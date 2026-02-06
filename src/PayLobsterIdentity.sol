// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PayLobsterIdentity
 * @notice ERC-8004 compliant Identity Registry for AI agents
 * @dev ERC-721 based agent handles with URI storage for registration files
 * 
 * ERC-8004 Specification:
 * - Each agent is an ERC-721 NFT
 * - tokenId = agentId (assigned incrementally)
 * - tokenURI = agentURI (resolves to registration JSON)
 * - Owner can transfer or delegate management
 * 
 * Pay Lobster Extension:
 * - Integrates with Reputation + Credit registries
 * - On-chain capabilities for quick filtering
 */
contract PayLobsterIdentity is ERC721URIStorage, Ownable {
    
    // ═══════════════════════════════════════════════════════════════════
    //                           STATE
    // ═══════════════════════════════════════════════════════════════════

    uint256 private _nextAgentId = 1;
    
    // Agent metadata (on-chain for quick queries)
    struct AgentMetadata {
        string name;
        string capabilities;      // CSV: "payments,escrow,code-review"
        bool active;
        uint256 registeredAt;
    }
    
    mapping(uint256 => AgentMetadata) public agentMetadata;
    mapping(address => uint256) public addressToAgentId;  // Reverse lookup
    
    // Linked registries
    address public reputationRegistry;
    address public creditRegistry;

    // ═══════════════════════════════════════════════════════════════════
    //                           EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event AgentRegistered(
        uint256 indexed agentId, 
        address indexed owner, 
        string name,
        string agentURI
    );
    event AgentURIUpdated(uint256 indexed agentId, string newURI);
    event AgentDeactivated(uint256 indexed agentId);
    event AgentReactivated(uint256 indexed agentId);

    // ═══════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor() ERC721("Pay Lobster Agent", "LOBSTER") Ownable(msg.sender) {}

    // ═══════════════════════════════════════════════════════════════════
    //                       ERC-8004: IDENTITY REGISTRY
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Register a new agent (ERC-8004 compliant)
     * @param agentURI URI to registration JSON (IPFS, HTTPS, or data:)
     * @param name Display name for the agent
     * @param capabilities Comma-separated capabilities
     * @return agentId The assigned agent ID (ERC-721 tokenId)
     */
    function register(
        string calldata agentURI,
        string calldata name,
        string calldata capabilities
    ) external returns (uint256 agentId) {
        require(bytes(agentURI).length > 0, "URI required");
        require(bytes(name).length > 0, "Name required");
        require(addressToAgentId[msg.sender] == 0, "Already registered");
        
        agentId = _nextAgentId++;
        
        _mint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        
        agentMetadata[agentId] = AgentMetadata({
            name: name,
            capabilities: capabilities,
            active: true,
            registeredAt: block.timestamp
        });
        
        addressToAgentId[msg.sender] = agentId;
        
        emit AgentRegistered(agentId, msg.sender, name, agentURI);
    }

    /**
     * @notice Update agent registration URI (ERC-8004: setAgentURI)
     * @param agentId The agent's token ID
     * @param newURI New registration JSON URI
     */
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(_isAuthorized(ownerOf(agentId), msg.sender, agentId), "Not authorized");
        require(bytes(newURI).length > 0, "URI required");
        
        _setTokenURI(agentId, newURI);
        emit AgentURIUpdated(agentId, newURI);
    }

    /**
     * @notice Update agent metadata
     */
    function updateMetadata(
        uint256 agentId,
        string calldata name,
        string calldata capabilities
    ) external {
        require(_isAuthorized(ownerOf(agentId), msg.sender, agentId), "Not authorized");
        
        agentMetadata[agentId].name = name;
        agentMetadata[agentId].capabilities = capabilities;
    }

    /**
     * @notice Deactivate an agent (soft delete)
     */
    function deactivate(uint256 agentId) external {
        require(_isAuthorized(ownerOf(agentId), msg.sender, agentId), "Not authorized");
        agentMetadata[agentId].active = false;
        emit AgentDeactivated(agentId);
    }

    /**
     * @notice Reactivate an agent
     */
    function reactivate(uint256 agentId) external {
        require(_isAuthorized(ownerOf(agentId), msg.sender, agentId), "Not authorized");
        agentMetadata[agentId].active = true;
        emit AgentReactivated(agentId);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           VIEWS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Get agent by address
     */
    function getAgentByAddress(address addr) external view returns (
        uint256 agentId,
        string memory name,
        string memory capabilities,
        string memory agentURI,
        bool active,
        uint256 registeredAt
    ) {
        agentId = addressToAgentId[addr];
        require(agentId != 0, "Agent not found");
        
        AgentMetadata storage meta = agentMetadata[agentId];
        return (
            agentId,
            meta.name,
            meta.capabilities,
            tokenURI(agentId),
            meta.active,
            meta.registeredAt
        );
    }

    /**
     * @notice Get agent by ID
     */
    function getAgent(uint256 agentId) external view returns (
        address owner,
        string memory name,
        string memory capabilities,
        string memory agentURI,
        bool active,
        uint256 registeredAt
    ) {
        require(agentId > 0 && agentId < _nextAgentId, "Invalid agentId");
        
        AgentMetadata storage meta = agentMetadata[agentId];
        return (
            ownerOf(agentId),
            meta.name,
            meta.capabilities,
            tokenURI(agentId),
            meta.active,
            meta.registeredAt
        );
    }

    /**
     * @notice Get total number of registered agents
     */
    function totalAgents() external view returns (uint256) {
        return _nextAgentId - 1;
    }

    /**
     * @notice Check if an address is registered
     */
    function isRegistered(address addr) external view returns (bool) {
        return addressToAgentId[addr] != 0;
    }

    /**
     * @notice Get agent ID by address
     */
    function getAgentId(address addr) external view returns (uint256) {
        return addressToAgentId[addr];
    }

    /**
     * @notice Discover agents (paginated)
     * @param offset Starting index
     * @param limit Max results
     */
    function discoverAgents(uint256 offset, uint256 limit) external view returns (
        uint256[] memory agentIds,
        address[] memory owners,
        string[] memory names,
        bool[] memory activeStatus
    ) {
        uint256 total = _nextAgentId - 1;
        if (offset >= total) {
            return (new uint256[](0), new address[](0), new string[](0), new bool[](0));
        }
        
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 count = end - offset;
        
        agentIds = new uint256[](count);
        owners = new address[](count);
        names = new string[](count);
        activeStatus = new bool[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 id = offset + i + 1;  // agentIds start at 1
            agentIds[i] = id;
            owners[i] = ownerOf(id);
            names[i] = agentMetadata[id].name;
            activeStatus[i] = agentMetadata[id].active;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           ADMIN
    // ═══════════════════════════════════════════════════════════════════

    function setReputationRegistry(address _registry) external onlyOwner {
        reputationRegistry = _registry;
    }

    function setCreditRegistry(address _registry) external onlyOwner {
        creditRegistry = _registry;
    }
}
