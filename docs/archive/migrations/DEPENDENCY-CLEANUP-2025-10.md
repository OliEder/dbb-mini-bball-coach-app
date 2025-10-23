# 🗑️ Dependency Cleanup - Analyse

## ❌ UNGENUTZT - Können entfernt werden

### @tanstack/react-query & @tanstack/react-query-devtools

**Status:** ✅ **SICHER ZU ENTFERNEN**

**Beweis:**
- Keine Imports im Code: `grep -r "@tanstack/react-query" src/` → Keine Treffer
- Keine `useQuery`, `useMutation`, `QueryClient` Nutzung
- Nicht in Config-Files

**Wahrscheinlich:** Ursprünglich geplant für API-Calls, aber nie implementiert.

**Aktuelle API-Lösung:** `BBBApiService` (direkter fetch)

**Entfernen:**
```bash
npm uninstall @tanstack/react-query @tanstack/react-query-devtools
```

**Bundle-Größe gespart:** ~40KB (gzipped)

---

## ✅ GENUTZT - Behalten

### ESLint Plugins (false-positive vom Script)

**eslint-plugin-react-hooks:** ✅ Genutzt in `eslint.config.js`
**eslint-plugin-react-refresh:** ✅ Genutzt in `eslint.config.js`
**@eslint/js:** ✅ Genutzt in `eslint.config.js`
**typescript-eslint:** ✅ Genutzt in `eslint.config.js`

### axe-core

**Status:** ✅ **BEHALTEN**

Wird indirekt von `jest-axe` genutzt für Accessibility-Tests.

---

## 🤔 ZU PRÜFEN - Zukunft

### @pact-foundation/pact

**Status:** ⚠️ **Aktuell ungenutzt, aber geplant?**

Contract-Testing für API-Integration. Wenn du keine Contract-Tests planst → entfernen.

**Prüfen:**
```bash
grep -r "pact" src/
grep -r "pact" tests/
```

Wenn keine Treffer → entfernen (spart ~15MB!)

---

## 📊 Zusammenfassung

| Package | Status | Aktion | Ersparnis |
|---------|--------|--------|-----------|
| @tanstack/react-query | ❌ Ungenutzt | Entfernen | ~30KB |
| @tanstack/react-query-devtools | ❌ Ungenutzt | Entfernen | ~10KB |
| @pact-foundation/pact | ⚠️ Zu prüfen | Entfernen? | ~15MB (!) |
| eslint-plugin-* | ✅ Genutzt | Behalten | - |
| axe-core | ✅ Genutzt | Behalten | - |

---

## 🚀 Empfohlene Aktionen

### SOFORT (sicher):

```bash
cd basketball-app

# React Query entfernen (ungenutzt)
npm uninstall @tanstack/react-query @tanstack/react-query-devtools

# Test & Commit
npm test
npm run build
git add package.json package-lock.json
git commit -m "chore: Remove unused @tanstack/react-query packages"
```

### PRÜFEN (wenn Contract-Tests nicht geplant):

```bash
# Pact entfernen (sehr groß!)
npm uninstall @pact-foundation/pact

# Test
npm test
```

---

## 💡 Zukünftige Best Practices

1. **Vor Installation prüfen:** Brauche ich das wirklich?
2. **Nach Refactoring:** `npm run check:unused` ausführen
3. **Bundle-Analyse:** `npm run build -- --analyze`
4. **Monatlich:** Ungenutzte Dependencies entfernen

---

## 📈 Erwarteter Nutzen

Nach Cleanup:
- ✅ ~40KB kleineres Bundle (gzipped)
- ✅ Weniger Dependencies = weniger Security-Risiko
- ✅ Schnellere `npm install` (~15MB weniger bei Pact)
- ✅ Übersichtlichere package.json

---

## 🎯 Nächste Schritte

1. **React Query entfernen** (definitiv ungenutzt)
2. **Pact prüfen** (wahrscheinlich auch ungenutzt)
3. **Tests ausführen**
4. **Committen**
5. **Weiter mit Onboarding Schritt 4!** 🏀
