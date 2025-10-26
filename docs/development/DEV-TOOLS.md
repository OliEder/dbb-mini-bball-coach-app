# Dev Tools - Reset-Funktion

**Datum:** 12. Oktober 2025  
**Feature:** Development Reset-Button

---

## ✨ Was wurde hinzugefügt:

### DevTools-Komponente

**Datei:** `src/shared/components/DevTools.tsx`

**Features:**
- ✅ Nur sichtbar im **Development Mode** (`npm run dev`)
- ✅ Fixed Position (unten rechts)
- ✅ Gelbes "DEV MODE" Badge
- ✅ Reset-Button mit Bestätigungsdialog
- ✅ Löscht ALLE Daten:
  - Dexie Database
  - LocalStorage
  - SessionStorage
- ✅ Lädt App automatisch neu (zurück zum Onboarding)

---

## 🎯 Verwendung:

### 1. App im Dev-Mode starten:

```bash
npm run dev
```

### 2. DevTools öffnen:

Die DevTools erscheinen automatisch **unten rechts** als gelbes Panel:

```
🛠️ DEV MODE
┌─────────────────────────────┐
│ Development Tools           │
│                             │
│ [🗑️ Alle Daten löschen]    │
│                             │
│ Diese Tools sind nur im     │
│ Dev-Mode sichtbar           │
└─────────────────────────────┘
```

### 3. Reset durchführen:

1. Klick auf **"Alle Daten löschen"**
2. Bestätigungsdialog erscheint mit Warnung
3. Klick auf **"Bestätigen"**
4. App lädt neu → Onboarding startet

---

## 🔒 Sicherheit:

**In Production (`npm run build`):**
- ✅ DevTools werden NICHT angezeigt
- ✅ Code wird automatisch tree-shaked
- ✅ Keine Reset-Funktion verfügbar

**Check:**
```javascript
if (!import.meta.env.DEV) {
  return null; // Nicht anzeigen
}
```

---

## 📍 Wo sichtbar:

Die DevTools sind auf **allen Seiten** sichtbar wo das Dashboard geladen wird:
- ✅ Dashboard (Übersicht)
- ✅ Spielerverwaltung
- ✅ Spielplan
- ✅ Statistik
- ✅ Einstellungen

**Nicht sichtbar:**
- ❌ Onboarding-Flow (dort noch keine Daten)
- ❌ Production Build

---

## 🎨 Design:

**WCAG 2.0 AA Compliant:**
- ✅ Klare Warnfarben (Rot für destruktive Aktionen)
- ✅ Bestätigungsdialog mit expliziter Liste
- ✅ Touch Targets > 44x44px
- ✅ Screen Reader Support
- ✅ Keyboard Navigation

**Visuell:**
- Gelbes Badge für Dev-Kennzeichnung
- Weißes Panel mit gelbem Border
- Shadow für Elevation
- z-index: 50 (über Content)

---

## 🧪 Testing:

```bash
# 1. Dev-Server starten
npm run dev

# 2. Onboarding durchlaufen (mit Mock-Daten)

# 3. Im Dashboard: DevTools unten rechts sichtbar

# 4. Reset-Button klicken

# 5. Bestätigen

# 6. App lädt neu → Onboarding wieder sichtbar
```

---

## 🔄 Was passiert beim Reset:

1. `resetDatabase()` wird aufgerufen
   - Dexie Database wird gelöscht
   - Neue leere DB wird erstellt
   
2. `localStorage.clear()`
   - Alle LocalStorage-Einträge gelöscht
   
3. `sessionStorage.clear()`
   - Alle SessionStorage-Einträge gelöscht
   
4. `window.location.href = '/'`
   - App lädt komplett neu
   - Onboarding wird angezeigt (keine Teams vorhanden)

---

## 💡 Erweiterungen (Optional):

Mögliche weitere Dev-Tools:
- **Seed Data:** Test-Daten schnell einfügen
- **Export/Import:** Datensätze als JSON speichern
- **Performance Monitor:** FPS, Memory Usage
- **Debug Logger:** Erweiterte Console-Logs
- **Mock API Toggle:** Zwischen Mock & Real API wechseln

---

**Version:** 1.3.0  
**Status:** ✅ Ready for Development  
**Sichtbar:** Nur in `npm run dev`
