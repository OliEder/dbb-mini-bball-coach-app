#!/bin/bash

# Alternative: Remove PACT and use built-in mocking
echo "🔒 Removing PACT due to security vulnerabilities..."
echo "=================================================="
echo ""

echo "📦 Uninstalling @pact-foundation/pact..."
npm uninstall @pact-foundation/pact

echo ""
echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json
npm install

echo ""
echo "✅ Clean installation complete!"
echo ""
echo "📊 Security check:"
npm audit

echo ""
echo "💡 Alternative: Using MSW (Mock Service Worker) for API mocking"
echo "MSW is modern, secure, and has no known vulnerabilities"
echo ""
echo "To install MSW (optional):"
echo "  npm install --save-dev msw"
echo ""
echo "Or continue with the existing mock-based tests which work great!"
