"use strict";
/**
 * ERC-8004 Constants & Contract Addresses
 *
 * Official registry deployments from https://github.com/erc-8004/erc-8004-contracts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRUST_LEVELS = exports.REPUTATION_REGISTRY_ABI = exports.IDENTITY_REGISTRY_ABI = exports.CHAIN_CONFIG = exports.ERC8004_CONTRACTS = void 0;
exports.ERC8004_CONTRACTS = {
    // Testnets (same addresses across all testnets)
    testnet: {
        identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
        reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    },
    // Mainnets (same addresses across all mainnets)
    mainnet: {
        identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
        reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    },
};
exports.CHAIN_CONFIG = {
    'ETH-SEPOLIA': {
        chainId: 11155111,
        namespace: 'eip155',
        rpcUrl: 'https://rpc.sepolia.org',
        explorer: 'https://sepolia.etherscan.io',
        contracts: exports.ERC8004_CONTRACTS.testnet,
    },
    'BASE-SEPOLIA': {
        chainId: 84532,
        namespace: 'eip155',
        rpcUrl: 'https://sepolia.base.org',
        explorer: 'https://sepolia.basescan.org',
        contracts: exports.ERC8004_CONTRACTS.testnet,
    },
    'MATIC-AMOY': {
        chainId: 80002,
        namespace: 'eip155',
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        explorer: 'https://amoy.polygonscan.com',
        contracts: exports.ERC8004_CONTRACTS.testnet,
    },
    'ARB-SEPOLIA': {
        chainId: 421614,
        namespace: 'eip155',
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        explorer: 'https://sepolia.arbiscan.io',
        contracts: exports.ERC8004_CONTRACTS.testnet,
    },
    // Mainnets
    'ETH-MAINNET': {
        chainId: 1,
        namespace: 'eip155',
        rpcUrl: 'https://eth.llamarpc.com',
        explorer: 'https://etherscan.io',
        contracts: exports.ERC8004_CONTRACTS.mainnet,
    },
    'BASE-MAINNET': {
        chainId: 8453,
        namespace: 'eip155',
        rpcUrl: 'https://mainnet.base.org',
        explorer: 'https://basescan.org',
        contracts: exports.ERC8004_CONTRACTS.mainnet,
    },
};
// Identity Registry ABI (ERC-721 + URIStorage extension)
exports.IDENTITY_REGISTRY_ABI = [
    // ERC-721 standard
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function tokenByIndex(uint256 index) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    // ERC-8004 Identity Registry
    'function register(string uri) returns (uint256 agentId)',
    'function setAgentURI(uint256 agentId, string uri)',
    'function getAgentURI(uint256 agentId) view returns (string)',
    'function getAgentOwner(uint256 agentId) view returns (address)',
    'function getAgentsByOwner(address owner) view returns (uint256[])',
    // Events
    'event AgentRegistered(uint256 indexed agentId, address indexed owner, string uri)',
    'event AgentURIUpdated(uint256 indexed agentId, string uri)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];
// Reputation Registry ABI
exports.REPUTATION_REGISTRY_ABI = [
    // Post feedback
    'function postFeedback(uint256 agentId, int8 score, string context, bytes32 taskHash) returns (uint256 feedbackId)',
    'function postFeedbackWithProof(uint256 agentId, int8 score, string context, bytes32 taskHash, bytes proof) returns (uint256 feedbackId)',
    // Query feedback
    'function getFeedback(uint256 feedbackId) view returns (tuple(uint256 agentId, address author, int8 score, string context, bytes32 taskHash, uint256 timestamp))',
    'function getFeedbackCount(uint256 agentId) view returns (uint256)',
    'function getFeedbackByAgent(uint256 agentId, uint256 offset, uint256 limit) view returns (uint256[])',
    'function getAverageScore(uint256 agentId) view returns (int256 average, uint256 count)',
    // Authorization
    'function authorizeFeedback(uint256 agentId, address author)',
    'function revokeFeedbackAuthorization(uint256 agentId, address author)',
    'function isAuthorizedFeedbackAuthor(uint256 agentId, address author) view returns (bool)',
    // Events
    'event FeedbackPosted(uint256 indexed feedbackId, uint256 indexed agentId, address indexed author, int8 score)',
    'event FeedbackAuthorizationGranted(uint256 indexed agentId, address indexed author)',
    'event FeedbackAuthorizationRevoked(uint256 indexed agentId, address indexed author)',
];
// Trust level thresholds
exports.TRUST_LEVELS = {
    untrusted: { minScore: -100, minFeedback: 0 },
    new: { minScore: 0, minFeedback: 1 },
    emerging: { minScore: 25, minFeedback: 5 },
    established: { minScore: 50, minFeedback: 20 },
    trusted: { minScore: 75, minFeedback: 50 },
    verified: { minScore: 90, minFeedback: 100 },
};
//# sourceMappingURL=constants.js.map