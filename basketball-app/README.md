# 🏀 Basketball Team Manager

**Version:** 2.0.0  
**Status:** 🚧 In Entwicklung

Progressive Web App für Basketball-Trainer zur Verwaltung von Teams, Scouting-Daten und Spielberichtsbögen.

---

## 📚 Dokumentation (Single Source of Truth)

**➡️ Alle Dokumentation in [`docs/`](./docs/) Ordner!**

### Für neue Chat-Sessions
👉 **[docs/development/QUICKSTART.md](./docs/development/QUICKSTART.md)** - Template für Chat-Wechsel

### Vollständige Projekt-Doku
👉 **[docs/development/PROJECT-STATUS.md](./docs/development/PROJECT-STATUS.md)** - Architektur, Stand, Next Steps

### Technische Entscheidungen
👉 **[docs/development/TECHNICAL-DECISIONS.md](./docs/development/TECHNICAL-DECISIONS.md)** - Alle TDRs

### Test-Dokumentation
👉 **[tests/README.md](./tests/README.md)** - Test-Strategie & Coverage

---

## 🚀 Quick Start

```bash
npm install                # Dependencies installieren
npm run dev                # Dev Server starten
npm run test:ui            # Tests im UI Mode
```

**Mehr Details:** [docs/development/QUICKSTART.md](./docs/development/QUICKSTART.md)

---

## 📁 Ordnerstruktur

```
docs/
├── development/           # Aktuelle Entwicklungs-Doku
│   ├── PROJECT-STATUS.md      ⭐ Hauptdokumentation
│   ├── QUICKSTART.md          🚀 Chat-Wechsel Template
│   └── TECHNICAL-DECISIONS.md 🧠 Tech-Entscheidungen
├── bugfixes/             # Bug-Fix Dokumentation
└── archive/              # Alte/veraltete Dokumente

src/
├── domains/              # Domain-Driven Design
└── shared/               # Shared Layer

tests/
├── unit/                 # Unit Tests
├── integration/          # Integration Tests
└── e2e/                  # End-to-End Tests
```

---

## 🎯 Aktueller Status

- ✅ ClubDataLoader Service implementiert
- ✅ Simplified Onboarding Flow implementiert  
- ✅ 65+ Tests geschrieben
- ⚠️ Tests laufen noch nicht alle grün (in Arbeit)

**Nächste Schritte:** [docs/development/PROJECT-STATUS.md#nächste-schritte](./docs/development/PROJECT-STATUS.md#nächste-schritte)

---

## 💡 Wichtig für Chat-Wechsel

Bei neuem Chat einfach sagen:

```
Lies bitte für Kontext:
- docs/development/QUICKSTART.md (Template + Links)
- docs/development/PROJECT-STATUS.md (Vollständige Doku)

Meine Aufgabe: [DEINE AUFGABE]
```

---

**Alle Details:** [docs/development/](./docs/development/)
