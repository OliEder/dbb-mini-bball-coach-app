# 🏀 Basketball Team Manager - PWA

Progressive Web App für Basketball-Trainer zur Verwaltung von Teams, Spielern, Trikots und Einsatzplänen.

## ✨ Features

### ✅ Implementiert (MVP v1.0)

- **Onboarding Flow**
  - Multi-Step Setup mit Progress-Indicator
  - Team-Erstellung mit Altersklassen (U8-U18)
  - Vereins-Zuordnung
  - CSV-Import für Spieler & Trikots
  - Optional: BBB-URL für späteren Spielplan-Import

- **Team Management**
  - Multi-Team-Support
  - Saison-Verwaltung
  - Leistungsorientierte U12-Kennzeichnung

- **Spieler-Import**
  - Robuster CSV-Parser mit Validation
  - Erziehungsberechtigte-Zuordnung
  - Konfektionsgrößen für Trikotvergabe
  - TNA-Nummer für Ligaberechtigung

- **Trikot-Import**
  - Wendejerseys & Hosen
  - Größen-Tracking (EU 116-170)
  - Farben (dunkel/hell)
  - Verfügbarkeits-Status

- **Dashboard**
  - Übersicht mit Statistiken
  - Spieler-Count
  - Trikot-Count
  - Spiele-Count

### 🚧 In Entwicklung (Roadmap)

- BBB-Integration (basketball-bund.net)
  - Automatischer Spielplan-Import
  - Liga-Tabellen
  - Ergebnisse-Sync
  - Benchmark-Analysen
- Spielplan-Verwaltung
- Einsatzplanung (8 Achtel Rotation)
- Spieler-Bewertungen (9 Skills)
- Training-Tracking
- Offline-Sync

---

## 🚀 Installation & Setup

### Voraussetzungen

- Node.js >= 18.x
- npm >= 9.x

### 1. Dependencies installieren

```bash
npm install
```

### 2. Development Server starten

```bash
npm run dev
```

App ist verfügbar unter: `http://localhost:5173`

### 3. Production Build

```bash
npm run build
npm run preview
```

---

## 📦 Tech Stack

### Core
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server

### State Management
- **Zustand** - Globaler State (lightweight)
- **Zustand Persist** - LocalStorage Persistence

### Database
- **Dexie.js** - IndexedDB Wrapper
- **IndexedDB** - Browser-native Storage (Offline-First)

### Styling
- **Tailwind CSS** - Utility-First CSS
- **WCAG 2.0 AA** - Accessibility Standards

### Testing
- **Vitest** - Unit Test Framework
- **Testing Library** - Component Testing
- **fake-indexeddb** - IndexedDB Mocking

### PWA
- **vite-plugin-pwa** - Service Worker
- **Workbox** - Offline Caching

### CSV Processing
- **Papaparse** - Robust CSV Parser

### Icons
- **Lucide React** - Icon Library

---

## 🧪 Testing

### Unit Tests ausführen

```bash
npm run test
```

### Test UI (interaktiv)

```bash
npm run test:ui
```

### Coverage Report

```bash
npm run test:coverage
```

### Bestehende Tests

- ✅ `TeamService.test.ts` - 14 Tests für Team CRUD
- 🚧 Weitere Tests folgen

---

## 📁 Projekt-Struktur

```
src/
├── main.tsx                    # Entry Point
├── App.tsx                     # Root Component + Routing
├── index.css                   # Global Styles (WCAG-optimiert)
│
├── stores/                     # Zustand State Management
│   ├── appStore.ts            # Globaler App-State
│   └── onboardingStore.ts     # Onboarding-Flow State
│
├── shared/                     # Shared Code
│   ├── types/
│   │   └── index.ts           # Alle TypeScript Interfaces (24 Tabellen)
│   └── db/
│       └── database.ts        # Dexie Database Definition
│
├── domains/                    # Domain-Driven Design
│   ├── onboarding/
│   │   ├── components/
│   │   │   ├── OnboardingLayout.tsx
│   │   │   ├── OnboardingContainer.tsx
│   │   │   ├── WelcomeStep.tsx
│   │   │   ├── TeamStep.tsx
│   │   │   ├── VereinStep.tsx
│   │   │   ├── SpielerImportStep.tsx
│   │   │   ├── TrikotImportStep.tsx
│   │   │   ├── SpielplanStep.tsx
│   │   │   └── CompleteStep.tsx
│   │   └── services/
│   │       └── CSVImportService.ts
│   │
│   ├── team/
│   │   └── services/
│   │       ├── TeamService.ts
│   │       └── TeamService.test.ts
│   │
│   ├── verein/
│   │   └── services/
│   │       └── VereinService.ts
│   │
│   └── dashboard/
│       └── Dashboard.tsx
│
└── test/
    └── setup.ts               # Vitest Config
```

