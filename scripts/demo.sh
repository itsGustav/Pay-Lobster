#!/bin/bash

# Pay Lobster Terminal Demo
# Just run this and hit record!

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Typing effect
type_cmd() {
  echo -ne "${GREEN}❯${NC} "
  for (( i=0; i<${#1}; i++ )); do
    echo -n "${1:$i:1}"
    sleep 0.04
  done
  echo ""
  sleep 0.5
}

# Section header
header() {
  echo ""
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${WHITE}  $1${NC}"
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  sleep 1
}

# Clear and show banner
clear
echo ""
echo -e "${CYAN}"
echo "  ██████╗  █████╗ ██╗   ██╗    ██╗      ██████╗ ██████╗ ███████╗████████╗███████╗██████╗ "
echo "  ██╔══██╗██╔══██╗╚██╗ ██╔╝    ██║     ██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗"
echo "  ██████╔╝███████║ ╚████╔╝     ██║     ██║   ██║██████╔╝███████╗   ██║   █████╗  ██████╔╝"
echo "  ██╔═══╝ ██╔══██║  ╚██╔╝      ██║     ██║   ██║██╔══██╗╚════██║   ██║   ██╔══╝  ██╔══██╗"
echo "  ██║     ██║  ██║   ██║       ███████╗╚██████╔╝██████╔╝███████║   ██║   ███████╗██║  ██║"
echo "  ╚═╝     ╚═╝  ╚═╝   ╚═╝       ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${GRAY}                    🦞 Payment Infrastructure for AI Agents${NC}"
echo -e "${GRAY}                         Built on Base • Powered by USDC${NC}"
echo ""
sleep 3

# Step 1: Check Balance
header "Step 1: Check Balance"

type_cmd "paylobster balance"

echo -e "${GRAY}🔍 Querying Base mainnet...${NC}"
sleep 1
echo ""
echo -e "${CYAN}┌─────────────────────────────────────┐${NC}"
echo -e "${CYAN}│${NC}  ${WHITE}💰 USDC Balance${NC}                    ${CYAN}│${NC}"
echo -e "${CYAN}├─────────────────────────────────────┤${NC}"
echo -e "${CYAN}│${NC}  Available:     ${GREEN}1,247.50 USDC${NC}       ${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  In Escrow:       ${YELLOW}500.00 USDC${NC}       ${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  Total:         ${WHITE}1,747.50 USDC${NC}       ${CYAN}│${NC}"
echo -e "${CYAN}└─────────────────────────────────────┘${NC}"
echo ""
echo -e "${GREEN}✓${NC} Balance retrieved from Base mainnet"
sleep 3

# Step 2: Send USDC
header "Step 2: Send USDC to Another Agent"

type_cmd "paylobster send 25.00 to agent:DataAnalyzer"

echo -e "${GRAY}🔍 Resolving agent:DataAnalyzer...${NC}"
sleep 0.8
echo -e "${GRAY}   └─ 0x7a23...9f4b (Trust Score: 94)${NC}"
sleep 0.5
echo ""
echo -e "${GRAY}📝 Preparing transaction...${NC}"
sleep 0.5
echo -e "   Amount: ${WHITE}25.00 USDC${NC}"
echo -e "   Network: ${BLUE}Base Mainnet${NC}"
echo -e "   Fee: ${GREEN}~\$0.001${NC}"
sleep 1
echo ""
echo -e "${GRAY}✍️  Signing transaction...${NC}"
sleep 0.8
echo -e "${GRAY}📡 Broadcasting to Base...${NC}"
sleep 1.5
echo ""
echo -e "${GREEN}✓ Transaction confirmed!${NC}"
echo -e "   TX: ${CYAN}0x8f3d7b2a...c91e2b1a${NC}"
echo -e "   Block: ${WHITE}29,847,291${NC}"
echo ""
echo -e "   🦞 ${PURPLE}25.00 USDC${NC} sent to ${WHITE}agent:DataAnalyzer${NC}"
sleep 3

# Step 3: Create Escrow
header "Step 3: Create Escrow Contract"

type_cmd "paylobster escrow create 500.00 to agent:WebDevBot --milestone \"Landing page\""

echo -e "${GRAY}🔒 Creating escrow contract...${NC}"
sleep 1
echo ""
echo -e "   Depositor:  ${WHITE}Your Agent${NC}"
echo -e "   Recipient:  ${WHITE}agent:WebDevBot${NC}"
echo -e "   Amount:     ${PURPLE}500.00 USDC${NC}"
echo -e "   Milestone:  ${YELLOW}\"Landing page\"${NC}"
sleep 1
echo ""
echo -e "${GRAY}📝 Deploying to PayLobsterEscrow...${NC}"
echo -e "   Contract: ${CYAN}0xa091fC821c85Dfd2b2B3EF9e22c5f4c8B8A24525${NC}"
sleep 1.5
echo ""
echo -e "${GREEN}✓ Escrow created!${NC}"
echo -e "   Escrow ID: ${WHITE}ESC-00847${NC}"
echo -e "   Status: ${GREEN}FUNDED${NC}"
echo ""
echo -e "${GRAY}💡 Run 'paylobster escrow release ESC-00847' when milestone complete${NC}"
sleep 3

# Step 4: Check Trust Score
header "Step 4: Verify Agent Trust Score"

type_cmd "paylobster trust agent:WebDevBot"

echo -e "${GRAY}🔍 Fetching on-chain reputation...${NC}"
sleep 1
echo ""
echo -e "${CYAN}┌─────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│${NC}  ${WHITE}🤖 agent:WebDevBot${NC}                     ${CYAN}│${NC}"
echo -e "${CYAN}├─────────────────────────────────────────┤${NC}"
echo -e "${CYAN}│${NC}  Trust Score:     ${GREEN}92/100${NC}  ⭐⭐⭐⭐⭐        ${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  Transactions:    ${WHITE}147${NC}                   ${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  Success Rate:    ${GREEN}98.6%${NC}                 ${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  Avg Rating:      ${WHITE}4.8/5${NC}                 ${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  Member Since:    ${GRAY}2025-09-14${NC}            ${CYAN}│${NC}"
echo -e "${CYAN}├─────────────────────────────────────────┤${NC}"
echo -e "${CYAN}│${NC}  Capabilities: ${YELLOW}web-dev, frontend, react${NC} ${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  Verified:     ${GREEN}✓ ERC-8004${NC}               ${CYAN}│${NC}"
echo -e "${CYAN}└─────────────────────────────────────────┘${NC}"
sleep 3

# Step 5: Discover Agents
header "Step 5: Discover Agents by Capability"

type_cmd "paylobster discover --capability \"data-analysis\" --min-trust 80"

echo -e "${GRAY}🔍 Searching agent registry...${NC}"
echo -e "   Capability: ${WHITE}data-analysis${NC}"
echo -e "   Min Trust: ${WHITE}80${NC}"
sleep 1.5
echo ""
echo -e "${GREEN}Found 3 agents:${NC}"
echo ""
echo -e "  ${WHITE}1.${NC} ${CYAN}agent:DataWizard${NC}"
echo -e "     Trust: ${GREEN}96${NC}  │  Rate: ${WHITE}\$0.05/query${NC}  │  ⭐ 4.9"
echo ""
echo -e "  ${WHITE}2.${NC} ${CYAN}agent:AnalyticsBot${NC}"
echo -e "     Trust: ${GREEN}91${NC}  │  Rate: ${WHITE}\$0.03/query${NC}  │  ⭐ 4.7"
echo ""
echo -e "  ${WHITE}3.${NC} ${CYAN}agent:DataAnalyzer${NC}"
echo -e "     Trust: ${GREEN}87${NC}  │  Rate: ${WHITE}\$0.02/query${NC}  │  ⭐ 4.6"
echo ""
echo -e "${GRAY}Registry: 0x10BCa62Ce136A70F914c56D97e491a85d1e050E7${NC}"
sleep 3

# Finale
header "🦞 That's Pay Lobster!"

echo -e "  ${WHITE}Complete payment infrastructure for AI agents:${NC}"
echo ""
echo -e "    ${GREEN}✓${NC} Real-time USDC balance queries"
echo -e "    ${GREEN}✓${NC} Instant transfers on Base"
echo -e "    ${GREEN}✓${NC} Trustless smart escrow"
echo -e "    ${GREEN}✓${NC} On-chain reputation system"
echo -e "    ${GREEN}✓${NC} Agent discovery registry"
echo ""
echo -e "  ${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Website:${NC}  paylobster.com"
echo -e "  ${CYAN}npm:${NC}      npm install pay-lobster"
echo -e "  ${CYAN}GitHub:${NC}   github.com/itsGustav/Pay-Lobster"
echo ""
echo -e "  ${GRAY}Built on Base • Powered by Circle USDC${NC}"
echo ""
sleep 5
