#!/bin/bash

# Installation Script für PACT Contract Testing
# 
# Dieses Script installiert die notwendigen Dependencies für PACT Contract Tests
# Die Installation ist optional - die Unit-Tests funktionieren auch ohne PACT

echo "📦 Installing PACT dependencies for contract testing..."

# Install PACT Foundation
npm install --save-dev @pact-foundation/pact@^12.2.0

echo "✅ PACT dependencies installed successfully!"
echo ""
echo "You can now run the full test suite including contract tests:"
echo "  npm test"
echo ""
echo "Or run only PACT tests:"
echo "  npm test -- BBBSyncService.pact.test.ts"
echo ""
echo "📝 Note: PACT tests generate contracts in ./pacts/contracts/"