---

## 🗄️ Datenbank-Schema

Die App verwendet **IndexedDB** mit folgender Struktur (v1.0):

### Kern-Tabellen

1. **VEREINE** - Vereins-Verwaltung
2. **TEAMS** - Multi-Team-Support
3. **SPIELER** - Eigene Spieler + Gegner + Scouting
4. **BEWERTUNGEN** - 9 Skills, Gesamt-Wert
5. **ERZIEHUNGSBERECHTIGTE** - DSGVO-konform
6. **SPIELER_ERZIEHUNGSBERECHTIGTE** - n:m Beziehung
7. **HALLEN** - Spielorte mit Navigation
8. **LIGEN** - BBB-Integration
9. **LIGA_TEILNAHMEN** - Team-Liga-Zuordnung
10. **SPIELPLAENE** - BBB-URLs für Auto-Sync
11. **SPIELE** - Spielnr für BBB-Match
12. **LIGA_ERGEBNISSE** - Benchmark-Analysen
13. **LIGA_TABELLEN** - Dashboard-Anzeige
14. **TRIKOTS** - Wendejerseys & Hosen
15. **EINSAETZE** - 8 Achtel Rotation
16. **ACHTEL_STATISTIKEN** - Performance-Tracking
17. **TRAININGS** - Training-Verwaltung
18. **TRAINING_TEILNAHMEN** - Anwesenheit
19. **PROBETRAINING_TEILNEHMER** - Interessenten
20. **PROBETRAINING_HISTORIE** - Teilnahme-Tracking
21. **SPIELER_NOTIZEN** - Vertrauliche Notizen
22. **SAISON_ARCHIVE** - Historische Daten

### Indizes für Performance

```typescript
// Beispiel: Spieler-Tabelle
spieler: 'spieler_id, team_id, verein_id, spieler_typ, [vorname+nachname], aktiv'
```

---

## 📋 CSV-Import Format

### Spieler-CSV

**Erforderliche Spalten:**
- `vorname` ✅ Pflicht
- `nachname` ✅ Pflicht

**Optionale Spalten:**
- `geburtsdatum` (YYYY-MM-DD)
- `tna_nr` (DBB-Ausweisnummer)
- `konfektionsgroesse_jersey` (116-170)
- `konfektionsgroesse_hose` (116-170)
- `erz_vorname`
- `erz_nachname`
- `erz_telefon`
- `erz_email`

**Beispiel:**
```csv
vorname,nachname,geburtsdatum,tna_nr,konfektionsgroesse_jersey,konfektionsgroesse_hose,erz_vorname,erz_nachname,erz_telefon,erz_email
Max,Mustermann,2015-03-15,12345678,140,140,Maria,Mustermann,0170 1234567,maria@example.com
```

### Trikot-CSV

**Erforderliche Spalten:**
- `art` ✅ ("Wendejersey" oder "Hose")
- `groesse` ✅ (xs, s, m, l, xl)
- `eu_groesse` ✅ (116-170)

**Optionale Spalten:**
- `nummer` (Trikot-Nummer)
- `farbe_dunkel`
- `farbe_hell`

**Beispiel:**
```csv
art,nummer,groesse,eu_groesse,farbe_dunkel,farbe_hell
Wendejersey,4,m,140,blau,weiß
Hose,,m,140,,
```

---

## ♿ Accessibility (WCAG 2.0 AA)

Die App erfüllt **WCAG 2.0 AA Standards**:

### Implementiert

✅ **Farbkontraste:** Mindestens 4.5:1 für normalen Text  
✅ **Tastaturnavigation:** Alle Funktionen per Keyboard erreichbar  
✅ **Focus Management:** 2px Outline, 2px Offset  
✅ **Touch Targets:** Minimum 44x44px  
✅ **Screen Reader Support:** Semantisches HTML, ARIA-Labels  
✅ **Skip-to-Content Link:** Für Keyboard-User  
✅ **Error Messages:** Klare, hilfreiche Fehlermeldungen  
✅ **Form Labels:** Alle Inputs haben Labels  

### CSS-Klassen

