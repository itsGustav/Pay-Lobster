// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PayLobsterRegistryV2.sol";
import "../src/PayLobsterEscrowV2.sol";

/**
 * @title DeployV2
 * @notice Deploy Pay Lobster V2 contracts to Base mainnet
 * 
 * Run with:
 * forge script script/DeployV2.s.sol:DeployV2 \
 *   --rpc-url https://mainnet.base.org \
 *   --private-key $DEPLOYER_KEY \
 *   --broadcast \
 *   --verify
 */
contract DeployV2 is Script {
    // Base Mainnet USDC
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerKey);
        
        console.log("Deploying Pay Lobster V2...");
        console.log("Deployer:", deployer);
        console.log("USDC:", USDC);
        
        vm.startBroadcast(deployerKey);
        
        // 1. Deploy Registry V2
        PayLobsterRegistryV2 registry = new PayLobsterRegistryV2();
        console.log("PayLobsterRegistryV2 deployed:", address(registry));
        
        // 2. Deploy Escrow V2 (with registry and deployer as arbiter)
        PayLobsterEscrowV2 escrow = new PayLobsterEscrowV2(
            USDC,
            address(registry),
            deployer  // Arbiter = deployer for now
        );
        console.log("PayLobsterEscrowV2 deployed:", address(escrow));
        
        // 3. Link Registry to Escrow
        registry.setEscrowContract(address(escrow));
        console.log("Registry linked to Escrow");
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Registry V2:", address(registry));
        console.log("Escrow V2:", address(escrow));
        console.log("");
        console.log("Update paylobster-config.json with these addresses!");
    }
}
