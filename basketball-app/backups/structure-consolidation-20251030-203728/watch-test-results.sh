#!/bin/bash
# Test Results Watcher für Claude
# Zeigt kontinuierlich die neuesten Test-Ergebnisse aus JSON

RESULT_FILE="test-results/vitest-results.json"

echo "🧪 Watching test results at: $RESULT_FILE"
echo "📝 Run: npm run test:watch"
echo "---"

# Warte bis Datei existiert
while [ ! -f "$RESULT_FILE" ]; do
  echo "⏳ Waiting for test results..."
  sleep 2
done

# Zeige kontinuierlich Updates
while true; do
  if [ -f "$RESULT_FILE" ]; then
    clear
    echo "🧪 Latest Test Results ($(date +%H:%M:%S))"
    echo "=================================="
    
    # Parse JSON mit jq (falls verfügbar) oder cat
    if command -v jq &> /dev/null; then
      jq -r '
        "Total Tests: \(.numTotalTests)",
        "Passed: \(.numPassedTests)",
        "Failed: \(.numFailedTests)",
        "Pending: \(.numPendingTests)",
        "",
        "Duration: \(.testResults[0].duration // 0)ms",
        "",
        "Status: \(if .success then "✅ ALL PASSED" else "❌ FAILED" end)"
      ' "$RESULT_FILE"
      
      # Zeige fehlgeschlagene Tests
      if jq -e '.numFailedTests > 0' "$RESULT_FILE" > /dev/null; then
        echo ""
        echo "Failed Tests:"
        echo "---"
        jq -r '.testResults[].assertionResults[] | select(.status == "failed") | "❌ \(.fullName)\n   \(.failureMessages[0] // "No error message")\n"' "$RESULT_FILE"
      fi
    else
      # Fallback ohne jq
      echo "📄 Raw JSON (install jq for better formatting):"
      cat "$RESULT_FILE"
    fi
  fi
  
  sleep 3
done
