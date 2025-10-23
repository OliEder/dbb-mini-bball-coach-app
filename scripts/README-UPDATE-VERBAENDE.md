# Verbands-Daten Update Script

## 🎯 Zweck

Automatisches Update der statischen Verbands-Liste aus der DBB API.

## 📅 Wann ausführen?

- **1x pro Saison** (empfohlen: September/Oktober bei Saisonstart)
- Bei vermuteten Änderungen der Verbands-Struktur (sehr selten!)

## 🚀 Verwendung

### Option 1: npm-Script (empfohlen)

```bash
cd basketball-app
npm run update:verbaende
```

### Option 2: Direkt ausführen

```bash
node scripts/update-verbaende.js
```

## 📋 Was macht das Script?

1. **API-Call** → Holt aktuelle Verbands-Liste von `basketball-bund.net/rest/wam/data`
2. **Kategorisierung** → Gruppiert Verbände nach ID-Bereichen:
   - 1-16: Landesverbände
   - 29: Deutsche Meisterschaften
   - 30-33: Regionalligen
   - 40+: Rollstuhlbasketball
   - 100+: Bundesligen
3. **Code-Generierung** → Erstellt TypeScript-Code mit allen Verbänden
4. **Datei-Update** → Überschreibt `src/shared/constants/verbaende.ts`

## 📤 Output

Das Script generiert eine vollständige TypeScript-Datei mit:

```typescript
export const LANDESVERBAENDE: VerbandOption[] = [
  { id: 1, label: 'Baden-Württemberg', ... },
  { id: 2, label: 'Bayern', ... },
  // ... alle 16 Bundesländer
];

export const BUNDESLIGEN: VerbandOption[] = [...];
export const DEUTSCHE_MEISTERSCHAFTEN: VerbandOption[] = [...];
export const REGIONALLIGEN: VerbandOption[] = [...];
export const ROLLSTUHLBASKETBALL: VerbandOption[] = [...];

// + Hilfsfunktionen
```

## ⚠️ Wichtig

- Die generierte Datei enthält Header: **"AUTOMATISCH GENERIERT - NICHT MANUELL BEARBEITEN"**
- Manuelle Änderungen gehen beim nächsten Update verloren!
- Das Script committed die Datei **nicht** automatisch → Git-Review möglich

## 🔍 Nach dem Update prüfen

```bash
# 1. Diff ansehen
git diff basketball-app/src/shared/constants/verbaende.ts

# 2. Bei Änderungen: Testen
cd basketball-app
npm run dev

# 3. Onboarding-Flow durchgehen
# → VerbandStep sollte alle Verbände zeigen

# 4. Committen wenn OK
git add basketball-app/src/shared/constants/verbaende.ts
git commit -m "chore: Update Verbands-Daten für Saison 2025/26"
```

## 🐛 Troubleshooting

### Fehler: "API returned 500"
- DBB-API ist möglicherweise down
- Später erneut versuchen

### Fehler: "Unexpected API response structure"
- API-Struktur hat sich geändert
- Script muss angepasst werden

### Warnung: "Unbekannte Verbände gefunden"
- Neue ID-Bereiche wurden eingeführt
- Prüfen und ggf. Script erweitern

## 📊 Beispiel-Output

```bash
🏀 Basketball Verbands-Update Script

📡 Hole Verbands-Daten von DBB API...
✅ 25 Verbände geladen

📋 Kategorisiere Verbände...
   Landesverbände: 16
   Bundesligen: 1
   Deutsche Meisterschaften: 1
   Regionalligen: 4
   Rollstuhlbasketball: 1

✍️  Generiere TypeScript Code...

💾 Schreibe in: .../constants/verbaende.ts

✅ Verbands-Daten erfolgreich aktualisiert!
📅 Nächstes Update empfohlen: September 2026
```

## 🔄 Wartungs-Kalender

| Saison | Update-Datum | Status |
|--------|--------------|--------|
| 2025/26 | Okt 2025 | ✅ Initial |
| 2026/27 | Sep 2026 | ⏳ Geplant |
| 2027/28 | Sep 2027 | ⏳ Geplant |

## 📝 Changelog

### v1.0.0 (2025-10-22)
- Initial Version
- Unterstützt alle 5 Verbands-Kategorien
- Automatische Kategorisierung
- Farbiges Console-Output
