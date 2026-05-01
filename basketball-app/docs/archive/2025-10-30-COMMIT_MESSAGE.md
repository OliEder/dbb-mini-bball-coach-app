fix: TypeScript-Fehler behoben und Build-Warnings eliminiert

## 🔧 Fixes

### TypeScript-Fehler behoben
- Property-Namen korrigiert: `team.id` → `team.team_id`
- Arrays explizit typisiert: `Spiel[]` statt implizites `any[]`
- Types importiert wo nötig
- Alle Entity-IDs folgen jetzt konsistent dem Pattern `{entity}_id`

### TypeScript-Konfiguration modernisiert
- `baseUrl` entfernt (deprecated in TS 5.0+)
- Path-Aliases bleiben über Vite-Konfiguration erhalten
- Keine Deprecation-Warnings mehr

### PWA Build-Warning behoben
- Glob-Pattern-Fehler durch leeres Array behoben
- Precaching deaktiviert zugunsten von Runtime-Caching
- Bessere Cache-Strategien implementiert

## 📚 Neue Dokumentation

### TypeScript-Guide erstellt (`/docs/development/TYPESCRIPT-GUIDE.md`)
- Häufige Fehler und ihre Lösungen
- Korrekte Property-Namen für alle Entities
- Best Practices für dieses Projekt
- Copy-Paste Templates

### VSCode-Konfiguration hinzugefügt
- `.vscode/extensions.json`: Empfohlene Extensions (inkl. Error Lens)
- `.vscode/settings.json`: Strengere TypeScript-Checks

### Dokumentation aktualisiert
- `PROJECT-STATUS.md`: TypeScript-Guide prominent verlinkt
- `docs/README.md`: TypeScript-Guide als wichtigstes Dokument
- Bug-Fix dokumentiert in `/docs/bugfixes/2025-10-26-BBB-SYNC-FIX.md`

## ✅ Verifiziert
- Build läuft fehlerfrei: `npm run build`
- Keine TypeScript-Errors
- Keine PWA Build-Warnings
- BBBSyncService funktioniert mit korrektem API-Response-Handling

## 🎯 Impact
- Entwickler-Experience verbessert durch klare Dokumentation
- Zukünftige TypeScript-Fehler werden durch Guide vermieden
- Build-Pipeline sauber ohne Warnings
- Code-Qualität durch strikte Types erhöht

Refs: #typescript-cleanup #build-optimization #developer-experience
