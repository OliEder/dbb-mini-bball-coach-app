# Phase 2 Tests - Anleitung

## ✅ Installation erfolgreich!

Die PACT Dependencies wurden erfolgreich installiert. Die Warnungen sind normal und beeinträchtigen nicht die Funktionalität.

## 🎯 Tests ausführen

### Quick Start:
```bash
# Alle Tests ausführen
npm test -- --run

# Oder mit dem Helper-Script:
chmod +x run-tests.sh
./run-tests.sh
```

### Spezifische Test-Modi:

#### 1. Nur Unit-Tests (schnell)
```bash
./run-tests.sh unit
```

#### 2. Nur PACT Contract-Tests
```bash
./run-tests.sh pact
```

#### 3. Watch-Mode (während Entwicklung)
```bash
./run-tests.sh watch
```

#### 4. Mit Coverage-Report
```bash
./run-tests.sh coverage
```

#### 5. Vitest UI (Browser-basiert)
```bash
./run-tests.sh ui
# Öffnet dann http://localhost:51204/__vitest__/
```

## 🔍 Erwartete Test-Ergebnisse

### Unit-Tests:
- **BBBSyncService.test.ts**: 6 Tests
  - ✅ syncLiga (komplette Liga-Sync)
  - ✅ Fehlerbehandlung
  - ✅ markAsOwnTeam
  - ✅ markMultipleAsOwnTeams
  - ✅ syncTabelleAndTeams
  - ✅ getLigenForSync

- **BBBApiService.test.ts**: 18 Tests
  - ✅ fetchWithFallback (CORS-Proxy)
  - ✅ filterLigen
  - ✅ getTabelle
  - ✅ getSpielplan
  - ✅ getMatchInfo
  - ✅ batchProcess
  - ✅ Error Handling

### PACT Contract-Tests:
- **BBBSyncService.pact.test.ts**: 6 Contracts
  - ✅ Liga Tabelle Contract
  - ✅ Spielplan Contract
  - ✅ Match Info Contract
  - ✅ WAM Filter Contract
  - ✅ 404 Error Contract
  - ✅ Rate Limiting Contract

## 📊 Coverage

Nach `npm run test:coverage` findest du den Report in:
- Terminal: Direkte Ausgabe
- HTML: `coverage/index.html` (im Browser öffnen)

Ziel-Coverage: **> 80%**

## 🐛 Troubleshooting

### Falls Tests fehlschlagen:

1. **PACT Port bereits belegt:**
   ```bash
   # Port 9876 freigeben
   lsof -ti:9876 | xargs kill -9
   ```

2. **Database Lock:**
   ```bash
   # Node-Prozesse beenden
   pkill -f node
   ```

3. **Module nicht gefunden:**
   ```bash
   # Dependencies neu installieren
   rm -rf node_modules package-lock.json
   npm install
   ./install-pact.sh
   ```

## 📝 Test-Output verstehen

### Erfolgreiche Tests:
```
✓ BBBSyncService > syncLiga > sollte eine komplette Liga synchronisieren (145ms)
✓ BBBApiService > fetchWithFallback > sollte direkte Anfrage versuchen (12ms)
```

### Fehlgeschlagene Tests:
```
✗ Test-Name
  → Expected: value
    Received: other value
```

### PACT Contracts:
Nach erfolgreichen PACT-Tests findest du die generierten Contracts in:
```
./pacts/contracts/basketball-pwa-dbb-api.json
```

## 🚀 Nächste Schritte

Nach erfolgreichen Tests kannst du mit **Phase 3: Onboarding Flow v2** fortfahren!

Die getesteten Services stehen bereit für die Integration.
