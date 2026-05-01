# Basketball PWA - Projekt Kurzfassung

**Stand:** Oktober 2025 17:13

---

## Projektüberblick

- Entwicklung einer Progressive Web App (PWA) für Basketball Trainer und Teams
- Fokus auf Einsatzplanung, Spieler- und Trikotmanagement, Spielvorbereitung und Analyse
- Integration mit deutschen Basketball-Verband (basketball-bund.net, kurz BBB)

## Bisherige Fortschritte

- Detaillierte Spezifikationen für Onboarding und App-Startprozess
- Multi-Team-Support, Pflicht-CSV-Importe für Spieler und Trikots
- Automatischer Cloud-ähnlicher Sync (lokal/offline-first) mit Spielplänen, Tabellen und Ergebnissen
- Benchmark-Analyse gegen gemeinsame Gegner zur Spielvorbereitung
- Robustheit durch Spielnummer-basierte Sync-Updates
- Lokale Datenhaltung für Offline-Fähigkeit und DSGVO-Konformität

## Wichtige Entscheidungen

- Nur eine einzige URL mit `liga_id` wird eingegeben, egal ob Spielplan-, Tabellen- oder Ergebnislink
- App extrahiert automatisch die Liga-ID und baut alle drei wesentlichen URLs ab
- Updates bei jedem App-Start (wenn online) zur Synchronisation
- Teams haben individuelle Kader und Trikots

## Dokumente

- basketball-pwa-app-start-flow.md  
  Enthält vollständigen Ablauf von Onboarding bis Dashboard

- basketball-pwa-flows.md  
  Diverse Flow-Diagramme (Mermaid) zu App-Start, Updates und CSV-Import

- basketball-pwa-schema-update-v3.md  
  Datenbank-Schema und Migrationspfade für Spielplan, Ergebnisse, Tabellen

## Nächste Schritte

- Vorbereitung der Spielvorbereitung und Spieltag-Durchführung
- Feinschliff der UI und optimierte Nutzerführung
- Lokale und ggf. serverseitige Algorithmen für Einsatzplanung und Scouting

---

Diese Kurzfassung kann im neuen Chat zur Kontextübergabe verwendet werden.