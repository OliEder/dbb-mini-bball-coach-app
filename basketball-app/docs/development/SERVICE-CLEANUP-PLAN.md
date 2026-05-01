# 🎯 Service Bereinigung & DDD-Refactoring Plan

**Datum:** 30. Oktober 2025  
**Status:** BEREIT ZUR AUSFÜHRUNG  
**Geschätzter Zeitaufwand:** 30-45 Minuten

---

## 📋 Zusammenfassung

**Gefundene Probleme:**
- ✅ 5 Service-Duplikate identifiziert
- ✅ Falsche DDD-Struktur (BBB Services in domains statt shared)
- ✅ Inkonsistente Import-Pfade (@/ vs @shared)
- ✅ Mix aus kebab-case und PascalCase

**Ziel:**
- Saubere DDD-Architektur
- Keine Duplikate
- Konsistente Namenskonventionen
- Alle Tests grün

---

## 🔴 Phase 1: Service-Duplikate bereinigen

### 1.1 SpielService.ts

**AKTION:** Löschen der redundanten Version

```bash
# ❌ LÖSCHEN: Kleinere, abgespeckte Version
rm src/domains/spiel/services/SpielService.ts
rm -rf src/domains/spiel/__tests__ 2>/dev/null
rmdir src/domains/spiel/services
rmdir src/domains/spiel

# ✅ BEHALTEN: Umfassender Service
# src/domains/spielplan/services/SpielService.ts
```

**Begründung:**
- spielplan-Version: 6643 bytes, vollständiger CRUD, Validierung
- spiel-Version: 2650 bytes, nur Basis-Filterung
- spiel-Domain wird komplett entfernt (redundant zu spielplan)

---

### 1.2 ClubDataService.ts

**AKTION:** Löschen der alten fetch-basierten Version

```bash
# ❌ LÖSCHEN: Alte fetch-basierte Version
rm src/domains/onboarding/services/ClubDataService.ts

# ✅ BEHALTEN: Moderne ES Module Version
# src/shared/services/ClubDataService.ts
```

**Begründung:**
- shared-Version: ES Module Imports, Chunk-Caching, Vite-optimiert
- onboarding-Version: fetch()-basiert, veraltet

---

### 1.3 CSVImportService.ts

**AKTION:** Dateien zusammenführen (beste Features kombinieren)

**Schritt 1:** Features aus beiden Versionen kombinieren

```typescript
// Behalte aus onboarding/services/CSVImportService.ts:
- generateSpielerTemplate()
- generateTrikotTemplate()

// Behalte aus shared/services/csv-import.service.ts:
- validateSpielerCSV()
- validateTrikotCSV()
- Besseres Error Handling

// Ziel-Datei: src/shared/services/CSVImportService.ts (PascalCase!)
```

**Schritt 2:** Duplikat löschen

```bash
# Nach Merge:
rm src/domains/onboarding/services/CSVImportService.ts
rm src/shared/services/csv-import.service.ts

# Neue konsolidierte Datei:
# src/shared/services/CSVImportService.ts
```

---

### 1.4 TeamService.ts

**AKTION:** Löschen der alten Version

```bash
# ❌ LÖSCHEN: Pre-v7.0 Version
rm src/domains/team/team.service.ts

# ✅ BEHALTEN: v7.0 kompatibel
# src/domains/team/services/TeamService.ts
```

**Begründung:**
- services/TeamService.ts: v7.0 DB, Multi-Team Support, TeamStats
- team.service.ts: Alte CreateTeamDTO, Pre-v7.0

---

### 1.5 VereinService.ts

**AKTION:** Zusammenführen und alte Version löschen

**Schritt 1:** Features kombinieren

```typescript
// Behalte aus services/VereinService.ts:
- CreateVereinInput (aus @/shared/types)
- getEigeneVereine() (Plural - mehrere eigene Vereine möglich)
- isVereinNameTaken()
- countTeams()

// Übernehme aus verein.service.ts:
- exists()
- count()
- Bessere Error Messages

// Ziel-Datei: src/domains/verein/services/VereinService.ts
```

**Schritt 2:** Duplikat löschen

```bash
rm src/domains/verein/verein.service.ts
```

---

## 🏗️ Phase 2: DDD-Refactoring

### 2.1 BBB Services → shared/services/

