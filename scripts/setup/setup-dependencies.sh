#!/bin/bash

# Setup script for Claude Code Remote Control project dependencies
# This script checks for and installs Bun, Expo CLI, and other required tools

set -e

echo "🚀 Setting up dependencies for Claude Code Remote Control project..."
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Bun
install_bun() {
    echo -e "${BLUE}Installing Bun...${NC}"
    curl -fsSL https://bun.sh/install | bash
    
    # Add Bun to PATH for current session
    export PATH="$HOME/.bun/bin:$PATH"
    
    # Source shell profile to update PATH
    if [ -f "$HOME/.zshrc" ]; then
        echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$HOME/.bashrc"
    fi
    
    echo -e "${GREEN}✅ Bun installed successfully!${NC}"
}

# Function to install Expo CLI
install_expo_cli() {
    echo -e "${BLUE}Installing Expo CLI globally...${NC}"
    if command_exists bun; then
        bun add -g @expo/cli
    elif command_exists npm; then
        npm install -g @expo/cli
    else
        echo -e "${RED}❌ Neither Bun nor npm found. Cannot install Expo CLI.${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ Expo CLI installed successfully!${NC}"
}

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js from https://nodejs.org${NC}"
    echo "Node.js is required for this project."
    exit 1
fi

# Check and install Bun
echo -e "${BLUE}Checking Bun...${NC}"
if command_exists bun; then
    BUN_VERSION=$(bun --version)
    echo -e "${GREEN}✅ Bun is already installed: $BUN_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Bun not found.${NC}"
    read -p "Would you like to install Bun? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_bun
    else
        echo -e "${RED}❌ Bun is required for this project. Exiting.${NC}"
        exit 1
    fi
fi

# Check and install Expo CLI
echo -e "${BLUE}Checking Expo CLI...${NC}"
if command_exists expo; then
    EXPO_VERSION=$(expo --version)
    echo -e "${GREEN}✅ Expo CLI is already installed: $EXPO_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Expo CLI not found.${NC}"
    read -p "Would you like to install Expo CLI? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_expo_cli
    else
        echo -e "${YELLOW}⚠️  Expo CLI is recommended but not strictly required.${NC}"
    fi
fi

# Check Git
echo -e "${BLUE}Checking Git...${NC}"
if command_exists git; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✅ Git is installed: $GIT_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Git not found. Please install Git for version control.${NC}"
fi

echo
echo -e "${GREEN}🎉 Dependency check complete!${NC}"
echo
echo -e "${BLUE}Summary:${NC}"
echo "- Node.js: $(command_exists node && echo "✅ Installed" || echo "❌ Missing")"
echo "- Bun: $(command_exists bun && echo "✅ Installed" || echo "❌ Missing")"
echo "- Expo CLI: $(command_exists expo && echo "✅ Installed" || echo "❌ Missing")"
echo "- Git: $(command_exists git && echo "✅ Installed" || echo "❌ Missing")"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run this script if any dependencies are missing"
echo "2. Initialize the project with: bun init"
echo "3. Create Expo project with: bun create expo-app"
echo
echo -e "${GREEN}You're ready to start development! 🚀${NC}"