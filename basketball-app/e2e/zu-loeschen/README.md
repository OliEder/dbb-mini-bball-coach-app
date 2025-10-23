# Archivierte Tests

Diese Tests sind **veraltet** und werden nicht mehr ausgeführt.

## 📁 Dateien

### `onboarding.spec.ts`
**Status:** ❌ Veraltet  
**Grund:** 
- Testet alten Flow mit BBB-URL-Import
- BBB-URLs werden nicht mehr verwendet
- Flow komplett überarbeitet zu Simplified Onboarding

**Migration:** Ersetzt durch `onboarding-simplified.spec.ts`

---

### `onboarding-v3.spec.ts`
**Status:** ❌ Veraltet  
**Grund:**
- Testet 10-Schritte-Flow (Verband → Altersklasse → Gebiet → Ligen → Verein → Team)
- Zu komplex, war nur nötig um API-Calls zu reduzieren
- Mit lokalen Club-Daten nicht mehr notwendig

**Migration:** Ersetzt durch `onboarding-simplified.spec.ts` (5 Schritte)

---

### `bbb-integration.spec.ts`
**Status:** ❌ Veraltet  
**Grund:**
- Testet BBB API Integration
- Wir verwenden keine BBB API mehr
- Alle Daten sind lokal (JSON-Chunks)

**Migration:** Keine - Feature entfernt

---

## 🗑️ Löschen?

**Diese Tests können nach Review gelöscht werden.**

Bevor du löschst:
1. ✅ Sicherstellen, dass `onboarding-simplified.spec.ts` alle relevanten Testfälle abdeckt
2. ✅ `npm run test:e2e` erfolgreich durchläuft
3. ✅ Accessibility-Tests funktionieren

## 📚 Neue Tests

Aktuelle E2E-Tests befinden sich in:
- `../onboarding-simplified.spec.ts` - Neuer vereinfachter Flow
- `../accessibility.spec.ts` - WCAG 2.1 AA Tests

## 🔄 Änderungen im Flow

**Alt (10 Schritte):**
```
Welcome → User → Verband → Altersklassen → Gebiet → 
Ligen-Loading → Verein → Team → Sync → Team-Selection
```

**Neu (5 Schritte):**
```
Welcome → User → Verein (mit Filter) → Team → Completion
```

## 📝 Hinweise

Falls diese Tests noch einmal benötigt werden (z.B. für Legacy-Support), können sie aus dem Git-History wiederhergestellt werden:

```bash
# Zeige letzten Stand vor Archivierung
git log -- e2e/onboarding.spec.ts

# Stelle Datei wieder her
git checkout <commit-hash> -- e2e/onboarding.spec.ts
```
