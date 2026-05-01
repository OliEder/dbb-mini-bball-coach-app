# 📋 Roadmap-Konsolidierung - Zusammenfassung

**Datum:** 30. Oktober 2025  
**Aktion:** STATUS.md Roadmap → docs/planning/roadmaps/ migriert

---

## ✅ Was wurde gemacht

### 1. Neue FEATURE-ROADMAP.md erstellt
**Pfad:** `docs/planning/roadmaps/FEATURE-ROADMAP.md`

**Inhalt:**
- ✅ Phase 1 (Abgeschlossen): MVP, BBB-Integration, Multi-Team
- 🚧 Phase 2 (Aktiv Q4 2025): Einsatzplanung & Live Game
  - 8-Achtel-Editor mit DBB-Regelvalidierung
  - Live Timer & Tracking
  - Spieler-Bewertungen Integration
- 🔮 Phase 3 (Q1 2026): Spieltag & Analysen
  - Erweiterte Statistiken
  - Benchmark & Gegner-Analyse
  - PDF-Export
- 🎓 Phase 4 (Q2 2026): Training & Langzeit-Analysen
  - Training-Tracking
  - Spieler-Entwicklung
  - Consent-Management (DSGVO)
- 🚀 Phase 5 (Q3 2026+): Advanced Features
  - Multi-Saison, Cloud-Sync, Video, ML

**Quelle:** Aus STATUS.md extrahiert und aktualisiert

---

### 2. IMPLEMENTATION-ROADMAP.md aktualisiert
**Pfad:** `docs/planning/roadmaps/IMPLEMENTATION-ROADMAP.md`

**Änderungen:**
- ✅ Abgeschlossene Phasen 1-2 markiert
- 🚧 Phase 3 (Dashboard) mit konkreten Tasks
  - LigaTabelle Component
  - NaechstesSpiel Card
  - TeamStats Widget
  - SpielplanListe
  - QuickActions
- 🔮 Phase 4 (Services) vorbereitet
  - SpielService erweitern
  - BenchmarkService erstellen
  - HalleService erweitern

**Fokus:** Technische Implementation (kurzfristig)

---

### 3. STATUS.md archiviert
**Alt:** `docs/development/STATUS.md`  
**Neu:** `docs/archive/2025-10-13-STATUS-v1.2.3.md`

**Begründung:**
- Veraltet (13.10. vs 30.10.)
- Duplikate zu FEATURE-ROADMAP.md
- Keine kritischen Info über aktuellen Zustand
- PROJECT-STATUS.md ist aktueller und detaillierter

---

## 📊 Vergleich: Alt vs. Neu

### STATUS.md (Alt) ❌
- **Typ:** Feature-Roadmap (langfristig)
- **Stand:** 13. Oktober 2025
- **Version:** v1.2.3
- **Fokus:** "Was kommt wann?"
- **Problem:** Veraltet, keine Info über aktuelle Blocker

### FEATURE-ROADMAP.md (Neu) ✅
- **Typ:** Feature-Roadmap (langfristig)
- **Stand:** 30. Oktober 2025
- **Version:** 2.0
- **Fokus:** "Was wollen wir erreichen?"
- **Vorteil:** Aktuell, mit Prioritäten-Matrix

### IMPLEMENTATION-ROADMAP.md (Aktualisiert) ✅
- **Typ:** Tech-Roadmap (kurzfristig)
- **Stand:** 30. Oktober 2025
- **Fokus:** "Wie implementieren wir es?"
- **Vorteil:** Konkrete Tasks, Code-Beispiele, TDD

---

## 🎯 Relevanz-Check: Was ist noch aktuell?

### ✅ Noch Relevant (Übernommen)

**Aus STATUS.md Phase 2 (Einsatzplanung):**
- ✅ 8-Achtel-Editor → FEATURE-ROADMAP Phase 2.1
- ✅ DBB-Regelvalidierung → FEATURE-ROADMAP Phase 2.1
- ✅ Spieler-Bewertungen → FEATURE-ROADMAP Phase 2.1
- ✅ Ersatz-Vorschläge → FEATURE-ROADMAP Phase 2.1

