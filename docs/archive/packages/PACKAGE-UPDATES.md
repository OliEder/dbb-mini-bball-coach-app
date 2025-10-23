# Package Update Strategie & Security

## 🚨 Warum Updates wichtig sind

### Aktuelle Supply-Chain-Attacken (2024/2025):
- **@types/* packages** - Kompromittierte Type-Definitionen
- **eslint-scope** - Credential-Theft
- **ua-parser-js** - Cryptominer injiziert
- **colors/faker** - Protestware (Endlos-Loop)

**→ Veraltete Packages = Sicherheitsrisiko!**

---

## 📊 Package Status prüfen

### Script ausführen:

```bash
cd basketball-app
npm run check:packages
```

**Output zeigt:**
- 🚨 Kritische Updates (Security-relevante Packages)
- ⚠️  Major Updates (Breaking Changes)
- 📦 Minor Updates (Features)
- 🔧 Patch Updates (Bugfixes)
- 🔒 Security Audit

---

## 🔄 Update-Strategie

### 1. Patch Updates (sicher)

```bash
npm update
npm audit fix
```

✅ Keine Breaking Changes
✅ Nur Bugfixes
✅ Immer aktuell halten!

### 2. Minor Updates (Features)

```bash
npm install <package>@latest
npm test
```

⚠️ Neue Features können Bugs haben
✅ Abwärtskompatibel (sollte funktionieren)

### 3. Major Updates (Breaking Changes)

```bash
# Einzeln testen!
npm install react@latest react-dom@latest
npm test
npm run build
```

🔴 Breaking Changes möglich
📋 CHANGELOG.md prüfen
🧪 Intensives Testen erforderlich

---

## 🎯 Unsere Packages - Prioritäten

### KRITISCH (wöchentlich prüfen):

```json
{
  "@types/*": "Type-Packages (nach Attacke 2024)",
  "typescript": "Compiler",
  "vite": "Build-Tool",
  "react": "Core Framework",
  "eslint": "Linting (nach eslint-scope Attacke)",
  "@testing-library/*": "Test-Dependencies"
}
```

**Script markiert diese automatisch als KRITISCH!**

### WICHTIG (monatlich):

```json
{
  "zustand": "State Management",
  "dexie": "IndexedDB",
  "@tanstack/react-query": "Data Fetching",
  "workbox-*": "Service Worker / PWA"
}
```

### STANDARD (bei Bedarf):

```json
{
  "lucide-react": "Icons",
  "papaparse": "CSV Parser",
  "tailwindcss": "Styling"
}
```

---

## 📅 Update-Zyklus

### Wöchentlich (Montags):

```bash
npm run check:packages
npm audit fix
```

### Monatlich (1. des Monats):

```bash
npm run check:packages
npm update
npm test
npm run test:e2e
```

### Bei Critical Security Alert:

```bash
# SOFORT
npm audit
npm audit fix --force  # Wenn nötig
npm test
```

---

## 🛡️ Security Best Practices

### 1. npm audit aktivieren

```bash
# In CI/CD Pipeline:
npm audit --audit-level=moderate
```

### 2. Dependabot / Renovate aktivieren

GitHub Dependabot erstellt automatisch PRs für Updates.

### 3. Package Lock committen

```bash
git add package-lock.json
git commit -m "chore: Update dependencies"
```

**→ Reproducible Builds!**

### 4. Minimize Dependencies

Jedes Package = potentielle Attack-Surface
- Prüfe regelmäßig: `npm ls --depth=0`
- Entferne ungenutzte Packages

---

## 📋 Update-Checklist

Vor jedem Update:

- [ ] `npm run check:packages` ausführen
- [ ] CHANGELOG der Packages prüfen
- [ ] `npm update` oder `npm install <pkg>@latest`
- [ ] `npm audit` prüfen
- [ ] `npm test` ausführen
- [ ] `npm run test:e2e` ausführen
- [ ] `npm run build` testen
- [ ] `git commit` mit Versionsinfo

---

## 🔍 Aktuelle Package-Versionen prüfen

### Manuell einzeln prüfen:

```bash
npm view react version          # Neueste Version
npm list react                  # Installierte Version
npm outdated                    # Alle veralteten Packages
```

### Websites für Security-Infos:

- https://npmjs.com/advisories
- https://snyk.io/vuln/npm
- https://security.snyk.io/
- https://github.com/advisories

---

## ⚡ Quick Commands

```bash
# Check everything
npm run check:packages

# Safe updates only
npm run update:packages

# Full upgrade (ACHTUNG: Breaking Changes!)
npx npm-check-updates -u
npm install
npm test
```

---

## 🚀 Automation

### GitHub Actions Workflow:

```yaml
# .github/workflows/update-deps.yml
name: Update Dependencies
on:
  schedule:
    - cron: '0 9 * * 1'  # Montags 9 Uhr
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run check:packages
      - run: npm audit
```

---

## ✅ Zusammenfassung

1. **Wöchentlich:** `npm run check:packages`
2. **Monatlich:** Updates installieren & testen
3. **Bei Security-Alert:** SOFORT updaten
4. **CI/CD:** Automatische Checks einbauen
5. **Package-Lock:** Immer committen

**→ Security ist kein einmaliger Task, sondern ein Prozess!**
