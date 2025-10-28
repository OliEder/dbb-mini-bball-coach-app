#!/bin/bash

# Security Audit und Fix Script
echo "🔍 Analyzing npm vulnerabilities..."
echo "=================================="
echo ""

# Detailed audit
echo "📊 Current vulnerabilities:"
npm audit

echo ""
echo "🔧 Attempting automatic fixes..."
npm audit fix

echo ""
echo "⚠️  If high vulnerabilities remain, trying forced fix..."
echo "Note: This may introduce breaking changes"
read -p "Do you want to force fix? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npm audit fix --force
fi

echo ""
echo "📋 Final audit report:"
npm audit

echo ""
echo "✅ Security check complete!"
