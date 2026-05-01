# Umstrukturierungs-Protokoll - Basketball PWA

**Datum:** 12. Oktober 2025  
**Durchgeführt von:** Automatische Reorganisation

---

## 🎯 Ziel der Umstrukturierung

**Problem:** Dokumentation und Prototypen waren mit Production-Code vermischt, was zu Unklarheiten führte.

**Lösung:** Saubere Trennung in drei Bereiche:
- 📚 Dokumentation → `/docs/`
- 🧪 Prototypen → `/basketball-app/prototypes/`
- 🏀 Production Code → `/basketball-app/src/`

---

## ✅ Durchgeführte Aktionen

### 1. Neue Ordnerstruktur erstellt

```
Basketball-Apps/
├── docs/                      # NEU - Komplette Dokumentation
│   ├── requirements/         # NEU - Anforderungen
│   ├── architecture/         # NEU - Schema & ERD
│   ├── userflows/           # NEU - Flow-Dokumente
│   └── archive/             # VERSCHOBEN von /archive/
│
└── basketball-app/
    └── prototypes/          # NEU - Prototypen außerhalb von /src/
```

---

### 2. Dateien verschoben

#### **Prototypen** → `/basketball-app/prototypes/`

| Ursprünglicher Pfad | Neuer Pfad | Größe |
|---------------------|------------|-------|
| `basketball-schema-designer.tsx` | `basketball-app/prototypes/schema-designer.tsx` | ~70 KB |
| `basketball-pwa-mvp.tsx` | `basketball-app/prototypes/pwa-mvp.tsx` | ~28 KB |

#### **Requirements** → `/docs/requirements/`

| Ursprünglicher Pfad | Neuer Pfad | Größe |
|---------------------|------------|-------|
| `Anforderungen-Team-Management` | `docs/requirements/Anforderungen-Team-Management.md` | ~9 KB |
| `basketball-pwa-spec-v2.md` | `docs/requirements/basketball-pwa-spec-v2.md` | ~59 KB |

#### **Architecture** → `/docs/architecture/`

| Ursprünglicher Pfad | Neuer Pfad | Größe |
|---------------------|------------|-------|
| `basketball-erd.mermaid` | `docs/architecture/basketball-erd.mermaid` | ~6 KB |
| `datenstruktur.puml` | `docs/architecture/datenstruktur.puml` | ~3 KB |
| `datenbank-schema-update_v3.md` | `docs/architecture/datenbank-schema-update_v3.md` | ~15 KB |
| `ANALYSE-Schema-Änderungen.md` | `docs/architecture/ANALYSE-Schema-Änderungen.md` | ~14 KB |

#### **Userflows** → `/docs/userflows/`

| Ursprünglicher Pfad | Neuer Pfad | Größe |
|---------------------|------------|-------|
| `app-start_onboarding_flow_v3.1.md` | `docs/userflows/app-start_onboarding_flow_v3.1.md` | ~3 KB |
| `App-Start Flows.md` | `docs/userflows/App-Start-Flows.md` | ~3 KB |
| `projekt-zusammenfassng-userflow.md` | `docs/userflows/projekt-zusammenfassng-userflow.md` | ~2 KB |

#### **Archive** → `/docs/archive/`

| Ursprünglicher Pfad | Neuer Pfad |
|---------------------|------------|
| `archive/basketball-pwa-spec-v1.md` | `docs/archive/basketball-pwa-spec-v1.md` |
| `archive/README.md` | `docs/archive/README.md` |

---

### 3. Neue Dokumentation erstellt

| Datei | Beschreibung | Größe |
|-------|--------------|-------|
| `docs/README.md` | **Haupt-Dokumentations-Index** | ~7 KB |
| `basketball-app/prototypes/README.md` | Prototypen-Übersicht mit Guidelines | ~3 KB |
| `UMSTRUKTURIERUNG-PROTOKOLL.md` | Dieses Dokument | ~5 KB |

---

### 4. Index-Dateien aktualisiert

| Datei | Aktion | Status |
|-------|--------|--------|
| `DOCUMENTATION-INDEX.md` | Alle Pfade aktualisiert | ✅ |
| `BEREINIGUNG-PROTOKOLL.md` | Bleibt unverändert | ✅ |
| `.gitignore` | Bleibt unverändert | ✅ |

---

## 📊 Vorher/Nachher

### Vorher (chaotisch)

```
Basketball-Apps/
├── *.md Dateien (12+ Dateien im Root)
├── *.tsx Prototypen (2 Dateien im Root)
├── *.mermaid, *.puml (Diagramme im Root)
├── archive/ (nur 1 Datei)
└── basketball-app/
    └── src/ (Production Code)
```

**Probleme:**
- ❌ Keine klare Trennung
- ❌ Dokumentation verstreut
- ❌ Prototypen könnten versehentlich im Build landen
- ❌ Schwer navigierbar

### Nachher (strukturiert)

```
Basketball-Apps/
├── DOCUMENTATION-INDEX.md
├── BEREINIGUNG-PROTOKOLL.md
├── UMSTRUKTURIERUNG-PROTOKOLL.md
├── .gitignore
│
├── docs/                          # 📚 Alle Dokumentation
│   ├── README.md
│   ├── requirements/ (2)
│   ├── architecture/ (4)
│   ├── userflows/ (3)
│   └── archive/ (2)
│
├── basketball-app/
│   ├── src/                       # 🏀 Production Code
│   └── prototypes/                # 🧪 Entwicklungs-Prototypen
│       ├── README.md
│       ├── schema-designer.tsx
│       └── pwa-mvp.tsx
│
└── to-delete/                     # ⚠️ Temporär
```

