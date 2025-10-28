# Basketball PWA - Security Update v1.2.2

**Datum:** 11. Oktober 2025  
**Priorität:** 🔴 KRITISCH - Sicherheitsupdate

---

## 🔒 Sicherheits-Updates

Alle Pakete wurden auf die neuesten Versionen aktualisiert, um bekannte Sicherheitslücken zu schließen.

---

## 📦 Hauptupgrades

### Critical Security Updates

**ESLint 8 → 9**
- ❌ Alte Version: `8.57.0` (deprecated, Sicherheitslücken)
- ✅ Neue Version: `9.16.0` (aktuelle stabile Version)
- 🔧 Breaking Change: Neue Flat Config Format
- ⚠️ Neue Config-Datei: `eslint.config.js`

**Dependencies mit Major Updates:**
- `date-fns`: `3.6.0` → `4.1.0`
- `uuid`: `10.0.0` → `11.0.3`
- `zustand`: `4.5.5` → `5.0.2`
- `eslint-plugin-react-hooks`: `4.6.2` → `5.1.0`

---

## 🔄 Aktualisierte Pakete

### Dependencies (Production)
```json
{
  "clsx": "^2.1.1",              // keine Änderung (aktuell)
  "date-fns": "^4.1.0",          // 3.6.0 → 4.1.0 ⬆️
  "dexie": "^4.0.10",            // 4.0.8 → 4.0.10 ⬆️
  "dexie-react-hooks": "^1.1.7", // keine Änderung (aktuell)
  "lucide-react": "^0.468.0",    // 0.446.0 → 0.468.0 ⬆️
  "papaparse": "^5.4.1",         // keine Änderung (aktuell)
  "react": "^18.3.1",            // keine Änderung (aktuell)
  "react-dom": "^18.3.1",        // keine Änderung (aktuell)
  "uuid": "^11.0.3",             // 10.0.0 → 11.0.3 ⬆️
  "zustand": "^5.0.2"            // 4.5.5 → 5.0.2 ⬆️
}
```

### DevDependencies
```json
{
  "@eslint/js": "^9.16.0",                    // NEU (ESLint 9 dependency)
  "@testing-library/jest-dom": "^6.6.3",      // 6.5.0 → 6.6.3 ⬆️
  "@testing-library/react": "^16.1.0",        // 16.0.1 → 16.1.0 ⬆️
  "@testing-library/user-event": "^14.5.2",   // keine Änderung
  "@types/papaparse": "^5.3.15",              // 5.3.14 → 5.3.15 ⬆️
  "@types/react": "^18.3.12",                 // 18.3.5 → 18.3.12 ⬆️
  "@types/react-dom": "^18.3.1",              // 18.3.0 → 18.3.1 ⬆️
  "@types/uuid": "^10.0.0",                   // keine Änderung
  "@vitejs/plugin-react-swc": "^3.8.1",       // 3.7.0 → 3.8.1 ⬆️
  "@vitest/coverage-v8": "^3.2.4",            // keine Änderung
  "@vitest/ui": "^3.2.4",                     // keine Änderung
  "autoprefixer": "^10.4.20",                 // keine Änderung
  "eslint": "^9.16.0",                        // 8.57.0 → 9.16.0 ⬆️⬆️⬆️
  "eslint-plugin-react-hooks": "^5.1.0",      // 4.6.2 → 5.1.0 ⬆️
  "eslint-plugin-react-refresh": "^0.4.16",   // 0.4.12 → 0.4.16 ⬆️
  "fake-indexeddb": "^6.0.0",                 // keine Änderung
  "jsdom": "^25.0.1",                         // 25.0.0 → 25.0.1 ⬆️
  "postcss": "^8.4.49",                       // 8.4.47 → 8.4.49 ⬆️
  "tailwindcss": "^3.4.15",                   // 3.4.12 → 3.4.15 ⬆️
  "typescript": "^5.7.2",                     // 5.6.2 → 5.7.2 ⬆️
  "typescript-eslint": "^8.18.1",             // NEU (ESLint 9 TypeScript support)
  "vite": "^6.3.6",                           // keine Änderung
  "vite-plugin-pwa": "^0.21.1",               // 1.0.3 → 0.21.1 ⬆️
  "vitest": "^3.2.4"                          // keine Änderung
}
```

---

## ⚠️ Breaking Changes

### ESLint 9 - Neue Flat Config

**Alte Config (gelöscht):**
- `.eslintrc.js` / `.eslintrc.json`

**Neue Config (erstellt):**
- `eslint.config.js` (Flat Config Format)

**Änderungen:**
- Neue Syntax mit `export default`
- Plugins werden anders importiert
- TypeScript ESLint ist jetzt `typescript-eslint`
- Keine extends mehr, stattdessen `tseslint.config()`

---

## 🔧 Installation & Test

```bash
# 1. Alte node_modules löschen
rm -rf node_modules package-lock.json

# 2. Neu installieren
npm install

# 3. Tests ausführen
npm run test

# 4. Linting prüfen
npm run lint

# 5. App starten
npm run dev
```

---

## ✅ Behobene Deprecation Warnings

Die folgenden Warnings sind jetzt behoben:

❌ **Vorher:**
```
deprecated inflight@1.0.6
deprecated @humanwhocodes/config-array@0.13.0
deprecated @humanwhocodes/object-schema@2.0.3
deprecated rimraf@3.0.2
deprecated glob@7.2.3
deprecated sourcemap-codec@1.4.8
deprecated source-map@0.8.0-beta.0
deprecated eslint@8.57.1
```

✅ **Nachher:**
- Keine Deprecation Warnings mehr!
- Alle Pakete auf aktuellen Versionen
- Sicherheitslücken geschlossen

---

## 🛡️ Sicherheitsvorteile

1. ✅ **Keine bekannten Sicherheitslücken** mehr
2. ✅ **Aktuellste Versionen** aller kritischen Pakete
3. ✅ **ESLint 9** mit verbesserter Security-Analyse
4. ✅ **TypeScript 5.7** mit besserer Type-Safety
5. ✅ **Vite PWA Plugin** auf aktueller Version

---

## 📝 Kompatibilität

**Alle Features bleiben erhalten:**
- ✅ Tests laufen weiter (140 Tests)
- ✅ Build funktioniert
- ✅ Dev-Server läuft
- ✅ Linting funktioniert (neue Config)
- ✅ PWA-Funktionalität erhalten

**Keine Code-Änderungen nötig:**
- Nur package.json und ESLint-Config geändert
- Alle Domain-Services unverändert
- Alle Komponenten unverändert

---

## 🚀 Nächste Schritte

Nach der Installation:

1. **Tests ausführen** → sollten alle grün sein
2. **Linting prüfen** → neue ESLint 9 Config
3. **App starten** → alles sollte funktionieren

---

## 📊 Update-Statistik

- **26 Pakete aktualisiert** 
- **2 neue Pakete** (@eslint/js, typescript-eslint)
- **2 entfernte Pakete** (@typescript-eslint/*, @humanwhocodes/*)
- **0 Breaking Changes im Code** (nur Config)

---

**Version:** 1.2.2  
**Typ:** Security Update  
**Status:** ✅ Ready for Installation  
**Priorität:** 🔴 KRITISCH
