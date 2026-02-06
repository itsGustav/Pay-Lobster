// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface imports for linked contracts
interface IPayLobsterIdentity {
    function ownerOf(uint256 tokenId) external view returns (address);
    function isRegistered(address agent) external view returns (bool);
    function getAgentId(address agent) external view returns (uint256);
}

interface IPayLobsterReputation {
    function submitFeedback(
        uint256 fromAgentId,
        uint256 toAgentId,
        uint8 rating,
        string calldata category,
        string calldata comment,
        bytes32 txRef
    ) external;
    function getAgentTrustScore(uint256 agentId) external view returns (uint256);
}

interface IPayLobsterCredit {
    function checkCreditEligibility(address agent) external view returns (bool qualified, uint256 available);
    function recordLoan(address borrower, uint256 amount, uint256 escrowId) external returns (uint256 loanId);
    function recordRepayment(uint256 loanId) external;
    function recordSuccessfulTransaction(address agent) external;
    function recordLatePayment(address agent) external;
    function recordDefault(address agent) external;
    function getProfile(address agent) external view returns (
        uint256 score,
        uint256 creditLimit,
        uint256 availableCredit,
        uint256 totalDebt,
        uint256 lifetimeBorrowed,
        uint256 lifetimeRepaid,
        uint256 successfulTxns,
        uint256 lateTxns,
        uint256 defaults,
        uint256 registeredAt,
        uint256 lastActivity,
        bool initialized
    );
}

/**
 * @title PayLobsterEscrowV3
 * @notice Trustless USDC Escrow with Identity, Reputation & Credit Integration
 * @dev Central payment contract that orchestrates the Pay Lobster ecosystem
 * 
 * Features:
 * - Standard USDC escrow (hold, release, refund)
 * - Credit-backed escrows (up to 50% credit)
 * - Verified ratings (only escrow parties, only after completion)
 * - Automatic score updates on completion/default
 * - Dispute resolution with arbiter
 */
