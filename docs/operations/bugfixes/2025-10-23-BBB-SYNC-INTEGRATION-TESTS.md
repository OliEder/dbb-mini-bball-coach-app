# BBB Sync Integration Tests - Bug Fixes

**Datum:** 23. Oktober 2025  
**Autor:** AI-Assisted Development  
**Status:** ✅ Fertig  
**Betroffene Dateien:**
- `src/domains/bbb-api/services/__tests__/BBBSyncService.integration.test.ts`

---

## Zusammenfassung

5 fehlgeschlagene Integration-Tests im BBBSyncService wurden behoben. Die Hauptursache waren **inkonsistente Mock-Datenstrukturen** und **falsche Annahmen über DEV-Modus-Verhalten**.

---

## 🔴 Fehler #1: Undefinierte Variable

### Problem
```
ReferenceError: mockSpielplanResponse is not defined
```

### Root Cause
Variable wurde als `spielplanResponse` definiert, aber als `mockSpielplanResponse` referenziert.

### Lösung
```typescript
// ❌ Vorher
json: async () => mockSpielplanResponse

// ✅ Nachher  
json: async () => spielplanResponse
```

### Prevention
- **Naming Convention einhalten**: Mock-Variablen konsistent benennen
- TypeScript strict mode hilft, solche Fehler zur Compile-Zeit zu finden

---

## 🔴 Fehler #2: CORS-Proxy-Fallback Test

### Problem
```
AssertionError: expected 2nd "spy" call to have been called with...
TypeError: Cannot read properties of undefined (reading 'ligaId')
```

### Root Cause
1. **DEV-Modus überspringt direkten Fetch** → Erster Call ist bereits ein Proxy
2. **Falsche Response-Struktur**: Test erwartete `result.data.ligaId`, aber API gibt direktes `result.ligaId` zurück

### Lösung
```typescript
// Test-Assertion anpassen
expect(mockFetch).toHaveBeenNthCalledWith(1,  // Nicht 2!
  expect.stringContaining('corsproxy.io'),
  expect.any(Object)
);
expect(result.ligaId).toBe(ligaId);  // Nicht result.data.ligaId
```

### Prevention
- **BBBApiService Mapping beachten**: 
  - API liefert: `{ data: { ligaId, teams: [...] } }`
  - Service gibt zurück: `{ ligaId, teams: [...] }` (ohne data-Wrapper)
- **DEV-Modus dokumentieren**: In Tests berücksichtigen, dass direkter Fetch übersprungen wird

---

## 🔴 Fehler #3: Partielle Fehler tolerieren

### Problem
```
AssertionError: expected 0 to be greater than 0
```

### Root Cause
Mock-Daten verwendeten **englische Feldnamen** (position, teamName, clubName), aber API erwartet **deutsche Feldnamen**.

### Lösung
```typescript
// ❌ Vorher (Englisch)
teams: [{
  position: 1,
  teamName: 'Team A',
  clubName: 'Club A',
  games: 5,
  wins: 3,
  // ...
}]

// ✅ Nachher (Deutsch, wie echte API)
data: {
  teams: [{
    platzierung: 1,
    teamname: 'Team A',
    vereinname: 'Club A',
    spiele: 5,
    gewonnen: 3,
    verloren: 2,
    punkte: 6,
    korbpunkteGemacht: 100,
    korbpunkteGegen: 90,
    differenz: 10
  }]
}
```

### Prevention
- **API-Schema als Single Source of Truth**: 
  - Dokumentation: `docs/development/DBB-API-EVALUATION.md`
  - Mock-Daten IMMER von echten API-Responses ableiten
- **Type-Safe Mocks**: 
  ```typescript
  const mockResponse: { data: DBBTabelleApiResponse } = { ... }
  ```

---

## 🔴 Fehler #4: Alle Proxies durchprobieren

### Problem
```
AssertionError: expected "spy" to be called 7 times, but got 6 times
```

