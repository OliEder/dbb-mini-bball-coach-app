# Projekt-Cleanup Analyse

**Datum:** 28.10.2025  
**Status:** Vorschlag zur Aufräumung

## 📦 NPM Upgrade

### Empfehlung: ✅ Upgrade durchführen
```bash
# Global npm upgraden
npm install -g npm@11.6.2

# Dependencies updaten & Vulnerabilities fixen
npm update
npm audit fix
npm install
```

## 🔧 PWA Build Warning Fix

### Problem
`An error occurred when globbing for files. 'Cannot read properties of undefined (reading 'sync')'`

### Lösung
```bash
# Workbox-Dependencies updaten
npm install --save-dev workbox-build@latest vite-plugin-pwa@latest

# Cache clearen
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🗂️ Dateien zur Archivierung

### 1. Temporäre Fix-Skripte (können nach `/archive/scripts/` verschoben werden)
```
fix-build-errors.sh
fix-console-correct.js
fix-find-stores.js
fix-indexeddb-direct.js
fix-install.sh
fix-team-id.js
force-cleanup.sh
quick-build-fix.sh
security-fix.sh
```

### 2. Alte Dokumentation (können nach `/archive/docs/` verschoben werden)
```
BUILD-FIXES.md
BUILD-TROUBLESHOOTING.md
COMMIT_GITHUB_PAGES.md
COMMIT_MESSAGE.md
COMMIT-SUMMARY.md
DEPLOYMENT_COMPLETE.md
FIX-BBBSyncService.md
GITHUB_PAGES_OLIEEDER.md
ONBOARDING-V2-FIX.md
ONBOARDING-V2-UPDATE.md
PACKAGE-FIX.md
PACT-V16-UPGRADE.md
REACT_ROUTER_MIGRATION.md
SECURITY-NOTICE.md
SECURITY-UPDATE-v1.2.2.md
SIMPLIFIED_ONBOARDING.md
TEST-FIXES-SUMMARY.md
VEREIN-DISCOVERY-UPDATE.md
```

### 3. Cleanup-Skripte (können nach `/archive/cleanup/` verschoben werden)
```
cleanup-all.sh
cleanup-js-files.sh
cleanup-js.sh
cleanup-public.sh
cleanup-sw.sh
```

### 4. Alte Config-Dateien (prüfen & ggf. löschen)
```
vite.config.d.ts       # Nicht benötigt
vite.config.js         # Verwenden wir .ts
vite.config.minimal.ts # Backup, nicht benötigt
temp-fetch-fix.ts      # Temporärer Fix
```

### 5. Test-Ausgaben (können gelöscht werden)
```
test-output.txt        # 267KB! Kann gelöscht werden
.rebuild-trigger       # 0 Bytes, kann gelöscht werden
```

## 📁 Empfohlene Struktur nach Cleanup

```
basketball-app/
├── src/              # Source Code
├── tests/            # Tests
├── public/           # Static Assets
├── docs/             # Aktuelle Dokumentation
│   └── development/
├── scripts/          # Aktive Scripts
├── archive/          # Archivierte Dateien
│   ├── fixes/        # Alte Fix-Scripts
│   ├── docs/         # Alte Dokumentation
│   └── cleanup/      # Alte Cleanup-Scripts
├── dist/             # Build Output
├── coverage/         # Test Coverage
├── node_modules/     # Dependencies
├── .github/          # GitHub Actions
├── .vscode/          # VS Code Settings
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript Config
├── vite.config.ts    # Vite Config
├── vitest.config.ts  # Test Config
├── tailwind.config.js # Tailwind Config
├── index.html        # Entry Point
├── README.md         # Projekt-Übersicht
├── CHANGELOG.md      # Version History
└── STATUS.md         # Aktueller Status
```

## 🚀 Durchführung

### Schritt 1: Backup erstellen
```bash
# Backup des aktuellen Zustands
cp -r . ../basketball-app-backup-$(date +%Y%m%d)
```

### Schritt 2: NPM Upgrade
```bash
npm install -g npm@11.6.2
npm cache clean --force
```

### Schritt 3: Dependencies updaten
```bash
rm -rf node_modules package-lock.json
npm install
npm update
npm audit fix
```

### Schritt 4: Archive-Struktur erstellen
```bash
mkdir -p archive/fixes
mkdir -p archive/docs
mkdir -p archive/cleanup
```

### Schritt 5: Dateien archivieren (NICHT löschen!)
```bash
# Fix-Scripts
mv fix-*.sh archive/fixes/
mv fix-*.js archive/fixes/

# Alte Docs
mv BUILD-*.md archive/docs/
mv COMMIT*.md archive/docs/
# ... etc

# Cleanup Scripts
mv cleanup-*.sh archive/cleanup/
```

### Schritt 6: Test-Output löschen
```bash
rm test-output.txt
rm .rebuild-trigger
```

### Schritt 7: Build testen
```bash
npm run build
npm run test
```

## ⚠️ Wichtig

- **KEINE Dateien direkt löschen** - erst archivieren!
- **Backup erstellen** bevor Änderungen durchgeführt werden
- **Tests laufen lassen** nach jedem größeren Schritt
- **Git Commit** nach erfolgreichem Cleanup

## 📝 Nächste Schritte

1. Diesen Plan reviewen
2. Backup erstellen
3. NPM Upgrade durchführen
4. PWA Build testen
5. Bei Erfolg: Dateien archivieren
6. Finaler Test aller Features
7. Git Commit mit Message: "chore: npm upgrade to v11.6.2 and project cleanup"
