# Test-Konzept für PWA mit dezentraler IndexedDB und zukünftigen Scouting-Features

## 1. Überblick
Dieses Test-Konzept deckt folgende Anforderungen ab:

- Dezentrale Datenhaltung in IndexedDB (keine Nutzer-Accounts)
- Öffentliche DBB-Ligadaten (einwilligungsfrei)
- Temporäre Scouting-Daten fremder Spieler (bis Saisonende/Altersklasse)
- Scouting-Daten eigener Spieler: optionaler Export mit Consent (Eltern/Volljährige)
- Domain-Driven Design (Layered Architecture)
- WCAG 2.0 AA Barrierefreiheit
- DSGVO-konform (Consent, Datenminimierung, Löschung)

Zukünftige Features wie Scouting-Erweiterungen oder Datenübergabe an Folgetrainer sind berücksichtigt und Hinweise für eine datensparsame Umsetzung enthalten.

## 2. Test-Pyramiden-Verteilung
- **Unit Tests**: 60% (Domain-Logik, Consent-Dialog, Cleanup-Job)
- **Integration Tests**: 20% (Layer-Interaktionen, IndexedDB, API)
- **End-to-End-Tests**: 10% (Export-Flow, Rollen-Workflows, Offline)
- **Visual/Security/Performance/Accessibility**: 10%

## 3. CI/CD-Pipeline

**Pre-Commit:**
- Unit Tests für Domain-Entities, Consent-Dialog, Cleanup-Job
- Mutation Tests (Scouting-Business-Rules, Cleanup)

**Pull Request:**
- Integration Tests (IndexedDB CRUD, Cleanup-Job, API-Endpunkte)
- Contract Tests gegen OpenAPI-Spec
- Security Scan (OWASP ZAP)

**Pre-Deployment:**
- End-to-End-Tests:
  - Temporärer Daten-Workflow (Saisonende)
  - Export-Flow mit Consent-Dialog
  - Rollen-Workflows (Scouter/Trainer)
  - Offline-Szenarien persönlicher Daten
- Visual Regression (Percy/Chromatic)
- Accessibility Audit (axe-core)
- Performance Tests (Lighthouse CI)

**Post-Deployment:**
- Smoke Tests (Cleanup-Job, Export-Flow)
- Real User Monitoring (Privacy & Performance)

## 4. Test-Kategorien

### 4.1 Unit Tests
- **Domain-Entities & Aggregate**: Scouting-Daten, Metriken
- **Consent-Dialog**: UI-Logik, Button-Interaktionen
- **Cleanup-Job**: zeitgesteuerte Löschung fremder Spieler
- **Service Worker**: Caching-Logik, Offline-Features

### 4.2 Integration Tests
- **Layered Architecture**: Application ↔ Domain ↔ Infrastructure
- **IndexedDB**: CRUD-Operationen, verschlüsselte Speicherung
- **API-Endpunkte**: Export, (optional) externe Scouting-API
- **Authorization**: Scouter/Trainer-Zugriff

### 4.3 Contract Tests
- **OpenAPI-Spec**: Export- und Lösch-Endpunkte
- **Consumer-Driven Contracts**: PWA definiert Schema, Test schlägt bei Abweichungen fehl

### 4.4 End-to-End-Tests
- **Consent-Flow**: Einwilligung zur Datenweitergabe
- **Export-Flow**: Datenpaket generieren, Download, Löschung beim Scouter
- **Temporärer Daten-Workflow**: automatische Bereinigung nach Saisonende
- **Rollen-Workflows**: nur Scouter/Trainer sehen entsprechende UI
- **Offline**: vollständige User-Journeys offline

### 4.5 Visual Regression Tests
- **UI-Komponenten**: Consent-Modals, Export-Dialoge, Dashboard
- **Responsive Design**: verschiedene Viewports

### 4.6 Mutation Tests
- **Scouting-Business-Rules**: Validierung Metriken, Edge Cases
- **Cleanup-Logik**: korrekte Auslösung und Löschung

### 4.7 Security Tests
- **OWASP ZAP**: API + Frontend
- **CSP, HSTS, TLS**: Header-Validierung
- **IndexedDB-Verschlüsselung**: Test auf fehlende Verschlüsselung

### 4.8 Performance & Accessibility
- **Core Web Vitals**: LCP, FID, CLS
- **axe-core**: WCAG AA Violations = 0

## 5. Hinweise für spätere Features
- **Erweiterte Scouting-Metriken**: Schema-Versionierung, Mutation Tests bei Schema-Änderungen
- **Übergabe an Folgetrainer**: modularen Export-Service implementieren
- **Data Retention Policies**: Cleanup-Job an neue Altersklasse-Regeln anpassen
- **Offline-Synchronisation**: Conflict Resolution Strategies
