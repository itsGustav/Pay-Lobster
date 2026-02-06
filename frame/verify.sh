#!/bin/bash

# LOBSTER Frame Verification Script
# Checks that all files are in place and the project is ready

echo "🦞 LOBSTER Frame Verification"
echo "=============================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        return 1
    fi
}

# File checks
echo "📁 Directory Structure:"
check_dir "app/api/[[...routes]]"
check_dir "app/api/og"
check_dir "lib"
check_dir "public"
check_dir "node_modules"
echo ""

echo "📄 Core Files:"
check_file "app/api/[[...routes]]/route.tsx"
check_file "app/api/og/route.tsx"
check_file "app/layout.tsx"
check_file "app/page.tsx"
check_file "lib/contracts.ts"
echo ""

echo "⚙️  Configuration:"
check_file "package.json"
check_file "tsconfig.json"
check_file "next.config.js"
check_file "vercel.json"
check_file ".gitignore"
echo ""

echo "📚 Documentation:"
check_file "README.md"
check_file "QUICKSTART.md"
check_file "TESTING.md"
check_file "DEPLOY.md"
check_file "BUILD_SUMMARY.md"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    echo "   Run: npm install"
    echo ""
fi

# Try to build
echo "🔨 Build Test:"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build succeeds"
else
    echo -e "${RED}✗${NC} Build fails - run 'npm run build' for details"
fi
echo ""

# Summary
echo "=============================="
echo "📊 Status Summary:"
echo ""
echo "Location: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""
echo "Next steps:"
echo "  1. npm run dev          (test locally)"
echo "  2. ngrok http 3001      (expose for testing)"
echo "  3. npx vercel --prod    (deploy)"
echo ""
echo "Frame endpoint: /api"
echo "Preview page: /"
echo ""
echo "🦞 Ready to check LOBSTER scores!"