contract PayLobsterEscrowV3 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Constants ============
    
    uint256 public constant MAX_CREDIT_RATIO = 50;      // Max 50% credit-backed
    uint256 public constant PLATFORM_FEE_BPS = 50;      // 0.5% platform fee
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant DISPUTE_WINDOW = 3 days;
    uint256 public constant CREDIT_REPAYMENT_WINDOW = 7 days;
    
    // ============ Linked Contracts ============
    
    IERC20 public immutable usdc;
    IPayLobsterIdentity public identity;
    IPayLobsterReputation public reputation;
    IPayLobsterCredit public credit;
    
    // ============ State ============
    
    enum EscrowStatus {
        Created,        // Escrow created, awaiting funding
        Funded,         // Fully funded, awaiting completion
        Completed,      // Work done, funds released
        Disputed,       // Under dispute
        Refunded,       // Refunded to buyer
        Cancelled       // Cancelled before funding
    }
    
    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;             // Total escrow amount
        uint256 collateralAmount;   // Amount paid upfront
        uint256 creditAmount;       // Amount backed by credit
        uint256 loanId;             // Credit loan ID (if any)
        string description;
        EscrowStatus status;
        uint256 createdAt;
        uint256 fundedAt;
        uint256 completedAt;
        uint256 disputeDeadline;
        bool buyerRated;
        bool sellerRated;
    }
    
    // Escrow ID => Escrow
    mapping(uint256 => Escrow) public escrows;
    uint256 public nextEscrowId;
    
    // Arbiter for disputes
    address public arbiter;
    
    // Platform fee recipient
    address public feeRecipient;
    
    // Accumulated fees
    uint256 public accumulatedFees;
    
    // ============ Events ============
    
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 creditAmount,
        string description
    );
    event EscrowFunded(uint256 indexed escrowId, uint256 collateralAmount, uint256 creditAmount);
    event EscrowCompleted(uint256 indexed escrowId, uint256 amountReleased, uint256 fee);
    event EscrowRefunded(uint256 indexed escrowId, uint256 amountRefunded);
    event EscrowDisputed(uint256 indexed escrowId, address disputedBy);
    event DisputeResolved(uint256 indexed escrowId, address winner, uint256 amount);
    event RatingSubmitted(uint256 indexed escrowId, address indexed rater, address indexed ratee, uint8 rating);
    event CreditRepaid(uint256 indexed escrowId, uint256 loanId, uint256 amount);
    event ArbiterUpdated(address indexed oldArbiter, address indexed newArbiter);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    // ============ Modifiers ============
    
    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter");
        _;
    }
    
    modifier escrowExists(uint256 escrowId) {
        require(escrows[escrowId].id == escrowId && escrowId > 0, "Escrow does not exist");
        _;
    }
    
    modifier onlyParty(uint256 escrowId) {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.buyer || msg.sender == e.seller, "Not a party");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _usdc,
        address _identity,
        address _reputation,
        address _credit,
        address _arbiter,
        address _feeRecipient
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        
        usdc = IERC20(_usdc);
        identity = IPayLobsterIdentity(_identity);
        reputation = IPayLobsterReputation(_reputation);
        credit = IPayLobsterCredit(_credit);
        arbiter = _arbiter;
        feeRecipient = _feeRecipient;
        nextEscrowId = 1;
    }
    
    // ============ Admin Functions ============
    
    function setArbiter(address _arbiter) external onlyOwner {
        address old = arbiter;
        arbiter = _arbiter;
        emit ArbiterUpdated(old, _arbiter);
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        address old = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(old, _feeRecipient);
    }
    
    function updateLinkedContracts(
        address _identity,
        address _reputation,
        address _credit
    ) external onlyOwner {
        if (_identity != address(0)) identity = IPayLobsterIdentity(_identity);
        if (_reputation != address(0)) reputation = IPayLobsterReputation(_reputation);
        if (_credit != address(0)) credit = IPayLobsterCredit(_credit);
    }
    
    function withdrawFees() external nonReentrant {
        require(msg.sender == feeRecipient || msg.sender == owner(), "Not authorized");
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees = 0;
        usdc.safeTransfer(feeRecipient, amount);
        
        emit FeesWithdrawn(feeRecipient, amount);
    }
    
    // ============ Escrow Lifecycle ============
    
    /**
     * @notice Create a new escrow
     * @param seller Address of the seller/service provider
     * @param amount Total escrow amount in USDC
     * @param creditAmount Amount to back with credit (0 for no credit)
     * @param description Job/service description
     */
    function createEscrow(
        address seller,
        uint256 amount,
        uint256 creditAmount,
        string calldata description
    ) external nonReentrant returns (uint256 escrowId) {
        require(seller != address(0) && seller != msg.sender, "Invalid seller");
        require(amount > 0, "Amount must be > 0");
        require(bytes(description).length > 0, "Description required");
        
        // Verify identities if identity contract is set
        if (address(identity) != address(0)) {
            require(identity.isRegistered(msg.sender), "Buyer not registered");
            require(identity.isRegistered(seller), "Seller not registered");
        }
        
        // Validate credit usage
        uint256 collateralRequired = amount;
        uint256 loanId = 0;
        
        if (creditAmount > 0) {
            require(address(credit) != address(0), "Credit not enabled");
            require(creditAmount <= (amount * MAX_CREDIT_RATIO) / 100, "Exceeds max credit ratio");
            
            (bool eligible, uint256 available) = credit.checkCreditEligibility(msg.sender);
            require(eligible, "Not eligible for credit");
            require(creditAmount <= available, "Insufficient credit");
            
            collateralRequired = amount - creditAmount;
        }
        
        escrowId = nextEscrowId++;
        
        escrows[escrowId] = Escrow({
            id: escrowId,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            collateralAmount: collateralRequired,
            creditAmount: creditAmount,
            loanId: 0,  // Set when funded
            description: description,
            status: EscrowStatus.Created,
            createdAt: block.timestamp,
            fundedAt: 0,
            completedAt: 0,
            disputeDeadline: 0,
            buyerRated: false,
            sellerRated: false
        });
        
        emit EscrowCreated(escrowId, msg.sender, seller, amount, creditAmount, description);
        
        return escrowId;
    }
    
    /**
     * @notice Fund an escrow (buyer deposits collateral)
     * @param escrowId ID of the escrow to fund
     */
    function fundEscrow(uint256 escrowId) external nonReentrant escrowExists(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.buyer, "Only buyer can fund");
        require(e.status == EscrowStatus.Created, "Invalid status");
        
        // Transfer collateral from buyer
        usdc.safeTransferFrom(msg.sender, address(this), e.collateralAmount);
        
        // Record credit loan if using credit
        if (e.creditAmount > 0) {
            e.loanId = credit.recordLoan(msg.sender, e.creditAmount, escrowId);
        }
        
        e.status = EscrowStatus.Funded;
        e.fundedAt = block.timestamp;
        
        emit EscrowFunded(escrowId, e.collateralAmount, e.creditAmount);
    }
    
    /**
     * @notice Create and fund escrow in one transaction
     */
    function createAndFundEscrow(
        address seller,
        uint256 amount,
        uint256 creditAmount,
        string calldata description
    ) external nonReentrant returns (uint256 escrowId) {
        // Create escrow
        escrowId = this.createEscrow(seller, amount, creditAmount, description);
        
        // Fund it
        Escrow storage e = escrows[escrowId];
        usdc.safeTransferFrom(msg.sender, address(this), e.collateralAmount);
        
        if (e.creditAmount > 0) {
            e.loanId = credit.recordLoan(msg.sender, e.creditAmount, escrowId);
        }
        
        e.status = EscrowStatus.Funded;
        e.fundedAt = block.timestamp;
        
        emit EscrowFunded(escrowId, e.collateralAmount, e.creditAmount);
        
        return escrowId;
    }
    
    /**
     * @notice Release funds to seller (buyer confirms completion)
     * @param escrowId ID of the escrow
     */
    function releaseEscrow(uint256 escrowId) external nonReentrant escrowExists(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.buyer, "Only buyer can release");
        require(e.status == EscrowStatus.Funded, "Invalid status");
        
        _completeEscrow(escrowId, e.seller, e.amount);
    }
    
    /**
     * @notice Request refund (seller can approve or dispute arises)
     * @param escrowId ID of the escrow
     */
    function requestRefund(uint256 escrowId) external nonReentrant escrowExists(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.buyer, "Only buyer can request refund");
        require(e.status == EscrowStatus.Funded, "Invalid status");
        
        // Move to disputed state, give seller time to respond
        e.status = EscrowStatus.Disputed;
        e.disputeDeadline = block.timestamp + DISPUTE_WINDOW;
        
        emit EscrowDisputed(escrowId, msg.sender);
    }
    
    /**
     * @notice Seller approves refund
     * @param escrowId ID of the escrow
     */
    function approveRefund(uint256 escrowId) external nonReentrant escrowExists(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.seller, "Only seller can approve");
        require(e.status == EscrowStatus.Disputed, "Not disputed");
        
        _refundEscrow(escrowId);
    }
    
    /**
     * @notice Cancel unfunded escrow
     * @param escrowId ID of the escrow
     */
    function cancelEscrow(uint256 escrowId) external escrowExists(escrowId) onlyParty(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Created, "Can only cancel unfunded");
        
        e.status = EscrowStatus.Cancelled;
    }
    
    // ============ Dispute Resolution ============
    
    /**
     * @notice Arbiter resolves dispute
     * @param escrowId ID of the escrow
     * @param releaseToSeller True to release to seller, false to refund buyer
     * @param splitBps If non-zero, split: seller gets splitBps, buyer gets rest
     */
    function resolveDispute(
        uint256 escrowId,
        bool releaseToSeller,
        uint256 splitBps
    ) external onlyArbiter nonReentrant escrowExists(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Disputed, "Not disputed");
        
        if (splitBps > 0) {
            require(splitBps <= BPS_DENOMINATOR, "Invalid split");
            
            // Split payment
            uint256 sellerAmount = (e.amount * splitBps) / BPS_DENOMINATOR;
            uint256 buyerAmount = e.amount - sellerAmount;
            
            if (sellerAmount > 0) {
                uint256 fee = (sellerAmount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
                accumulatedFees += fee;
                usdc.safeTransfer(e.seller, sellerAmount - fee);
            }
            
            if (buyerAmount > 0) {
                usdc.safeTransfer(e.buyer, buyerAmount);
            }
            
            // Handle credit portion if buyer used credit
            if (e.creditAmount > 0) {
                // Buyer still owes credit portion
                // This is handled separately via repayCredit
            }
            
            e.status = EscrowStatus.Completed;
            e.completedAt = block.timestamp;
            
            emit DisputeResolved(escrowId, address(0), e.amount);
        } else if (releaseToSeller) {
            _completeEscrow(escrowId, e.seller, e.amount);
            emit DisputeResolved(escrowId, e.seller, e.amount);
        } else {
            _refundEscrow(escrowId);
            emit DisputeResolved(escrowId, e.buyer, e.amount);
        }
    }
    
    // ============ Credit Repayment ============
    
    /**
     * @notice Repay credit portion of escrow
     * @param escrowId ID of the escrow
     */
    function repayCredit(uint256 escrowId) external nonReentrant escrowExists(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.buyer, "Only buyer can repay");
        require(e.creditAmount > 0, "No credit to repay");
        require(e.status == EscrowStatus.Completed || e.status == EscrowStatus.Refunded, "Escrow not closed");
        require(e.loanId > 0, "No active loan");
        
        // Transfer credit amount from buyer
        usdc.safeTransferFrom(msg.sender, address(this), e.creditAmount);
        
        // Record repayment in credit contract
        credit.recordRepayment(e.loanId);
        
        // Clear loan reference
        uint256 repaidLoanId = e.loanId;
        e.loanId = 0;
        
        emit CreditRepaid(escrowId, repaidLoanId, e.creditAmount);
    }
    
    // ============ Ratings ============
    
    /**
     * @notice Submit rating for counterparty (only after escrow completion)
     * @param escrowId ID of the completed escrow
     * @param rating Rating 1-5
     * @param comment Optional comment
     */
    function submitRating(
        uint256 escrowId,
        uint8 rating,
        string calldata comment
    ) external escrowExists(escrowId) onlyParty(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(
            e.status == EscrowStatus.Completed || e.status == EscrowStatus.Refunded,
            "Escrow not finished"
        );
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");
        
        address ratee;
        
        if (msg.sender == e.buyer) {
            require(!e.buyerRated, "Already rated");
            e.buyerRated = true;
            ratee = e.seller;
        } else {
            require(!e.sellerRated, "Already rated");
            e.sellerRated = true;
            ratee = e.buyer;
        }
        
        // Submit to reputation contract if set
        if (address(reputation) != address(0) && address(identity) != address(0)) {
            uint256 fromId = identity.getAgentId(msg.sender);
            uint256 toId = identity.getAgentId(ratee);
            
            reputation.submitFeedback(
                fromId,
                toId,
                rating,
                "escrow",
                comment,
                bytes32(escrowId)
            );
        }
        
        emit RatingSubmitted(escrowId, msg.sender, ratee, rating);
    }
    
    // ============ Internal Functions ============
    
    function _completeEscrow(uint256 escrowId, address recipient, uint256 amount) internal {
        Escrow storage e = escrows[escrowId];
        
        // Calculate fee
        uint256 fee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 payout = amount - fee;
        
        // Only transfer collateral (credit portion goes to seller but buyer owes it)
        uint256 actualTransfer = e.collateralAmount > payout ? payout : e.collateralAmount;
        if (fee <= e.collateralAmount - actualTransfer + (e.collateralAmount - actualTransfer)) {
            // Simplify: transfer collateral minus fee
            actualTransfer = e.collateralAmount - fee;
            accumulatedFees += fee;
        }
        
        usdc.safeTransfer(recipient, actualTransfer);
        
        // Update credit scores
        if (address(credit) != address(0)) {
            credit.recordSuccessfulTransaction(e.buyer);
            credit.recordSuccessfulTransaction(e.seller);
        }
        
        e.status = EscrowStatus.Completed;
        e.completedAt = block.timestamp;
        
        emit EscrowCompleted(escrowId, actualTransfer, fee);
    }
    
    function _refundEscrow(uint256 escrowId) internal {
        Escrow storage e = escrows[escrowId];
        
        // Refund collateral to buyer
        usdc.safeTransfer(e.buyer, e.collateralAmount);
        
        // If credit was used, buyer still owes it (handled via repayCredit or default)
        // The loan remains active in credit contract
        
        e.status = EscrowStatus.Refunded;
        e.completedAt = block.timestamp;
        
        emit EscrowRefunded(escrowId, e.collateralAmount);
    }
    
    // ============ View Functions ============
    
    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
    
    function getEscrowStatus(uint256 escrowId) external view returns (EscrowStatus) {
        return escrows[escrowId].status;
    }
    
    function canRate(uint256 escrowId, address party) external view returns (bool) {
        Escrow storage e = escrows[escrowId];
        if (e.status != EscrowStatus.Completed && e.status != EscrowStatus.Refunded) {
            return false;
        }
        if (party == e.buyer) return !e.buyerRated;
        if (party == e.seller) return !e.sellerRated;
        return false;
    }
}
