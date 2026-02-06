// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PayLobsterRegistryV2
 * @notice On-chain registry with escrow-verified ratings + credit system
 * @dev Pay Lobster 🦞 — Trust meets Credit
 * 
 * UPGRADES FROM V1:
 * ✅ Ratings now require completed escrow (no fake reviews)
 * ✅ One rating per party per escrow (no review bombing)
 * ✅ Full credit scoring system
 * ✅ Credit limits based on reputation + history
 */
contract PayLobsterRegistryV2 {

    // ═══════════════════════════════════════════════════════════════════
    //                           STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    struct Agent {
        string name;
        string capabilitiesCSV;
        string metadataURI;
        uint256 registeredAt;
        bool active;
    }

    struct Rating {
        address rater;
        uint8 score;          // 1-5 stars
        string comment;
        uint256 timestamp;
        uint256 escrowId;     // NEW: Which escrow this rating is from
    }

    struct CreditProfile {
        uint256 creditScore;      // 300-850 scale (like FICO)
        uint256 creditLimit;      // Max USDC they can borrow (6 decimals)
        uint256 creditUsed;       // Currently borrowed
        uint256 totalBorrowed;    // Lifetime borrowed amount
        uint256 totalRepaid;      // Lifetime repaid amount
        uint256 onTimePayments;   // Count of on-time repayments
        uint256 latePayments;     // Count of late repayments
        uint256 defaults;         // Count of defaults
        uint256 lastUpdated;      // Timestamp of last credit update
    }

    struct Loan {
        address borrower;
        uint256 amount;
        uint256 dueDate;
        bool repaid;
        bool defaulted;
        uint256 createdAt;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           STATE
    // ═══════════════════════════════════════════════════════════════════

    // Agent registry
    mapping(address => Agent) public agents;
    address[] public registeredAgents;

    // Trust system (ratings)
    mapping(address => Rating[]) public agentRatings;
    mapping(address => uint256) public totalScore;
    mapping(address => uint256) public ratingCount;

    // NEW: Escrow rating tracking (escrowId => rater => hasRated)
    mapping(uint256 => mapping(address => bool)) public hasRatedEscrow;

    // NEW: Credit system
    mapping(address => CreditProfile) public creditProfiles;
    mapping(uint256 => Loan) public loans;
    uint256 public loanCount;

    // Escrow contract reference (for verifying completed transactions)
    address public escrowContract;
    address public owner;

    // Credit system constants
    uint256 public constant MIN_CREDIT_SCORE = 300;
    uint256 public constant MAX_CREDIT_SCORE = 850;
    uint256 public constant DEFAULT_CREDIT_SCORE = 500;
    uint256 public constant CREDIT_LIMIT_MULTIPLIER = 100; // score * 100 = limit in USDC cents

    // ═══════════════════════════════════════════════════════════════════
    //                           EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event AgentRegistered(address indexed agent, string name, string capabilitiesCSV);
    event AgentUpdated(address indexed agent, string name, string capabilitiesCSV);
    event AgentDeactivated(address indexed agent);
    event AgentRated(address indexed agent, address indexed rater, uint8 score, uint256 escrowId);
    
    // Credit events
    event CreditScoreUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    event CreditLimitUpdated(address indexed agent, uint256 newLimit);
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 dueDate);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower, uint256 amount);

    // ═══════════════════════════════════════════════════════════════════
    //                           MODIFIERS
    // ═══════════════════════════════════════════════════════════════════

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyEscrow() {
        require(msg.sender == escrowContract, "Only escrow contract");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor() {
        owner = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                       AGENT REGISTRATION
    // ═══════════════════════════════════════════════════════════════════

    function registerAgent(
        string calldata name,
        string calldata capabilitiesCSV,
        string calldata metadataURI
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(bytes(capabilitiesCSV).length > 0, "Capabilities required");
        require(!agents[msg.sender].active, "Already registered");

        agents[msg.sender] = Agent({
            name: name,
            capabilitiesCSV: capabilitiesCSV,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            active: true
        });

        // Initialize credit profile
        creditProfiles[msg.sender] = CreditProfile({
            creditScore: DEFAULT_CREDIT_SCORE,
            creditLimit: DEFAULT_CREDIT_SCORE * CREDIT_LIMIT_MULTIPLIER * 1e6 / 100, // Convert to USDC decimals
            creditUsed: 0,
            totalBorrowed: 0,
            totalRepaid: 0,
            onTimePayments: 0,
            latePayments: 0,
            defaults: 0,
            lastUpdated: block.timestamp
        });

        registeredAgents.push(msg.sender);
        emit AgentRegistered(msg.sender, name, capabilitiesCSV);
    }

    function updateAgent(
        string calldata name,
        string calldata capabilitiesCSV,
        string calldata metadataURI
    ) external {
        require(agents[msg.sender].active, "Not registered");
        agents[msg.sender].name = name;
        agents[msg.sender].capabilitiesCSV = capabilitiesCSV;
        agents[msg.sender].metadataURI = metadataURI;
        emit AgentUpdated(msg.sender, name, capabilitiesCSV);
    }

    function deactivateAgent() external {
        require(agents[msg.sender].active, "Not registered");
        agents[msg.sender].active = false;
        emit AgentDeactivated(msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                    ESCROW-VERIFIED RATINGS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Rate an agent after completing an escrow (called by escrow contract)
     * @param escrowId The completed escrow
     * @param rater The party submitting the rating (buyer or seller)
     * @param target The agent being rated
     * @param score Rating 1-5
     * @param comment Optional comment
     */
    function submitRating(
        uint256 escrowId,
        address rater,
        address target,
        uint8 score,
        string calldata comment
    ) external onlyEscrow {
        require(agents[target].active, "Target not registered");
        require(score >= 1 && score <= 5, "Score must be 1-5");
        require(rater != target, "Cannot rate yourself");
        require(!hasRatedEscrow[escrowId][rater], "Already rated this escrow");

        hasRatedEscrow[escrowId][rater] = true;

        agentRatings[target].push(Rating({
            rater: rater,
            score: score,
            comment: comment,
            timestamp: block.timestamp,
            escrowId: escrowId
        }));

        totalScore[target] += score;
        ratingCount[target]++;

        // Update credit score based on new rating
        _updateCreditScore(target);

        emit AgentRated(target, rater, score, escrowId);
    }

    /**
     * @notice Check if a party has already rated an escrow
     */
    function canRate(uint256 escrowId, address rater) external view returns (bool) {
        return !hasRatedEscrow[escrowId][rater];
    }

    // ═══════════════════════════════════════════════════════════════════
    //                        TRUST SCORES
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Get trust score (average rating * 20, so 5 stars = 100)
     */
    function getTrustScore(address agent) external view returns (uint256 score, uint256 ratings) {
        if (ratingCount[agent] == 0) {
            return (50, 0);
        }
        uint256 avgRating = (totalScore[agent] * 20) / ratingCount[agent];
        return (avgRating, ratingCount[agent]);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                        CREDIT SYSTEM
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Get agent's credit score and limit
     */
    function getCreditInfo(address agent) external view returns (
        uint256 creditScore,
        uint256 creditLimit,
        uint256 creditAvailable,
        uint256 creditUsed
    ) {
        CreditProfile storage cp = creditProfiles[agent];
        uint256 available = cp.creditLimit > cp.creditUsed ? cp.creditLimit - cp.creditUsed : 0;
        return (cp.creditScore, cp.creditLimit, available, cp.creditUsed);
    }

    /**
     * @notice Get full credit profile
     */
    function getCreditProfile(address agent) external view returns (CreditProfile memory) {
        return creditProfiles[agent];
    }

    /**
     * @notice Record a loan (called by escrow for undercollateralized transactions)
     */
    function recordLoan(
        address borrower,
        uint256 amount,
        uint256 dueDate
    ) external onlyEscrow returns (uint256 loanId) {
        CreditProfile storage cp = creditProfiles[borrower];
        require(cp.creditScore >= MIN_CREDIT_SCORE, "No credit profile");
        require(cp.creditUsed + amount <= cp.creditLimit, "Exceeds credit limit");

        loanId = loanCount++;
        loans[loanId] = Loan({
            borrower: borrower,
            amount: amount,
            dueDate: dueDate,
            repaid: false,
            defaulted: false,
            createdAt: block.timestamp
        });

        cp.creditUsed += amount;
        cp.totalBorrowed += amount;

        emit LoanCreated(loanId, borrower, amount, dueDate);
    }

    /**
     * @notice Record loan repayment (called by escrow)
     */
    function recordRepayment(uint256 loanId) external onlyEscrow {
        Loan storage loan = loans[loanId];
        require(!loan.repaid && !loan.defaulted, "Loan already closed");

        loan.repaid = true;
        
        CreditProfile storage cp = creditProfiles[loan.borrower];
        cp.creditUsed -= loan.amount;
        cp.totalRepaid += loan.amount;

        if (block.timestamp <= loan.dueDate) {
            cp.onTimePayments++;
            // Boost credit score for on-time payment
            _adjustCreditScore(loan.borrower, 5);
        } else {
            cp.latePayments++;
            // Penalize for late payment
            _adjustCreditScore(loan.borrower, -10);
        }

        emit LoanRepaid(loanId, loan.borrower, loan.amount);
    }

    /**
     * @notice Record loan default (called by escrow or owner)
     */
    function recordDefault(uint256 loanId) external {
        require(msg.sender == escrowContract || msg.sender == owner, "Not authorized");
        
        Loan storage loan = loans[loanId];
        require(!loan.repaid && !loan.defaulted, "Loan already closed");
        require(block.timestamp > loan.dueDate, "Not yet due");

        loan.defaulted = true;
        
        CreditProfile storage cp = creditProfiles[loan.borrower];
        cp.creditUsed -= loan.amount; // Write off
        cp.defaults++;

        // Major credit hit for default
        _adjustCreditScore(loan.borrower, -100);

        emit LoanDefaulted(loanId, loan.borrower, loan.amount);
    }

    /**
     * @notice Internal: Update credit score based on trust rating
     */
    function _updateCreditScore(address agent) internal {
        CreditProfile storage cp = creditProfiles[agent];
        uint256 oldScore = cp.creditScore;

        // Base credit score calculation:
        // - Start with trust score (0-100) mapped to (300-700)
        // - Adjust for payment history
        
        (uint256 trustScore,) = this.getTrustScore(agent);
        
        // Trust contributes 300-700 (400 point range)
        uint256 trustComponent = 300 + (trustScore * 4);

        // Payment history can add/subtract up to 150 points
        int256 paymentComponent = 0;
        uint256 totalPayments = cp.onTimePayments + cp.latePayments;
        if (totalPayments > 0) {
            // On-time rate (0-100%)
            uint256 onTimeRate = (cp.onTimePayments * 100) / totalPayments;
            paymentComponent = int256(onTimeRate) - 50; // -50 to +50
            paymentComponent = paymentComponent * 3; // -150 to +150
        }

        // Defaults are catastrophic
        if (cp.defaults > 0) {
            paymentComponent -= int256(cp.defaults * 50);
        }

        // Calculate final score
        int256 rawScore = int256(trustComponent) + paymentComponent;
        
        // Clamp to valid range
        if (rawScore < int256(MIN_CREDIT_SCORE)) rawScore = int256(MIN_CREDIT_SCORE);
        if (rawScore > int256(MAX_CREDIT_SCORE)) rawScore = int256(MAX_CREDIT_SCORE);

        cp.creditScore = uint256(rawScore);
        cp.creditLimit = uint256(rawScore) * CREDIT_LIMIT_MULTIPLIER * 1e6 / 100;
        cp.lastUpdated = block.timestamp;

        if (cp.creditScore != oldScore) {
            emit CreditScoreUpdated(agent, oldScore, cp.creditScore);
            emit CreditLimitUpdated(agent, cp.creditLimit);
        }
    }

    /**
     * @notice Internal: Adjust credit score by delta
     */
    function _adjustCreditScore(address agent, int256 delta) internal {
        CreditProfile storage cp = creditProfiles[agent];
        uint256 oldScore = cp.creditScore;

        int256 newScore = int256(cp.creditScore) + delta;
        if (newScore < int256(MIN_CREDIT_SCORE)) newScore = int256(MIN_CREDIT_SCORE);
        if (newScore > int256(MAX_CREDIT_SCORE)) newScore = int256(MAX_CREDIT_SCORE);

        cp.creditScore = uint256(newScore);
        cp.creditLimit = uint256(newScore) * CREDIT_LIMIT_MULTIPLIER * 1e6 / 100;
        cp.lastUpdated = block.timestamp;

        emit CreditScoreUpdated(agent, oldScore, cp.creditScore);
        emit CreditLimitUpdated(agent, cp.creditLimit);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                          VIEWS
    // ═══════════════════════════════════════════════════════════════════

    function getAgent(address agent) external view returns (
        string memory name,
        string memory capabilitiesCSV,
        string memory metadataURI,
        uint256 registeredAt,
        bool active,
        uint256 trustScore,
        uint256 numRatings,
        uint256 creditScore,
        uint256 creditLimit
    ) {
        Agent storage a = agents[agent];
        (uint256 ts, uint256 nr) = this.getTrustScore(agent);
        CreditProfile storage cp = creditProfiles[agent];
        return (
            a.name, 
            a.capabilitiesCSV, 
            a.metadataURI, 
            a.registeredAt, 
            a.active, 
            ts, 
            nr,
            cp.creditScore,
            cp.creditLimit
        );
    }

    function discoverAgents(uint256 limit) external view returns (
        address[] memory agentAddresses,
        string[] memory names,
        uint256[] memory trustScores,
        uint256[] memory creditScores
    ) {
        uint256 count = registeredAgents.length < limit ? registeredAgents.length : limit;

        agentAddresses = new address[](count);
        names = new string[](count);
        trustScores = new uint256[](count);
        creditScores = new uint256[](count);

        uint256 j = 0;
        for (uint i = 0; i < registeredAgents.length && j < count; i++) {
            if (agents[registeredAgents[i]].active) {
                agentAddresses[j] = registeredAgents[i];
                names[j] = agents[registeredAgents[i]].name;
                (trustScores[j],) = this.getTrustScore(registeredAgents[i]);
                creditScores[j] = creditProfiles[registeredAgents[i]].creditScore;
                j++;
            }
        }
    }

    function getAgentRatings(address agent, uint256 limit) external view returns (Rating[] memory) {
        Rating[] storage ratings = agentRatings[agent];
        uint256 count = ratings.length < limit ? ratings.length : limit;
        Rating[] memory result = new Rating[](count);

        for (uint i = 0; i < count; i++) {
            result[i] = ratings[ratings.length - 1 - i];
        }
        return result;
    }

    function getAllAgents() external view returns (address[] memory) {
        return registeredAgents;
    }

    function getAgentCount() external view returns (uint256) {
        return registeredAgents.length;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                          ADMIN
    // ═══════════════════════════════════════════════════════════════════

    function setEscrowContract(address _escrow) external onlyOwner {
        escrowContract = _escrow;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
