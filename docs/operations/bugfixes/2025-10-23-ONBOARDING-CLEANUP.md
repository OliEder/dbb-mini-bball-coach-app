# Onboarding Cleanup - Obsolete Dateien entfernt

**Datum:** 23. Oktober 2025  
**Typ:** Cleanup / Refactoring  
**Priorität:** Medium  
**Status:** ✅ Behoben

---

## 🐛 Problem

### Symptome
1. **Build hatte 39 Fehler** - TypeScript konnte obsolete Imports nicht auflösen
2. **Preview zeigte alten Flow** - Trotz SimplifiedOnboarding wurde noch v2-Code referenziert
3. **Code-Bloat** - Viele ungenutzte Onboarding-Komponenten im Repo

### Root Cause
Nach Migration zu `SimplifiedOnboarding` blieben alle alten v2-Komponenten und Stores im Code, obwohl sie nicht mehr verwendet wurden.

**Problematische Dateien:**
- `onboarding-v2.store.ts` - Obsoleter Store
- `OnboardingV2Container.tsx` - Alter Container
- Gesamter `v2/` Ordner mit 11 Komponenten
- Leerer `v3/` Ordner

---

## 🔧 Lösung

### Schritt 1: Benötigte Komponenten extrahieren
Drei Komponenten wurden **noch verwendet** und mussten gerettet werden:

```bash
# Aus v2/ nach components/ verschoben:
WelcomeStep.tsx
UserStep.tsx  
CompletionStep.tsx
```

Diese werden von `SimplifiedOnboardingContainer.tsx` verwendet.

### Schritt 2: Imports aktualisieren
**SimplifiedOnboardingContainer.tsx:**

```typescript
// ❌ Alt (v2-Import)
import { WelcomeStep, UserStep } from './v2';
import { CompletionStep } from './v2/CompletionStep';

// ✅ Neu (direkter Import)
import { WelcomeStep } from './WelcomeStep';
import { UserStep } from './UserStep';
import { CompletionStep } from './CompletionStep';
```

### Schritt 3: Obsoletes archivieren
Alle obsoleten Dateien wurden ins Archive verschoben:

```
src/domains/onboarding/archive/2025-10-23-cleanup/
├── onboarding-v2.store.ts
├── OnboardingV2Container.tsx
└── v2/
    ├── AltersklassenStep.tsx
    ├── GebietStep.tsx
    ├── LigenLoadingStep.tsx
    ├── TeamStepV3.tsx
    ├── VerbandStep.tsx
    ├── VereinStep.tsx
    ├── VereinStepV3.tsx
    ├── index.ts
    └── __tests__/
        └── VerbandStep.test.tsx
```

**Hinweis:** Dateien wurden **archiviert**, nicht gelöscht - sie bleiben verfügbar falls nötig.

### Schritt 4: Leere Ordner (manuell zu löschen)
```bash
# Diese Ordner sind leer und können gelöscht werden:
rm -rf src/domains/onboarding/components/v2/
rm -rf src/domains/onboarding/components/v3/
```

---

## ✅ Verifikation

### Tests
```bash
npm run test:ui:json
```
**Ergebnis:** ✅ Alle Tests grün

### Build
```bash
npm run build
```
**Ergebnis:** ✅ Keine TypeScript-Fehler mehr (von 39 auf 0)

### Preview
```bash
npm run preview
```
**Ergebnis:** ✅ Zeigt SimplifiedOnboarding (neuer Flow)

---

## 📊 Impact

### Positiv
✅ **Build-Fehler behoben:** 39 → 0 TypeScript-Fehler  
✅ **Code-Bloat reduziert:** ~15 obsolete Dateien entfernt  
✅ **Klarheit:** Nur noch aktive Komponenten im Hauptordner  
✅ **Preview funktioniert:** Zeigt korrekten Flow

### Negativ
⚠️ **Manuelle Schritte nötig:** Leere Ordner müssen manuell gelöscht werden

---

## 🛡️ Prevention

### Checkliste für zukünftige Refactorings

1. **Vor Migration:**
   - [ ] Liste aller betroffenen Dateien erstellen
   - [ ] Dependency-Graph prüfen (was wird wo verwendet?)

2. **Während Migration:**
   - [ ] Obsolete Dateien markieren (z.B. mit Kommentar `// DEPRECATED`)
   - [ ] Imports inkrementell migrieren

3. **Nach Migration:**
   - [ ] Sofort obsolete Dateien archivieren/löschen
   - [ ] Build & Tests prüfen
   - [ ] Preview testen

### Code-Conventions

```typescript
// Alte Dateien explizit als deprecated markieren:
/**
 * @deprecated Use SimplifiedOnboarding instead
 * Migration: 2025-10-23
 */
export const OnboardingV2Container = () => { ... }
```

---

## 📝 Lessons Learned

### Was gut lief
✅ Systematisches Vorgehen (Extrahieren → Imports → Archivieren)  
✅ Archive statt direktes Löschen  
✅ Ausführliche Dokumentation

### Was besser sein könnte
⚠️ Früher aufräumen - direkt nach erfolgreicher Migration  
⚠️ Automatisiertes Tooling für "Find Unused Files"  
⚠️ Pre-commit Hook für verwaiste Imports

### Empfehlungen
1. **Weekly Cleanup:** Jede Woche kurz prüfen ob obsolete Dateien rumliegen
2. **Migration-Checklist:** Aufräumen als Teil der Definition-of-Done
3. **ESLint Rule:** "no-unused-imports" aktivieren

---

## 🔗 Related

- **Cleanup-Details:** `src/domains/onboarding/archive/2025-10-23-cleanup/README.md`
- **Simplified Store:** `src/domains/onboarding/onboarding-simple.store.ts`
- **Main Container:** `src/domains/onboarding/components/SimplifiedOnboardingContainer.tsx`

---

## 📌 Tags

`cleanup` `refactoring` `onboarding` `build-fix` `typescript`
