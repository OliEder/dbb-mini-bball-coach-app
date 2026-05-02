# SOFORT-AKTION: Test-Migration 🚨

## Problem
- **141 TypeScript-Fehler** weil Tests in `src/` kompiliert werden
- Tests gehören nach `/tests`, nicht nach `/src`
- Alte Path-Aliase `@domains/`, `@shared/` existieren noch

## ✅ Bereits durchgeführt
1. ✅ tsconfig.json - Tests jetzt ausgeschlossen
2. ✅ tsconfig.json - Alte Path-Aliase entfernt (nur noch `@/`)
3. ✅ Migration-Skript erstellt
4. ✅ Import-Pfade in `/tests` korrigiert

## 🎯 Nächste Schritte (FÜR DICH)

### Schritt 1: Migration ausführen (5 Minuten)

```bash
# Wechsle ins Projekt-Verzeichnis
cd /Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app

# Skript ausführbar machen
chmod +x migrate-tests.sh

# Migration durchführen
./migrate-tests.sh
```

**Was das Skript macht:**
- ✓ Löscht Duplikate (BBB-API Tests die schon in tests/ sind)
- ✓ Verschiebt verbleibende Tests von src/ nach tests/
- ✓ Erstellt korrekte Verzeichnisstruktur

### Schritt 2: Verifikation (2 Minuten)

```bash
# Prüfe: Keine Tests mehr in src/
find src -name "*.test.ts" -o -name "*.test.tsx" -o -name "__tests__"

# Sollte leer sein!

# Zähle Tests in tests/
find tests -name "*.test.ts" -o -name "*.test.tsx" | wc -l

# Sollte >14 sein
```

### Schritt 3: TypeScript-Check (1 Minute)

```bash
npm run type-check
```

**Erwartetes Ergebnis:** 
- ✅ 0 Fehler (statt 141!)
- Oder nur echte Code-Fehler, keine Test-Importe mehr

### Schritt 4: Tests ausführen (2 Minuten)

```bash
npm test
```

### Schritt 5: Commit (1 Minute)

```bash
git add .
git commit -m "fix: Migriere alle Tests von src/ nach tests/

- Tests aus src/ entfernt (gehören nicht in Produktions-Code)
- tsconfig.json: Tests von Kompilierung ausgeschlossen
- tsconfig.json: Alte @domains/@shared Aliase entfernt
- Nur noch @/ für alle Imports verwenden
- Fixes 141 TypeScript-Fehler"
```

## 📊 Vorher/Nachher

### Vorher ❌
```
src/
├── domains/
│   ├── bbb-api/services/__tests__/     ← FALSCH
│   ├── spiel/services/__tests__/       ← FALSCH
│   ├── team/services/TeamService.test.ts ← FALSCH
│   └── ...
└── shared/services/__tests__/          ← FALSCH

tsconfig.json:
  - Kompiliert Tests mit ❌
  - @domains/*, @shared/* Aliase ❌
```

### Nachher ✅
```
src/
├── domains/
│   └── ... (NUR Production Code)
└── shared/ (NUR Production Code)

tests/
├── unit/
├── integration/
├── e2e/
└── ... (ALLE Tests hier)

tsconfig.json:
  - Ignoriert Tests ✅
  - Nur @/* Alias ✅
```

## ⚠️ Wenn das Skript fehlschlägt

Falls das Skript nicht funktioniert, manuelle Migration:

```bash
# 1. Lösche Duplikate
rm -rf src/domains/bbb-api/services/__tests__
rm -rf src/shared/services/__tests__
rm src/domains/team/services/TeamService.test.ts

# 2. Verschiebe Rest manuell
# Siehe TEST-MIGRATION-PLAN.md für Details
```

## 🎉 Erfolgs-Kriterien

Nach der Migration solltest du haben:
- [ ] 0 TypeScript-Fehler in Tests
- [ ] Alle Tests in `/tests`, nichts in `/src`
- [ ] `npm test` läuft durch
- [ ] `npm run type-check` zeigt 0 Fehler
- [ ] Nur `@/` Imports, keine `@domains/` oder `@shared/`

## 💡 Warum das wichtig ist

**Problem:** TypeScript kompiliert Tests mit Production-Code
- ❌ Tests landen im Build
- ❌ Test-Dependencies in Production
- ❌ Größere Bundle-Size
- ❌ Kompilierungs-Fehler

**Lösung:** Tests komplett getrennt von src/
- ✅ Saubere Trennung
- ✅ Kleinere Bundles
- ✅ Schnellere Builds
- ✅ Keine Test-Imports in Production

## Los geht's! 🚀

```bash
chmod +x migrate-tests.sh && ./migrate-tests.sh
```
