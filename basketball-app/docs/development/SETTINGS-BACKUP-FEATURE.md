# Settings & Backup Feature - Dokumentation

**Datum:** 28.10.2025  
**Version:** 1.0.0  
**Status:** ✅ Implementiert

---

## 🎯 Features

### 1. App-Reset mit Sicherheitsmechanismen
- **Mehrfache Bestätigung** erforderlich
- User muss "RESET" eintippen
- **Automatisches Backup** vor Reset
- Löscht alle Daten (DB + localStorage)
- Navigiert zum Onboarding

### 2. Backup-System
- **Export** als JSON-Datei
- Enthält alle Daten:
  - Teams
  - Spieler
  - Spiele
  - Tabellen
  - Einsatzplan
  - App-State
- Dateiname mit Datum: `basketball-app-backup-YYYY-MM-DD.json`

### 3. Backup-Wiederherstellung
- **Import** von JSON-Backup
- Validierung des Formats
- Warnung bei alten Backups (>30 Tage)
- Überschreibt aktuelle Daten
- Automatischer Reload nach Import

---

## 🛡️ Sicherheitsmechanismen

### Reset-Schutz
1. **Erster Klick:** Zeigt Warnung
2. **Bestätigung:** User muss "RESET" tippen
3. **Auto-Backup:** Vor Reset wird Backup erstellt
4. **Abbrechen:** Jederzeit möglich

### Backup-Schutz
- Validierung des Backup-Formats
- Warnung bei alten Backups
- Keine sensiblen Daten im Export

---

## 📖 Benutzeranleitung

### Reset durchführen
1. Dashboard → Einstellungen
2. "App zurücksetzen" klicken
3. Warnung lesen
4. "RESET" eintippen
5. "Jetzt zurücksetzen" klicken
6. Automatisches Backup wird erstellt
7. App startet neu beim Onboarding

### Backup erstellen
1. Dashboard → Einstellungen
2. "Backup erstellen" klicken
3. JSON-Datei wird heruntergeladen
4. Sicher aufbewahren!

### Backup wiederherstellen
1. Dashboard → Einstellungen
2. "Backup wiederherstellen" klicken
3. JSON-Datei auswählen
4. Import läuft automatisch
5. App lädt neu mit wiederhergestellten Daten

---

## 🏗️ Technische Details

### Backup-Format (JSON)
```json
{
  "version": "1.0",
  "timestamp": "2025-10-28T12:00:00Z",
  "appVersion": "2.0.0",
  "data": {
    "teams": [...],
    "spieler": [...],
    "spiele": [...],
    "liga_tabellen": [...],
    "einsatzplan": [...]
  },
  "store": {
    "currentTeamId": "uuid",
    "myTeamIds": ["uuid1", "uuid2"],
    "hasCompletedOnboarding": true
  }
}
```

### Komponenten
- `/src/domains/settings/components/SettingsView.tsx` - Hauptkomponente
- Integration in Dashboard über `currentView === 'einstellungen'`

### Datenbank-Operations
- `db.delete()` - Löscht komplette DB
- `db.*.clear()` - Leert einzelne Tabellen
- `db.*.bulkAdd()` - Import mehrerer Einträge

### Store-Operations
- `useAppStore.getState().reset()` - Reset Store
- `localStorage.clear()` - Löscht localStorage
- `sessionStorage.clear()` - Löscht sessionStorage

---

## ⚠️ Wichtige Hinweise

### DSGVO-Konformität
- Keine Cloud-Speicherung
- Lokale Datenhaltung
- User hat volle Kontrolle
- Explizite Lösch-Funktion

### Browser-Kompatibilität
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile Browser ✅

### Bekannte Limitationen
- Max. Backup-Größe: ~50MB (Browser-Limit)
- Import großer Backups kann dauern
- Service Worker muss nach Reset neu registriert werden

---

## 🐛 Troubleshooting

### Reset funktioniert nicht
```javascript
// In Browser Console:
__DEV_UTILS__.reset();
```

### Backup-Import schlägt fehl
- Prüfe JSON-Format
- Prüfe Dateigröße (<50MB)
- Browser-Console für Fehler checken

### Daten nach Reset weg
- Automatisches Backup suchen im Download-Ordner
- Dateiname: `basketball-app-backup-[datum].json`

---

## 🚀 Zukünftige Verbesserungen

- [ ] Automatische Backups (täglich/wöchentlich)
- [ ] Verschlüsselte Backups
- [ ] Cloud-Sync (optional, DSGVO-konform)
- [ ] Selektives Backup (nur bestimmte Daten)
- [ ] Backup-Versionierung
- [ ] Undo-Funktion nach Reset

---

**Letzte Aktualisierung:** 28.10.2025
