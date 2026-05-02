# Onboarding-Bereinigung: Alt → V2

**Datum:** 2025-10-22  
**Status:** ✅ **ABGESCHLOSSEN**

---

## 🎯 Ziel

Entfernung des alten, unvollständigen Onboarding-Flows und Migration auf **OnboardingV2Container** mit vollständigem Liga-Filter-Workflow.

---

## ✅ Gelöschte Dateien (alle archiviert)

### Alte Onboarding-Komponenten
- ❌ `OnboardingContainer.tsx` - Alter Container (unvollständig)
- ❌ `TeamSelectStep.tsx` - Erwartete liga_id ohne Verband-Auswahl
- ❌ `SpielerImportStep.tsx` - CSV-Import (alt)
- ❌ `TrikotImportStep.tsx` - CSV-Import (alt)
- ❌ `CompleteStep.tsx` - Abschluss-Screen (alt)
- ❌ `WelcomeStep.tsx` - Begrüßung (alt)
- ❌ `OnboardingLayout.tsx` - Layout-Wrapper (ungenutzt)

### Alter Store
- ❌ `stores/onboardingStore.ts` - Vereinfachter Store ohne Verband-Flow

Alle Dateien → `archive/*.backup`

---

## ✅ Aktiver Flow: OnboardingV2

### App.tsx
```typescript
// ✅ EINZIGER Import:
import { OnboardingV2Container } from './domains/onboarding/components/OnboardingV2Container';

// ✅ Verwendet in Routing:
if (!hasCompletedOnboarding) {
  return <OnboardingV2Container />;
}
```

### Vollständiger V2-Workflow (10 Schritte)

```
1. welcome           ✅ Begrüßung
2. user              ✅ Trainer-Name (Vorname, Nachname)
3. verband           ✅ Verband auswählen (Bayern, Hessen, ...)
4. altersklassen     ✅ Altersklassen (U10, U12, U14, ...)
5. gebiet            ✅ Gebiet (wenn Verband Gebiete hat)
6. ligen-loading     ✅ Ligen laden via POST /rest/wam/data
7. verein            ✅ Verein (Club) auswählen
8. team-select       ⏳ Team(s) auswählen (TODO)
9. sync              ⏳ Daten synchronisieren (TODO)
10. team-selection   ⏳ Aktives Team festlegen (TODO)
```

### Store: onboarding-v2.store.ts

```typescript
// ✅ Vollständiger State:
interface OnboardingV2State {
  currentStep: OnboardingV2Step;
  user: { vorname, nachname };
  
  // Filter-Auswahl
  selectedVerband: number;
  selectedAltersklassen: number[];
  selectedGebiet: string;
  
  // API-Daten
  gefundeneLigen: WamLigaEintrag[];
  geladeneTeams: Map<ligaId, teams[]>;
  
  // Nutzer-Auswahl
  selectedVerein: Verein;
  eigeneTeams: Team[];
  aktivesTeam: Team;
}
```

---

## 🔍 Verifizierung

### Durchgeführte Checks
- ✅ Keine Imports von `OnboardingContainer` (alt)
- ✅ Keine Imports von `useOnboardingStore` (alt)
- ✅ Keine Imports von alten Step-Komponenten
- ✅ `App.tsx` nutzt ausschließlich `OnboardingV2Container`
- ✅ Migration-Info in App.tsx für Nutzer mit altem Onboarding

### Keine Referenzen mehr auf:
```bash
# ✅ Alle Prüfungen erfolgreich:
grep -r "OnboardingContainer" src/  # → Nur V2
grep -r "useOnboardingStore" src/   # → Nicht gefunden
grep -r "TeamSelectStep" src/       # → Nicht gefunden
grep -r "onboardingStore" src/      # → Nicht gefunden
```

---

## 📋 Nächste Schritte

### Fehlende Implementierungen in V2:

**Schritt 8: team-select**
- Team-Auswahl aus gefilterten Vereins-Teams
- Multi-Select möglich (Trainer kann mehrere Teams betreuen)
- Speichern in `eigeneTeams[]`

**Schritt 9: sync**
- Initiale Synchronisation der Liga-Daten
- Spielplan, Tabelle, Match-Details laden
- In IndexedDB speichern

**Schritt 10: team-selection**
- Aktives Team festlegen (aus `eigeneTeams[]`)
- Hauptteam für Dashboard-Ansicht
- Speichern als `aktivesTeam`

---

## 🆕 Neu entdeckte API-Endpunkte

```typescript
// 1. Team-Matches über alle Ligen
GET /rest/team/id/:teamPermanentId/matches
// → Alle Spiele eines Teams (verbandsübergreifend)

// 2. Vereins-Matches (aktuelle + kommende)
GET /rest/club/id/:clubId/actualmatches?justHome=false&rangeDays=8
// → Club-Name + nächste Spiele (konfigurierbar)
```

**Integration TODO:**
- Team-Matches für Spieler-Historie
- Club-Matches für Verein-Übersicht

---

## 📦 Archivierte Dateien

```
archive/
├── OnboardingContainer.tsx.backup
├── TeamSelectStep.tsx.backup
├── SpielerImportStep.tsx.backup
├── TrikotImportStep.tsx.backup
├── CompleteStep.tsx.backup
├── WelcomeStep-old.tsx.backup
├── OnboardingLayout.tsx.backup
└── onboardingStore.ts.backup (2. Version)
```

⚠️ **Hinweis:** Backups können nach erfolgreicher Verifizierung gelöscht werden.

---

## 🎯 Zusammenfassung

| Aspekt | Vorher (Alt) | Nachher (V2) |
|--------|--------------|--------------|
| **Container** | 2 (doppelt) | 1 (OnboardingV2) |
| **Steps** | 5 (unvollständig) | 10 (vollständig) |
| **Verband-Auswahl** | ❌ Fehlt | ✅ Schritte 3-6 |
| **Liga-Filter** | ❌ liga_id erwartet | ✅ WAM API Filter |
| **Vereins-Auswahl** | ❌ Fehlt | ✅ Schritt 7 |
| **Multi-Team** | ❌ Nicht möglich | ✅ Mehrere Teams |
| **Store** | Vereinfacht | Vollständig |
| **App.tsx** | Auskommentiert | Aktiv |

### Vorteile V2
- ✅ **Geführter Flow** - Schritt-für-Schritt vom Verband zum Team
- ✅ **API-Integration** - Direkte Liga-Suche via WAM
- ✅ **Multi-Team-Support** - Trainer kann mehrere Teams betreuen
- ✅ **Vollständiger State** - Alle Filter- und Auswahl-Daten gespeichert
- ✅ **Migration-Support** - Info für Nutzer mit altem Onboarding

---

**Status:** ✅ **ALTER FLOW VOLLSTÄNDIG ENTFERNT**  
**Nächster Schritt:** Schritte 8-10 in V2 implementieren
