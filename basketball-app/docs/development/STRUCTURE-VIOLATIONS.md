# 🚨 Projekt-Struktur Abweichungen

**Analysedatum:** 2025-10-30  
**Basis:** PROJECT-STRUCTURE.md v2.0

---

## 📊 Zusammenfassung

**Status:** 🔴 10 Abweichungen gefunden  
**Automatisch behebbar:** 8  
**Manuell erforderlich:** 2

---

## 🔴 KRITISCHE Abweichungen

### 1. E2E-Tests im falschen Verzeichnis
**Ist:** `/e2e/` (Root)  
**Soll:** `/tests/e2e/`  
**Dateien:** accessibility.spec.ts, onboarding-simplified.spec.ts, README.md

### 2. Doppelte Ordner
- `docs/bugfixes/` + `docs/operations/bugfixes/`
- `docs/migrations/` + `docs/operations/migrations/`

---

## 🟡 MITTLERE Abweichungen

### 3. Scripts nicht in Unterordnern
```
scripts/fix-node-modules.sh → scripts/cleanup/
scripts/run-all-tests.sh → scripts/testing/
scripts/test-*.{sh,js,ts} → scripts/testing/
```

### 4. Falsche Dateien
- `scripts/package.json` - gehört nicht hierher
- `scripts/package-lock.json` - gehört nicht hierher

### 5. Fehlende Test-Verzeichnisse
- tests/contract/pacts/
- tests/visual/
- tests/security/
- tests/performance/
- tests/accessibility/

### 6. Architecture-Dateien falsch abgelegt
```
docs/architecture/basketball-erd.mermaid → docs/architecture/diagrams/
docs/architecture/datenstruktur.puml → docs/architecture/diagrams/
docs/architecture/datenbank-schema-update_v3.md → docs/specifications/data-models/
```

### 7. Unklare Development-Dateien
- STATUS.md - Duplikat?
- TO-MERGE-QUICKSTART.md - sollte integriert werden
- entwicklungs-prompt.md - ggf. nach concepts/

---

## 🟢 KLEINERE Abweichungen

### 8. .DS_Store Dateien
Mehrere macOS System-Dateien im Repo

### 9. Fehlende README.md
Diverse Unterordner ohne README

### 10. Undokumentierte Verzeichnisse
- /prototypes/
- /test-data/

---

## 🚀 Lösung

### Automatisch (Script)
```bash
cd /Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app
bash scripts/cleanup/fix-structure-violations.sh
```

### Manuell
```bash
# Duplikate mergen
cp -r docs/bugfixes/* docs/operations/bugfixes/
rm -rf docs/bugfixes/

cp -r docs/migrations/* docs/operations/migrations/
rm -rf docs/migrations/

# STATUS.md prüfen
diff docs/development/STATUS.md docs/development/PROJECT-STATUS.md

# QUICKSTART mergen
cat docs/development/TO-MERGE-QUICKSTART.md >> docs/development/QUICKSTART.md
rm docs/development/TO-MERGE-QUICKSTART.md
```

---

## ✅ Checkliste

- [ ] Script ausgeführt
- [ ] Duplikate gemergt
- [ ] STATUS.md konsolidiert
- [ ] QUICKSTART gemergt
- [ ] DBB-API Doku-Speicherort entschieden
- [ ] prototypes/ + test-data/ dokumentiert
- [ ] Git Commit
