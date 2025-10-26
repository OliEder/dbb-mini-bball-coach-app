# 🔧 Build & Preview Troubleshooting

**Datum:** 23. Oktober 2025  
**Status:** ✅ Lösungen für häufige Build-Probleme

---

## 🚨 Problem: Preview zeigt alte Version

### Symptome
- `npm run preview` zeigt alten Onboarding-Flow
- Änderungen nicht sichtbar
- Alte Komponenten werden angezeigt

### Ursachen
1. **Alter dist/-Build** wird cached
2. **Service Worker** cached alte Assets
3. **Browser-Cache** hält alte Dateien

### Lösung

```bash
# 1. Vollständiges Cleanup
./cleanup-all.sh

# 2. Fresh Install
npm install

# 3. Fresh Build
npm run build

# 4. Preview
npm run preview
```

### Zusätzlich: Service Worker Reset

```bash
# Im Browser DevTools → Application → Service Workers → Unregister
# Oder:
# Application → Clear Storage → Clear site data
```

---

## 🚨 Problem: Build schlägt fehl

### Symptom: TypeScript-Fehler die lokal nicht auftreten

#### Ursache: Veraltete .tsbuildinfo

```bash
# Lösung
rm tsconfig.tsbuildinfo
rm tsconfig.node.tsbuildinfo
npm run build
```

#### Ursache: Node Modules korrupt

```bash
# Lösung
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

---

## 🚨 Problem: "Module not found" Fehler

### Symptome
```
Error: Cannot find module '@/components/...'
Error: Cannot find module '@domains/...'
```

### Ursache: Vite Path-Aliase nicht aufgelöst

### Lösung: Prüfe vite.config.ts

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@domains': path.resolve(__dirname, './src/domains'),
    '@shared': path.resolve(__dirname, './src/shared')
  }
}
```

---

## 🚨 Problem: Tests bestehen, Build schlägt fehl

### Ursache: Unterschiedliche TypeScript-Konfiguration

```bash
# Test verwendet vitest.config.ts
# Build verwendet tsconfig.json

# Prüfe beide Configs auf Konsistenz
```

### Lösung: Strict Mode Unterschiede

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true  // Hilft bei Type-Problemen in node_modules
  }
}
```

---

## 🚨 Problem: Alte Service Worker Dateien

### Symptome
- PWA verhält sich unerwartet
- Alte Assets werden geladen
- Offline-Funktionalität defekt

### Lösung

```bash
# 1. Entferne alte SW-Dateien
rm -f public/sw.js
rm -f public/workbox-*.js
rm -f src/sw.js

# 2. Fresh Build
npm run build

# 3. Im Browser: Unregister alle Service Workers
# DevTools → Application → Service Workers → Unregister All
```

---

## 🔧 Quick Fix Commands

### Vollständiger Reset
```bash
./cleanup-all.sh && npm install && npm run build
```

### Build ohne Cache
```bash
rm -rf dist .vite && npm run build
```

### Development Reset
```bash
rm -rf node_modules dist && npm install && npm run dev
```

---

## 🐛 Build-Error Debugging

### 1. Enable Verbose Output

```bash
# TypeScript verbose
npm run build -- --verbose

# Vite verbose
DEBUG=vite:* npm run build
```

### 2. Prüfe Build-Logs

```bash
# Suche nach spezifischen Fehlern
npm run build 2>&1 | grep -i "error"

# Zeige alle Warnings
npm run build 2>&1 | grep -i "warning"
```

### 3. Test Build-Schritte einzeln

```bash
# Nur TypeScript
tsc -b

# Nur Vite (ohne TypeScript)
vite build --mode development
```

---

## 📋 Pre-Build Checklist

Vor jedem Build prüfen:

- [ ] `npm install` durchgeführt?
- [ ] `.tsbuildinfo` Dateien gelöscht?
- [ ] `dist/` Verzeichnis leer?
- [ ] Keine TypeScript-Fehler in IDE?
- [ ] Alle Tests bestehen?
- [ ] Service Worker deregistriert?

---

## 🔗 Relevante Dateien

| Datei | Zweck |
|-------|-------|
| `vite.config.ts` | Build-Konfiguration |
| `tsconfig.json` | TypeScript für Build |
| `vitest.config.ts` | TypeScript für Tests |
| `package.json` | Build-Scripts |
| `.tsbuildinfo` | TypeScript Cache (kann Probleme machen) |

---

## 🆘 Wenn nichts hilft

### Nuclear Option: Alles zurücksetzen

```bash
# ACHTUNG: Löscht auch Git-untracked files!
git clean -fdx
npm install
npm run build
```

### Dokumentierte Probleme prüfen

- [GitHub Issues](link-to-issues)
- [Build-Fixes Documentation](./BUILD-FIXES.md)
- [Bug-Fix Documentation](./docs/bugfixes/)

---

## 📝 Nach dem Fix

1. ✅ Dokumentiere das Problem in `docs/bugfixes/`
2. ✅ Update diese Datei mit neuen Lösungen
3. ✅ Teile Erkenntnisse mit Team

---

**Bei weiteren Problemen:** Erstelle ein GitHub Issue mit:
- Build-Command
- Error-Message (vollständig)
- Environment (Node-Version, OS)
- Was schon probiert wurde
