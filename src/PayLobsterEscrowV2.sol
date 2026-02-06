// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPayLobsterRegistry {
    function submitRating(uint256 escrowId, address rater, address target, uint8 score, string calldata comment) external;
    function canRate(uint256 escrowId, address rater) external view returns (bool);
    function getCreditInfo(address agent) external view returns (uint256 creditScore, uint256 creditLimit, uint256 creditAvailable, uint256 creditUsed);
    function recordLoan(address borrower, uint256 amount, uint256 dueDate) external returns (uint256 loanId);
    function recordRepayment(uint256 loanId) external;
    function recordDefault(uint256 loanId) external;
}

/**
 * @title PayLobsterEscrowV2
 * @notice Trustless USDC escrow with integrated ratings + credit system
 * @dev Pay Lobster 🦞 — Verified Transactions, Real Reputation
 * 
 * UPGRADES FROM V1:
 * ✅ Integrated rating system (rate after release/refund)
 * ✅ One rating per party per escrow (enforced)
 * ✅ Credit-backed escrows (undercollateralized for trusted agents)
 * ✅ Automatic credit tracking
 */
contract PayLobsterEscrowV2 is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════
    //                           STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    enum EscrowStatus { Active, Released, Refunded, Disputed }
    enum EscrowType { Standard, CreditBacked }
    
    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;           // Total amount
        uint256 collateral;       // Amount actually deposited (can be < amount for credit)
        EscrowStatus status;
        EscrowType escrowType;
        string description;
        uint256 createdAt;
        uint256 deadline;
        uint256 loanId;           // If credit-backed, the loan ID in registry
        bool buyerRated;
        bool sellerRated;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    //                           STATE
    // ═══════════════════════════════════════════════════════════════════

    IERC20 public immutable usdc;
    IPayLobsterRegistry public registry;
    address public arbiter;
    address public owner;
    
    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCount;

    // Credit system settings
    uint256 public constant MIN_CREDIT_SCORE_FOR_CREDIT = 600; // Minimum score to use credit
    uint256 public constant MAX_CREDIT_PERCENTAGE = 50;        // Max 50% can be credit-backed
    uint256 public constant CREDIT_REPAYMENT_DAYS = 7;         // Days to repay after release

    // ═══════════════════════════════════════════════════════════════════
    //                           EVENTS
    // ═══════════════════════════════════════════════════════════════════
    
    event EscrowCreated(
        uint256 indexed id, 
        address indexed buyer, 
        address indexed seller, 
        uint256 amount, 
        uint256 collateral,
        EscrowType escrowType,
        string description
    );
    event EscrowReleased(uint256 indexed id, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed id, address indexed buyer, uint256 amount);
    event EscrowDisputed(uint256 indexed id, address indexed disputer);
    event DisputeResolved(uint256 indexed id, address indexed winner, uint256 amount);
    event RatingSubmitted(uint256 indexed escrowId, address indexed rater, address indexed target, uint8 score);
    event CreditRepaid(uint256 indexed escrowId, address indexed buyer, uint256 amount);

    // ═══════════════════════════════════════════════════════════════════
    //                           MODIFIERS
    // ═══════════════════════════════════════════════════════════════════

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════
    
    constructor(address _usdc, address _registry, address _arbiter) {
        usdc = IERC20(_usdc);
        registry = IPayLobsterRegistry(_registry);
        arbiter = _arbiter;
        owner = msg.sender;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    //                       STANDARD ESCROW
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Create a standard fully-collateralized escrow
     */
    function createEscrow(
        address seller,
        uint256 amount,
        string calldata description,
        uint256 deadline
    ) external nonReentrant returns (uint256 escrowId) {
        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Cannot escrow to self");
        require(amount > 0, "Amount must be > 0");
        
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        escrowId = escrowCount++;
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            collateral: amount,
            status: EscrowStatus.Active,
            escrowType: EscrowType.Standard,
            description: description,
            createdAt: block.timestamp,
            deadline: deadline,
            loanId: 0,
            buyerRated: false,
            sellerRated: false
        });
        
        emit EscrowCreated(escrowId, msg.sender, seller, amount, amount, EscrowType.Standard, description);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                      CREDIT-BACKED ESCROW
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Create a credit-backed escrow (partial collateral)
     * @param seller Recipient
     * @param amount Total escrow amount
     * @param collateralAmount How much buyer is depositing (rest is credit)
     * @param description Task description
     * @param deadline Completion deadline
     */
    function createCreditEscrow(
        address seller,
        uint256 amount,
        uint256 collateralAmount,
        string calldata description,
        uint256 deadline
    ) external nonReentrant returns (uint256 escrowId) {
        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Cannot escrow to self");
        require(amount > 0, "Amount must be > 0");
        require(collateralAmount < amount, "Use standard escrow for full collateral");
        require(collateralAmount >= (amount * (100 - MAX_CREDIT_PERCENTAGE)) / 100, "Credit portion too high");

        // Check buyer's credit eligibility
        (uint256 creditScore,, uint256 creditAvailable,) = registry.getCreditInfo(msg.sender);
        require(creditScore >= MIN_CREDIT_SCORE_FOR_CREDIT, "Credit score too low");
        
        uint256 creditNeeded = amount - collateralAmount;
        require(creditAvailable >= creditNeeded, "Insufficient credit available");

        // Transfer collateral
        usdc.safeTransferFrom(msg.sender, address(this), collateralAmount);

        // Record the loan in registry
        uint256 dueDate = block.timestamp + (CREDIT_REPAYMENT_DAYS * 1 days);
        uint256 loanId = registry.recordLoan(msg.sender, creditNeeded, dueDate);

        escrowId = escrowCount++;
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            collateral: collateralAmount,
            status: EscrowStatus.Active,
            escrowType: EscrowType.CreditBacked,
            description: description,
            createdAt: block.timestamp,
            deadline: deadline,
            loanId: loanId,
            buyerRated: false,
            sellerRated: false
        });
        
        emit EscrowCreated(escrowId, msg.sender, seller, amount, collateralAmount, EscrowType.CreditBacked, description);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    //                       ESCROW ACTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Release escrow funds to seller
     * @dev For credit-backed: releases collateral immediately, buyer must repay credit portion
     */
    function releaseEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.buyer, "Only buyer can release");
        
        escrow.status = EscrowStatus.Released;

        if (escrow.escrowType == EscrowType.Standard) {
            // Standard: transfer full amount
            usdc.safeTransfer(escrow.seller, escrow.amount);
        } else {
            // Credit-backed: transfer collateral, credit portion due separately
            usdc.safeTransfer(escrow.seller, escrow.collateral);
            // Note: buyer must call repayCreditPortion() to settle remaining
        }
        
        emit EscrowReleased(escrowId, escrow.seller, escrow.amount);
    }

    /**
     * @notice Repay the credit portion of a credit-backed escrow
     * @dev Must be called after release to complete the transaction
     */
    function repayCreditPortion(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.escrowType == EscrowType.CreditBacked, "Not credit-backed");
        require(escrow.status == EscrowStatus.Released, "Escrow not released");
        require(msg.sender == escrow.buyer, "Only buyer can repay");

        uint256 creditAmount = escrow.amount - escrow.collateral;
        
        // Transfer credit portion to seller
        usdc.safeTransferFrom(msg.sender, escrow.seller, creditAmount);
        
        // Record repayment in registry
        registry.recordRepayment(escrow.loanId);
        
        emit CreditRepaid(escrowId, msg.sender, creditAmount);
    }
    
    /**
     * @notice Refund escrow to buyer
     */
    function refundEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        
        bool canRefund = msg.sender == escrow.seller || 
            (msg.sender == escrow.buyer && escrow.deadline > 0 && block.timestamp > escrow.deadline);
        require(canRefund, "Cannot refund");
        
        escrow.status = EscrowStatus.Refunded;
        usdc.safeTransfer(escrow.buyer, escrow.collateral);

        // If credit-backed, cancel the loan
        if (escrow.escrowType == EscrowType.CreditBacked) {
            registry.recordRepayment(escrow.loanId); // Treat as repaid (no actual debt since cancelled)
        }
        
        emit EscrowRefunded(escrowId, escrow.buyer, escrow.collateral);
    }
    
    /**
     * @notice Dispute an escrow
     */
    function disputeEscrow(uint256 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.buyer || msg.sender == escrow.seller, "Not party to escrow");
        
        escrow.status = EscrowStatus.Disputed;
        emit EscrowDisputed(escrowId, msg.sender);
    }
    
    /**
     * @notice Resolve a dispute
     */
    function resolveDispute(uint256 escrowId, bool releaseToSeller) external nonReentrant {
        require(msg.sender == arbiter, "Only arbiter");
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Not disputed");
        
        address winner;
        if (releaseToSeller) {
            escrow.status = EscrowStatus.Released;
            usdc.safeTransfer(escrow.seller, escrow.collateral);
            winner = escrow.seller;
            // Credit portion still owed by buyer
        } else {
            escrow.status = EscrowStatus.Refunded;
            usdc.safeTransfer(escrow.buyer, escrow.collateral);
            winner = escrow.buyer;
            // Cancel loan if credit-backed
            if (escrow.escrowType == EscrowType.CreditBacked) {
                registry.recordRepayment(escrow.loanId);
            }
        }
        
        emit DisputeResolved(escrowId, winner, escrow.collateral);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                       RATING SYSTEM
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Rate the other party after escrow completion
     * @param escrowId The completed escrow
     * @param score 1-5 stars
     * @param comment Optional feedback
     */
    function rateCounterparty(
        uint256 escrowId, 
        uint8 score, 
        string calldata comment
    ) external {
        Escrow storage escrow = escrows[escrowId];
        
        // Must be completed (released or refunded)
        require(
            escrow.status == EscrowStatus.Released || escrow.status == EscrowStatus.Refunded,
            "Escrow not completed"
        );

        address target;
        
        if (msg.sender == escrow.buyer) {
            require(!escrow.buyerRated, "Buyer already rated");
            escrow.buyerRated = true;
            target = escrow.seller;
        } else if (msg.sender == escrow.seller) {
            require(!escrow.sellerRated, "Seller already rated");
            escrow.sellerRated = true;
            target = escrow.buyer;
        } else {
            revert("Not party to escrow");
        }

        // Submit rating to registry
        registry.submitRating(escrowId, msg.sender, target, score, comment);
        
        emit RatingSubmitted(escrowId, msg.sender, target, score);
    }

    /**
     * @notice Check if caller can rate an escrow
     */
    function canRateEscrow(uint256 escrowId, address rater) external view returns (bool) {
        Escrow storage escrow = escrows[escrowId];
        
        if (escrow.status != EscrowStatus.Released && escrow.status != EscrowStatus.Refunded) {
            return false;
        }

        if (rater == escrow.buyer) {
            return !escrow.buyerRated;
        } else if (rater == escrow.seller) {
            return !escrow.sellerRated;
        }
        
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                          VIEWS
    // ═══════════════════════════════════════════════════════════════════
    
    function getEscrow(uint256 escrowId) external view returns (
        address buyer,
        address seller,
        uint256 amount,
        uint256 collateral,
        EscrowStatus status,
        EscrowType escrowType,
        string memory description,
        uint256 createdAt,
        uint256 deadline,
        bool buyerRated,
        bool sellerRated
    ) {
        Escrow storage e = escrows[escrowId];
        return (
            e.buyer, 
            e.seller, 
            e.amount, 
            e.collateral,
            e.status, 
            e.escrowType,
            e.description, 
            e.createdAt, 
            e.deadline,
            e.buyerRated,
            e.sellerRated
        );
    }

    /**
     * @notice Check credit eligibility for a buyer
     */
    function checkCreditEligibility(address buyer, uint256 amount) external view returns (
        bool eligible,
        uint256 maxCreditAmount,
        uint256 minCollateral,
        uint256 creditScore
    ) {
        uint256 creditAvailable;
        (creditScore,, creditAvailable,) = registry.getCreditInfo(buyer);
        
        eligible = creditScore >= MIN_CREDIT_SCORE_FOR_CREDIT && creditAvailable > 0;
        maxCreditAmount = (amount * MAX_CREDIT_PERCENTAGE) / 100;
        if (maxCreditAmount > creditAvailable) {
            maxCreditAmount = creditAvailable;
        }
        minCollateral = amount - maxCreditAmount;
        
        return (eligible, maxCreditAmount, minCollateral, creditScore);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                          ADMIN
    // ═══════════════════════════════════════════════════════════════════
    
    function setArbiter(address newArbiter) external {
        require(msg.sender == arbiter || msg.sender == owner, "Not authorized");
        arbiter = newArbiter;
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = IPayLobsterRegistry(_registry);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
