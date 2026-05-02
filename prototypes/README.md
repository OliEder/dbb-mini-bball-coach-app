# Basketball PWA - Prototypes

**Letzte Aktualisierung:** 12. Oktober 2025

---

## 🧪 Übersicht

Dieser Ordner enthält Prototypen und experimentelle Komponenten, die **nicht** Teil des Production-Builds sind. Diese Dateien dienen der Entwicklung, Visualisierung und Testing.

---

## 📋 Verfügbare Prototypen

### 1. `schema-designer.tsx` ⭐
**Status:** ✅ Aktuell (v4.0)  
**Zweck:** Interaktiver Schema-Designer zur Visualisierung der Datenbank-Struktur

**Features:**
- Alle 24 Tabellen des v4.0 Schemas
- Filterung nach Kategorien (Kern, BBB, Erweiterungen)
- Anzeige von Pflichtfeldern, Foreign Keys, Compound-Indizes
- Dokumentation entfernter Felder (DSGVO-Optimierung)
- Visualisierung der Beziehungen

**Verwendung:**
```bash
# In React-App einbinden zum Testen
import SchemaDesigner from './prototypes/schema-designer';
```

**Updates:**
- v4.0 (12.10.2025): SPIELPLAN umstrukturiert, LIGA_ERGEBNISSE + LIGA_TABELLE hinzugefügt
- v3.0: Basis-Version mit 22 Tabellen

---

### 2. `pwa-mvp.tsx` 
**Status:** 🚧 Legacy/Referenz  
**Zweck:** Früher MVP-Prototyp der PWA

**Hinweis:** Dieser Prototyp ist veraltet und dient nur als Referenz. Die aktuelle Implementierung befindet sich in `/src/`.

---

## 🎯 Zweck der Prototypen

### Entwicklung
- Schnelle Iteration ohne Production-Impact
- Experimentieren mit neuen Features
- UI/UX Konzepte visualisieren

### Dokumentation
- Lebende Dokumentation der Architektur
- Interaktive Schema-Exploration
- Onboarding-Hilfe für neue Entwickler

### Testing
- Isoliertes Testen von Konzepten
- Performance-Benchmarks
- A/B Testing von Ansätzen

---

## 🚫 Wichtige Hinweise

### **Diese Dateien sind NICHT im Production-Build!**

**Warum?**
- ❌ Keine optimierten Production-Komponenten
- ❌ Können große Dependencies enthalten
- ❌ Nicht vollständig getestet
- ❌ Experimenteller Code

**Verwendung:**
- ✅ Während der Entwicklung
- ✅ Für Visualisierung & Dokumentation
- ✅ Als Referenz für Implementierung
- ❌ NIEMALS in Production deployen

---

## 📝 Neue Prototypen hinzufügen

### Konventionen
- **Dateinamen:** `kebab-case.tsx` oder `PascalCase.tsx`
- **Kommentare:** Zweck und Status dokumentieren
- **Versionierung:** Optional, wenn sinnvoll

### Template für neue Prototypen
```typescript
/**
 * Prototype: [Name]
 * 
 * Status: [🚧 In Entwicklung | ✅ Stabil | 📦 Archiviert]
 * Version: [optional]
 * Erstellt: [Datum]
 * 
 * Zweck:
 * [Beschreibung des Prototyps]
 * 
 * Features:
 * - [Feature 1]
 * - [Feature 2]
 * 
 * WICHTIG: Nicht für Production!
 */

import React from 'react';

export default function PrototypeName() {
  return <div>Prototype Content</div>;
}
```

---

## 🔄 Lifecycle

### Prototype → Production
Wenn ein Prototyp Production-reif ist:

1. ✅ **Code Review** durchführen
2. ✅ **Tests** schreiben (Unit + PACT)
3. ✅ **WCAG 2.0 AA** Compliance prüfen
4. ✅ **Performance** optimieren
5. ✅ Code nach `/src/domains/` verschieben
6. ✅ Prototyp hier archivieren oder löschen

### Archivierung
Alte Prototypen verschieben nach:
```
/prototypes/
  └── archive/
      └── [prototype-name].tsx
```

---

## 🛠️ Verwendung im Development

### Schema Designer starten
```bash
# In der basketball-app
npm run dev

# Schema Designer in App einbinden (temporär)
# In App.tsx oder einer Test-Route:
import SchemaDesigner from './prototypes/schema-designer';
```

### Als Standalone testen
```bash
# Erstelle temporäre Test-Seite
# z.B. in src/test-prototype.tsx
import SchemaDesigner from './prototypes/schema-designer';

function TestPage() {
  return <SchemaDesigner />;
}
```

---

## 📚 Verwandte Dokumente

- **Datenbank-Schema:** `../docs/architecture/datenbank-schema-update_v3.md`
- **ER-Diagramm:** `../docs/architecture/basketball-erd.mermaid`
- **Projekt-Status:** `../STATUS.md`
- **Dokumentations-Index:** `../../DOCUMENTATION-INDEX.md`

---

## 🔗 Navigation

- [← Zurück zur App](../)
- [Documentation →](../../docs/)
- [Haupt-Index](../../DOCUMENTATION-INDEX.md)

---

**Letzte Änderungen:**
- 12.10.2025: Ordner erstellt, schema-designer.tsx und pwa-mvp.tsx verschoben
- 12.10.2025: schema-designer.tsx auf v4.0 aktualisiert
