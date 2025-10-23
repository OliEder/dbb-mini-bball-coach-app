# 📚 Basketball Team Manager - Dokumentation

**Single Source of Truth für alle Projekt-Dokumentation**

---

## 🎯 Wichtigste Dokumente

### Für neue Chat-Sessions
**[development/QUICKSTART.md](./development/QUICKSTART.md)** 🚀  
Template und Best Practices für Chat-Wechsel

### Vollständige Projekt-Doku
**[development/PROJECT-STATUS.md](./development/PROJECT-STATUS.md)** ⭐  
Architektur, implementierter Stand, bekannte Issues, nächste Schritte

### Technische Entscheidungen
**[development/TECHNICAL-DECISIONS.md](./development/TECHNICAL-DECISIONS.md)** 🧠  
Alle Technical Decision Records (TDRs)

### Test-Status & Analyse
**[development/TEST-STATUS.md](./development/TEST-STATUS.md)** 🧪  
Test-Übersicht, Fehleranalyse, Lösungsansätze

---

## 📁 Ordnerstruktur

```
docs/
├── README.md                     ← Diese Datei (Übersicht)
│
├── development/                  ← Aktive Entwicklungs-Doku
│   ├── PROJECT-STATUS.md             ⭐ Hauptdokumentation
│   ├── QUICKSTART.md                 🚀 Chat-Template
│   ├── TECHNICAL-DECISIONS.md        🧠 TDRs
│   ├── TEST-STATUS.md                🧪 Test-Analyse
│   ├── DBB-API-EVALUATION.md         📡 API-Bewertung
│   ├── DEV-TOOLS.md                  🛠️ Entwickler-Tools
│   └── ONBOARDING-FLOW-V2.md         📋 Onboarding-Design
│
├── bugfixes/                     ← Bug-Fix Dokumentation
│   ├── README.md                     📋 Übersicht & Template
│   └── 2025-10-23-BBB-SYNC-*.md      🐛 Bug-Fix Details
│
└── archive/                      ← Alte/veraltete Dokumente
    └── [Historische Dokumente]
```

---

## 🚀 Quick Navigation

### Ich möchte...

#### ...in einem neuen Chat weitermachen
→ [development/QUICKSTART.md](./development/QUICKSTART.md)

#### ...verstehen wie die App aufgebaut ist
→ [development/PROJECT-STATUS.md](./development/PROJECT-STATUS.md)

#### ...wissen warum Tech-Entscheidung X getroffen wurde
→ [development/TECHNICAL-DECISIONS.md](./development/TECHNICAL-DECISIONS.md)

#### ...die DBB-API verstehen
→ [development/DBB-API-EVALUATION.md](./development/DBB-API-EVALUATION.md)

#### ...die Test-Strategie verstehen
→ [../tests/README.md](../tests/README.md)

#### ...den aktuellen Test-Status & Fehleranalyse sehen
→ [development/TEST-STATUS.md](./development/TEST-STATUS.md)

#### ...behobene Bugs & Lessons Learned sehen
→ [bugfixes/](./bugfixes/) - Bug-Fix Dokumentation mit Prevention-Tipps

#### ...ein neues Feature mit TDD entwickeln
→ [development/QUICKSTART.md#tdd-workflow](./development/QUICKSTART.md#tdd-workflow)

---

## 📝 Dokumentations-Guidelines

### Neue Dokumente erstellen

1. **Entwicklungs-Doku** → `development/`
2. **Bug-Dokumentation** → `bugfixes/`
3. **Veraltete Doku** → `archive/`

### Naming Convention

```
THEMA-BESCHREIBUNG.md

Beispiele:
✅ ONBOARDING-FLOW-V2.md
✅ DBB-API-EVALUATION.md
✅ TECHNICAL-DECISIONS.md

❌ doc.md
❌ notes.txt
❌ temp-stuff.md
```

### Markdown-Format

```markdown
# Titel

**Datum:** [Datum]  
**Autor:** [Name/AI]  
**Status:** [🚧 In Arbeit / ✅ Fertig / ⚠️ Veraltet]

## Inhaltsverzeichnis
...

## Section
...
```

---

## 🗂️ Archivierung

Alte Dokumente werden nach `archive/` verschoben wenn:
- Nicht mehr aktuell
- Durch neue Version ersetzt
- Historischer Wert (nicht löschen!)

**Beispiel:**
```bash
mv docs/development/OLD-FEATURE.md docs/archive/2025-10-OLD-FEATURE.md
```

Präfix mit Datum: `YYYY-MM-FILENAME.md`

---

## 🔄 Updates

### Bei wichtigen Änderungen

1. **Update development/PROJECT-STATUS.md**
   - Implementierter Stand
   - Bekannte Issues
   - Nächste Schritte

2. **Bei Tech-Entscheidungen: TDR schreiben**
   - Template in TECHNICAL-DECISIONS.md
   - Context → Optionen → Entscheidung → Begründung

3. **README.md im Root aktualisieren**
   - Nur Wegweiser, keine Details!

---

## 🆘 Dokumentation nicht gefunden?

1. Suche in `development/` (aktuell)
2. Suche in `archive/` (historisch)
3. Prüfe ob im Root-Ordner (sollte nicht sein!)
4. Erstelle neue Doku in `development/`

---

## 📞 Wichtige Links

- [Projekt Root](../)
- [Source Code](../src/)
- [Tests](../tests/)
- [Development Docs](./development/)

---

**Letzte Aktualisierung:** 23. Oktober 2025  
**Maintainer:** AI-Assisted Development

---

💡 **Tipp:** Bookmark diese Datei für schnellen Zugriff auf alle Dokumentation!
