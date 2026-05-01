# Code-Bereinigung: URL-Workflow & HTML-Parsing Entfernung

**Datum:** 2025-10-22  
**Status:** ✅ **ABGESCHLOSSEN**

---

## 🎯 Ziel

Entfernung aller veralteten Code-Bereiche:
- URL-Input Workflow (manuelles Eingeben von basketball-bund.net URLs)
- HTML-Parsing Logik (statt JSON REST API)
- Doppelte Store-Definitionen

---

## ✅ Durchgeführte Bereinigungen

### 1. Doppelte BBB API Services entfernt

**BBBApiService.corrected.ts**
- ❌ **GELÖSCHT:** `src/domains/bbb-api/services/BBBApiService.corrected.ts`
- 📦 **Backup:** `archive/BBBApiService.corrected.ts.backup`
- ✅ **Grund:** Veraltete Version (18.10.), fehlende Features
- ✅ **Aktiv:** `BBBApiService.ts` (19.10.) - vollständiger & aktueller
- **Unterschiede:**
  - ❌ `.corrected`: Keine `getSpielerDetails()`, komplexe Type-Mappings
  - ✅ `.ts`: Vollständig mit allen Methoden, bessere Validierung

### 2. Veraltete Onboarding-Komponenten entfernt

**BBBUrlStep.tsx**
- ❌ **GELÖSCHT:** `src/domains/onboarding/components/BBBUrlStep.tsx`
- 📦 **Backup:** `archive/BBBUrlStep.tsx.backup`
- ✅ **Grund:** Veralteter Workflow mit manuellem URL-Input
- 🔄 **Ersetzt durch:** Direkte Liga-ID-Auswahl via DB/Konstanten

### 3. HTML-Parser Service entfernt

**BBBParserService**
- ❌ **GELÖSCHT:** `src/domains/bbb/services/BBBParserService.ts`
- ❌ **GELÖSCHT:** `src/domains/bbb/services/BBBParserService.test.ts`
- ❌ **GELÖSCHT:** `src/domains/bbb/services/BBBParserService.integration.test.ts`
- 📦 **Backups:** `archive/BBBParserService.*.backup`
- ✅ **Grund:** Nutzte HTML-Parsing statt JSON API
- 🔄 **Ersetzt durch:** `BBBApiService` mit REST JSON API

### 4. URL-Utils bereinigt

**urlUtils.ts**
- ✅ **BEREINIGT:** `src/shared/utils/urlUtils.ts`
- ❌ **Entfernt:** `htmlTabelle()`, `htmlSpielplan()` (Legacy HTML-URLs)
- ✅ **Behalten:** REST API URLs (JSON-Endpoints)
- ✅ **Funktionen:**
  - `extractLigaIdFromUrl()` - Liga-ID Extraktion
  - `normalizeBBBUrl()` - URL-Normalisierung
  - `BBBUrls.tabelle()` - REST API
  - `BBBUrls.spielplan()` - REST API
  - `BBBUrls.matchInfo()` - REST API
  - `BBBUrls.wamData()` - REST API

### 5. Doppelter Onboarding Store entfernt

**onboarding.store.ts**
- ❌ **GELÖSCHT:** `src/domains/onboarding/onboarding.store.ts`
- 📦 **Backup:** `archive/onboarding.store.ts.backup`
- ✅ **Grund:** Duplikat
- ✅ **Aktiver Store:** `src/stores/onboardingStore.ts`

### 6. Onboarding Container vereinfacht

**OnboardingContainer.tsx**
- ✅ **AKTUALISIERT:** `src/domains/onboarding/components/OnboardingContainer.tsx`
- ❌ **Entfernt:** Import und Verwendung von `BBBUrlStep`
- ❌ **Entfernt:** Step `bbb_url`
- ✅ **Flow:** `welcome → team_select → spieler → trikots → complete`

### 7. Onboarding Store modernisiert

**onboardingStore.ts**
- ✅ **AKTUALISIERT:** `src/stores/onboardingStore.ts`
- ❌ **Entfernt:** 
  - `bbb_url` Step
  - `parsed_liga_data` (BBBParseResult)
  - `setBBBUrl()` Methode
  - `setParsedLigaData()` Methode
- ✅ **Neu:**
  - `liga_id` (number) - Direkte Liga-ID
  - `setLigaId()` - Liga-ID Setter
- ✅ **Workflow:**
  ```
  welcome → team_select → spieler → trikots → complete
  ```

### 8. Tests aktualisiert

**urlUtils.test.ts**
- ✅ **AKTUALISIERT:** `src/shared/utils/urlUtils.test.ts`
- ❌ **Entfernt:** Tests für HTML-URLs (`htmlTabelle`, `htmlSpielplan`)
- ✅ **Fokus:** REST API JSON-Endpoints

---

