# Basketball PWA - Projekt-Dokumentation

**Letzte Aktualisierung:** 12. Oktober 2025  
**Schema-Version:** v4.0

---

## 📚 Übersicht

Diese Dokumentation enthält alle projektrelevanten Dokumente der Basketball PWA, strukturiert nach Bereichen.

---

## 📂 Dokumentationsstruktur

### `/requirements/` - Anforderungen & Spezifikationen
Enthält alle funktionalen und nicht-funktionalen Anforderungen an die Applikation.

**Hauptdokumente:**
- `basketball-pwa-spec-v2.md` - **Hauptspezifikation** (v2.0)
- `Anforderungen-Team-Management.md` - Umfassende Anforderungserhebung für U10

### `/architecture/` - System-Architektur
Technische Architektur, Datenbank-Schema und Diagramme.

**Hauptdokumente:**
- `basketball-erd.mermaid` - Entity-Relationship-Diagramm
- `datenbank-schema-update_v3.md` - Schema v3.0 Dokumentation
- `ANALYSE-Schema-Änderungen.md` - Schema-Änderungs-Analysen
- `datenstruktur.puml` - PlantUML Datenstruktur

### `/userflows/` - User Flows & Prozesse
Beschreibungen aller Benutzer-Workflows und Prozessabläufe.

**Hauptdokumente:**
- `app-start_onboarding_flow_v3.1.md` - Onboarding-Prozess (BBB-Integration)
- `App-Start-Flows.md` - Visuelle Mermaid-Diagramme
- `projekt-zusammenfassng-userflow.md` - Projekt-Kurzfassung

### `/archive/` - Archiv
Alte Versionen und abgelöste Dokumente.

---

## 🚀 Quick Start

### Für neue Team-Mitglieder
1. **Start:** Lies `projekt-zusammenfassng-userflow.md` für Überblick
2. **Anforderungen:** `requirements/basketball-pwa-spec-v2.md`
3. **Flows:** `userflows/app-start_onboarding_flow_v3.1.md`
4. **Architektur:** `architecture/basketball-erd.mermaid`

### Für Entwickler
1. **Schema:** `architecture/datenbank-schema-update_v3.md`
2. **Code:** Siehe `../basketball-app/STATUS.md`
3. **Prototypen:** Siehe `../basketball-app/prototypes/README.md`

---

## 📋 Dokumenten-Index

### Requirements (2 Dokumente)
| Dokument | Beschreibung | Version | Status |
|----------|--------------|---------|--------|
| basketball-pwa-spec-v2.md | Hauptspezifikation | v2.0 | ✅ Aktuell |
| Anforderungen-Team-Management.md | U10 Anforderungen | - | ✅ Aktuell |

### Architecture (4 Dokumente)
| Dokument | Beschreibung | Format | Status |
|----------|--------------|--------|--------|
| basketball-erd.mermaid | ER-Diagramm | Mermaid | ✅ Aktuell |
| datenbank-schema-update_v3.md | Schema v3.0 | Markdown | ✅ Aktuell |
| ANALYSE-Schema-Änderungen.md | Schema-Analysen | Markdown | ✅ Aktuell |
| datenstruktur.puml | PlantUML Diagramm | PlantUML | ⚠️ Prüfen |

### Userflows (3 Dokumente)
| Dokument | Beschreibung | Version | Status |
|----------|--------------|---------|--------|
| app-start_onboarding_flow_v3.1.md | Onboarding-Prozess | v3.1 | ✅ Aktuell |
| App-Start-Flows.md | Mermaid Diagramme | - | ✅ Aktuell |
| projekt-zusammenfassng-userflow.md | Projekt-Übersicht | - | ✅ Aktuell |

### Archive (1+ Dokumente)
| Dokument | Beschreibung | Archiviert |
|----------|--------------|------------|
| basketball-pwa-spec-v1.md | Alte Spezifikation | 12.10.2025 |

---

## 🔄 Versionierung

### Spezifikationen
- **v2.0** (Aktuell) - Erweitert mit DSGVO, BBB-Integration
- **v1.0** (Archiviert) - Basis-Spezifikation

### Datenbank-Schema
- **v4.0** (In Entwicklung) - Compound-Indizes, Performance-Optimierung
- **v3.0** (Dokumentiert) - 24 Tabellen, Multi-Team-Support
- **v2.x, v1.x** (Siehe Archive)

### User Flows
- **v3.1** (Aktuell) - Einzel-URL BBB-Import
- **v3.0** - Basis Onboarding

---

## 🛠️ Mitarbeit

### Neue Dokumentation erstellen
Platziere neue Dokumente im passenden Unterordner:
- Requirements → `/requirements/`
- Architektur → `/architecture/`
- User Flows → `/userflows/`

### Dokumente aktualisieren
1. Versionsnummer hochzählen (wenn relevant)
2. Alte Version nach `/archive/` verschieben
3. Dieses README aktualisieren

### Konventionen
- **Dateinamen:** `kebab-case.md` (klein, mit Bindestrichen)
- **Versionierung:** `dokument-name_v{major}.{minor}.md`
- **Mermaid-Diagramme:** `.mermaid` Extension
- **PlantUML-Diagramme:** `.puml` Extension

---

## 📞 Anmerkungen

### Zu prüfen
- `datenstruktur.puml` - Überschneidung mit `basketball-erd.mermaid`?

### Geplante Ergänzungen
- Test-Strategie Dokumentation
- BBB-Parser API Dokumentation
- Deployment-Guide
- User-Handbuch

---

## 🔗 Verwandte Dokumente

- **Haupt-Index:** `../DOCUMENTATION-INDEX.md`
- **Projekt-Status:** `../basketball-app/STATUS.md`
- **Prototypen:** `../basketball-app/prototypes/README.md`
- **Bereinigungsprotokoll:** `../BEREINIGUNG-PROTOKOLL.md`

---

**Navigation:**
- [← Zurück zur Projektübersicht](../README.md)
- [Haupt-Index](../DOCUMENTATION-INDEX.md)
- [Basketball-App →](../basketball-app/)
