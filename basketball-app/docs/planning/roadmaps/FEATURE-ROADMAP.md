# 🎯 Feature Roadmap - Basketball Team Manager PWA

**Version:** 2.0  
**Stand:** 30. Oktober 2025  
**Status:** Phase 1 abgeschlossen, Phase 2 aktiv

---

## 📍 Aktueller Stand (Oktober 2025)

### ✅ Phase 1: MVP & Basis (Abgeschlossen)

#### Core-Features
- [x] **Team Management**
- [x] **Spieler-Management**
- [x] **BBB-Integration**
- [x] **Onboarding-Flow**
- [x] **Dashboard** (Basis)

#### Tech Stack
- [x] React 19, TypeScript, Vite, IndexedDB
- [x] Domain-Driven Design
- [x] PWA mit Service Worker

### 🔴 Phase 1.5: Test-Konsolidierung (AKTUELL - P0 PRIORITÄT)

**Status:** RED Phase (TDD) - Tests sind bewusst rot  
**Deadline:** Diese Woche (bis 3.11.2025)

#### Aufgaben
- [ ] **Tests aus /src/ nach /tests/ migrieren** 🔴 BLOCKIEREND
  - Tests liegen noch in `src/domains/*/services/`
  - Tests liegen noch in `src/shared/services/__tests__/`
  - Müssen nach `tests/unit/`, `tests/integration/` verschoben werden
  
- [ ] **Test-Duplikate konsolidieren**
  - SpielerService Tests
  - SpielService Tests
  - BBB Tests
  - Analog zu Service Cleanup (30.10.)
  
- [ ] **Import-Pfade fixen**
  - Relative Imports → `@/` Imports
  - Nach BBB Service Cleanup (30.10.)
  
- [ ] **DB v7.0 Tests vervollständigen**
  - Team Liga Participation Tests
  - Migration v6→v7 Tests
  
- [ ] **GREEN Phase erreichen**
  - Alle Tests grün
  - Coverage ≥85%
  - Mutation Score ≥70%

**Siehe:** [TEST-MIGRATION-PLAN.md](../../testing/TEST-MIGRATION-PLAN.md)

---

## 🚧 Phase 2: Einsatzplanung & Live Game (Aktiv Q4 2025)

**Geschätzter Aufwand:** 6-8 Wochen  
**Ziel:** DBB-konforme Einsatzplanung für Minibasketball

### Features

#### 2.1 Einsatzplanung-Editor 🎯 PRIORITÄT
- [ ] **8-Achtel-Editor**
  - UI für Einsatzplanung pro Spiel
  - Drag & Drop für Spieler-Zuordnung
  - Achtel-Zuordnung (1-8)
  - Positionswahl (Guard, Forward, Center)
  - Visuelles Spielfeld-Layout
  
- [ ] **DBB-Minibasketball-Regelvalidierung**
  - ✅ Mindestens 2 Achtel spielen (jeder Spieler)
  - ✅ Mindestens 2 Achtel Pause (jeder Spieler)
  - ✅ Balance-Prüfung (±1 Achtel zwischen Spielern)
  - ⚠️ Warnings bei Regelverstößen
  - 📊 Einsatzzeit-Statistik pro Spieler
  
- [ ] **Spieler-Bewertungen Integration**
  - 9-Skill-System in Einsatzplanung einbeziehen
  - Team-Score-Berechnung pro Achtel
  - Optimierungs-Vorschläge basierend auf Skills
  - Balance zwischen starken/schwächeren Spielern
  
- [ ] **Ersatz-Vorschläge**
  - Beste Alternative bei Spieler-Ausfall
  - Skill-basierte Empfehlungen
  - Berücksichtigung bisheriger Einsatzzeit
  - "Was-Wäre-Wenn" Simulator

#### 2.2 Live Game Management
- [ ] **Timer & Tracking**
  - Spieluhr (4x 10 Min Viertel)
  - Achtel-Timer (jeweils 5 Min)
  - Auto-Wechsel-Hinweise
  - Pause-Timer
  
- [ ] **Schnelle Wechsel**
  - One-Click Substitution
  - Wechsel-Historie
  - Nächster-Spieler-Vorschlag
  - Notfall-Modus (bei Verletzung)
  
- [ ] **Spiel-Statistiken (Basic)**
  - Punkte-Erfassung (einfach)
  - Fouls-Tracking
  - Einsatzzeit pro Spieler
  - Wechsel-Log

#### Tech Stack Additions
- React DnD / dnd-kit für Drag & Drop
- Timer-Management mit Web Workers
- Lokale Benachrichtigungen (PWA)

**Meilensteine:**
- **v1.3.0** (Ende November): 8-Achtel-Editor + DBB-Regelvalidierung
- **v1.4.0** (Mitte Dezember): Spieler-Bewertungen Integration + Ersatz-Vorschläge
- **v1.5.0** (Ende Dezember): Live Game Timer + Schnelle Wechsel

