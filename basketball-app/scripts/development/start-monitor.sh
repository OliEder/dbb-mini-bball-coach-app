#!/bin/bash

# Basketball PWA Test Monitor Launcher
# Startet den Test Monitor ohne externe Dependencies

echo "🏀 Starting Basketball PWA Test Monitor..."
echo "==========================================="

# Create test-results directory if not exists
mkdir -p test-results

# Navigate to scripts directory
cd scripts

# Run the native monitor (no dependencies needed)
node test-monitor-native.js
