# 📋 Dokumentations-Audit & Aufräum-Plan

**Datum:** 22. Oktober 2025  
**Prüfung:** Root-Level Dokumentation  
**Ziel:** Archivierung veralteter Dokumente

---

## ✅ AKTUELL - Behalten

### Haupt-Index
- ✅ **DOCUMENTATION-INDEX.md** (12. Okt 2025)
  - Zentraler Dokumentations-Index
  - Verweist auf docs/ Ordner
  - **AKTION:** Aktualisieren nach Cleanup

---

## 📦 ARCHIVIEREN - Erledigt/Veraltet

### Migration & Refactoring (Abgeschlossen)

1. **ONBOARDING-MIGRATION.md** (22. Okt 2025)
   - ✅ Migration zu OnboardingV2 abgeschlossen
   - **ARCHIV:** `docs/archive/migrations/ONBOARDING-MIGRATION-2025-10-22.md`
   
2. **REACT-19-MIGRATION.md**
   - ✅ React 19.2.0 ist installiert (siehe package.json)
   - Migration war erfolgreich
   - **ARCHIV:** `docs/archive/migrations/REACT-19-MIGRATION-2025-10.md`

3. **DEPENDENCY-CLEANUP.md**
   - ✅ @tanstack/react-query ist entfernt (nicht in package.json)
   - Cleanup erledigt
   - **ARCHIV:** `docs/archive/migrations/DEPENDENCY-CLEANUP-2025-10.md`

4. **BEREINIGUNG-PROTOKOLL.md** (12. Okt 2025)
   - Historisches Protokoll
   - **ARCHIV:** `docs/archive/cleanup/BEREINIGUNG-PROTOKOLL-2025-10-12.md`

5. **CLEANUP-PROTOKOLL.md**
   - Duplikat/ähnlich zu BEREINIGUNG-PROTOKOLL
   - **ARCHIV:** `docs/archive/cleanup/CLEANUP-PROTOKOLL.md`

6. **UMSTRUKTURIERUNG-PROTOKOLL.md**
   - Historisches Refactoring-Protokoll
   - **ARCHIV:** `docs/archive/cleanup/UMSTRUKTURIERUNG-PROTOKOLL.md`

### Crawler (Veraltet - durch docs/ Crawler-Doku ersetzt)

7. **CLUB-CRAWLER-PLAN.md**
   - Beschreibt v3 Plan (überholt durch Bulk Crawler)
   - **ARCHIV:** `docs/archive/crawler/CLUB-CRAWLER-PLAN-OLD.md`

8. **CRAWLER-EXPLAINED.md**
   - Beschreibt v2 (Basis von Bulk Crawler)
   - **VERSCHIEBEN:** `docs/CRAWLER-V2-EXPLAINED.md` (als Referenz)

### Package Management (Veraltet)

9. **PACKAGE-STATUS.md**
   - Snapshot vom Zeitpunkt X
   - **ARCHIV:** `docs/archive/packages/PACKAGE-STATUS.md`

10. **PACKAGE-UPDATES.md**
    - Alte Update-Liste
    - **ARCHIV:** `docs/archive/packages/PACKAGE-UPDATES.md`

11. **UPDATE-STRATEGIE.md**
    - Alte Update-Strategie
    - **ARCHIV:** `docs/archive/packages/UPDATE-STRATEGIE.md`

### Security & Fixes (Erledigt)

12. **SECURITY-FIX-PLAN.md**
    - Security-Fix Plan (erledigt?)
    - **PRÜFEN & ARCHIV:** `docs/archive/security/SECURITY-FIX-PLAN.md`

13. **SECURITY-FIX.md**
    - Security-Fix Protokoll
    - **PRÜFEN & ARCHIV:** `docs/archive/security/SECURITY-FIX.md`

### Weitere

14. **TEAM-TYP-FIX.md**
    - Spezifischer Fix (erledigt?)
    - **ARCHIV:** `docs/archive/fixes/TEAM-TYP-FIX.md`

15. **STATISCHE-VERBAENDE.md** (Root)
    - **DUPLIKAT:** Existiert bereits in docs/
    - **LÖSCHEN:** Root-Version

---

## 🔄 VERSCHIEBEN - Ins docs/ Verzeichnis

1. **CRAWLER-EXPLAINED.md**
   - **NACH:** `docs/CRAWLER-V2-EXPLAINED.md`
   - Grund: Gute Erklärung der v2 Basis-Logik

---

## 🗑️ LÖSCHEN - Duplikate

1. **STATISCHE-VERBAENDE.md** (Root)
   - Existiert bereits in docs/
   - Root-Version löschen

---

## 📁 Neue Archiv-Struktur