---

## 🔮 Phase 3: Spieltag & Analysen (Q1 2026)

**Geschätzter Aufwand:** 6-8 Wochen  
**Ziel:** Vollständiges Spieltag-Management mit Analysen

### 3.1 Erweiterte Spieltag-Features

- [ ] **Erweiterte Statistiken**
  - Detaillierte Punkte-Erfassung (Spieler-Level)
  - Rebounds, Assists, Steals (optional)
  - Shot-Chart (Wurf-Positionen)
  - Plus/Minus pro Spieler
  
- [ ] **Team-Performance-Tracking**
  - Performance-Score pro Achtel
  - Effektivste Kombinationen
  - Schwachstellen-Analyse
  - Trend-Erkennung

- [ ] **PDF-Export**
  - Spielbericht (DBB-konform)
  - Einsatzplan mit Zeiten
  - Statistiken & Grafiken
  - Team-Sheet für Schiedsrichter

### 3.2 Benchmark & Gegner-Analyse

- [ ] **Benchmark-Analysen**
  - Vergleich mit Liga-Durchschnitt
  - Gemeinsame Gegner-Analyse
  - Trend-Analysen über Saison
  - Stärken/Schwächen-Profil
  
- [ ] **Gegner-Vorbereitung**
  - Gegner-Statistiken aus vergangenen Spielen
  - Spieler-Profile (aus BBB-API)
  - Empfohlene Taktik-Anpassungen
  - Scouting-Notizen

**Meilensteine:**
- **v2.0.0** (Ende Januar): Erweiterte Statistiken + PDF-Export
- **v2.1.0** (Ende Februar): Benchmark-Analysen + Gegner-Vorbereitung

---

## 🎓 Phase 4: Training & Langzeit-Analysen (Q2 2026)

**Geschätzter Aufwand:** 6-8 Wochen  
**Ziel:** Training-Tracking & Spieler-Entwicklung

### 4.1 Training-Management

- [ ] **Training-Tracking**
  - Anwesenheit erfassen
  - Übungen dokumentieren (aus Katalog)
  - Trainings-Schwerpunkte definieren
  - Fortschritt pro Spieler tracken
  
- [ ] **Trainingspläne**
  - Wochenplan erstellen
  - Saison-Periodisierung
  - Individuelle Trainings-Ziele
  - Automatische Erinnerungen

### 4.2 Performance-Metriken & Entwicklung

- [ ] **Spieler-Entwicklung**
  - Skill-Entwicklung über Zeit
  - Vergleich Saison-Anfang/Ende
  - Einsatzzeit-Entwicklung
  - Individuelles Feedback-System
  
- [ ] **Team-Performance**
  - Saison-Statistiken
  - Performance-Trends
  - Stärken-Schwächen-Matrix
  - Ziel-Erreichung-Tracking

### 4.3 Export & Reports

- [ ] **Daten-Export**
  - CSV-Export (alle Daten)
  - Excel-Reports mit Grafiken
  - JSON-Export für Backup
  - Saison-Abschluss-Report
  
- [ ] **Consent-Management (Scouting-Domain)**
  - Consent-Dialog für eigene Spieler
  - Export-Flow mit Eltern-Zustimmung
  - Automatischer Cleanup fremder Spieler-Daten
  - DSGVO-konformes Lösch-Management

**Meilensteine:**
- **v2.2.0** (Ende März): Training-Tracking + Trainingspläne
- **v2.3.0** (Ende April): Spieler-Entwicklung + Team-Performance
- **v2.4.0** (Ende Mai): Daten-Export + Consent-Management

---

## 🚀 Phase 5: Advanced Features (Q3 2026+)

**Status:** Konzeptphase

### Potenzielle Features (Priorisierung offen)

- [ ] **Multi-Saison-Management**
  - Saison-Archive
  - Vergleich über mehrere Saisons
  - Spieler-Karriere-Tracking
  
- [ ] **Verein-weite Analysen**
  - Mehrere Teams eines Vereins vergleichen
  - Verein-Dashboard
  - Spieler-Pool-Management
  
- [ ] **Cloud-Sync (Optional)**
  - Geräte-übergreifende Synchronisation
  - Team-Backup in Cloud
  - Shared Access für Co-Trainer
  
- [ ] **Video-Integration**
  - Video-Links zu Spielen
  - Video-Analyse-Notizen
  - Highlight-Clips verlinken
  
- [ ] **Advanced Analytics**
  - Machine Learning für Lineup-Optimierung
  - Vorhersage von Spiel-Ausgängen
  - Spieler-Potential-Schätzung

---

## 📊 Prioritäten-Matrix