```css
/* Accessible Button */
.btn-primary {
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: colors 200ms;
  &:focus-visible {
    outline: 2px solid var(--primary-600);
    outline-offset: 2px;
  }
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

---

## 🛠️ Development Guidelines

### Domain-Driven Design

Jede Domain ist eigenständig:
```
domains/[domain]/
├── components/     # React Components
├── services/       # Business Logic
├── models/         # (optional) Types
└── [domain].test.ts
```

### Test-Driven Development

1. Test schreiben (rot)
2. Code implementieren (grün)
3. Refactoring (cleanup)

Beispiel:
```typescript
// 1. Test schreiben
describe('TeamService', () => {
  it('should create a new team', async () => {
    const team = await teamService.createTeam({...});
    expect(team.name).toBe('U10 mixed');
  });
});

// 2. Code implementieren
export class TeamService {
  async createTeam(input: CreateTeamInput): Promise<Team> {
    // Implementation
  }
}

// 3. Test läuft durch ✅
```

### WCAG-Compliance

- Alle Buttons: `min-h-[44px]`
- Alle Inputs: `label` + `aria-describedby`
- Fehler: `role="alert"`, `aria-invalid="true"`
- Progress: `role="progressbar"`, `aria-valuenow`
- Tabs: `role="tablist"`, `aria-selected`

---

## 📝 Scripts

```bash
# Development
npm run dev              # Vite Dev Server (Hot Reload)

# Building
npm run build            # TypeScript compile + Vite build
npm run preview          # Preview Production Build

# Testing
npm run test             # Vitest (watch mode)
npm run test:ui          # Interactive Test UI
npm run test:coverage    # Coverage Report

# Code Quality
npm run lint             # ESLint
npm run type-check       # TypeScript Check (no emit)
```

---

## 🔐 Datenschutz (DSGVO)

Die App ist **DSGVO-konform**:

✅ **Datensparsamkeit:** Nur notwendige Daten  
✅ **Lokale Speicherung:** Alle Daten bleiben im Browser  
✅ **Keine Server:** Kein Tracking, keine Cookies  
✅ **Explizite Zustimmung:** Erziehungsberechtigte müssen zustimmen  
✅ **Löschung:** Vollständige Datenlöschung möglich  

### Gespeicherte Daten

**Personenbezogene Daten:**
- Spieler: Vorname, Nachname, Geburtsdatum (optional), TNA-Nr
- Erziehungsberechtigte: Vorname, Nachname, Telefon, E-Mail

**Keine Speicherung von:**
- Adressen (DSGVO-Minimierung)
- Trainer-Kontaktdaten (bist du selbst)
- Vereins-Adressen (nicht nötig)

---

## 🐛 Bekannte Einschränkungen

1. **Kein Routing-Library:** Simple Routing ohne History API
2. **Keine BBB-Integration:** Noch nicht implementiert
3. **Keine Offline-Sync-Konflikte:** Wird später hinzugefügt
4. **Keine Multi-User:** Single-User-App (Trainer)

---

## 🗺️ Roadmap

### Phase 2: BBB-Integration (nächste 2 Wochen)
- [ ] BBBSyncService
- [ ] HTML-Parser für Spielplan/Tabelle/Ergebnisse
- [ ] Automatischer Sync bei App-Start
- [ ] Benchmark-Analysen (gemeinsame Gegner)

### Phase 3: Einsatzplanung (nächste 4 Wochen)
- [ ] 8-Achtel-Editor
- [ ] DBB-Regelvalidierung (Pausen, Balance)
- [ ] Spieler-Bewertungen
- [ ] Team-Score-Berechnung
- [ ] Ersatz-Vorschläge

### Phase 4: Spieltag-Features (nächste 6 Wochen)
- [ ] Timer & Live-Tracking
- [ ] Spiel-Statistiken
- [ ] Schnelle Wechsel
- [ ] Export als PDF

---

## 📄 Lizenz

Private Entwicklung - Keine öffentliche Lizenz

---

## 👨‍💻 Entwickler

Entwickelt mit ❤️ von einem Basketball-Trainer für Basketball-Trainer

---

## 🙏 Credits

- **React** - Facebook
- **Dexie.js** - David Fahlander
- **Tailwind CSS** - Adam Wathan
- **Lucide Icons** - Lucide Contributors
- **Papaparse** - Matt Holt
- **Zustand** - Daishi Kato

---

**Version:** 1.0.0  
**Letztes Update:** 11. Oktober 2025
