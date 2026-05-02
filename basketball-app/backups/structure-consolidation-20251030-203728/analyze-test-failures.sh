#!/bin/bash

# Test-Fehler Analyse Script
echo "🔍 Analysiere Test-Fehler..."

# Führe Tests aus und speichere Output
echo "📊 Führe Tests aus..."
npm run test:json 2>&1 | tee test-results.log

# Extrahiere fehlgeschlagene Tests
echo ""
echo "❌ Fehlgeschlagene Tests:"
echo "========================"
grep -A 5 "FAIL" test-results.log | head -100

echo ""
echo "🔍 Suche nach spezifischen Fehlern:"
echo "===================================="
grep -E "TypeError|ReferenceError|Cannot read|undefined" test-results.log | head -20

echo ""
echo "📝 Test-Zusammenfassung:"
if [ -f "test-results/vitest-results.json" ]; then
    echo "Analysiere JSON Results..."
    node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('test-results/vitest-results.json'));
    const failed = data.testResults?.filter(t => t.status === 'failed') || [];
    console.log('Failed tests:', failed.length);
    failed.forEach(test => {
        console.log('- ' + test.name);
        if (test.message) console.log('  Error:', test.message.substring(0, 100));
    });
    "
fi
