# Test-Migration von src/ nach tests/

## Status: ⚠️ DRINGEND - Viele Tests noch in src/

## Gefundene Test-Dateien in src/ (aus TypeScript-Fehlern)

### Domain: bbb-api
**Aktuell:** `src/domains/bbb-api/services/__tests__/`
- BBBApiService.test.ts
- BBBSyncService.integration.test.ts
- BBBSyncService.pact.test.ts
- BBBSyncService.test.ts

**Ziel:**
- `tests/unit/domains/bbb-api/BBBApiService.test.ts` ✅ BEREITS VORHANDEN
- `tests/integration/bbb-api/BBBSyncService.integration.test.ts`
- `tests/contract/bbb-api/BBBSyncService.pact.test.ts`
- `tests/unit/domains/bbb-api/BBBSyncService.test.ts` ✅ BEREITS VORHANDEN

**Aktion:** DUPLIKATE - alte Dateien in src/ löschen!

---

### Domain: spiel
**Aktuell:** `src/domains/spiel/services/__tests__/`
- SpielService.test.ts

**Ziel:**
- `tests/unit/domains/spiel/services/SpielService.test.ts`

---

### Domain: spieler
**Aktuell:** `src/domains/spieler/services/`
- SpielerService.integration.test.ts
- SpielerService.test.ts

**Ziel:**
- `tests/integration/spieler/SpielerService.integration.test.ts`
- `tests/unit/domains/spieler/services/SpielerService.test.ts`

---

### Domain: spielplan
**Aktuell:** `src/domains/spielplan/services/`
- SpielService.integration.test.ts
- SpielService.test.ts

**Ziel:**
- `tests/integration/spielplan/SpielService.integration.test.ts`
- `tests/unit/domains/spielplan/services/SpielService.test.ts`

---

### Domain: team
**Aktuell:** `src/domains/team/services/`
- TeamService.test.ts

**Ziel:**
- `tests/unit/domains/team/services/TeamService.test.ts` ✅ BEREITS VORHANDEN

**Aktion:** DUPLIKAT - alte Datei in src/ löschen!

---

### Domain: verein
**Aktuell:** `src/domains/verein/services/`
- VereinService.test.ts

**Ziel:**
- `tests/unit/domains/verein/services/VereinService.test.ts`

---

### Shared: db
**Aktuell:** `src/shared/db/__tests__/`
- database-v7.test.ts

**Ziel:**
- `tests/unit/shared/db/database-v7.test.ts`

---

### Shared: services
**Aktuell:** `src/shared/services/__tests__/`
- BBBApiService.test.ts
- BBBSyncService.integration.test.ts
- BBBSyncService.pact.test.ts
- BBBSyncService.test.ts

**Ziel:**
- Siehe bbb-api oben (DUPLIKATE!)

---

### Test Helpers
**Aktuell:** `src/test/helpers/`
- index.ts

**Ziel:**
- `tests/helpers/index.ts`

---

## Migrations-Strategie

### Phase 1: Duplikate identifizieren
- [ ] BBBApiService Tests sind in `src/` UND `tests/`
- [ ] BBBSyncService Tests sind in `src/` UND `tests/`
- [ ] TeamService Tests sind in `src/` UND `tests/`

### Phase 2: Duplikate löschen (in src/)
```bash
# VORSICHT: Erst prüfen ob tests/ Version aktueller ist!
rm -rf src/domains/bbb-api/services/__tests__/
rm -rf src/shared/services/__tests__/BBB*
rm src/domains/team/services/TeamService.test.ts
```

### Phase 3: Verbleibende Tests migrieren
1. Spiel, Spieler, Spielplan, Verein Tests
2. Database Tests
3. Test Helpers

### Phase 4: tsconfig anpassen
Stelle sicher dass Tests ausgeschlossen sind:
```json
{
  "exclude": ["node_modules", "dist", "tests"]
}
```

## Sofort-Aktion erforderlich!

**Problem:** TypeScript kompiliert Tests in src/ mit, was zu 141 Fehlern führt.

**Lösung:** Tests gehören in `/tests`, nicht in `/src`!