### Must Have (P0) - 2025/2026
1. **Einsatzplanung mit DBB-Regeln** (Phase 2.1) - Q4 2025
2. **Live Game Timer** (Phase 2.2) - Q4 2025
3. **PDF-Export** (Phase 3.1) - Q1 2026
4. **Training-Tracking** (Phase 4.1) - Q2 2026

### Should Have (P1) - 2026
5. **Erweiterte Statistiken** (Phase 3.1) - Q1 2026
6. **Benchmark-Analysen** (Phase 3.2) - Q1 2026
7. **Spieler-Entwicklung** (Phase 4.2) - Q2 2026
8. **Consent-Management** (Phase 4.3) - Q2 2026

### Nice to Have (P2) - 2026+
9. **Multi-Saison-Management** (Phase 5) - Q3 2026
10. **Cloud-Sync** (Phase 5) - Q3 2026
11. **Video-Integration** (Phase 5) - Q4 2026
12. **Advanced Analytics** (Phase 5) - Q4 2026

---

## 🎯 Akzeptanz-Kriterien pro Phase

### Phase 2: Einsatzplanung
- ✅ Trainer kann Einsatzplan für 8 Achtel erstellen
- ✅ System validiert DBB-Minibasketball-Regeln
- ✅ Warnings bei Regelverstößen
- ✅ Spieler-Bewertungen fließen in Vorschläge ein
- ✅ Ersatz-Vorschläge bei Ausfall funktionieren
- ✅ Live Timer funktioniert offline
- ✅ Wechsel-Hinweise erscheinen rechtzeitig

### Phase 3: Spieltag & Analysen
- ✅ Statistiken können während Spiel erfasst werden
- ✅ PDF-Export ist DBB-konform
- ✅ Benchmark zeigt gemeinsame Gegner
- ✅ Gegner-Profile aus BBB-API verfügbar
- ✅ Alle Features offline verfügbar

### Phase 4: Training & Entwicklung
- ✅ Trainer kann Trainings-Anwesenheit erfassen
- ✅ Übungen aus Katalog wählbar
- ✅ Spieler-Skill-Entwicklung visualisiert
- ✅ Saison-Report generierbar
- ✅ Consent-Workflow DSGVO-konform
- ✅ Daten-Export funktioniert vollständig

---

## 🚧 Abhängigkeiten & Blocker

### Phase 2 Blocker
- ✅ DB v7.0 Migration abgeschlossen
- ✅ BBBSyncService stabil
- ⏳ UI/UX Design für 8-Achtel-Editor
- ⏳ Drag & Drop Library evaluiert

### Phase 3 Blocker
- ⏳ Phase 2 abgeschlossen
- ⏳ PDF-Library evaluiert (jsPDF vs. PDFKit)
- ⏳ BBB-API Spieler-Daten-Struktur dokumentiert

### Phase 4 Blocker
- ⏳ Phase 2 & 3 abgeschlossen
- ⏳ Übungs-Katalog definiert
- ⏳ DSGVO-Consent-Texte finalisiert

---

## 📝 Anmerkungen

### Scope-Änderungen
- **Multi-Team Support** wurde von Phase 5 in Phase 1 vorgezogen (bereits implementiert)
- **Simplified Onboarding** wurde zusätzlich implementiert (lokale Alternative)
- **DB v7.0** (Team Liga Participation) wurde vorgezogen für Multi-Saison-Support

### Nicht im Scope
- ❌ Kein Schiedsrichter-Modus
- ❌ Keine Ligaverwaltung (nur Trainer-Sicht)
- ❌ Keine Finanz-Features (Beiträge, Ausgaben)
- ❌ Keine Chat/Messaging-Features
- ❌ Keine Social-Media-Integration

### Design-Prinzipien
1. **Offline-First:** Alle Features müssen offline funktionieren
2. **DSGVO:** Datenschutz von Anfang an mitgedacht
3. **WCAG 2.0 AA:** Accessibility ist Pflicht
4. **Mobile-First:** Touch-optimierte UI
5. **TDD:** Test-Driven Development für alle Features

---

## 🔗 Verwandte Dokumentation

- [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) - Technische Implementation
- [MULTI-TEAM-SUPPORT-PLAN.md](./MULTI-TEAM-SUPPORT-PLAN.md) - Multi-Team Feature-Details
- [PROJECT-STATUS.md](../../development/PROJECT-STATUS.md) - Aktueller Entwicklungs-Status
- [CHANGELOG.md](./CHANGELOG.md) - Versions-Historie

---

**Nächster Meilenstein:** v1.3.0 (Ende November 2025) - 8-Achtel-Editor + DBB-Regelvalidierung  
**Langfrist-Ziel:** v2.4.0 (Ende Mai 2026) - Feature-Complete mit Training & Consent-Management
