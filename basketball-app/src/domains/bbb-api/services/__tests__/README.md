# BBBSyncService Test-Suite

## Überblick

Diese Test-Suite implementiert Unit- und Contract-Tests für den BBBSyncService, der für die Synchronisation von Liga-Daten aus der DBB REST API verantwortlich ist.

## Test-Struktur

### Unit-Tests (`BBBSyncService.test.ts`)

Testet die Business-Logik des Services:
- Liga-Synchronisation (Tabelle + Spielplan)
- Team-Markierung als "eigen"
- Fehlerbehandlung
- Datenbank-Operationen

### API-Tests (`BBBApiService.test.ts`)

Testet den REST API Wrapper:
- CORS-Fallback-Mechanismus
- Request-Building
- Response-Parsing
- Batch-Processing mit Rate-Limiting
- Error Handling

### PACT-Tests (`BBBSyncService.pact.test.ts`)

Contract-Tests für die API-Integration:
- Definiert erwartete Request/Response-Strukturen
- Verifiziert API-Kontrakte
- Testet Fehlerszenarien (404, Rate-Limiting)

## Installation

### Standard-Dependencies (bereits installiert)
```bash
npm install
```

### PACT Dependencies (optional, für Contract-Tests)
```bash
npm install --save-dev @pact-foundation/pact
```

## Test-Ausführung

### Alle Tests
```bash
npm test
```

### Nur Unit-Tests (ohne PACT)
```bash
npm test -- --exclude="*.pact.test.ts"
```

### Mit Coverage
```bash
npm run test:coverage
```

### Watch-Mode während Entwicklung
```bash
npm test -- --watch
```

### UI-Mode für bessere Übersicht
```bash
npm run test:ui
```

## Test-Daten

Die Tests verwenden realistische Testdaten basierend auf der tatsächlichen DBB API-Struktur:

- **Liga ID**: 12345 (U10 Bezirksliga Oberpfalz)
- **Team IDs**: 111 (SV Postbauer), 222 (TSV Neumarkt)
- **Match ID**: 99991

## Mocking-Strategie

### Unit-Tests
- Vollständiges Mocking der BBBApiService
- In-Memory Dexie Datenbank (fake-indexeddb)
- Deterministische Test-Daten

### PACT-Tests
- Mock-Server simuliert DBB API
- Contracts werden in `pacts/contracts` gespeichert
- Können für Provider-Tests verwendet werden

## Wichtige Test-Szenarien

### 1. Erfolgreiche Liga-Synchronisation
- Tabelle laden → Teams & Vereine erstellen
- Spielplan laden → Spiele erstellen
- Venues aus Match-Info extrahieren
- Spieler aus Match-Info extrahieren

### 2. Team-Markierung
- Einzelnes Team als "eigen" markieren
- Mehrere Teams gleichzeitig markieren
- User-Zuordnung

### 3. Fehlerbehandlung
- Netzwerkfehler
- 404 - Liga nicht gefunden
- 429 - Rate-Limiting
- CORS-Fehler mit Fallback

### 4. Batch-Processing
- Parallele Requests mit Limit
- Rate-Limiting zwischen Batches
- Fehler in einzelnen Items

## CI/CD Integration

Die Tests sind so konfiguriert, dass sie in CI/CD-Pipelines laufen können:

```yaml
# GitHub Actions Beispiel
- name: Run Tests
  run: |
    npm ci
    npm test -- --run --coverage
```

## Bekannte Einschränkungen

1. **CORS-Proxy Tests**: Die tatsächlichen CORS-Proxies werden in Tests gemockt
2. **Rate-Limiting**: Timing-basierte Tests können in CI flaky sein
3. **PACT-Tests**: Benötigen zusätzliche Dependencies

## Debugging

### Verbose Logging aktivieren
```typescript
// In Test-Datei
beforeEach(() => {
  vi.spyOn(console, 'log');
  vi.spyOn(console, 'error');
});
```

### Datenbank-State inspizieren
```typescript
// Nach Test-Operation
const teams = await db.teams.toArray();
console.log('Teams in DB:', teams);
```

## Best Practices

1. **Isolation**: Jeder Test cleared die Datenbank
2. **Determinismus**: Feste UUIDs in Tests verwenden
3. **Coverage**: Mindestens 80% Code-Coverage anstreben
4. **Performance**: Batch-Tests mit kleineren Datenmengen

## Weiterentwicklung

### Geplante Erweiterungen
- [ ] Integration-Tests mit echtem DBB API Staging-Server
- [ ] Performance-Tests für große Datenmengen
- [ ] E2E-Tests mit Playwright
- [ ] Mutation Testing mit Stryker

### Contract Testing
Die PACT-Contracts können verwendet werden für:
- Provider-Verifizierung (DBB API Team)
- Breaking Change Detection
- API-Versionierung

## Support

Bei Fragen oder Problemen:
1. Test-Logs prüfen
2. Coverage-Report analysieren
3. PACT-Contracts verifizieren
