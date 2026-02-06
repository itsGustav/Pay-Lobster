// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PayLobsterCredit
 * @notice LOBSTER Credit Score System (300-850) - Like FICO for AI Agents
 * @dev Manages credit scores, credit limits, and loan tracking for agents
 * 
 * Score Components (FICO-inspired):
 * - Trust History: 35% (from reputation contract)
 * - Payment History: 30% (on-time vs late payments)
 * - Credit Utilization: 15% (current debt / credit limit)
 * - Account Age: 10% (time since registration)
 * - Credit Mix: 5% (variety of transaction types)
 * - Recent Inquiries: 5% (credit checks in last 30 days)
 */
contract PayLobsterCredit is Ownable, ReentrancyGuard {
    
    // ============ Constants ============
    
    uint256 public constant MIN_SCORE = 300;
    uint256 public constant MAX_SCORE = 850;
    uint256 public constant SCORE_FOR_CREDIT = 600;  // Minimum to access credit
    uint256 public constant CREDIT_MULTIPLIER = 1e6; // Score * $1 USDC (6 decimals)
    uint256 public constant REPAYMENT_WINDOW = 7 days;
    uint256 public constant MAX_CREDIT_RATIO = 50;   // Max 50% credit-backed
    
    // Score change amounts
    int256 public constant SCORE_SUCCESSFUL_TXN = 5;
    int256 public constant SCORE_LATE_PAYMENT = -10;
    int256 public constant SCORE_DEFAULT = -100;
    int256 public constant SCORE_EARLY_REPAYMENT = 3;
    
    // ============ Structs ============
    
    struct CreditProfile {
        uint256 score;              // LOBSTER score (300-850)
        uint256 creditLimit;        // Max credit in USDC (6 decimals)
        uint256 availableCredit;    // Current available credit
        uint256 totalDebt;          // Outstanding debt
        uint256 lifetimeBorrowed;   // Total ever borrowed
        uint256 lifetimeRepaid;     // Total ever repaid
        uint256 successfulTxns;     // Count of successful transactions
        uint256 lateTxns;           // Count of late payments
        uint256 defaults;           // Count of defaults
        uint256 registeredAt;       // Timestamp of first credit activity
        uint256 lastActivity;       // Timestamp of last activity
        bool initialized;           // Whether profile exists
    }
    
    struct Loan {
        uint256 amount;             // Loan amount in USDC
        uint256 dueDate;            // When repayment is due
        uint256 escrowId;           // Associated escrow (if any)
        address borrower;           // Who borrowed
        bool repaid;                // Whether repaid
        bool defaulted;             // Whether defaulted
    }
    
    // ============ State ============
    
    // Agent address => Credit profile
    mapping(address => CreditProfile) public profiles;
    
    // Loan ID => Loan details
    mapping(uint256 => Loan) public loans;
    uint256 public nextLoanId;
    
    // Agent => Active loan IDs
    mapping(address => uint256[]) public agentLoans;
    
    // Authorized contracts (Escrow contract)
    mapping(address => bool) public authorizedCallers;
    
    // ============ Events ============
    
    event CreditProfileCreated(address indexed agent, uint256 initialScore);
    event ScoreUpdated(address indexed agent, uint256 oldScore, uint256 newScore, string reason);
    event CreditLimitUpdated(address indexed agent, uint256 oldLimit, uint256 newLimit);
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 dueDate);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event CallerAuthorized(address indexed caller);
    event CallerRevoked(address indexed caller);
    
    // ============ Modifiers ============
    
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier profileExists(address agent) {
        require(profiles[agent].initialized, "Profile does not exist");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        nextLoanId = 1;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Authorize a contract to record loans and update scores
     * @param caller Address to authorize (typically Escrow contract)
     */
    function authorizeCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = true;
        emit CallerAuthorized(caller);
    }
    
    /**
     * @notice Revoke authorization from a contract
     * @param caller Address to revoke
     */
    function revokeCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = false;
        emit CallerRevoked(caller);
    }
    
    // ============ Profile Management ============
    
    /**
     * @notice Initialize credit profile for an agent
     * @param agent Address of the agent
     * @param initialScore Starting score (typically 500 for new agents)
     */
    function initializeProfile(address agent, uint256 initialScore) external onlyAuthorized {
        require(!profiles[agent].initialized, "Profile already exists");
        require(initialScore >= MIN_SCORE && initialScore <= MAX_SCORE, "Invalid score");
        
        uint256 creditLimit = _calculateCreditLimit(initialScore);
        
        profiles[agent] = CreditProfile({
            score: initialScore,
            creditLimit: creditLimit,
            availableCredit: creditLimit,
            totalDebt: 0,
            lifetimeBorrowed: 0,
            lifetimeRepaid: 0,
            successfulTxns: 0,
            lateTxns: 0,
            defaults: 0,
            registeredAt: block.timestamp,
            lastActivity: block.timestamp,
            initialized: true
        });
        
        emit CreditProfileCreated(agent, initialScore);
    }
    
    /**
     * @notice Get full credit profile for an agent
     * @param agent Address to query
     * @return profile The complete credit profile
     */
    function getProfile(address agent) external view returns (CreditProfile memory) {
        return profiles[agent];
    }
    
    /**
     * @notice Check if an agent qualifies for credit
     * @param agent Address to check
     * @return qualified Whether they meet minimum score
     * @return available How much credit is available
     */
    function checkCreditEligibility(address agent) external view returns (bool qualified, uint256 available) {
        CreditProfile storage profile = profiles[agent];
        if (!profile.initialized) {
            return (false, 0);
        }
        qualified = profile.score >= SCORE_FOR_CREDIT;
        available = qualified ? profile.availableCredit : 0;
    }
    
    // ============ Score Management ============
    
    /**
     * @notice Update score after successful transaction
     * @param agent Address of the agent
     */
    function recordSuccessfulTransaction(address agent) external onlyAuthorized profileExists(agent) {
        CreditProfile storage profile = profiles[agent];
        uint256 oldScore = profile.score;
        
        profile.successfulTxns++;
        profile.lastActivity = block.timestamp;
        
        // Apply score change (capped at MAX_SCORE)
        uint256 newScore = _applyScoreChange(oldScore, SCORE_SUCCESSFUL_TXN);
        profile.score = newScore;
        
        // Update credit limit based on new score
        _updateCreditLimit(agent);
        
        emit ScoreUpdated(agent, oldScore, newScore, "successful_transaction");
    }
    
    /**
     * @notice Update score after late payment
     * @param agent Address of the agent
     */
    function recordLatePayment(address agent) external onlyAuthorized profileExists(agent) {
        CreditProfile storage profile = profiles[agent];
        uint256 oldScore = profile.score;
        
        profile.lateTxns++;
        profile.lastActivity = block.timestamp;
        
        uint256 newScore = _applyScoreChange(oldScore, SCORE_LATE_PAYMENT);
        profile.score = newScore;
        
        _updateCreditLimit(agent);
        
        emit ScoreUpdated(agent, oldScore, newScore, "late_payment");
    }
    
    /**
     * @notice Update score after default
     * @param agent Address of the agent
     */
    function recordDefault(address agent) external onlyAuthorized profileExists(agent) {
        CreditProfile storage profile = profiles[agent];
        uint256 oldScore = profile.score;
        
        profile.defaults++;
        profile.lastActivity = block.timestamp;
        
        uint256 newScore = _applyScoreChange(oldScore, SCORE_DEFAULT);
        profile.score = newScore;
        
        _updateCreditLimit(agent);
        
        emit ScoreUpdated(agent, oldScore, newScore, "default");
    }
    
    /**
     * @notice Batch update scores from external reputation data
     * @param agent Address of the agent
     * @param trustScore Trust score from reputation contract (0-100)
     */
    function syncFromReputation(address agent, uint256 trustScore) external onlyAuthorized {
        require(trustScore <= 100, "Invalid trust score");
        
        CreditProfile storage profile = profiles[agent];
        if (!profile.initialized) {
            // Initialize with score derived from trust
            uint256 initialScore = MIN_SCORE + ((MAX_SCORE - MIN_SCORE) * trustScore / 100);
            
            profiles[agent] = CreditProfile({
                score: initialScore,
                creditLimit: _calculateCreditLimit(initialScore),
                availableCredit: _calculateCreditLimit(initialScore),
                totalDebt: 0,
                lifetimeBorrowed: 0,
                lifetimeRepaid: 0,
                successfulTxns: 0,
                lateTxns: 0,
                defaults: 0,
                registeredAt: block.timestamp,
                lastActivity: block.timestamp,
                initialized: true
            });
            
            emit CreditProfileCreated(agent, initialScore);
        } else {
            // Blend trust score into existing score (35% weight as per FICO model)
            uint256 trustComponent = MIN_SCORE + ((MAX_SCORE - MIN_SCORE) * trustScore / 100);
            uint256 oldScore = profile.score;
            uint256 newScore = (oldScore * 65 + trustComponent * 35) / 100;
            
            profile.score = newScore;
            profile.lastActivity = block.timestamp;
            
            _updateCreditLimit(agent);
            
            emit ScoreUpdated(agent, oldScore, newScore, "reputation_sync");
        }
    }
    
    // ============ Loan Management ============
    
    /**
     * @notice Record a new loan (called by Escrow contract)
     * @param borrower Address of the borrower
     * @param amount Loan amount in USDC
     * @param escrowId Associated escrow ID
     * @return loanId The ID of the created loan
     */
    function recordLoan(
        address borrower,
        uint256 amount,
        uint256 escrowId
    ) external onlyAuthorized profileExists(borrower) nonReentrant returns (uint256 loanId) {
        CreditProfile storage profile = profiles[borrower];
        
        require(profile.score >= SCORE_FOR_CREDIT, "Score too low for credit");
        require(amount <= profile.availableCredit, "Exceeds available credit");
        
        loanId = nextLoanId++;
        
        loans[loanId] = Loan({
            amount: amount,
            dueDate: block.timestamp + REPAYMENT_WINDOW,
            escrowId: escrowId,
            borrower: borrower,
            repaid: false,
            defaulted: false
        });
        
        agentLoans[borrower].push(loanId);
        
        // Update profile
        profile.availableCredit -= amount;
        profile.totalDebt += amount;
        profile.lifetimeBorrowed += amount;
        profile.lastActivity = block.timestamp;
        
        emit LoanCreated(loanId, borrower, amount, loans[loanId].dueDate);
        
        return loanId;
    }
    
    /**
     * @notice Record loan repayment (called by Escrow contract)
     * @param loanId ID of the loan being repaid
     */
    function recordRepayment(uint256 loanId) external onlyAuthorized nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.amount > 0, "Loan does not exist");
        require(!loan.repaid && !loan.defaulted, "Loan already closed");
        
        CreditProfile storage profile = profiles[loan.borrower];
        
        loan.repaid = true;
        
        // Update profile
        profile.totalDebt -= loan.amount;
        profile.availableCredit += loan.amount;
        profile.lifetimeRepaid += loan.amount;
        profile.lastActivity = block.timestamp;
        
        // Bonus for early repayment
        if (block.timestamp < loan.dueDate) {
            uint256 oldScore = profile.score;
            uint256 newScore = _applyScoreChange(oldScore, SCORE_EARLY_REPAYMENT);
            profile.score = newScore;
            _updateCreditLimit(loan.borrower);
            emit ScoreUpdated(loan.borrower, oldScore, newScore, "early_repayment");
        }
        
        emit LoanRepaid(loanId, loan.borrower, loan.amount);
    }
    
    /**
     * @notice Mark a loan as defaulted (called by Escrow or admin)
     * @param loanId ID of the defaulted loan
     */
    function recordLoanDefault(uint256 loanId) external onlyAuthorized nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.amount > 0, "Loan does not exist");
        require(!loan.repaid && !loan.defaulted, "Loan already closed");
        require(block.timestamp > loan.dueDate, "Loan not yet due");
        
        loan.defaulted = true;
        
        // Record default impact on credit (inline to avoid external call)
        CreditProfile storage profile = profiles[loan.borrower];
        uint256 oldScore = profile.score;
        profile.defaults++;
        profile.lastActivity = block.timestamp;
        uint256 newScore = _applyScoreChange(oldScore, SCORE_DEFAULT);
        profile.score = newScore;
        _updateCreditLimit(loan.borrower);
        
        emit ScoreUpdated(loan.borrower, oldScore, newScore, "default");
        emit LoanDefaulted(loanId, loan.borrower, loan.amount);
    }
    
    /**
     * @notice Get all active loans for an agent
     * @param agent Address to query
     * @return loanIds Array of active loan IDs
     */
    function getActiveLoans(address agent) external view returns (uint256[] memory) {
        uint256[] storage allLoans = agentLoans[agent];
        uint256 activeCount = 0;
        
        // Count active loans
        for (uint256 i = 0; i < allLoans.length; i++) {
            if (!loans[allLoans[i]].repaid && !loans[allLoans[i]].defaulted) {
                activeCount++;
            }
        }
        
        // Build array of active loans
        uint256[] memory activeLoanIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allLoans.length; i++) {
            if (!loans[allLoans[i]].repaid && !loans[allLoans[i]].defaulted) {
                activeLoanIds[index++] = allLoans[i];
            }
        }
        
        return activeLoanIds;
    }
    
    /**
     * @notice Check for overdue loans and process defaults
     * @param agent Address to check
     * @return overdueCount Number of overdue loans found
     */
    function processOverdueLoans(address agent) external returns (uint256 overdueCount) {
        uint256[] storage allLoans = agentLoans[agent];
        
        for (uint256 i = 0; i < allLoans.length; i++) {
            Loan storage loan = loans[allLoans[i]];
            if (!loan.repaid && !loan.defaulted && block.timestamp > loan.dueDate) {
                loan.defaulted = true;
                overdueCount++;
                
                // Update credit profile
                CreditProfile storage profile = profiles[agent];
                profile.defaults++;
                uint256 oldScore = profile.score;
                uint256 newScore = _applyScoreChange(oldScore, SCORE_DEFAULT);
                profile.score = newScore;
                
                emit LoanDefaulted(allLoans[i], agent, loan.amount);
                emit ScoreUpdated(agent, oldScore, newScore, "default");
            }
        }
        
        if (overdueCount > 0) {
            _updateCreditLimit(agent);
        }
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Apply a score change, respecting min/max bounds
     */
    function _applyScoreChange(uint256 currentScore, int256 change) internal pure returns (uint256) {
        if (change >= 0) {
            uint256 newScore = currentScore + uint256(change);
            return newScore > MAX_SCORE ? MAX_SCORE : newScore;
        } else {
            uint256 decrease = uint256(-change);
            if (decrease >= currentScore - MIN_SCORE) {
                return MIN_SCORE;
            }
            return currentScore - decrease;
        }
    }
    
    /**
     * @dev Calculate credit limit based on score
     */
    function _calculateCreditLimit(uint256 score) internal pure returns (uint256) {
        if (score < SCORE_FOR_CREDIT) {
            return 0;
        }
        // Score * $1 USDC (6 decimals)
        // e.g., 750 score = $750 = 750_000_000 USDC units
        return score * CREDIT_MULTIPLIER;
    }
    
    /**
     * @dev Update credit limit after score change
     */
    function _updateCreditLimit(address agent) internal {
        CreditProfile storage profile = profiles[agent];
        uint256 oldLimit = profile.creditLimit;
        uint256 newLimit = _calculateCreditLimit(profile.score);
        
        if (newLimit != oldLimit) {
            profile.creditLimit = newLimit;
            
            // Recalculate available credit (can't go negative)
            if (newLimit > profile.totalDebt) {
                profile.availableCredit = newLimit - profile.totalDebt;
            } else {
                profile.availableCredit = 0;
            }
            
            emit CreditLimitUpdated(agent, oldLimit, newLimit);
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get credit score for an agent
     * @param agent Address to query
     * @return score The LOBSTER score (300-850)
     */
    function getScore(address agent) external view returns (uint256) {
        return profiles[agent].score;
    }
    
    /**
     * @notice Get credit limit for an agent
     * @param agent Address to query
     * @return limit Credit limit in USDC (6 decimals)
     */
    function getCreditLimit(address agent) external view returns (uint256) {
        return profiles[agent].creditLimit;
    }
    
    /**
     * @notice Get available credit for an agent
     * @param agent Address to query
     * @return available Available credit in USDC (6 decimals)
     */
    function getAvailableCredit(address agent) external view returns (uint256) {
        return profiles[agent].availableCredit;
    }
    
    /**
     * @notice Check if agent has any active debt
     * @param agent Address to check
     * @return hasDebt Whether agent has outstanding debt
     * @return amount Total debt amount
     */
    function hasActiveDebt(address agent) external view returns (bool hasDebt, uint256 amount) {
        CreditProfile storage profile = profiles[agent];
        return (profile.totalDebt > 0, profile.totalDebt);
    }
}
