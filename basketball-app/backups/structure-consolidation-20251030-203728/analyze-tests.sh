#!/bin/bash

# Comprehensive Test Failure Analysis
echo "🔍 Basketball App - Test Failure Analysis"
echo "=========================================="
echo ""

# 1. Run tests and capture output
echo "📊 Running tests with detailed output..."
npm run test -- --run --reporter=verbose 2>&1 > test-output-full.log

# 2. Extract summary
echo ""
echo "📈 Test Summary:"
echo "----------------"
grep -E "Test Files|Tests|Duration|passed|failed" test-output-full.log | tail -5

# 3. List all failing tests
echo ""
echo "❌ Failed Tests:"
echo "----------------"
grep "FAIL" test-output-full.log | head -20

# 4. Show BBB-related failures specifically
echo ""
echo "🔍 BBB API Test Failures:"
echo "-------------------------"
grep -A 3 "BBBApiService\|BBBSyncService" test-output-full.log | grep -E "FAIL|✗|Error"

# 5. Extract error messages
echo ""
echo "💥 Error Messages:"
echo "------------------"
grep -E "TypeError|ReferenceError|Error:|Expected|Received" test-output-full.log | head -20

# 6. Check for specific issues
echo ""
echo "🎯 Common Issues Found:"
echo "-----------------------"

# Check for undefined errors
UNDEFINED_COUNT=$(grep -c "undefined" test-output-full.log)
echo "- 'undefined' errors: $UNDEFINED_COUNT"

# Check for mapping issues
MAPPING_COUNT=$(grep -c "teamname\|teamName\|gewonnen\|wins" test-output-full.log)
echo "- Field mapping issues: $MAPPING_COUNT"

# Check for mock issues
MOCK_COUNT=$(grep -c "mock\|Mock" test-output-full.log)
echo "- Mock-related issues: $MOCK_COUNT"

echo ""
echo "📝 Full output saved to: test-output-full.log"
echo "💡 Run 'npm run test:ui' for interactive debugging"
