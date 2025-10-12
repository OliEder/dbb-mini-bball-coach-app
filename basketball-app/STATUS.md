# Basketball PWA - Clean Start

## 🎯 Projekt-Setup Status

### ✅ Abgeschlossen

#### 1. Build-Setup
- [x] package.json mit allen Dependencies
- [x] TypeScript Config (tsconfig.json)
- [x] Vite Config mit PWA-Plugin
- [x] Tailwind CSS mit WCAG 2.0 AA Farben
- [x] PostCSS Config

#### 2. Type Definitions
- [x] Komplettes Schema v3.0 als TypeScript Interfaces
- [x] 24 Tabellen-Definitionen
- [x] Alle Enums (Altersklasse, SpielerTyp, etc.)
- [x] CSV-Import Types
- [x] BBB-Parser Types
- [x] Onboarding State

#### 3. Database (Dexie/IndexedDB)
- [x] BasketballDatabase mit allen 24 Tabellen
- [x] Indizes für Performance
- [x] Export/Import Funktionen
- [x] Development Reset-Funktion

#### 4. WCAG 2.0 AA Compliance
- [x] index.css mit Accessibility-Klassen
- [x] Focus-Styles (2px outline, 2px offset)
- [x] Minimale Touch-Target-Größe (44x44px)
- [x] High-Contrast Links und Buttons
- [x] Screen Reader Support (.sr-only)
- [x] Skip-to-Content Link

---

## 🚧 Nächste Schritte

### Phase 1: Onboarding Flow (JETZT)
Soll ich jetzt mit dem Onboarding-Flow starten?

**Was wird implementiert:**
1. **Onboarding Domain-Struktur**
   - `/domains/onboarding/components/` - UI-Komponenten
   - `/domains/onboarding/services/` - Business Logic
   - `/domains/onboarding/store/` - Zustand State Management

2. **Onboarding Steps:**
   - Welcome Screen
   - Team erstellen (Name, Altersklasse, Saison)
   - Verein zuordnen (neu oder bestehend)
   - Spieler CSV-Import
   - Trikot CSV-Import
   - BBB-URL eingeben (optional)
   - Fertig → Dashboard

3. **Team Domain**
   - Team Service (CRUD)
   - Team Models
   - Team Store

4. **Router Setup**
   - TanStack Router
   - Routes: /onboarding, /dashboard, /team/:id

5. **Main App**
   - App.tsx mit Router
   - main.tsx Entry Point

---

## 📊 Architektur-Übersicht

```
src/
├── main.tsx                    # Entry Point
├── App.tsx                     # Router + Layout
├── index.css                   # WCAG-optimierte Styles
│
├── shared/                     # ✅ FERTIG
│   ├── types/index.ts         # Alle Interfaces
│   └── db/database.ts         # Dexie Database
│
├── domains/                    # 🚧 IN ARBEIT
│   ├── onboarding/            # NEXT: Onboarding Flow
│   │   ├── components/
│   │   ├── services/
│   │   └── store/
│   │
│   ├── team/                  # NEXT: Team Management
│   ├── dashboard/             # NEXT: Hauptansicht
│   ├── spielplan/             # SPÄTER: BBB-Integration
│   ├── spieler/               # SPÄTER: Spielerverwaltung
│   └── ... (weitere Domains)
│
└── test/                      # Test Setup
    └── setup.ts
```

---

## 🎨 Design System

### Farben (WCAG 2.0 AA)
- **Primary:** Blue 600 (#2563eb) - 4.5:1 Kontrast
- **Success:** Green 600 (#16a34a)
- **Warning:** Yellow 600 (#ca8a04)
- **Error:** Red 600 (#dc2626)

### Komponenten
- Buttons: min-height 44px, 2px focus outline
- Inputs: 2px border, focus ring
- Cards: White background, subtle shadow
- Alerts: Color-coded mit Icons

---

## 💾 Datenbank-Struktur

### Kern-Tabellen (24 Total)
1. **Vereine** - BBB-Sync, Kontakte
2. **Teams** - Multi-Team-Support
3. **Spieler** - Eigene + Gegner + Scouting
4. **Bewertungen** - 9 Skills, Gesamt-Wert
5. **Erziehungsberechtigte** - DSGVO-konform
6. **Hallen** - Navigation, Parken, ÖPNV
7. **Spielplan** - BBB-URLs, Auto-Sync
8. **Spiele** - Spielnr für BBB-Match
9. **Liga-Ergebnisse** - Benchmark-Analysen
10. **Liga-Tabelle** - Dashboard-Anzeige
11. **Trikots** - Wendejerseys, Hosen
12. **Einsatz** - 8 Achtel, Rotation
13. ... (11 weitere Tabellen)

---

## ✅ Soll ich weitermachen?

**Option A:** Onboarding Flow komplett implementieren
- Welcome → Team → Spieler-CSV → Trikot-CSV → Fertig
- Geschätzter Aufwand: 2-3 Stunden
- Ergebnis: Funktionierende App mit Team-Erstellung

**Option B:** Zuerst nur Router + Dashboard-Skeleton
- Schneller zu einem laufenden Prototyp
- Onboarding später

**Was bevorzugst du?**
