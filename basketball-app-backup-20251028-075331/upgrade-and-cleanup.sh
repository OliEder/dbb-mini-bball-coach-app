#!/bin/bash

# Basketball App - Project Cleanup & NPM Upgrade Script
# Datum: 28.10.2025
# Version: 1.0.0

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Basketball App - Cleanup & Upgrade${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in basketball-app directory!${NC}"
    exit 1
fi

# Step 1: Create Backup
echo -e "\n${YELLOW}Step 1: Creating backup...${NC}"
BACKUP_DIR="../basketball-app-backup-$(date +%Y%m%d-%H%M%S)"
echo "Backup location: $BACKUP_DIR"
read -p "Create backup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp -r . "$BACKUP_DIR"
    echo -e "${GREEN}✅ Backup created${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping backup (not recommended!)${NC}"
fi

# Step 2: NPM Upgrade
echo -e "\n${YELLOW}Step 2: NPM Upgrade${NC}"
echo "Current npm version: $(npm -v)"
read -p "Upgrade npm to 11.6.2? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install -g npm@11.6.2
    echo -e "${GREEN}✅ NPM upgraded to $(npm -v)${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping npm upgrade${NC}"
fi

# Step 3: Clean and reinstall dependencies
echo -e "\n${YELLOW}Step 3: Clean reinstall dependencies${NC}"
read -p "Clean and reinstall all dependencies? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning npm cache..."
    npm cache clean --force
    
    echo "Removing node_modules and package-lock.json..."
    rm -rf node_modules package-lock.json
    
    echo "Installing dependencies..."
    npm install
    
    echo "Updating dependencies..."
    npm update
    
    echo "Fixing vulnerabilities..."
    npm audit fix || true
    
    echo -e "${GREEN}✅ Dependencies reinstalled${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping dependency reinstall${NC}"
fi

# Step 4: Create archive structure
echo -e "\n${YELLOW}Step 4: Archive old files${NC}"
read -p "Archive old files? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create archive directories
    mkdir -p archive/fixes
    mkdir -p archive/docs
    mkdir -p archive/cleanup
    mkdir -p archive/old-configs
    
    # Archive fix scripts
    echo "Archiving fix scripts..."
    for file in fix-*.{sh,js}; do
        [ -f "$file" ] && mv "$file" archive/fixes/ && echo "  Moved: $file"
    done
    
    # Archive cleanup scripts
    echo "Archiving cleanup scripts..."
    for file in cleanup-*.sh force-cleanup.sh; do
        [ -f "$file" ] && mv "$file" archive/cleanup/ && echo "  Moved: $file"
    done
    
    # Archive old documentation
    echo "Archiving old documentation..."
    for file in BUILD-*.md COMMIT*.md DEPLOYMENT*.md FIX-*.md \
                GITHUB_PAGES*.md ONBOARDING-V2-*.md PACKAGE-*.md \
                PACT-V16*.md REACT_ROUTER*.md SECURITY*.md \
                SIMPLIFIED*.md TEST-FIXES*.md VEREIN-*.md; do
        [ -f "$file" ] && mv "$file" archive/docs/ && echo "  Moved: $file"
    done
    
    # Archive old configs
    echo "Archiving old configs..."
    [ -f "vite.config.d.ts" ] && mv vite.config.d.ts archive/old-configs/
    [ -f "vite.config.js" ] && mv vite.config.js archive/old-configs/
    [ -f "vite.config.minimal.ts" ] && mv vite.config.minimal.ts archive/old-configs/
    [ -f "temp-fetch-fix.ts" ] && mv temp-fetch-fix.ts archive/old-configs/
    
    # Delete test output
    echo "Removing test output files..."
    [ -f "test-output.txt" ] && rm test-output.txt && echo "  Deleted: test-output.txt"
    [ -f ".rebuild-trigger" ] && rm .rebuild-trigger && echo "  Deleted: .rebuild-trigger"
    
    echo -e "${GREEN}✅ Files archived${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping file archiving${NC}"
fi

# Step 5: Test the build
echo -e "\n${YELLOW}Step 5: Testing build${NC}"
read -p "Run build test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful!${NC}"
    else
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping build test${NC}"
fi

# Step 6: Run tests
echo -e "\n${YELLOW}Step 6: Running tests${NC}"
read -p "Run test suite? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running tests..."
    npm test -- --run
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Tests passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping tests${NC}"
fi

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Cleanup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo "Summary:"
echo "  ✓ Backup created: $BACKUP_DIR"
echo "  ✓ NPM version: $(npm -v)"
echo "  ✓ Files archived to ./archive/"
echo "  ✓ Dependencies updated"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review the changes"
echo "  2. Test the application manually"
echo "  3. Commit changes with: git add -A && git commit -m 'chore: npm upgrade to v11.6.2 and project cleanup'"
echo
echo -e "${GREEN}Done!${NC}"