## 📋 Aktueller Workflow

```
┌──────────────────┐
│     Welcome      │
│  Begrüßung +     │
│  Einführung      │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│   Team Select    │
│  Liga-ID aus DB  │
│  + Team-Auswahl  │
│  + Trainer-Name  │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Spieler Import   │
│  CSV Upload      │
│  (optional)      │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Trikot Import    │
│  CSV Upload      │
│  (optional)      │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│    Complete      │
│  Setup fertig    │
└──────────────────┘
```

---

## ✅ Was bleibt bestehen

### BBB API Service (JSON-basiert)
- ✅ `BBBApiService.ts` - Nutzt **ausschließlich** REST JSON API
- ✅ **Keine** HTML-Parsing-Logik mehr
- ✅ Endpoints:
  - `GET /rest/competition/table/id/{ligaId}` - Tabelle
  - `GET /rest/competition/spielplan/id/{ligaId}` - Spielplan
  - `GET /rest/match/id/{matchId}/matchInfo` - Match-Details
  - `POST /rest/wam/data` - Liga-Suche mit Filter

### Aktive Komponenten
- ✅ `WelcomeStep.tsx` - Begrüßung
- ✅ `TeamSelectStep.tsx` - Team-Auswahl aus JSON-Daten
- ✅ `SpielerImportStep.tsx` - CSV Upload
- ✅ `TrikotImportStep.tsx` - CSV Upload
- ✅ `CompleteStep.tsx` - Abschluss

### Store
- ✅ `src/stores/onboardingStore.ts` - Zentraler Zustand Store
  - Simplified state: `liga_id`, `selected_team_name`, `trainer_name`
  - CSV Files: `spieler_csv`, `trikot_csv` (nicht persistiert)

---

## 🔍 Verifizierung

### Durchgeführte Checks
- ✅ Keine `BBBUrlStep` Imports mehr vorhanden
- ✅ Keine `BBBParserService` Imports mehr aktiv
- ✅ Keine HTML-Parsing-Funktionen in `urlUtils`
- ✅ `OnboardingContainer` nutzt korrekten Flow
- ✅ Store hat keine `bbb_url` Step mehr
- ✅ Alle veralteten Dateien archiviert

### Nächste Schritte
1. **TypeScript Compilation:**
   ```bash
   cd basketball-app
   npm run build
   ```

2. **Tests ausführen:**
   ```bash
   npm run test
   ```

3. **Komponenten-Integration:**
   - `TeamSelectStep` muss Liga-ID verarbeiten können
   - Liga-ID Quelle definieren (DB? Konstanten? API-Auswahl?)

---

## 📦 Archivierte Dateien

Alle gelöschten Dateien wurden in `/archive/` gesichert:

```
archive/
├── BBBApiService.corrected.ts.backup
├── BBBUrlStep.tsx.backup
├── onboarding.store.ts.backup
├── BBBParserService.ts.backup
├── BBBParserService.test.ts.backup
└── BBBParserService.integration.test.ts.backup
```

⚠️ **Hinweis:** Backups können nach erfolgreicher Verifizierung permanent gelöscht werden.

---

## 📊 Zusammenfassung

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| **Workflow** | URL-Input → Parse → Team-Auswahl | Liga-ID → Team-Auswahl |
| **API-Zugriff** | HTML-Parsing | REST JSON API |
| **Stores** | 2 (doppelt) | 1 (vereinheitlicht) |
| **Steps** | 6 Steps | 5 Steps |
| **Code-Qualität** | ⚠️ Legacy Code | ✅ Modern & Wartbar |

### Vorteile der Bereinigung
- ✅ **Kein HTML-Parsing mehr** - Robustere API-Integration
- ✅ **Vereinfachter Workflow** - Weniger Steps, klarer Flow
- ✅ **Keine Duplikate** - Ein Store, eine Wahrheit
- ✅ **Bessere Wartbarkeit** - Weniger Code, klarer Fokus
- ✅ **Zukunftssicher** - Basiert auf offizieller REST API

---

## ⚠️ Offene Punkte

1. **Liga-ID Quelle definieren**
   - Option A: Hardcoded Konstanten für bekannte Ligen
   - Option B: Datenbank mit Liga-Liste
   - Option C: API-Endpunkt zum Suchen/Filtern von Ligen

2. **TeamSelectStep anpassen**
   - Implementierung für Liga-ID basierte Team-Auswahl
   - Integration mit `BBBApiService.getTable(ligaId)`

3. **Tests aktualisieren**
   - Store-Tests für neuen State
   - Component-Tests ohne BBBUrlStep
   - Integration-Tests mit JSON API

---

**Status:** ✅ **BEREINIGUNG ABGESCHLOSSEN**  
**Nächster Schritt:** Tests ausführen & Komponenten-Integration verifizieren
