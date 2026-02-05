/**
 * ERC-8004 Constants & Contract Addresses
 *
 * Official registry deployments from https://github.com/erc-8004/erc-8004-contracts
 */
export declare const ERC8004_CONTRACTS: {
    readonly testnet: {
        readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
        readonly reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713";
    };
    readonly mainnet: {
        readonly identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
        readonly reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
    };
};
export declare const CHAIN_CONFIG: {
    readonly 'ETH-SEPOLIA': {
        readonly chainId: 11155111;
        readonly namespace: "eip155";
        readonly rpcUrl: "https://rpc.sepolia.org";
        readonly explorer: "https://sepolia.etherscan.io";
        readonly contracts: {
            readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
            readonly reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713";
        };
    };
    readonly 'BASE-SEPOLIA': {
        readonly chainId: 84532;
        readonly namespace: "eip155";
        readonly rpcUrl: "https://sepolia.base.org";
        readonly explorer: "https://sepolia.basescan.org";
        readonly contracts: {
            readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
            readonly reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713";
        };
    };
    readonly 'MATIC-AMOY': {
        readonly chainId: 80002;
        readonly namespace: "eip155";
        readonly rpcUrl: "https://rpc-amoy.polygon.technology";
        readonly explorer: "https://amoy.polygonscan.com";
        readonly contracts: {
            readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
            readonly reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713";
        };
    };
    readonly 'ARB-SEPOLIA': {
        readonly chainId: 421614;
        readonly namespace: "eip155";
        readonly rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc";
        readonly explorer: "https://sepolia.arbiscan.io";
        readonly contracts: {
            readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
            readonly reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713";
        };
    };
    readonly 'ETH-MAINNET': {
        readonly chainId: 1;
        readonly namespace: "eip155";
        readonly rpcUrl: "https://eth.llamarpc.com";
        readonly explorer: "https://etherscan.io";
        readonly contracts: {
            readonly identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
            readonly reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
        };
    };
    readonly 'BASE-MAINNET': {
        readonly chainId: 8453;
        readonly namespace: "eip155";
        readonly rpcUrl: "https://mainnet.base.org";
        readonly explorer: "https://basescan.org";
        readonly contracts: {
            readonly identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
            readonly reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
        };
    };
};
export type SupportedChain = keyof typeof CHAIN_CONFIG;
export declare const IDENTITY_REGISTRY_ABI: readonly ["function balanceOf(address owner) view returns (uint256)", "function ownerOf(uint256 tokenId) view returns (address)", "function tokenURI(uint256 tokenId) view returns (string)", "function totalSupply() view returns (uint256)", "function tokenByIndex(uint256 index) view returns (uint256)", "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)", "function register(string uri) returns (uint256 agentId)", "function setAgentURI(uint256 agentId, string uri)", "function getAgentURI(uint256 agentId) view returns (string)", "function getAgentOwner(uint256 agentId) view returns (address)", "function getAgentsByOwner(address owner) view returns (uint256[])", "event AgentRegistered(uint256 indexed agentId, address indexed owner, string uri)", "event AgentURIUpdated(uint256 indexed agentId, string uri)", "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"];
export declare const REPUTATION_REGISTRY_ABI: readonly ["function postFeedback(uint256 agentId, int8 score, string context, bytes32 taskHash) returns (uint256 feedbackId)", "function postFeedbackWithProof(uint256 agentId, int8 score, string context, bytes32 taskHash, bytes proof) returns (uint256 feedbackId)", "function getFeedback(uint256 feedbackId) view returns (tuple(uint256 agentId, address author, int8 score, string context, bytes32 taskHash, uint256 timestamp))", "function getFeedbackCount(uint256 agentId) view returns (uint256)", "function getFeedbackByAgent(uint256 agentId, uint256 offset, uint256 limit) view returns (uint256[])", "function getAverageScore(uint256 agentId) view returns (int256 average, uint256 count)", "function authorizeFeedback(uint256 agentId, address author)", "function revokeFeedbackAuthorization(uint256 agentId, address author)", "function isAuthorizedFeedbackAuthor(uint256 agentId, address author) view returns (bool)", "event FeedbackPosted(uint256 indexed feedbackId, uint256 indexed agentId, address indexed author, int8 score)", "event FeedbackAuthorizationGranted(uint256 indexed agentId, address indexed author)", "event FeedbackAuthorizationRevoked(uint256 indexed agentId, address indexed author)"];
export interface AgentRegistration {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
    name: string;
    description: string;
    image?: string;
    services: AgentService[];
    x402Support: boolean;
    active: boolean;
    registrations: {
        agentId: number;
        agentRegistry: string;
    }[];
    supportedTrust: ('reputation' | 'crypto-economic' | 'tee-attestation' | 'zkml')[];
    usdcAgent?: {
        version: string;
        capabilities: string[];
        supportedChains: string[];
        paymentAddress?: string;
        escrowSupport: boolean;
        x402Endpoint?: string;
    };
}
export interface AgentService {
    name: string;
    endpoint: string;
    version?: string;
    skills?: string[];
    domains?: string[];
}
export interface Feedback {
    feedbackId: number;
    agentId: number;
    author: string;
    score: number;
    context: string;
    taskHash: string;
    timestamp: number;
}
export interface ReputationSummary {
    agentId: number;
    averageScore: number;
    totalFeedback: number;
    recentFeedback: Feedback[];
    trustLevel: 'untrusted' | 'new' | 'emerging' | 'established' | 'trusted' | 'verified';
}
export declare const TRUST_LEVELS: {
    readonly untrusted: {
        readonly minScore: -100;
        readonly minFeedback: 0;
    };
    readonly new: {
        readonly minScore: 0;
        readonly minFeedback: 1;
    };
    readonly emerging: {
        readonly minScore: 25;
        readonly minFeedback: 5;
    };
    readonly established: {
        readonly minScore: 50;
        readonly minFeedback: 20;
    };
    readonly trusted: {
        readonly minScore: 75;
        readonly minFeedback: 50;
    };
    readonly verified: {
        readonly minScore: 90;
        readonly minFeedback: 100;
    };
};
//# sourceMappingURL=constants.d.ts.map