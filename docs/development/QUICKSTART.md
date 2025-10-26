# 🚀 Quick Start für neue Chat-Sessions

**Zuletzt aktualisiert:** 23. Oktober 2025

---

## 📌 Context für neuen Chat

Kopiere dieses Template in einen neuen Chat:

```
Hallo! Ich arbeite an einem Basketball Team Manager (PWA).

**Status:**
- ClubDataLoader Service implementiert ✅
- Simplified Onboarding Flow implementiert ✅  
- 65+ Tests geschrieben, aber 27 failen ⚠️
- TypeScript-Fehler mit kurzname (optional) behoben ✅

**Letzte Änderungen:**
- ClubDataLoader lädt jetzt Chunks via ES Modules
- kurzname im ClubData-Interface als optional markiert
- Tests verwenden echte Chunk-Daten (Integration-Test-Ansatz)

**Nächste Aufgabe:**
[Beschreibe hier was du als nächstes tun willst]

**Dateien zum Kontext:**
Bitte lies folgende Dateien:
1. PROJECT-STATUS.md (Gesamtübersicht)
2. src/shared/services/ClubDataLoader.ts (Kern-Service)
3. tests/unit/shared/services/ClubDataLoader.test.ts (Tests)

**Meine Frage:**
[Stelle hier deine Frage]
```

---

## 🎯 Häufige Aufgaben

### Tests zum Laufen bringen
```
"Die Tests failen noch. Kannst du:
1. Tests durchlaufen lassen und Errors analysieren
2. Die Ursachen identifizieren
3. Fixes implementieren
4. Tests grün machen"
```

### Neues Feature mit TDD
```
"Ich möchte [FEATURE] mit TDD entwickeln.
Lass uns starten:
1. Zuerst Tests schreiben (RED)
2. Minimalen Code implementieren (GREEN)
3. Refactoring (Tests bleiben grün)

Beginne mit dem ersten Test für [KONKRETE FUNKTIONALITÄT]"
```

### Code Review
```
"Kannst du folgende Datei reviewen:
[DATEI-PFAD]

Prüfe auf:
- TypeScript Best Practices
- WCAG Accessibility
- DSGVO-Compliance
- Test-Coverage
- Performance"
```

### Dokumentation aktualisieren
```
"Ich habe [FEATURE] implementiert.
Aktualisiere bitte:
1. PROJECT-STATUS.md
2. tests/README.md
3. Relevante Code-Comments"
```

---

## 🔥 Wichtigste Kommandos

```bash
# Development
npm run dev              # Dev Server starten
npm run test:ui          # Tests im UI Mode (beste DX!)

# Debugging
npm run test:coverage    # Welche Stellen nicht getestet?
npm run lint             # Code-Qualität prüfen

# Build
npm run build            # Production Build
```

---

## 📁 Wichtigste Dateien

```
PROJECT-STATUS.md                     ← Vollständige Doku
QUICKSTART.md                         ← Diese Datei
tests/README.md                       ← Test-Strategie
src/shared/services/ClubDataLoader.ts ← Kern-Service
vite.config.ts                        ← Build Config
vitest.config.ts                      ← Test Config
```

---

## ⚠️ Bekannte Probleme (aktuell)

1. **27 Tests failen**
   - Ursache: Mocking-Probleme
   - Fix: In Arbeit

2. **kurzname optional**
   - Ursache: DBB-Daten inkonsistent
   - Fix: ✅ Implementiert

3. **Alte Services nicht gelöscht**
   - ClubDataService.ts (alt)
   - LigaDiscoveryService.ts (alt)
   - TODO: Nach erfolgreichen Tests aufräumen

---

## 💡 Best Practices für Prompts

### ✅ Gute Prompts
```
"Schreibe Unit-Tests für ClubDataLoader.searchClubs() 
mit folgenden Test-Cases:
1. Findet Club nach Namen
2. Case-insensitive Suche
3. Leeres Array bei nicht gefundenem Club"
```

### ❌ Schlechte Prompts
```
"Mach die Tests"
```

---

## 🧪 TDD-Workflow (ab jetzt!)

Für **JEDES** neue Feature:

```
1. RED Phase
   - Test schreiben
   - Test läuft rot
   - Commit: "test: add test for [feature]"

2. GREEN Phase
   - Minimalen Code implementieren
   - Test wird grün
   - Commit: "feat: implement [feature]"

3. REFACTOR Phase
   - Code optimieren
   - Tests bleiben grün
   - Commit: "refactor: improve [feature]"
```

---

## 📊 Quality Gates

Vor jedem Commit prüfen:

- [ ] Alle Tests grün
- [ ] TypeScript kompiliert ohne Errors
- [ ] ESLint keine Warnings
- [ ] Code formatiert (Prettier)
- [ ] Dokumentation aktualisiert

---

## 🆘 Wenn du nicht weiter kommst

1. **Lies PROJECT-STATUS.md** (meist steht's da schon)
2. **Suche in tests/** (Tests zeigen wie's geht)
3. **Frage spezifisch** (mit Dateiname + Zeilennummer)

---

**Viel Erfolg! 🚀**

Bei Fragen einfach auf diese Datei referenzieren.
