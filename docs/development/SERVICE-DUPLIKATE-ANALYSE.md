# 🔍 Service Duplikate Analyse

**Datum:** 30. Oktober 2025  
**Status:** Analyse abgeschlossen - Bereinigungsplan folgt

---

## 📊 Gefundene Duplikate

### 1. SpielService.ts (2 Versionen)

#### ✅ BEHALTEN: `domains/spielplan/services/SpielService.ts`
- **Größe:** 6643 bytes (~200 Zeilen)
- **Erstellt:** 11.10.2025
- **Modified:** 27.10.2025
- **Features:**
  - Vollständiger CRUD Service
  - Validierungslogik
  - BBB-Integration Support
  - Filter-Funktionen
  - Error Handling
- **Kommentar:** Umfassender Domain Service

#### ❌ LÖSCHEN: `domains/spiel/services/SpielService.ts`
- **Größe:** 2650 bytes (~80 Zeilen)
- **Erstellt:** 27.10.2025
- **Modified:** 27.10.2025
- **Features:**
  - Nur einfache Filterlogik
  - Keine Validierung
  - Minimale Funktionalität
- **Grund:** Redundante, abgespeckte Version

---

### 2. ClubDataService.ts (2 Versionen)

#### ✅ BEHALTEN: `shared/services/ClubDataService.ts`
- **Features:**
  - ES Module Imports (modern)
  - Chunk-basiertes Loading
  - Intelligentes Caching
  - TypeScript Interfaces vollständig
  - Performance-optimiert
- **Technologie:** `import()` statt `fetch()`
- **Kommentar:** Moderne, Vite-optimierte Version

#### ❌ LÖSCHEN: `domains/onboarding/services/ClubDataService.ts`
- **Features:**
  - fetch()-basiert (veraltet)
  - Weniger Type-Safety
  - Einfacheres Caching
- **Grund:** Alte Version vor Refactoring

---

### 3. CSVImportService / csv-import.service.ts (2 Versionen)

#### 📋 ANALYSE ERFORDERLICH
- `domains/onboarding/services/CSVImportService.ts`
- `shared/services/csv-import.service.ts`

**Unterschiede prüfen:**
- Namenskonvention (PascalCase vs kebab-case)
- Funktionsumfang
- Verwendung im Code

---

### 4. TeamService.ts (2 Versionen)

#### ✅ BEHALTEN: `domains/team/services/TeamService.ts`
- **Features:**
  - Phase 2: Multi-Team Support
  - v7.0 Database kompatibel
  - TeamStats Interface
  - Referenziert `spielService`
  - Import: `@/domains/spiel`
- **Kommentar:** Aktuelle Version für DB v7.0

#### ❌ LÖSCHEN: `domains/team/team.service.ts`
- **Features:**
  - Ältere Version
  - CreateTeamDTO (alt)
  - Import: `@shared/db/database`
- **Grund:** Pre-v7.0 Version

---

### 5. VereinService.ts (2 Versionen)

#### 📋 ANALYSE ERFORDERLICH
- `domains/verein/services/VereinService.ts`
- `domains/verein/verein.service.ts`

**Zu prüfen:**
- Funktionsumfang
- Database Schema Version
- Verwendung im Code

---

## 🎯 Bereinigungsplan (Empfehlung)

### Phase 1: Sofort löschen (klar redundant)

```bash
# SpielService - alte Version
rm src/domains/spiel/services/SpielService.ts
rmdir src/domains/spiel/services 2>/dev/null
rmdir src/domains/spiel 2>/dev/null

# ClubDataService - alte fetch-basierte Version
rm src/domains/onboarding/services/ClubDataService.ts

# TeamService - alte Version
rm src/domains/team/team.service.ts
```

### Phase 2: Weitere Analyse nötig

**CSVImportService:**
1. Beide Dateien vergleichen (diff)
2. Verwendungen im Code suchen
3. Entscheiden welche behalten werden soll

**VereinService:**
1. Beide Dateien vergleichen
2. Prüfen ob v7.0 kompatibel
3. Import-Pfade analysieren

### Phase 3: Strukturbereinigung

Nach Duplikat-Entfernung:

```
src/domains/
├── spiel/           # LÖSCHEN (leer)
└── spielplan/       # BEHALTEN (hat SpielService)
```

**Frage:** Sollte `spielplan/` zu `spiel/` umbenannt werden?
- Pro: Spiel ist die Domain-Entity
- Contra: Spielplan ist der Business Context

---

## 🏗️ DDD-Refactoring (nächster Schritt)

Nach Duplikat-Bereinigung folgt DDD-Strukturierung:

### Infrastructure Layer → shared/services/

**Verschieben:**
- `domains/bbb-api/services/BBBApiService.ts` → `shared/services/`
- `domains/bbb-api/services/BBBSyncService.ts` → `shared/services/`
- Entsprechende Tests mitnehmen

**Löschen:**
- `domains/bbb-api/` (komplettes Verzeichnis)

**Grund:** 
- BBB Services sind Infrastructure/Application Layer
- Werden von mehreren Domains verwendet
- "bbb-api" ist keine Business Domain

---

## 📁 Andere auffällige Strukturen

### LigaDiscoveryService.ts
**Pfad:** `domains/onboarding/services/LigaDiscoveryService.ts`

**Frage:** Ist das noch in Verwendung?
- Wenn ja: Nach `shared/services/` verschieben
- Wenn nein: Löschen (durch BBBSyncService ersetzt?)

---

## 🔍 Nächste Schritte

1. ✅ Analyse abgeschlossen
2. 🔄 CSV/Verein Services im Detail vergleichen
3. 🔄 Bereinigungsplan ausführen
4. 🔄 DDD-Refactoring durchführen
5. 🔄 Alle Imports aktualisieren
6. 🔄 Tests ausführen
7. 🔄 PROJECT-STATUS.md korrigieren

---

**Erstellt:** 30.10.2025  
**Nächstes Update:** Nach Code-Vergleich CSV/Verein Services
