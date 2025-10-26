# Onboarding Cleanup - 23. Oktober 2025

## 🎯 Ziel
Entfernung obsoleter Onboarding-v2-Komponenten und -Stores nach erfolgreicher Migration zu SimplifiedOnboarding.

---

## 📦 Archivierte Dateien

### Stores
- ✅ `onboarding-v2.store.ts` → `archive/2025-10-23-cleanup/`

### Container
- ✅ `OnboardingV2Container.tsx` → `archive/2025-10-23-cleanup/`

### v2/ Components (11 Dateien)
Alle Dateien verschoben nach: `archive/2025-10-23-cleanup/v2/`

- ✅ `AltersklassenStep.tsx`
- ✅ `CompletionStep.tsx`
- ✅ `GebietStep.tsx`
- ✅ `LigenLoadingStep.tsx`
- ✅ `TeamStepV3.tsx`
- ✅ `UserStep.tsx`
- ✅ `VerbandStep.tsx`
- ✅ `VereinStep.tsx`
- ✅ `VereinStepV3.tsx`
- ✅ `WelcomeStep.tsx`
- ✅ `index.ts`

### Tests
- ✅ `v2/__tests__/VerbandStep.test.tsx` → `archive/2025-10-23-cleanup/v2/__tests__/`

---

## ✨ Neue Struktur

### Aktive Komponenten (nach Cleanup)

```
src/domains/onboarding/
├── components/
│   ├── WelcomeStep.tsx           ← Neu: aus v2/ extrahiert
│   ├── UserStep.tsx              ← Neu: aus v2/ extrahiert
│   ├── CompletionStep.tsx        ← Neu: aus v2/ extrahiert
│   ├── SimplifiedVereinStep.tsx  ← Aktiv
│   ├── SimplifiedTeamStep.tsx    ← Aktiv
│   └── SimplifiedOnboardingContainer.tsx ← Aktiv (Main Container)
├── onboarding-simple.store.ts    ← Aktiver Store
└── archive/
    └── 2025-10-23-cleanup/       ← Archivierte Dateien
```

---

## 🔄 Durchgeführte Änderungen

### 1. Komponenten gerettet (Phase 1)
Die folgenden Komponenten wurden **aus v2/ extrahiert** und auf oberste Ebene von `components/` verschoben, da sie noch von `SimplifiedOnboardingContainer` verwendet werden:

- `WelcomeStep.tsx`
- `UserStep.tsx`
- `CompletionStep.tsx`

### 2. Imports aktualisiert (Phase 2)
**SimplifiedOnboardingContainer.tsx** wurde angepasst:

```typescript
// Vorher
import { WelcomeStep, UserStep } from './v2';
import { CompletionStep } from './v2/CompletionStep';

// Nachher
import { WelcomeStep } from './WelcomeStep';
import { UserStep } from './UserStep';
import { CompletionStep } from './CompletionStep';
```

### 3. Obsolete Dateien archiviert (Phase 3)
Alle obsoleten v2-Komponenten, der alte v2-Store und der alte Container wurden ins Archive verschoben.

---

## 🗑️ Manuelle Cleanup-Schritte

Die folgenden **leeren Ordner** können manuell gelöscht werden:

```bash
# Im Terminal
cd src/domains/onboarding/components

# Leere Ordner löschen
rm -rf v2/
rm -rf v3/
```

**Hinweis:** Die Ordner sind bereits leer, alle Dateien wurden ins Archive verschoben.

---

## ✅ Verifikation

### Tests laufen?
```bash
npm run test:ui:json
```

Alle Tests sollten **grün** sein, da keine Test-Imports auf v2/ zeigen.

### Build funktioniert?
```bash
npm run build
```

Build sollte **ohne Fehler** durchlaufen.

### Preview zeigt neuen Flow?
```bash
npm run preview
```

Sollte **SimplifiedOnboarding** zeigen (kein alter v2-Flow mehr).

---

## 📝 Lessons Learned

### Was gut lief
✅ Systematisches Vorgehen: Erst extrahieren, dann Imports fixen, dann archivieren  
✅ Archive statt Löschen: Dateien bleiben verfügbar falls nötig  
✅ Klare Benennung: `2025-10-23-cleanup` macht Kontext sofort klar

### Was zu beachten ist
⚠️ Imports immer **vor** dem Verschieben prüfen  
⚠️ Leere Ordner können automatisch nicht gelöscht werden (Tooling-Limitierung)  
⚠️ Archive regelmäßig aufräumen (nach 6 Monaten?)

---

## 🔗 Related Documents

- **Migration Guide:** `ONBOARDING-V2.md`
- **Simplified Store:** `onboarding-simple.store.ts`
- **Main Container:** `components/SimplifiedOnboardingContainer.tsx`

---

**Datum:** 23. Oktober 2025  
**Durchgeführt von:** AI-Assisted Cleanup  
**Status:** ✅ Abgeschlossen