### Root Cause
Test erwartete **7 Versuche** (1 direkt + 6 Proxies), aber im **DEV-Modus** wird direkter Fetch übersprungen → nur **6 Proxy-Versuche**.

### Lösung
```typescript
// Test-Kommentar und Assertion anpassen
// All 6 CORS proxies fail (direct fetch is skipped in DEV mode)
expect(mockFetch).toHaveBeenCalledTimes(6);  // Nicht 7!
```

### Prevention
- **Environment-spezifisches Verhalten dokumentieren**:
  ```typescript
  // BBBApiService.ts
  if (import.meta.env.DEV) {
    console.log('🔄 DEV: Using CORS proxy immediately');
  } else {
    // Production: Versuche direkt
  }
  ```

---

## 🔴 Fehler #5: Duplikate vermeiden

### Problem
```
AssertionError: expected [] to have a length of 1 but got +0
```

### Root Cause
Gleiche Ursache wie Fehler #3 - Mock-Daten mit falschen Feldnamen.

### Lösung
Mock-Struktur auf deutsche API-Feldnamen umgestellt (siehe Fehler #3).

---

## 📋 Checklist für zukünftige API-Tests

### ✅ Mock-Daten erstellen
- [ ] Von **echten API-Responses** ableiten (nie raten!)
- [ ] **Wrapper-Struktur beachten**: `{ data: { ... } }`
- [ ] **Deutsche Feldnamen** verwenden (platzierung, teamname, etc.)
- [ ] **Type-Safe Mocks** mit TypeScript-Typen

### ✅ Environment-Verhalten
- [ ] **DEV-Modus berücksichtigen** (kein direkter Fetch)
- [ ] **Proxy-Anzahl** korrekt testen (6 in DEV, 7 in Production)

### ✅ Response-Mapping
- [ ] **BBBApiService Mapping-Logik** verstehen:
  ```typescript
  // API gibt: { data: { ligaId, teams } }
  // Service mappt zu: { ligaId, teams }
  ```
- [ ] Tests auf **gemapptes Format** prüfen, nicht API-Format

### ✅ Test-Assertions
- [ ] **Korrekte Feldnamen** in Assertions (result.ligaId, nicht result.data.ligaId)
- [ ] **Call-Reihenfolge** beachten (nthCalledWith Index)

---

## 🔗 Relevante Dateien

### API-Dokumentation
- **Schema**: `docs/development/DBB-API-EVALUATION.md`
- **Feldnamen-Mapping**: In BBBApiService.ts Zeile 270+

### Code
- **Service**: `src/domains/bbb-api/services/BBBApiService.ts`
- **Tests**: `src/domains/bbb-api/services/__tests__/BBBSyncService.integration.test.ts`

### Types
- **API-Types**: `src/shared/types/dbb-api.types.ts`

---

## 📝 Lessons Learned

1. **Integration-Tests = Real API Contract**  
   Mock-Daten müssen echte API-Antworten 1:1 nachbilden, nicht "logische" Strukturen.

2. **Environment-Awareness**  
   Tests müssen DEV/PROD-Unterschiede berücksichtigen (z.B. CORS-Handling).

3. **Type-Safety reicht nicht**  
   TypeScript-Types validieren nur unser internes Format, nicht das API-Format. Mapping-Logik muss explizit getestet werden.

4. **Dokumentation > Memory**  
   API-Feldnamen nicht auswendig lernen → immer in Dokumentation nachschlagen.

---

## 🎯 Nächste Schritte

- [x] Tests gefixt und grün
- [ ] DBB-API-EVALUATION.md um vollständige Feldnamen-Tabelle erweitern
- [ ] Type-Generator für API-Responses implementieren (aus OpenAPI-Spec?)
- [ ] E2E-Tests mit echten API-Calls (Staging-Environment?)

---

**Alle 8 Integration-Tests laufen erfolgreich! 🎉**
