# 🧪 Test-Konsolidierung & Migration - Aktionsplan

**Datum:** 30. Oktober 2025  
**Status:** 🔴 **KRITISCH** - Muss VOR weiterer Feature-Entwicklung  
**Priorität:** P0 (Blockierend)

---

## 🎯 Ziel

**Tests aus `/src/` nach `/tests/` verschieben und konsolidieren**

Aktuell liegen Tests in:
- ❌ `src/domains/*/services/*.test.ts`
- ❌ `src/domains/*/services/*.__tests__/`
- ❌ `src/shared/services/__tests__/`
- ❌ `src/shared/db/__tests__/`

Sollen nach:
- ✅ `tests/unit/domains/*/services/`
- ✅ `tests/unit/shared/services/`
- ✅ `tests/unit/shared/db/`

---

## 📊 Analyse: Welche Tests existieren wo?

### Phase 1: Bestandsaufnahme

**Aufgabe:** Liste ALLE Test-Dateien in `/src/` auf

```bash
# Script erstellen
cat > scripts/testing/analyze-test-locations.sh << 'EOF'
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
EOF

chmod +x scripts/testing/analyze-test-locations.sh
bash scripts/testing/analyze-test-locations.sh
```

**Output speichern in:** `docs/testing/TEST-LOCATION-INVENTORY.md`

---

## 🔄 Migration-Strategie (TDD-konform)

### Prinzip: RED → GREEN → REFACTOR

1. **RED Phase (aktuell):**
   - Tests sind bewusst rot
   - Service Cleanup durchgeführt
   - Import-Pfade müssen angepasst werden

2. **Migration (vor GREEN):**
   - Tests verschieben (ohne Code-Änderungen)
   - Import-Pfade anpassen
   - Vitest Config prüfen

3. **GREEN Phase (Ziel):**
   - Alle Tests grün
   - Coverage ≥85%
   - Keine Duplikate

---

## 📋 Migration-Plan (Schritt für Schritt)

### Schritt 1: Bestandsaufnahme ✅
```bash
bash scripts/testing/analyze-test-locations.sh > docs/testing/TEST-LOCATION-INVENTORY.md
```

### Schritt 2: Ziel-Struktur erstellen
```bash
# Alle benötigten Verzeichnisse
mkdir -p tests/unit/domains/spieler/services
mkdir -p tests/unit/domains/spielplan/services
mkdir -p tests/unit/domains/team/services
mkdir -p tests/unit/domains/verein/services
mkdir -p tests/unit/shared/services
mkdir -p tests/unit/shared/db
```

### Schritt 3: Tests verschieben (Domain für Domain)

#### 3.1 Spieler-Domain
```bash
# Unit Tests
mv src/domains/spieler/services/SpielerService.test.ts \
   tests/unit/domains/spieler/services/

# Integration Tests
mv src/domains/spieler/services/SpielerService.integration.test.ts \
   tests/integration/domains/spieler/
```

#### 3.2 Spielplan-Domain
```bash
mv src/domains/spielplan/services/SpielService.test.ts \
   tests/unit/domains/spielplan/services/

mv src/domains/spielplan/services/SpielService.integration.test.ts \
   tests/integration/domains/spielplan/
```

#### 3.3 Team-Domain
```bash
mv src/domains/team/services/TeamService.test.ts \
   tests/unit/domains/team/services/
```

#### 3.4 Verein-Domain
```bash
mv src/domains/verein/services/VereinService.test.ts \
   tests/unit/domains/verein/services/
```

#### 3.5 Shared Services
```bash
# BBB Tests (bereits in shared/services/__tests__/ nach Cleanup)
mv src/shared/services/__tests__/*.test.ts \
   tests/unit/shared/services/

# Integration & PACT Tests gesondert
mv src/shared/services/__tests__/*.integration.test.ts \
   tests/integration/shared/services/

mv src/shared/services/__tests__/*.pact.test.ts \
   tests/contract/shared/services/
```

#### 3.6 Shared DB
```bash
mv src/shared/db/__tests__/database-v7.test.ts \
   tests/unit/shared/db/
```

### Schritt 4: Import-Pfade anpassen

**In ALLEN verschobenen Tests:**

```typescript
// VORHER (in src/):
import { SpielerService } from './SpielerService';
import { db } from '../../../shared/db/database';

// NACHHER (in tests/):
import { SpielerService } from '@/domains/spieler/services/SpielerService';
import { db } from '@/shared/db/database';
```

**Automatisierung:**
```bash
# Script für Import-Pfad-Fix
cat > scripts/testing/fix-test-imports.sh << 'EOF'
#!/bin/bash

for file in tests/**/*.test.ts tests/**/*.integration.test.ts; do
  if [ -f "$file" ]; then
    # Relative Imports durch @/ ersetzen
    sed -i "s|from '\./|from '@/domains/|g" "$file"
    sed -i "s|from '\.\./\.\./\.\./shared/|from '@/shared/|g" "$file"
    sed -i "s|from '\.\./\.\./shared/|from '@/shared/|g" "$file"
    sed -i "s|from '\.\./shared/|from '@/shared/|g" "$file"
    echo "Fixed: $file"
  fi
done
EOF

chmod +x scripts/testing/fix-test-imports.sh
```

