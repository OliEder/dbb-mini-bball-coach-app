# TypeScript 7.0 Migration - baseUrl Entfernung

**Datum:** 23. Oktober 2025  
**Status:** ✅ Behoben

---

## 🚨 Problem

TypeScript 7.0 hat die `baseUrl` Option entfernt. Build und Tests liefen zwar, aber VS Code zeigte Fehler:

```
Die Option "baseUrl" ist veraltet und funktioniert in TypeScript 7.0 nicht mehr.
```

---

## ✅ Lösung

### Vorher (❌ Alt)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@domains/*": ["./src/domains/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

### Nachher (✅ Neu)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@domains/*": ["./src/domains/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

---

## 📁 Geänderte Dateien

1. ✅ `tsconfig.json` - `baseUrl` Zeile entfernt
2. ℹ️ `vite.config.ts` - Keine Änderung nötig (nutzt `resolve.alias`)
3. ℹ️ `vitest.config.ts` - Keine Änderung nötig (nutzt `resolve.alias`)

---

## 📝 Technical Decision Record

**TDR-013** wurde zu den Technical Decisions hinzugefügt:
- Siehe: `docs/development/TECHNICAL-DECISIONS.md`

---

## ✅ Verification

Nach dem Fix sollten keine TypeScript-Fehler mehr in VS Code erscheinen:

```bash
# TypeScript prüfen
npx tsc --noEmit

# Build testen
npm run build

# Tests laufen lassen
npm test
```

---

## 🔗 Referenzen

- TypeScript 7.0 Release Notes: https://aka.ms/ts6
- Migration Guide: Paths funktionieren jetzt ohne baseUrl
- Alle Path-Aliases (@shared, @domains, @/) funktionieren weiterhin!

---

**Status:** ✅ Fix deployed, dokumentiert in TDR-013