```
docs/archive/
├── migrations/
│   ├── ONBOARDING-MIGRATION-2025-10-22.md
│   ├── REACT-19-MIGRATION-2025-10.md
│   └── DEPENDENCY-CLEANUP-2025-10.md
├── cleanup/
│   ├── BEREINIGUNG-PROTOKOLL-2025-10-12.md
│   ├── CLEANUP-PROTOKOLL.md
│   └── UMSTRUKTURIERUNG-PROTOKOLL.md
├── crawler/
│   └── CLUB-CRAWLER-PLAN-OLD.md
├── packages/
│   ├── PACKAGE-STATUS.md
│   ├── PACKAGE-UPDATES.md
│   └── UPDATE-STRATEGIE.md
├── security/
│   ├── SECURITY-FIX-PLAN.md
│   └── SECURITY-FIX.md
└── fixes/
    └── TEAM-TYP-FIX.md
```

---

## 🎯 Aktionen

### Phase 1: Archiv-Struktur erstellen
```bash
mkdir -p docs/archive/{migrations,cleanup,crawler,packages,security,fixes}
```

### Phase 2: Dateien verschieben (15 Dateien)
```bash
# Migrations
mv ONBOARDING-MIGRATION.md docs/archive/migrations/ONBOARDING-MIGRATION-2025-10-22.md
mv REACT-19-MIGRATION.md docs/archive/migrations/REACT-19-MIGRATION-2025-10.md
mv DEPENDENCY-CLEANUP.md docs/archive/migrations/DEPENDENCY-CLEANUP-2025-10.md

# Cleanup
mv BEREINIGUNG-PROTOKOLL.md docs/archive/cleanup/BEREINIGUNG-PROTOKOLL-2025-10-12.md
mv CLEANUP-PROTOKOLL.md docs/archive/cleanup/
mv UMSTRUKTURIERUNG-PROTOKOLL.md docs/archive/cleanup/

# Crawler
mv CLUB-CRAWLER-PLAN.md docs/archive/crawler/CLUB-CRAWLER-PLAN-OLD.md
mv CRAWLER-EXPLAINED.md docs/CRAWLER-V2-EXPLAINED.md  # Verschieben, nicht archivieren!

# Packages
mv PACKAGE-STATUS.md docs/archive/packages/
mv PACKAGE-UPDATES.md docs/archive/packages/
mv UPDATE-STRATEGIE.md docs/archive/packages/

# Security
mv SECURITY-FIX-PLAN.md docs/archive/security/
mv SECURITY-FIX.md docs/archive/security/

# Fixes
mv TEAM-TYP-FIX.md docs/archive/fixes/
```

### Phase 3: Duplikate löschen
```bash
# Root-Version löschen (existiert in docs/)
rm STATISCHE-VERBAENDE.md
```

### Phase 4: DOCUMENTATION-INDEX.md aktualisieren
- Neue Archiv-Struktur dokumentieren
- Veraltete Links entfernen
- Crawler-Doku aktualisieren

---

## 📊 Zusammenfassung

| Kategorie | Anzahl | Aktion |
|-----------|--------|--------|
| Migrations | 3 | Archivieren |
| Cleanup | 3 | Archivieren |
| Crawler | 2 | 1× Archiv, 1× Verschieben |
| Packages | 3 | Archivieren |
| Security | 2 | Archivieren |
| Fixes | 1 | Archivieren |
| Duplikate | 1 | Löschen |
| **TOTAL** | **15** | **14 archiviert, 1 gelöscht** |

---

## ✅ Erwartetes Ergebnis

**Root-Verzeichnis (nur noch essentials):**
```
Basketball-Apps/
├── DOCUMENTATION-INDEX.md    ← Aktualisiert
├── .gitignore
├── .env
├── basketball-app/
├── docs/                      ← Alle Doku hier
├── scripts/                   ← Crawler-Scripts
└── archive/                   ← Code-Backups (unberührt)
```

**Sauberes docs/ Verzeichnis:**
```
docs/
├── README.md                  ← Haupt-Index
├── CRAWLER-V2-EXPLAINED.md    ← NEU (verschoben)
├── architecture/
├── userflows/
├── requirements/
└── archive/                   ← Gut strukturiert
    ├── migrations/
    ├── cleanup/
    ├── crawler/
    ├── packages/
    ├── security/
    └── fixes/
```

---

## 🚀 Nächste Schritte

1. ✅ **Audit durchgeführt**
2. ⏳ **Bestätigung einholen**
3. ⏳ **Archiv-Struktur erstellen**
4. ⏳ **Dateien verschieben**
5. ⏳ **Index aktualisieren**
6. ⏳ **Git Commit**

---

**Bereit zum Aufräumen?** Soll ich starten? 🧹
