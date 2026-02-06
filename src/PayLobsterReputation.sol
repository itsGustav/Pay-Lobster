// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PayLobsterReputation
 * @notice ERC-8004 compliant Reputation Registry with Pay Lobster extensions
 * @dev Standard interface for posting and fetching feedback signals
 * 
 * ERC-8004 Specification:
 * - postFeedback(agentId, signal): Post feedback for an agent
 * - getFeedback(agentId): Fetch feedback signals
 * 
 * Pay Lobster Extensions:
 * - Escrow-verified ratings (only parties to completed transactions)
 * - Multi-dimensional trust vectors
 * - LOBSTER credit score integration
 */
contract PayLobsterReputation {
    
    // ═══════════════════════════════════════════════════════════════════
    //                           STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    struct Feedback {
        uint256 fromAgentId;      // Who gave the feedback
        uint8 score;              // 1-5 stars
        string comment;
        uint256 escrowId;         // Linked escrow (0 if none)
        uint256 timestamp;
        bytes32 category;         // "payment", "delivery", "quality", etc.
    }

    struct TrustVector {
        uint256 paymentScore;     // 0-100
        uint256 deliveryScore;    // 0-100
        uint256 qualityScore;     // 0-100
        uint256 responseScore;    // 0-100
        uint256 securityScore;    // 0-100
        uint256 overallScore;     // Weighted average
        uint256 totalRatings;
        uint256 lastUpdated;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           STATE
    // ═══════════════════════════════════════════════════════════════════

    // Feedback storage
    mapping(uint256 => Feedback[]) public agentFeedback;
    
    // Trust vectors
    mapping(uint256 => TrustVector) public trustVectors;
    
    // Category scores (agentId => category => totalScore, count)
    mapping(uint256 => mapping(bytes32 => uint256)) public categoryTotalScore;
    mapping(uint256 => mapping(bytes32 => uint256)) public categoryRatingCount;
    
    // Escrow rating tracking (escrowId => raterAgentId => rated)
    mapping(uint256 => mapping(uint256 => bool)) public hasRatedEscrow;
    
    // Linked contracts
    address public identityRegistry;
    address public escrowContract;
    address public owner;

    // Category constants
    bytes32 public constant CAT_PAYMENT = keccak256("payment");
    bytes32 public constant CAT_DELIVERY = keccak256("delivery");
    bytes32 public constant CAT_QUALITY = keccak256("quality");
    bytes32 public constant CAT_RESPONSE = keccak256("response");
    bytes32 public constant CAT_SECURITY = keccak256("security");

    // ═══════════════════════════════════════════════════════════════════
    //                           EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event FeedbackPosted(
        uint256 indexed agentId,
        uint256 indexed fromAgentId,
        uint8 score,
        bytes32 category,
        uint256 escrowId
    );
    event TrustVectorUpdated(uint256 indexed agentId, uint256 overallScore);

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

    constructor(address _identityRegistry) {
        identityRegistry = _identityRegistry;
        owner = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                    ERC-8004: REPUTATION REGISTRY
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Post feedback for an agent (ERC-8004 compliant)
     * @dev Called by escrow contract after transaction completion
     * @param agentId Agent receiving feedback
     * @param signal Encoded feedback data
     */
    function postFeedback(uint256 agentId, bytes calldata signal) external onlyEscrow {
        // Decode signal: (fromAgentId, score, comment, escrowId, category)
        (
            uint256 fromAgentId,
            uint8 score,
            string memory comment,
            uint256 escrowId,
            bytes32 category
        ) = abi.decode(signal, (uint256, uint8, string, uint256, bytes32));
        
        _postFeedback(agentId, fromAgentId, score, comment, escrowId, category);
    }

    /**
     * @notice Internal feedback posting with validation
     */
    function _postFeedback(
        uint256 agentId,
        uint256 fromAgentId,
        uint8 score,
        string memory comment,
        uint256 escrowId,
        bytes32 category
    ) internal {
        require(score >= 1 && score <= 5, "Score must be 1-5");
        require(agentId != fromAgentId, "Cannot rate yourself");
        
        // Escrow verification (if escrowId provided)
        if (escrowId > 0) {
            require(!hasRatedEscrow[escrowId][fromAgentId], "Already rated this escrow");
            hasRatedEscrow[escrowId][fromAgentId] = true;
        }
        
        // Store feedback
        agentFeedback[agentId].push(Feedback({
            fromAgentId: fromAgentId,
            score: score,
            comment: comment,
            escrowId: escrowId,
            timestamp: block.timestamp,
            category: category
        }));
        
        // Update category scores
        categoryTotalScore[agentId][category] += score;
        categoryRatingCount[agentId][category]++;
        
        // Update trust vector
        _updateTrustVector(agentId);
        
        emit FeedbackPosted(agentId, fromAgentId, score, category, escrowId);
    }

    /**
     * @notice Get feedback for an agent (ERC-8004 compliant)
     * @param agentId Agent to query
     * @return signals Array of encoded feedback
     */
    function getFeedback(uint256 agentId) external view returns (bytes[] memory signals) {
        Feedback[] storage feedback = agentFeedback[agentId];
        signals = new bytes[](feedback.length);
        
        for (uint256 i = 0; i < feedback.length; i++) {
            signals[i] = abi.encode(
                feedback[i].fromAgentId,
                feedback[i].score,
                feedback[i].comment,
                feedback[i].escrowId,
                feedback[i].category,
                feedback[i].timestamp
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                    PAY LOBSTER: TRUST VECTORS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Get trust vector for an agent
     */
    function getTrustVector(uint256 agentId) external view returns (TrustVector memory) {
        return trustVectors[agentId];
    }

    /**
     * @notice Get overall trust score (0-100)
     */
    function getTrustScore(uint256 agentId) external view returns (uint256 score, uint256 ratings) {
        TrustVector storage tv = trustVectors[agentId];
        if (tv.totalRatings == 0) {
            return (50, 0);  // Default score for new agents
        }
        return (tv.overallScore, tv.totalRatings);
    }

    /**
     * @notice Get category-specific score
     */
    function getCategoryScore(uint256 agentId, bytes32 category) external view returns (
        uint256 score,
        uint256 count
    ) {
        count = categoryRatingCount[agentId][category];
        if (count == 0) {
            return (50, 0);
        }
        score = (categoryTotalScore[agentId][category] * 20) / count;  // Convert 1-5 to 0-100
    }

    /**
     * @notice Internal: Update trust vector after new feedback
     */
    function _updateTrustVector(uint256 agentId) internal {
        TrustVector storage tv = trustVectors[agentId];
        
        // Calculate each dimension (0-100 scale)
        tv.paymentScore = _calcCategoryScore(agentId, CAT_PAYMENT);
        tv.deliveryScore = _calcCategoryScore(agentId, CAT_DELIVERY);
        tv.qualityScore = _calcCategoryScore(agentId, CAT_QUALITY);
        tv.responseScore = _calcCategoryScore(agentId, CAT_RESPONSE);
        tv.securityScore = _calcCategoryScore(agentId, CAT_SECURITY);
        
        // Weighted overall (payment and delivery weighted higher)
        uint256 totalWeight = 0;
        uint256 weightedSum = 0;
        
        if (categoryRatingCount[agentId][CAT_PAYMENT] > 0) {
            weightedSum += tv.paymentScore * 30;
            totalWeight += 30;
        }
        if (categoryRatingCount[agentId][CAT_DELIVERY] > 0) {
            weightedSum += tv.deliveryScore * 30;
            totalWeight += 30;
        }
        if (categoryRatingCount[agentId][CAT_QUALITY] > 0) {
            weightedSum += tv.qualityScore * 20;
            totalWeight += 20;
        }
        if (categoryRatingCount[agentId][CAT_RESPONSE] > 0) {
            weightedSum += tv.responseScore * 10;
            totalWeight += 10;
        }
        if (categoryRatingCount[agentId][CAT_SECURITY] > 0) {
            weightedSum += tv.securityScore * 10;
            totalWeight += 10;
        }
        
        if (totalWeight > 0) {
            tv.overallScore = weightedSum / totalWeight;
        } else {
            tv.overallScore = 50;  // Default
        }
        
        tv.totalRatings = agentFeedback[agentId].length;
        tv.lastUpdated = block.timestamp;
        
        emit TrustVectorUpdated(agentId, tv.overallScore);
    }

    /**
     * @notice Calculate category score (0-100)
     */
    function _calcCategoryScore(uint256 agentId, bytes32 category) internal view returns (uint256) {
        uint256 count = categoryRatingCount[agentId][category];
        if (count == 0) return 50;
        
        uint256 avgRating = categoryTotalScore[agentId][category] / count;  // 1-5
        return avgRating * 20;  // Scale to 0-100
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           VIEWS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Get recent feedback (paginated)
     */
    function getRecentFeedback(uint256 agentId, uint256 limit) external view returns (
        Feedback[] memory feedback
    ) {
        Feedback[] storage all = agentFeedback[agentId];
        uint256 count = all.length < limit ? all.length : limit;
        feedback = new Feedback[](count);
        
        for (uint256 i = 0; i < count; i++) {
            feedback[i] = all[all.length - 1 - i];  // Most recent first
        }
    }

    /**
     * @notice Check if an agent can rate another for an escrow
     */
    function canRate(uint256 escrowId, uint256 raterAgentId) external view returns (bool) {
        return !hasRatedEscrow[escrowId][raterAgentId];
    }

    /**
     * @notice Get feedback count for an agent
     */
    function getFeedbackCount(uint256 agentId) external view returns (uint256) {
        return agentFeedback[agentId].length;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           ADMIN
    // ═══════════════════════════════════════════════════════════════════

    function setEscrowContract(address _escrow) external onlyOwner {
        escrowContract = _escrow;
    }

    /**
     * @notice Alias for setEscrowContract (used by deploy script)
     */
    function authorizeEscrow(address _escrow) external onlyOwner {
        escrowContract = _escrow;
    }

    function setIdentityRegistry(address _identity) external onlyOwner {
        identityRegistry = _identity;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                    ESCROW INTEGRATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Submit feedback from escrow contract (convenience method)
     * @dev Called by EscrowV3 after transaction completion
     */
    function submitFeedback(
        uint256 fromAgentId,
        uint256 toAgentId,
        uint8 rating,
        string calldata category,
        string calldata comment,
        bytes32 txRef
    ) external onlyEscrow {
        bytes32 cat = keccak256(bytes(category));
        _postFeedback(toAgentId, fromAgentId, rating, comment, uint256(txRef), cat);
    }

    /**
     * @notice Get agent's overall trust score (0-100)
     */
    function getAgentTrustScore(uint256 agentId) external view returns (uint256) {
        TrustVector storage tv = trustVectors[agentId];
        if (tv.totalRatings == 0) {
            return 50;  // Default for new agents
        }
        return tv.overallScore;
    }
}
