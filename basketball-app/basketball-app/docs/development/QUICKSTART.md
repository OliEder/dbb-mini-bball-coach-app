# 🚀 Quick Start für neuen Chat - Basketball Team Manager

**Stand:** 27.10.2025  
**Letzter Fortschritt:** Phase 1 abgeschlossen (Altersklassen-Fix)  
**Nächster Schritt:** Phase 2 (Multi-Team Support)

---

## ✅ Was ist fertig?

### Phase 1: Altersklassen erweitert ✅
- **Type Definition** erweitert um `U21`, `U23`, `Senioren`
- **BBBSyncService** erkennt alle Altersklassen korrekt
- **ClubDataLoader** extrahiert Altersklassen mit Validierung
- **Tests** alle grün (63 passed)

**Details:** Siehe [MULTI-TEAM-SUPPORT-PLAN.md](./MULTI-TEAM-SUPPORT-PLAN.md) → Phase 1

---

## 🎯 Nächster Schritt: Phase 2 - Multi-Team Support

**Problem:** Trainer kann mehrere Teams im Onboarding auswählen, aber App verwaltet nur EIN Team.

**Lösung:** Vollständiger Multi-Team Support implementieren.

### 📋 Kompletter Plan verfügbar in:
**[MULTI-TEAM-SUPPORT-PLAN.md](./MULTI-TEAM-SUPPORT-PLAN.md)**

### 🚀 Start-Befehl für neuen Chat:

```
"Implementiere Phase 2 (Multi-Team Support) nach /docs/development/MULTI-TEAM-SUPPORT-PLAN.md

Start mit Schritt 1 (App Store erweitern) - TDD-konform (RED → GREEN → REFACTOR).

Die Dokumentation enthält:
- Kompletten Implementierungsplan
- Code-Beispiele für alle Änderungen
- Test-Strategien
- File-Locations
- Acceptance Criteria"
```

---

## 📊 Status-Übersicht

### Implementiert
- ✅ Phase 1: Altersklassen (U7-U23 + Senioren)
- ✅ BBB API Integration
- ✅ Onboarding Flow V2
- ✅ Spielplan & Tabelle
- ✅ Spieler-Verwaltung

### In Planung (Phase 2)
- 🚧 Multi-Team Support
  - App Store erweitern
  - Team-Switcher Component
  - Team-Übersicht Dashboard
  - Onboarding anpassen

### Danach (Phase 3 & 4)
- 📋 Season-History (Liga-Wechsel tracking)
- 📋 Team-basierter Spielplan-Sync
- 📋 Live-Game Management

---

## 🔥 Wichtige Hinweise

### TypeScript Best Practices
**IMMER prüfen:** [TYPESCRIPT-GUIDE.md](./TYPESCRIPT-GUIDE.md)

**Häufigster Fehler:**
```typescript
// ❌ FALSCH
team.id

// ✅ RICHTIG
team.team_id
```

### TDD Workflow
1. **RED:** Test schreiben (schlägt fehl)
2. **GREEN:** Code implementieren (Test wird grün)
3. **REFACTOR:** Code optimieren (Tests bleiben grün)

### Datenbank
- **Keine Schema-Änderungen** für Phase 2 nötig
- Alle nötigen Felder existieren bereits
- Indizes sind optimal

---

## 📁 Wichtige Files

```
/docs/development/
├── MULTI-TEAM-SUPPORT-PLAN.md  ← AKTUELLER PLAN
├── TYPESCRIPT-GUIDE.md          ← TypeScript Fehler vermeiden
├── PROJECT-STATUS.md            ← Architektur & Stand
└── TEST-STATUS.md               ← Test-Übersicht

/src/
├── stores/appStore.ts                    [PHASE 2: MODIFY]
├── shared/components/TeamSwitcher.tsx    [PHASE 2: NEW]
├── domains/dashboard/Dashboard.tsx       [PHASE 2: MODIFY]
└── domains/team/services/TeamService.ts  [PHASE 2: MODIFY]

/tests/
└── unit/stores/appStore.test.ts          [PHASE 2: NEW]
```

---

## 🧪 Tests vor Start prüfen

```bash
npm run test
# Sollte zeigen: 63 passed

npm run test:e2e
# E2E Tests (optional)
```

---

## 💡 Hilfreiche Commands

```bash
# Tests im Watch-Mode
npm run test:watch

# Nur spezifische Tests
npm run test -- appStore.test.ts

# E2E Tests
npm run test:e2e

# Dev-Server starten
npm run dev
```

---

## 🎓 Projekt-Kontext für AI

### Technologie-Stack
- **Frontend:** React + TypeScript + Vite
- **State:** Zustand (appStore)
- **DB:** IndexedDB via Dexie.js
- **Tests:** Vitest + Playwright
- **Styling:** Tailwind CSS

### Architektur-Prinzipien
- Domain-Driven Design
- TDD (Test-Driven Development)
- WCAG 2.0 AA Accessibility
- DSGVO-konform
- Offline-First (PWA)

### Naming Conventions
- **Entities:** Spieler, Spiel, Team, Verein
- **IDs:** `{entity}_id` (z.B. `team_id`, nie `id`)
- **Types:** PascalCase (z.B. `Altersklasse`)
- **Files:** kebab-case (z.B. `app-store.ts`)

---

## 🤝 Bei Fragen

Alle Details stehen in:
**[MULTI-TEAM-SUPPORT-PLAN.md](./MULTI-TEAM-SUPPORT-PLAN.md)**

Bei TypeScript-Fehlern:
**[TYPESCRIPT-GUIDE.md](./TYPESCRIPT-GUIDE.md)**

Architektur-Fragen:
**[PROJECT-STATUS.md](./PROJECT-STATUS.md)**

---

**Ready to start Phase 2!** 🚀
