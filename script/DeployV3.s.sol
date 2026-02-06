// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PayLobsterIdentity.sol";
import "../src/PayLobsterReputation.sol";
import "../src/PayLobsterCredit.sol";
import "../src/PayLobsterEscrowV3.sol";

/**
 * @title DeployV3
 * @notice Deploys all 4 Pay Lobster contracts to testnet/mainnet
 * 
 * Deployment Order:
 * 1. Identity (no deps) - Agent NFT handles
 * 2. Reputation (needs Identity) - Trust scores & ratings  
 * 3. Credit (no deps) - LOBSTER score & lending
 * 4. Escrow (needs all) - USDC payments
 * 
 * Usage:
 * BASE SEPOLIA (testnet):
 *   forge script script/DeployV3.s.sol:DeployV3 \
 *     --rpc-url https://sepolia.base.org \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 * 
 * BASE MAINNET:
 *   forge script script/DeployV3.s.sol:DeployV3 \
 *     --rpc-url https://mainnet.base.org \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 */
contract DeployV3 is Script {
    // Base Sepolia USDC (Circle test token)
    address constant USDC_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    // Base Mainnet USDC
    address constant USDC_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Detect network
        uint256 chainId = block.chainid;
        address usdc;
        string memory networkName;
        
        if (chainId == 84532) {
            // Base Sepolia
            usdc = USDC_SEPOLIA;
            networkName = "Base Sepolia";
        } else if (chainId == 8453) {
            // Base Mainnet
            usdc = USDC_MAINNET;
            networkName = "Base Mainnet";
        } else {
            revert("Unsupported chain");
        }
        
        console.log("===========================================");
        console.log("PAY LOBSTER V3 DEPLOYMENT");
        console.log("===========================================");
        console.log("Network:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("USDC:", usdc);
        console.log("===========================================");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Identity (ERC-721 Agent NFTs)
        console.log("\n[1/4] Deploying PayLobsterIdentity...");
        PayLobsterIdentity identity = new PayLobsterIdentity();
        console.log("Identity deployed:", address(identity));
        
        // 2. Deploy Reputation (needs Identity)
        console.log("\n[2/4] Deploying PayLobsterReputation...");
        PayLobsterReputation reputation = new PayLobsterReputation(address(identity));
        console.log("Reputation deployed:", address(reputation));
        
        // 3. Deploy Credit (standalone)
        console.log("\n[3/4] Deploying PayLobsterCredit...");
        PayLobsterCredit credit = new PayLobsterCredit();
        console.log("Credit deployed:", address(credit));
        
        // 4. Deploy Escrow (links everything)
        console.log("\n[4/4] Deploying PayLobsterEscrowV3...");
        PayLobsterEscrowV3 escrow = new PayLobsterEscrowV3(
            usdc,
            address(identity),
            address(reputation),
            address(credit),
            deployer,  // arbiter = deployer for now
            deployer   // feeRecipient = deployer for now
        );
        console.log("Escrow deployed:", address(escrow));
        
        // 5. Link contracts
        console.log("\n[5/5] Linking contracts...");
        
        // Authorize Escrow to update Reputation
        reputation.authorizeEscrow(address(escrow));
        console.log("Escrow authorized on Reputation");
        
        // Authorize Escrow to record loans in Credit
        credit.authorizeCaller(address(escrow));
        console.log("Escrow authorized on Credit");
        
        vm.stopBroadcast();
        
        // Summary
        console.log("\n===========================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("===========================================");
        console.log("Identity:   ", address(identity));
        console.log("Reputation: ", address(reputation));
        console.log("Credit:     ", address(credit));
        console.log("Escrow:     ", address(escrow));
        console.log("===========================================");
        console.log("\nSave these addresses!");
        console.log("\nNext steps:");
        console.log("1. Verify contracts on Basescan");
        console.log("2. Update SDK with new addresses");
        console.log("3. Test registration + escrow flow");
    }
}
