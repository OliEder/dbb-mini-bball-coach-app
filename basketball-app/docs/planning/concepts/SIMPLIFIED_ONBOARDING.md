# Vereinfachter Onboarding-Flow

## 🎯 Motivation

Der ursprüngliche Flow hatte 10 Schritte und war primär dazu da, API-Calls zu minimieren durch schrittweise Filterung (Verband → Altersklasse → Gebiet → Ligen → Verein).

**Mit lokalen Club-Daten brauchen wir das nicht mehr!**

## ✨ Neuer Flow (5 Schritte)

```
1. Welcome         "Willkommen!"
2. User            Vorname, Nachname
3. Verein          Suche + optionaler Verband-Filter
4. Team            Multi-Select aus Verein-Teams
5. Completion      → Auto-Redirect zum Dashboard
```

**Von 10 auf 5 Schritte reduziert! ⚡**

## 🏗️ Architektur

### Store
```typescript
// src/domains/onboarding/onboarding-simple.store.ts
useSimpleOnboardingStore()
  - currentStep: 'welcome' | 'user' | 'verein' | 'team' | 'completion'
  - user: { vorname, nachname }
  - selectedVerbandFilter: number | null  // Optional!
  - selectedVerein: Verein
  - selectedTeams: Team[]
```

### Components
```
src/domains/onboarding/components/
├── SimplifiedOnboardingContainer.tsx    # Main orchestrator
├── SimplifiedVereinStep.tsx             # Verein-Auswahl mit Filter + Suche
├── SimplifiedTeamStep.tsx               # Team-Auswahl
└── v2/
    ├── WelcomeStep.tsx                  # Wiederverwendet
    ├── UserStep.tsx                     # Wiederverwendet
    └── CompletionStep.tsx               # Wiederverwendet
```

## 🔍 Verein-Suche Features

### 1. Alphabetische Sortierung
Alle Vereine werden alphabetisch sortiert geladen.

### 2. Optionaler Verband-Filter
```
┌─────────────────────────────┐
│ Verband (optional)         │
│ ▼ Alle Verbände           │
│   Baden-Württemberg       │
│   Bayern                  │
│   ...                     │
└─────────────────────────────┘
```

Filtert die Liste auf Vereine des gewählten Verbands.

### 3. Echtzeit-Suche
```
┌─────────────────────────────┐
│ 🔍 Verein suchen           │
│ z.B. Bayern München        │
└─────────────────────────────┘
```

Client-seitige Suche in Name + Kurzname.

### 4. Live-Ergebniszähler
```
152 von 1.234 Vereinen
```

Zeigt gefilterte/gesuchte Anzahl.

## 📁 Neue Dateien

```
src/domains/onboarding/
├── onboarding-simple.store.ts              # NEU: Schlanker Store
└── components/
    ├── SimplifiedOnboardingContainer.tsx   # NEU: Neuer Container
    ├── SimplifiedVereinStep.tsx            # NEU: Verein mit Filter
    └── SimplifiedTeamStep.tsx              # NEU: Team-Auswahl

e2e/
└── onboarding-simplified.spec.ts           # NEU: Tests
```

## 🧪 Testing

### E2E-Tests
```bash
npm run test:e2e -- onboarding-simplified.spec.ts
```

### Manuell testen

1. **Storage löschen:**
   ```javascript
   localStorage.clear()
   indexedDB.deleteDatabase('BasketballPWA_v4')
   ```

2. **Flow durchlaufen:**
   - Welcome → Los geht's
   - User: Max Mustermann
   - Verein: 
     - Optional: Bayern wählen
     - Suche: "München"
     - Verein auswählen
   - Team: Mindestens 1 Team wählen
   - Completion → Dashboard

3. **Filter testen:**
   - Verband ändern → Liste aktualisiert sich
   - Suche eingeben → Live-Filterung
   - Zurück navigieren → Daten bleiben erhalten

4. **Responsive testen:**
   - Mobile (375x667)
   - Tablet (768x1024)
   - Desktop (1920x1080)

## 🚀 Performance

### Lade-Strategie
1. **Verein-Step:** Lädt ALLE chunks auf einmal (parallel)
2. **Team-Step:** Lädt nur den relevanten chunk

### Optimierung
- Chunks werden parallel geladen
- Client-seitige Filterung (keine API-Calls)
- Alphabetische Sortierung einmalig beim Laden

## 📊 Vergleich Alt vs. Neu

| Metrik | Alt (V2) | Neu (Simplified) |
|--------|----------|------------------|
| Schritte | 10 | 5 |
| API-Calls | 0 (lokal) | 0 (lokal) |
| Nutzer-Clicks | ~15+ | ~8 |
| Flow-Dauer | ~3-5 min | ~1-2 min |
| Komplexität | Hoch | Niedrig |

## 🔄 Migration

### Alte Stores bleiben erhalten
- `onboarding-v2.store.ts` → Bleibt für Kompatibilität
- `onboarding-simple.store.ts` → Neu, aktiv genutzt

### App.tsx Update
```typescript
// Vorher
import { OnboardingV2Container } from './domains/onboarding/components/OnboardingV2Container';

// Nachher
import { SimplifiedOnboardingContainer } from './domains/onboarding/components/SimplifiedOnboardingContainer';
```

## ✅ Checkliste

- [x] Store erstellt
- [x] VereinStep mit Filter + Suche
- [x] TeamStep mit Multi-Select
- [x] Container orchestriert Flow
- [x] App.tsx integriert
- [x] E2E-Tests geschrieben
- [ ] Manuell getestet
- [ ] Alte V2-Components entfernen (optional)

## 🐛 Bekannte Limitationen

1. **Alle Chunks auf einmal:** 
   - Bei sehr langsamer Verbindung kann initial laden lange dauern
   - Alternative: Pagination (später)

2. **Client-seitige Suche:**
   - Funktioniert nur für geladene Daten
   - Bei 1000+ Vereinen performant genug

## 📝 Next Steps

1. Manuell testen
2. Performance messen (chunk loading)
3. Optional: Lazy Loading für chunks
4. Optional: Pagination für Vereine
5. Optional: Fuzzy Search statt exakter Match
6. Alte V2-Components aufräumen

## 🎨 UI-Details

### Verein-Step
- Dropdown für Verband
- Searchbar mit Icon
- Radio-Buttons für Auswahl
- Live-Count: "152 von 1.234 Vereinen"
- Alphabetisch sortiert

### Team-Step
- Checkboxen für Multi-Select
- Badge: "2 Teams ausgewählt"
- Alphabetisch sortiert
- Fallback: "Keine Teams gefunden"

## 🔗 Related

- [REACT_ROUTER_MIGRATION.md](./REACT_ROUTER_MIGRATION.md) - Router Setup
- [DBB_CLUB_DATA.md](./docs/DBB_CLUB_DATA.md) - Club-Daten Struktur
