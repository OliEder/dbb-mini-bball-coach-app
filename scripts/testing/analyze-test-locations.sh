#!/bin/bash

echo "=== Test-Dateien in /src/ ==="
echo ""

echo "1. Service-Tests in Domains:"
find src/domains -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | sort

echo ""
echo "2. __tests__ Ordner in Domains:"
find src/domains -type d -name "__tests__" 2>/dev/null | sort

echo ""
echo "3. Shared Services Tests:"
find src/shared/services -name "*.test.ts" 2>/dev/null | sort

echo ""
echo "4. Shared DB Tests:"
find src/shared/db -name "*.test.ts" 2>/dev/null | sort

echo ""
echo "5. Integration Tests in src/:"
find src -name "*.integration.test.ts" 2>/dev/null | sort

echo ""
echo "=== Test-Dateien in /tests/ (Soll-Zustand) ==="
find tests -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | sort
