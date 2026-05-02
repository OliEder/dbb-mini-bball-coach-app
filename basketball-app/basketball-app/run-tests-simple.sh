#!/bin/bash

# Basketball PWA Test Runner with Monitor
# Führt Tests aus und zeigt Ergebnisse im Monitor

echo "🏀 Basketball PWA Test Runner"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create test-results directory
mkdir -p test-results

# Function to run tests and capture results
run_tests() {
    echo -e "\n${BLUE}📦 Running Unit Tests...${NC}"
    
    # Run vitest with JSON output
    npm run test:json
    
    # Check exit code
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Unit tests passed!${NC}"
    else
        echo -e "${RED}❌ Unit tests failed!${NC}"
    fi
    
    # Parse results if file exists
    if [ -f "test-results/vitest-results.json" ]; then
        # Use node to parse JSON and display summary
        node -e "
        const fs = require('fs');
        try {
            const data = JSON.parse(fs.readFileSync('test-results/vitest-results.json', 'utf8'));
            const tests = data.numTotalTests || 0;
            const passed = data.numPassedTests || 0;
            const failed = data.numFailedTests || 0;
            
            console.log('');
            console.log('Test Summary:');
            console.log('  Total: ' + tests);
            console.log('  Passed: ' + passed);
            console.log('  Failed: ' + failed);
            
            if (data.testResults) {
                const failedTests = [];
                data.testResults.forEach(file => {
                    if (file.assertionResults) {
                        file.assertionResults.forEach(test => {
                            if (test.status === 'failed') {
                                failedTests.push(test.title || test.fullName);
                            }
                        });
                    }
                });
                
                if (failedTests.length > 0) {
                    console.log('\\nFailed Tests:');
                    failedTests.slice(0, 5).forEach(test => {
                        console.log('  ❌ ' + test);
                    });
                    if (failedTests.length > 5) {
                        console.log('  ... and ' + (failedTests.length - 5) + ' more');
                    }
                }
            }
        } catch (err) {
            // Fallback to simple counting
            const content = fs.readFileSync('test-results/vitest-results.json', 'utf8');
            const passed = (content.match(/\"passed\"/g) || []).length;
            const failed = (content.match(/\"failed\"/g) || []).length;
            console.log('Tests run: ' + (passed + failed));
            console.log('Passed: ' + passed);
            console.log('Failed: ' + failed);
        }
        "
    fi
}

# Main execution
run_tests

echo -e "\n${YELLOW}💡 Tip: Run 'npm run monitor' in another terminal to see live results${NC}"
echo -e "${YELLOW}💡 Or run 'npm run test:watch' for continuous testing${NC}\n"
