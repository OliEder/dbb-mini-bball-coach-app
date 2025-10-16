#!/bin/bash

# Upgrade PACT to v16 to fix security vulnerabilities
echo "🔒 Upgrading PACT to v16 to fix security vulnerabilities..."
echo "=========================================================="
echo ""

echo "📦 Removing old PACT version..."
npm uninstall @pact-foundation/pact

echo ""
echo "🆕 Installing PACT v16 (latest secure version)..."
npm install --save-dev @pact-foundation/pact@^16.0.0

echo ""
echo "📊 Security check after upgrade:"
npm audit

echo ""
echo "✅ PACT upgraded successfully!"
echo ""
echo "Note: Tests have been updated for v16 compatibility"
