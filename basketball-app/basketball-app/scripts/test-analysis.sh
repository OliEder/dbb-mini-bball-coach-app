#!/bin/bash
# Test-Debug Script
# Analysiert Test-Fehler nach npm install

echo "🔍 Running Test Analysis..."

# Schritt 1: Einfacher Test-Lauf
echo "📊 Running tests..."
npm run test:json 2>&1 | tee test-output.log

# Schritt 2: Extrahiere Fehler
echo "❌ Failed tests:"
grep -E "FAIL|Error|TypeError" test-output.log

# Schritt 3: Spezifische BBB Tests
echo "🎯 Running BBB-specific tests..."
npx vitest run --reporter=verbose src/domains/bbb-api 2>&1 | tee bbb-test.log

# Schritt 4: Zusammenfassung
echo "📈 Summary:"
if [ -f "test-results/vitest-results.json" ]; then
  echo "Total tests: $(grep -c '"status"' test-results/vitest-results.json)"
  echo "Failed: $(grep -c '"status":"fail"' test-results/vitest-results.json)"
  echo "Passed: $(grep -c '"status":"pass"' test-results/vitest-results.json)"
fi

echo "✅ Analysis complete. Check test-output.log and bbb-test.log for details."
