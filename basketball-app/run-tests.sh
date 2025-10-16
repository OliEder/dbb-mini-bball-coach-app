#!/bin/bash

# Test Runner Script für Basketball PWA
# 
# Führt verschiedene Test-Szenarien aus

echo "🏀 Basketball PWA Test Suite"
echo "============================"
echo ""

# Check if running specific test type
case "$1" in
  "unit")
    echo "🧪 Running Unit Tests only..."
    npm run test:unit
    ;;
    
  "integration")
    echo "🔗 Running Integration Tests only..."
    npm run test:integration
    ;;
    
  "pact")
    echo "📝 Running PACT Contract Tests only..."
    npm run test:pact
    ;;
    
  "all")
    echo "🚀 Running ALL Tests (Unit + Integration + PACT)..."
    npm run test:all
    ;;
    
  "watch")
    echo "👁️  Starting Watch Mode..."
    npm test -- --watch
    ;;
    
  "coverage")
    echo "📊 Running Tests with Coverage..."
    npm run test:coverage
    ;;
    
  "ui")
    echo "🖥️  Starting Vitest UI..."
    npm run test:ui
    ;;
    
  *)
    echo "🚀 Running All Tests..."
    npm run test:all
    
    echo ""
    echo "Options:"
    echo "  ./run-tests.sh unit        - Run unit tests only"
    echo "  ./run-tests.sh integration - Run integration tests only"
    echo "  ./run-tests.sh pact        - Run PACT tests only"
    echo "  ./run-tests.sh all         - Run all tests"
    echo "  ./run-tests.sh watch       - Start watch mode"
    echo "  ./run-tests.sh coverage    - Run with coverage"
    echo "  ./run-tests.sh ui          - Open Vitest UI"
    ;;
esac