**AKTION:** BBB Services aus domains/ nach shared/ verschieben

```bash
# Services verschieben
mv src/domains/bbb-api/services/BBBApiService.ts src/shared/services/
mv src/domains/bbb-api/services/BBBSyncService.ts src/shared/services/

# Tests verschieben
mkdir -p src/shared/services/__tests__
mv src/domains/bbb-api/services/__tests__/BBBApiService.test.ts src/shared/services/__tests__/
mv src/domains/bbb-api/services/__tests__/BBBSyncService.test.ts src/shared/services/__tests__/
mv src/domains/bbb-api/services/__tests__/BBBSyncService.integration.test.ts src/shared/services/__tests__/
mv src/domains/bbb-api/services/__tests__/BBBSyncService.pact.test.ts src/shared/services/__tests__/
mv src/domains/bbb-api/services/__tests__/README.md src/shared/services/__tests__/

# bbb-api Domain löschen
rm -rf src/domains/bbb-api
```

**Begründung:**
- BBBApiService = Infrastructure Layer (External API Adapter)
- BBBSyncService = Application Layer (orchestriert mehrere Domains)
- Keine Business Domain, sondern Integrationsschicht
- Wird von mehreren Domains genutzt (Team, Spielplan, Liga, Verein)

---

### 2.2 Alte Onboarding Services prüfen

**AKTION:** LigaDiscoveryService.ts analysieren und ggf. löschen

```bash
# Prüfe Verwendung im Code
grep -r "LigaDiscoveryService" src/

# Falls nicht verwendet:
rm src/domains/onboarding/services/LigaDiscoveryService.ts

# Falls verwendet:
# → Nach shared/services/ verschieben (Application Layer Service)
```

---

## 🔧 Phase 3: Import-Pfade aktualisieren

### 3.1 Alle Imports auf neuen BBB Service Pfad aktualisieren

**Suchen & Ersetzen:**

```bash
# Finde alle Imports von BBB Services
grep -r "from.*domains/bbb-api" src/

# Ersetze:
# OLD: @/domains/bbb-api/services/BBBApiService
# NEW: @/shared/services/BBBApiService

# OLD: @/domains/bbb-api/services/BBBSyncService  
# NEW: @/shared/services/BBBSyncService
```

**Betroffene Dateien (geschätzt):**
- Dashboard Components
- Onboarding Components  
- Spielplan Components
- Team Services

---

### 3.2 CSVImportService Imports aktualisieren

```bash
# Suche alte Imports
grep -r "csv-import.service" src/
grep -r "CSVImportService" src/

# Ersetze alle mit:
# @/shared/services/CSVImportService
```

---

### 3.3 Import-Stil vereinheitlichen

**Entscheidung:** `@/` oder `@shared/`?

**Empfehlung:** `@/` (aktuell häufiger verwendet)

```bash
# Falls @/ gewählt:
# Alle @shared/ → @/shared/ ersetzen

# Falls @shared/ gewählt:
# Alle @/ → @ ersetzen und tsconfig anpassen
```

---

## 🧪 Phase 4: Tests aktualisieren

### 4.1 Test-Imports anpassen

```bash
# Nach Service-Verschiebung alle Tests prüfen:
npm run test:ui

# Erwartete Fehler:
# - Module not found (alte BBB-Pfade)
# - Module not found (alte CSV-Pfade)
```

### 4.2 Mock-Pfade aktualisieren

```typescript
// Alte Mocks aktualisieren:
// vi.mock('@/domains/bbb-api/services/BBBApiService')
// ↓
// vi.mock('@/shared/services/BBBApiService')
```

---

## 📊 Phase 5: Verifikation

### 5.1 Build prüfen

```bash
npm run build

# Erwartung: ✅ Success
# Falls Fehler: Import-Pfade prüfen
```

### 5.2 Tests ausführen

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e

# Erwartung: Alle grün
```

### 5.3 Type-Check

```bash
npx tsc --noEmit

# Erwartung: No errors
```

---

## 📝 Phase 6: Dokumentation aktualisieren

### 6.1 PROJECT-STATUS.md korrigieren

**Aktualisieren:**
```markdown
## Services & APIs

