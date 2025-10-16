#!/bin/bash

# Basketball PWA - Comprehensive Test Runner
# Führt alle Tests aus und überwacht Ergebnisse

echo "🏀 Basketball PWA Test Suite"
echo "============================"

# Create test-results directory if not exists
mkdir -p test-results

# Kill any existing test processes
pkill -f "vitest" || true
pkill -f "playwright" || true

# Start Test Watcher in background
echo "🔍 Starte Test Watcher..."
npx tsx scripts/test-watcher.ts &
WATCHER_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n🛑 Stopping all test processes..."
    kill $WATCHER_PID 2>/dev/null || true
    pkill -f "vitest" || true
    pkill -f "playwright" || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Run Vitest Unit Tests
echo -e "\n📦 Unit Tests (Vitest)..."
npm test -- --reporter=json --outputFile=test-results/vitest-results.json --run

# Run Playwright E2E Tests  
echo -e "\n🎭 E2E Tests (Playwright)..."
npx playwright test

# Generate combined report
echo -e "\n📊 Generiere Test-Report..."
npx playwright show-report

echo -e "\n✅ Alle Tests abgeschlossen!"
echo "Test Watcher läuft weiter (Ctrl+C zum Beenden)"

# Keep script running
wait $WATCHER_PID
