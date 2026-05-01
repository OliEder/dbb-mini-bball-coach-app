# PACT Contract Tests - DBB-API

## ✅ Status

**Phase:** COMPLETE - Comprehensive Test Suite erstellt  
**Datum:** 02.11.2025  
**Basiert auf:** 53 echten API Responses aus verschiedenen Ligen/Altersklassen

---

## 📋 Test Coverage

### Endpoints getestet

1. **Competition Table** - `GET /rest/competition/table/id/{ligaId}`
   - [x] Bundesliga (statisticType: 0)
   - [x] U10 (statisticType: 1)

2. **Competition Spielplan** - `GET /rest/competition/spielplan/id/{ligaId}`
   - [x] Bundesliga mit vollständigem Spielplan

3. **Match Info** - `GET /rest/match/id/{matchId}/matchInfo`
   - [x] Bundesliga Match-Details

4. **Club Teams** - `GET /rest/club/id/{clubId}/teams`
   - [x] Alle Teams eines Vereins

5. **Competition List** - `POST /rest/competition/list`
   - [x] Liga-Details per POST-Request

---

## 🎯 Korrekte Feldnamen (aus echten Responses)

### ✅ KORREKT verwendet:

```typescript
interface TableEntry {
  rang: number;
  team: TeamInfo;        // Objekt, NICHT String!
  anzspiele: number;
  anzGewinnpunkte: number;
  anzVerlustpunkte: number;
  s: number;             // Siege (wins)
  n: number;             // Niederlagen (losses)
  koerbe: number;        // Erzielte Körbe
  gegenKoerbe: number;   // Gegenkörbe
  korbdiff: number;      // Korbdifferenz
}
```

### ❌ FALSCH (alte Contract-Fehler):
- `gewonnen` / `verloren` → Verwende `s` / `n`
- `korbpunkte` → Verwende `koerbe`
- `team: string` → Verwende `team: TeamInfo` (Objekt!)

---

## 🚀 Tests ausführen

### Alle Contract Tests
```bash
npm test tests/contract
```

### Nur PACT Tests
```bash
npm test BBBApi.comprehensive.pact.test.ts
```

### PACT Contracts generieren
```bash
npm test tests/contract -- --run
```

Generierte Contracts: `/tests/contract/pacts/Basketball-PWA-DBB-API.json`

---

## 📊 statisticType Unterschiede

| Type | Ligen | Besonderheiten |
|------|-------|----------------|
| 0 | Bundesliga, ProB, Regionalliga, U18 | Vollständige Stats, Play-by-Play möglich |
| 1 | U10, U12 | Reduzierte Stats, Anonymisierung bei U8-U14 |

**Wichtig:** Beide Typen verwenden dieselben Feldnamen (`s`, `n`, `koerbe`)!

---

## 🔍 Response-Beispiele

Siehe: `/basketball-bund-api/Resonses BBB-API/`

### Wichtige Dateien:
- `bundesliga-table.json` - statisticType: 0
- `u12-table.json` - statisticType: 1
- `match-bundesliga-matchInfo.json` - Match-Details
- `club-id-428-teams.json` - Club-Teams

---

## 📝 Type Matchers

### PactV3 Matcher verwendet:

```typescript
import { MatchersV3 } from '@pact-foundation/pact';
const { like, eachLike, integer, string, boolean, regex } = MatchersV3;

// Beispiele:
like(null)                              // Nullable Felder
integer(51520)                          // Zahlen
string('Bundesliga')                    // Strings
boolean(true)                           // Booleans
regex(/^\d{4}-\d{2}-\d{2}$/, '2025-08-01')  // Patterns
eachLike(matcherObject)                 // Arrays
```

---

## ⚠️ Bekannte Edge Cases

1. **Nullable Felder:**
   - `teamnameSmall`, `bezirknr`, `bezirkName`, `kreisnr`, `kreisname` können `null` sein
   - `result` ist `null` für noch nicht gespielte Matches
   
2. **Anonymisierung (U8-U14):**
   - Spieler-Namen: `vorname: "***"`, `nachname: "****"`
   - Spieler-IDs: `playerId: 0`, `person.id: 0`
   - Trikotnummern: `no: "**"`

3. **Play-by-Play:**
   - Nur bei Bundesliga/ProB verfügbar
   - `hasPlayByPlay: false` bei den meisten Ligen

---

## 📚 Weitere Dokumentation

- [PACT Implementation Plan](./PACT-COMPREHENSIVE-IMPLEMENTATION-PLAN.md)
- [DBB API Complete Documentation](/basketball-bund-api/DBB-API-COMPLETE-DOCUMENTATION.md)
- [OpenAPI Spec](/basketball-bund-api/basketball-bund-net-api-V1.yaml)

---

**Letzte Aktualisierung:** 02.11.2025  
**Status:** ✅ Production Ready