### Infrastructure Layer (shared/services/)
- ✅ BBBApiService.ts - REST API Wrapper
- ✅ BBBSyncService.ts - Liga-Synchronisation
- ✅ ClubDataLoader.ts - Club-Daten Loader
- ✅ CSVImportService.ts - CSV Import (Spieler/Trikots)

### Domain Services
- ✅ domains/user/services/UserService.ts
- ✅ domains/team/services/TeamService.ts
- ✅ domains/spieler/services/SpielerService.ts
- ✅ domains/spielplan/services/SpielService.ts
- ✅ domains/spielplan/services/TabellenService.ts
- ✅ domains/verein/services/VereinService.ts
```

### 6.2 Architektur-Diagramm erstellen

```
src/
├── shared/
│   ├── services/           # Infrastructure & Application Layer
│   │   ├── BBBApiService.ts       # External API Adapter
│   │   ├── BBBSyncService.ts      # Application Service
│   │   ├── ClubDataLoader.ts      # Data Access Service
│   │   └── CSVImportService.ts    # Import Service
│   └── db/
│       └── database.ts            # Database Layer
│
└── domains/                # Domain Layer
    ├── user/
    │   └── services/UserService.ts
    ├── team/
    │   └── services/TeamService.ts
    ├── spieler/
    │   └── services/SpielerService.ts
    ├── spielplan/
    │   └── services/
    │       ├── SpielService.ts
    │       └── TabellenService.ts
    └── verein/
        └── services/VereinService.ts
```

---

## ✅ Checkliste

### Vor der Ausführung
- [ ] Git Commit (Sicherung des aktuellen Stands)
- [ ] Backup der Database erstellen (falls vorhanden)
- [ ] NODE_MODULES Issue beheben (npm install)

### Phase 1: Duplikate bereinigen
- [ ] SpielService.ts - Alte Version löschen
- [ ] ClubDataService.ts - Alte Version löschen
- [ ] CSVImportService.ts - Zusammenführen
- [ ] TeamService.ts - Alte Version löschen
- [ ] VereinService.ts - Zusammenführen

### Phase 2: DDD-Refactoring
- [ ] BBB Services nach shared/services/ verschieben
- [ ] BBB Tests nach shared/services/__tests__/ verschieben
- [ ] domains/bbb-api/ löschen
- [ ] LigaDiscoveryService prüfen

### Phase 3: Imports aktualisieren
- [ ] BBB Service Imports aktualisieren
- [ ] CSV Service Imports aktualisieren
- [ ] Import-Stil vereinheitlichen

### Phase 4: Tests
- [ ] Test-Imports anpassen
- [ ] Mock-Pfade aktualisieren
- [ ] Tests ausführen (npm test)

### Phase 5: Verifikation
- [ ] Build erfolgreich (npm run build)
- [ ] Type-Check erfolgreich (tsc --noEmit)
- [ ] Alle Tests grün
- [ ] Dev-Server läuft (npm run dev)

### Phase 6: Dokumentation
- [ ] PROJECT-STATUS.md aktualisieren
- [ ] SERVICE-DUPLIKATE-ANALYSE.md archivieren
- [ ] Git Commit (Refactoring abgeschlossen)

---

## 🚨 Rollback-Plan

Falls Probleme auftreten:

```bash
# Git Reset zum letzten funktionierenden Stand
git reset --hard HEAD

# Oder: Stash verwenden
git stash
```

---

## 📊 Erwartetes Ergebnis

**Vorher:**
- 15 Service-Dateien (inkl. 5 Duplikate)
- BBB Services in domains/
- Inkonsistente Imports

**Nachher:**
- 10 Service-Dateien (konsolidiert)
- BBB Services in shared/services/
- Konsistente Imports
- Saubere DDD-Struktur

**Geschätzte Einsparung:**
- ~500 Zeilen duplizierten Code
- ~5 Dateien weniger
- 1 Domain weniger (bbb-api)

---

**Erstellt:** 30.10.2025  
**Genehmigt:** Ausstehend  
**Ausgeführt:** Ausstehend

---

## 💡 Notizen

- Nach Ausführung: DATABASE-RESET empfohlen (DB v7.0 Migration)
- Alte Services nicht in Git History löschen (für Referenz behalten)
- Bei Problemen: Zuerst Tests prüfen, dann Imports

**Nächster Schritt:** Ausführung nach Genehmigung durch Oliver
