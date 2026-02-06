// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PayLobsterIdentity.sol";
import "../src/PayLobsterReputation.sol";
import "../src/PayLobsterRegistryV2.sol";
import "../src/PayLobsterEscrowV2.sol";

/**
 * @title DeployERC8004
 * @notice Deploy full ERC-8004 compliant Pay Lobster stack
 * 
 * Architecture:
 * 1. PayLobsterIdentity (ERC-8004 Identity Registry - ERC-721)
 * 2. PayLobsterReputation (ERC-8004 Reputation Registry)
 * 3. PayLobsterRegistryV2 (Credit System - Pay Lobster unique)
 * 4. PayLobsterEscrowV2 (Escrow + integrated rating)
 * 
 * Run with:
 * DEPLOYER_KEY=your_key forge script script/DeployERC8004.s.sol:DeployERC8004 \
 *   --rpc-url https://mainnet.base.org \
 *   --broadcast
 */
contract DeployERC8004 is Script {
    // Base Mainnet USDC
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerKey);
        
        console.log("===========================================");
        console.log("  Pay Lobster ERC-8004 Deployment");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Network: Base Mainnet");
        console.log("USDC:", USDC);
        console.log("");
        
        vm.startBroadcast(deployerKey);
        
        // 1. Deploy Identity Registry (ERC-8004)
        console.log("1. Deploying PayLobsterIdentity (ERC-8004 Identity)...");
        PayLobsterIdentity identity = new PayLobsterIdentity();
        console.log("   Address:", address(identity));
        
        // 2. Deploy Reputation Registry (ERC-8004)
        console.log("2. Deploying PayLobsterReputation (ERC-8004 Reputation)...");
        PayLobsterReputation reputation = new PayLobsterReputation(address(identity));
        console.log("   Address:", address(reputation));
        
        // 3. Deploy Credit Registry (Pay Lobster unique)
        console.log("3. Deploying PayLobsterRegistryV2 (Credit System)...");
        PayLobsterRegistryV2 credit = new PayLobsterRegistryV2();
        console.log("   Address:", address(credit));
        
        // 4. Deploy Escrow (integrates all)
        console.log("4. Deploying PayLobsterEscrowV2 (Escrow)...");
        PayLobsterEscrowV2 escrow = new PayLobsterEscrowV2(
            USDC,
            address(credit),  // Credit registry for loans
            deployer          // Arbiter
        );
        console.log("   Address:", address(escrow));
        
        // 5. Link contracts
        console.log("5. Linking contracts...");
        
        // Identity links to reputation and credit
        identity.setReputationRegistry(address(reputation));
        identity.setCreditRegistry(address(credit));
        console.log("   Identity -> Reputation, Credit: done");
        
        // Reputation links to escrow
        reputation.setEscrowContract(address(escrow));
        console.log("   Reputation -> Escrow: done");
        
        // Credit links to escrow
        credit.setEscrowContract(address(escrow));
        console.log("   Credit -> Escrow: done");
        
        vm.stopBroadcast();
        
        // Summary
        console.log("");
        console.log("===========================================");
        console.log("  DEPLOYMENT COMPLETE");
        console.log("===========================================");
        console.log("");
        console.log("ERC-8004 Contracts:");
        console.log("  Identity Registry:   ", address(identity));
        console.log("  Reputation Registry: ", address(reputation));
        console.log("");
        console.log("Pay Lobster Contracts:");
        console.log("  Credit Registry:     ", address(credit));
        console.log("  Escrow:              ", address(escrow));
        console.log("");
        console.log("Configuration:");
        console.log("  USDC:                ", USDC);
        console.log("  Arbiter:             ", deployer);
        console.log("");
        console.log("All contracts linked and ready!");
        console.log("");
        console.log("Next steps:");
        console.log("1. Update paylobster-config.json with addresses");
        console.log("2. Verify contracts on BaseScan");
        console.log("3. Update npm package");
    }
}