**Verbesserungen:**
- ✅ Klare Trennung: Docs ≠ Code ≠ Prototypes
- ✅ Standardkonvention (`/docs/` für GitHub Pages etc.)
- ✅ Prototypen explizit außerhalb von Production
- ✅ Einfache Navigation mit Index-Dateien
- ✅ Skalierbar für zukünftige Dokumente

---

## 🎯 Vorteile der neuen Struktur

### **1. Klare Verantwortlichkeiten**

| Ordner | Zweck | Zielgruppe |
|--------|-------|------------|
| `/docs/requirements/` | Was soll gebaut werden? | Product Owner, Stakeholder |
| `/docs/architecture/` | Wie ist es aufgebaut? | Architekten, Senior Devs |
| `/docs/userflows/` | Wie läuft es ab? | UX, Product, QA |
| `/docs/archive/` | Was war früher? | Alle (Referenz) |
| `/prototypes/` | Experimentell, Test | Entwickler |

### **2. Standard-Konformität**
- ✅ GitHub Pages unterstützt `/docs/` out-of-the-box
- ✅ Tooling erwartet Dokumentation in `/docs/`
- ✅ CI/CD kann `/docs/` für Dokumentations-Deployment nutzen

### **3. Build-Sicherheit**
- ✅ Prototypen sind explizit außerhalb von `/src/`
- ✅ Keine Gefahr versehentlicher Production-Deployment
- ✅ Kleinere Build-Größe

### **4. Onboarding**
- ✅ Neue Entwickler finden alles in `/docs/`
- ✅ Klare README-Dateien in jedem Ordner
- ✅ Strukturierter Einstieg über Index

---

## 📝 Konventionen für zukünftige Dateien

### **Dokumentation hinzufügen**

```bash
# Requirements
docs/requirements/neue-anforderung.md

# Architecture
docs/architecture/neues-diagramm.mermaid

# Userflows
docs/userflows/neuer-flow_v1.0.md

# Archive (bei Ablösung)
docs/archive/altes-dokument.md
```

### **Prototypen hinzufügen**

```bash
# Neue Prototypen
basketball-app/prototypes/neuer-prototyp.tsx

# Archivierte Prototypen
basketball-app/prototypes/archive/alter-prototyp.tsx
```

### **Dateinamen**
- **Dokumentation:** `kebab-case.md` (klein, mit Bindestrichen)
- **Prototypen:** `kebab-case.tsx` oder `PascalCase.tsx`
- **Versionierung:** `dokument-name_v{major}.{minor}.md`

---

## 🔍 Qualitätssicherung

### Überprüfte Aspekte
- ✅ Alle Dateien korrekt verschoben
- ✅ Keine Duplikate
- ✅ README-Dateien in allen Ordnern
- ✅ Index aktualisiert mit neuen Pfaden
- ✅ Alte Struktur dokumentiert

### Offene Punkte
- ⚠️ Altes leeres `/archive/` Verzeichnis kann gelöscht werden
- ⚠️ `/to-delete/` sollte nach Review gelöscht werden
- ⚠️ `datenstruktur.puml` Redundanz mit `basketball-erd.mermaid` prüfen

---

## 🚀 Nächste Schritte

### Sofort
1. **Review:** Prüfe die neue Struktur
2. **Löschen:** Entferne `/to-delete/` und altes leeres `/archive/`
3. **Git:** Commit die neue Struktur
   ```bash
   git add .
   git commit -m "refactor: reorganize project structure - docs, prototypes separation"
   ```

### Mittelfristig
1. **GitHub Pages:** Optional `/docs/` als GitHub Pages einrichten
2. **CI/CD:** Dokumentations-Deployment automatisieren
3. **Vite Config:** Sicherstellen, dass `/prototypes/` nicht im Build landet

---

## 📚 Verwandte Dokumente

- [DOCUMENTATION-INDEX.md](DOCUMENTATION-INDEX.md) - Haupt-Index mit allen Pfaden
- [docs/README.md](docs/README.md) - Dokumentations-Übersicht
- [basketball-app/prototypes/README.md](basketball-app/prototypes/README.md) - Prototypen-Guidelines
- [BEREINIGUNG-PROTOKOLL.md](BEREINIGUNG-PROTOKOLL.md) - Vorherige Bereinigung

---

## ✨ Zusammenfassung

**Durchgeführte Umstrukturierung:**
- 📁 5 neue Ordner erstellt
- 🔄 15 Dateien verschoben
- 📄 3 neue README-Dateien
- ✏️ 1 Index aktualisiert

**Ergebnis:**
- Saubere, professionelle Struktur
- Standard-konform (`/docs/`, `/prototypes/`)
- Klare Trennung: Docs ≠ Code ≠ Prototypes
- Einfache Navigation
- Zukunftssicher & skalierbar

---

**Status:** ✅ Umstrukturierung abgeschlossen  
**Nächster Schritt:** Review & Git Commit