### Schritt 5: vitest.config.ts prüfen

```typescript
// Sicherstellen dass @/ Alias funktioniert
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Schritt 6: Tests ausführen

```bash
# Alle Tests
npm run test

# Nur verschobene Tests
npm run test -- tests/unit/domains/spieler

# Mit UI
npm run test:ui
```

### Schritt 7: Alte __tests__ Ordner aufräumen

```bash
# Wenn Tests erfolgreich verschoben & grün:
rm -rf src/domains/*/services/__tests__
rm -rf src/shared/services/__tests__
rm -rf src/shared/db/__tests__
```

---

## 🧹 Test-Duplikate konsolidieren

### Ähnlich wie Service Cleanup:

1. **Identifizieren:**
   ```bash
   # Duplikat-Analyse
   cat > scripts/testing/find-test-duplicates.sh << 'EOF'
   #!/bin/bash
   
   echo "=== Potenzielle Test-Duplikate ==="
   echo ""
   echo "SpielerService Tests:"
   find tests -name "*SpielerService*.test.ts" | sort
   echo ""
   echo "SpielService Tests:"
   find tests -name "*SpielService*.test.ts" | sort
   echo ""
   echo "TeamService Tests:"
   find tests -name "*TeamService*.test.ts" | sort
   EOF
   
   chmod +x scripts/testing/find-test-duplicates.sh
   bash scripts/testing/find-test-duplicates.sh
   ```

2. **Entscheiden:**
   - Unit vs Integration: **BEIDE behalten**, aber richtig organisieren
   - Duplikate: Bester Test gewinnt, anderer wird gelöscht
   - Legacy: In docs/archive/tests/ verschieben

3. **Dokumentieren:**
   - `docs/testing/TEST-CONSOLIDATION-LOG.md` updaten
   - Welche Tests entfernt/gemergt wurden

---

## ✅ Erfolgskriterien

Nach erfolgreicher Migration:

- [ ] Alle Tests in `/tests/` (keine mehr in `/src/`)
- [ ] Struktur folgt `/tests/{unit,integration,contract}/`
- [ ] Alle Import-Pfade mit `@/`
- [ ] Alle Tests laufen (`npm run test`)
- [ ] Coverage ≥85%
- [ ] Keine `__tests__` Ordner in `/src/`
- [ ] Dokumentation aktualisiert

---

## 🚨 Blocker & Risiken

### Blocker
1. **Node Modules Dependencies** (weiterhin!)
   - `source-map`, `strip-literal` fehlen
   - **FIX:** `npm install` MUSS ZUERST

2. **Import-Pfade nach Service Cleanup**
   - BBB Services verschoben (30.10.)
   - Alle Tests müssen neue Pfade verwenden

### Risiken
- Tests könnten nach Verschieben anders failen
- Import-Pfad-Fixes könnten andere Stellen brechen
- Coverage könnte temporär sinken

**Mitigation:** Schrittweise vorgehen, pro Domain testen

---

## 📝 Reihenfolge (Priorisiert)

### 1. SOFORT (Blockierend)
```bash
npm install  # Dependencies fixen
```

### 2. DANN (Heute)
```bash
bash scripts/testing/analyze-test-locations.sh
# Output prüfen → Migrations-Script anpassen
```

### 3. MORGEN
```bash
# Domain für Domain migrieren
# Tests verschieben → Import-Pfade fixen → Tests laufen lassen
```

### 4. ÜBERMORGEN
```bash
# Test-Duplikate konsolidieren
# Coverage prüfen
# GREEN Phase erreichen
```

---

## 🔗 Verwandte Dokumentation

- [SERVICE-CLEANUP-COMPLETED.md](../development/SERVICE-CLEANUP-COMPLETED.md) - Analog für Services
- [TEST-CONSOLIDATION-LOG.md](./TEST-CONSOLIDATION-LOG.md) - Update mit Migration
- [PROJECT-STATUS.md](../development/PROJECT-STATUS.md) - Status aktualisieren

---

## 💡 Template für Chat-Wechsel

```
Hallo! Wir sind bei der Test-Migration.

AKTUELLER STAND:
- Tests liegen noch in /src/ (müssen nach /tests/)
- Service Cleanup durchgeführt (BBB Services verschoben)
- Tests sind ROT (RED Phase TDD)
- Node Modules Dependencies fehlen noch

NÄCHSTER SCHRITT:
1. npm install (Dependencies)
2. Test-Location-Analyse (analyze-test-locations.sh)
3. Tests verschieben (Domain für Domain)
4. Import-Pfade fixen
5. GREEN Phase erreichen

Lies: docs/testing/TEST-MIGRATION-PLAN.md

Meine Frage: [...]
```

---

**STATUS:** 🔴 Blockierend - Muss vor Feature-Entwicklung  
**DEADLINE:** Diese Woche (bis 3.11.2025)  
**OWNER:** Entwickler + AI (schrittweise)
