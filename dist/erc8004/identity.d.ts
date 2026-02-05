/**
 * ERC-8004 Identity Registry Client
 *
 * Register agents, manage identities, and resolve agent information.
 */
import { ethers } from 'ethers';
import { SupportedChain, AgentRegistration } from './constants';
export interface IdentityClientConfig {
    chain: SupportedChain;
    privateKey?: string;
    provider?: ethers.Provider;
}
export interface RegisteredAgent {
    agentId: number;
    owner: string;
    uri: string;
    registration?: AgentRegistration;
    agentRegistry: string;
}
export declare class IdentityClient {
    private chain;
    private provider;
    private signer?;
    private contract;
    private readOnlyContract;
    constructor(config: IdentityClientConfig);
    /**
     * Get the full agent registry identifier (namespace:chainId:address)
     */
    getAgentRegistry(): string;
    /**
     * Register a new agent with the Identity Registry
     *
     * @param registration Agent registration data
     * @returns The newly assigned agentId
     */
    register(registration: AgentRegistration): Promise<number>;
    /**
     * Update an agent's registration URI
     */
    updateRegistration(agentId: number, registration: AgentRegistration): Promise<void>;
    /**
     * Get agent information by ID
     */
    getAgent(agentId: number): Promise<RegisteredAgent | null>;
    /**
     * Get all agents owned by an address
     */
    getAgentsByOwner(owner: string): Promise<RegisteredAgent[]>;
    /**
     * Get total number of registered agents
     */
    getTotalAgents(): Promise<number>;
    /**
     * Search for agents by capability (searches registration files)
     */
    searchAgents(options: {
        capability?: string;
        service?: string;
        x402Support?: boolean;
        limit?: number;
    }): Promise<RegisteredAgent[]>;
    /**
     * Host a registration file and return its URI
     *
     * For simplicity, we use data: URIs (fully on-chain)
     * In production, you might use IPFS or HTTPS
     */
    private hostRegistrationFile;
    /**
     * Fetch and parse a registration file from its URI
     */
    private fetchRegistrationFile;
}
/**
 * Create a standard Pay Lobster registration file
 */
export declare function createLobsterAgentRegistration(options: {
    name: string;
    description: string;
    image?: string;
    agentId?: number;
    chain: SupportedChain;
    capabilities: string[];
    paymentAddress?: string;
    x402Endpoint?: string;
    escrowSupport?: boolean;
    mcpEndpoint?: string;
    a2aEndpoint?: string;
}): AgentRegistration;
//# sourceMappingURL=identity.d.ts.map