**Aus STATUS.md Phase 3 (Spieltag):**
- ✅ Timer & Live-Tracking → FEATURE-ROADMAP Phase 2.2
- ✅ Spiel-Statistiken → FEATURE-ROADMAP Phase 3.1
- ✅ Schnelle Wechsel → FEATURE-ROADMAP Phase 2.2
- ✅ PDF-Export → FEATURE-ROADMAP Phase 3.1

**Aus STATUS.md Phase 4 (Training):**
- ✅ Training-Tracking → FEATURE-ROADMAP Phase 4.1
- ✅ Benchmark-Analysen → FEATURE-ROADMAP Phase 3.2
- ✅ Performance-Metriken → FEATURE-ROADMAP Phase 4.2
- ✅ Daten-Export → FEATURE-ROADMAP Phase 4.3

### ❌ Nicht mehr relevant / Bereits erledigt

**STATUS.md "Roadmap Phase 1":**
- ❌ Schon abgeschlossen (Oktober 2025)
- ❌ Nicht mehr in FEATURE-ROADMAP (nur abgeschlossenes)

**STATUS.md "Tech Stack":**
- ❌ Jetzt in PROJECT-STATUS.md (aktueller)

**STATUS.md "Metriken":**
- ❌ Jetzt in PROJECT-STATUS.md (genauer)

---

## 📁 Neue Dokumentations-Struktur

```
docs/planning/roadmaps/
├── FEATURE-ROADMAP.md          ✨ NEU - Langfristig (2025-2026)
├── IMPLEMENTATION-ROADMAP.md   🔄 UPDATED - Kurzfristig (Wochen)
├── MULTI-TEAM-SUPPORT-PLAN.md  ✅ Bleibt - Detailplan
├── CHANGELOG.md                ✅ Bleibt - Versionshistorie
└── RELEASE-NOTES.md            ✅ Bleibt - Release-Infos

docs/archive/
└── 2025-10-13-STATUS-v1.2.3.md ✅ Archiviert
```

---

## 🔗 Referenzen aktualisieren

### In PROJECT-STATUS.md
```markdown
## 📚 Dokumentation

### Roadmaps
- ✅ [FEATURE-ROADMAP.md](../planning/roadmaps/FEATURE-ROADMAP.md) - Langfristige Feature-Planung
- ✅ [IMPLEMENTATION-ROADMAP.md](../planning/roadmaps/IMPLEMENTATION-ROADMAP.md) - Technische Implementation
- ✅ [MULTI-TEAM-SUPPORT-PLAN.md](../planning/roadmaps/MULTI-TEAM-SUPPORT-PLAN.md) - Multi-Team Details
```

### In README.md
```markdown
## 🗺️ Roadmap

Siehe:
- [FEATURE-ROADMAP.md](docs/planning/roadmaps/FEATURE-ROADMAP.md) - Was kommt wann?
- [IMPLEMENTATION-ROADMAP.md](docs/planning/roadmaps/IMPLEMENTATION-ROADMAP.md) - Wie setzen wir es um?
```

---

## ✅ Checkliste

- [x] FEATURE-ROADMAP.md erstellt
- [x] IMPLEMENTATION-ROADMAP.md aktualisiert
- [x] STATUS.md archiviert
- [ ] PROJECT-STATUS.md Referenzen updaten
- [ ] README.md Referenzen updaten

---

## 🎯 Nächste Schritte für Entwickler

1. **Feature-Planung:**  
   → Siehe `FEATURE-ROADMAP.md` für langfristige Ziele

2. **Konkrete Implementation:**  
   → Siehe `IMPLEMENTATION-ROADMAP.md` Phase 3 (Dashboard)

3. **Aktueller Status:**  
   → Siehe `PROJECT-STATUS.md` für Blocker & Issues

4. **Multi-Team Feature:**  
   → Siehe `MULTI-TEAM-SUPPORT-PLAN.md` für Details

---

**Fazit:** Roadmap ist jetzt sauber getrennt in Feature (langfristig) und Implementation (kurzfristig), ohne Duplikate.
