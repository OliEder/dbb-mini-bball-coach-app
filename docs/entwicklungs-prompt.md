# Prompt für LLM-gestützte Entwicklung

## Projekt-Kontext
- PWA mit Service Worker & Offline-Funktionalität (IndexedDB)
- Dezentrale Datenhaltung ohne Nutzer-Accounts
- Öffentliche DBB-Ligadaten (einwilligungsfrei)
- Temporäre Scouting-Daten fremder Spieler (Automatischer Cleanup je nach Altersklasse ToDO: Logik definieren vor Implementation)
- Scouting-Daten eigener Spieler: optionaler Export mit Consent (Eltern/Volljährige)
- Domain-Driven Design, Layered Architecture
- WCAG 2.0 AA Accessibility
- DSGVO-konform: Consent, Datenminimierung, Löschung

## Entwicklungs-Anforderungen
### TDD & Test-Strategie
1. **Unit Tests (RED-GREEN-REFACTOR)**
   - Domain-Entities & Metriken
   - Consent-Dialog-Logik
   - Cleanup-Job (temporäre Daten)
   - Service Worker Caching & Offline-Features

2. **Integration Tests**
   - Layer-Interaktionen: Application ↔ Domain ↔ Infrastructure
   - IndexedDB CRUD & optional Verschlüsselung
   - API-Endpunkte: Export-Flow
   - Authorization: Scouter/Trainer-Rollen

3. **Contract Tests**
   - OpenAPI-Spec für Export-Endpunkt
   - Consumer-Driven Contract Tests gegen Spec

4. **E2E Tests**
   - **Temporärer Daten-Workflow**: Automatische Löschung fremder Spieler nach Saisonende
   - **Export-Flow**: Consent-Dialog, Paket-Generierung, Download, Löschung beim Scouter
   - **Rollen-Workflows**: Scouter/Trainer-seitige UI
   - **Offline**: vollständige Journeys ohne Netzwerk

5. **Visual Regression**
   - Consent-Modals, Export-Dialoge, Dashboard im Responsive Design

6. **Mutation Tests**
   - Scouting-Business-Logik & Cleanup-Job auf Edge Cases prüfen

7. **Security Tests**
   - OWASP ZAP Scan
   - CSP/HSTS/TLS-Header-Validierung
   - IndexedDB-Verschlüsselung prüfen

8. **Performance & Accessibility**
   - Core Web Vitals: LCP<2.5s, FID<100ms, CLS<0.1
   - axe-core: WCAG AA Violations = 0

## CI/CD Quality Gates
- Unit Coverage ≥85%, Mutation Score ≥70%
- Alle Integration & Contract Tests grün
- Keine High/Critical Findings im Security Scan
- 0 Accessbility Violations (axe-core)
- Performance-Budgets eingehalten

## Vorgehen bei AI-Code-Generierung
1. Schreibe zuerst den fehlenden Test (RED)
2. Implementiere Code zum Bestehen des Tests (GREEN)
3. Refactore, Tests müssen grün bleiben (REFACTOR)
4. Aktualisiere OpenAPI-Spec vor Änderungen am Export-Endpunkt
5. Dokumentiere Datenschutzerklärung & Consent-Mechanismen
6. Integriere axe-core-Checks in generierten UI-Code
7. Prüfe Cleanup-Job auch offline
8. Bei neuen Features (Scouting-Erweiterung, Trainer-Übergabe) Tests frühzeitig anpassen

## Struktur der Tests
```
tests/
├── unit/
├── integration/
├── contract/
├── e2e/
├── visual/
├── security/
├── performance/
└── accessibility/
```

**Hinweis:** Zukünftige Scouting-Funktionen und Datenübergabe an Folgetrainer sollten modular implementiert und in Test-Konzept sowie CI/CD-Pipeline frühzeitig integriert werden.