# DevTools & API Mode Usage

## 🛠️ DevTools Features

Die DevTools sind **nur im Development Mode** sichtbar (rechts unten).

### Features:

1. **API Mode Toggle** ⚡/🎭
   - Umschalten zwischen echten APIs und Mock-Daten
   - Wird in `localStorage` gespeichert
   - Services können darauf reagieren

2. **DB Inspector** 📊
   - Zeigt Anzahl Einträge in jeder DB-Tabelle
   - Refresh-Button zum Aktualisieren

3. **Quick Reset** 🗑️
   - Schnelles Zurücksetzen mit einfacher Bestätigung
   - Löscht: DB + localStorage + sessionStorage

4. **Erweiterte Optionen** ⚠️
   - Ausführliche Reset-Funktion mit Warnhinweisen

---

## 💻 API Mode in Services nutzen

### Import Helper:

```typescript
import { useRealApiMode, isDevelopment } from '@/shared/utils/devMode';
```

### Beispiel 1: Entscheidung Mock vs. Real API

```typescript
class MyService {
  async fetchData() {
    const shouldUseRealApi = useRealApiMode();
    
    if (!shouldUseRealApi) {
      console.log('🎭 Using Mock Data');
      return this.getMockData();
    }
    
    console.log('⚡ Using Real API');
    const response = await fetch('https://api.example.com/...');
    // ...
  }
}
```

### Beispiel 2: Reagieren auf Toggle-Änderungen

```typescript
import { onApiModeChanged } from '@/shared/utils/devMode';

// In React Component
useEffect(() => {
  const cleanup = onApiModeChanged((useRealApi) => {
    console.log('API Mode changed:', useRealApi);
    // Daten neu laden, Cache leeren, etc.
  });
  
  return cleanup; // Cleanup on unmount
}, []);
```

### Beispiel 3: Dev-Only Features

```typescript
if (isDevelopment()) {
  // Nur in Dev ausführen
  console.log('Debug info:', data);
}
```

---

## 🎯 Best Practices

### ✅ DO:
- Toggle-State in Services mit `useRealApiMode()` abfragen
- Console-Logs mit Emoji für Mock/Real unterscheiden: 🎭 vs. ⚡
- Fallback auf Mock-Daten wenn Real API fehlschlägt
- Services sollten **unabhängig** vom Toggle funktionieren

### ❌ DON'T:
- Nicht direkt auf `localStorage` zugreifen → nutze Helper
- Nicht `import.meta.env.DEV` für API-Entscheidungen → nutze Toggle
- Keine Production-spezifische Logik in Dev-Mode-Checks

---

## 🔄 Preview vs. Dev vs. Production

| Environment | API Mode | Use Case |
|-------------|----------|----------|
| **Dev** (`npm run dev`) | Toggle: Mock 🎭 / Real ⚡ | Lokale Entwicklung |
| **Preview** (`npm run preview`) | Immer Real ⚡ | Pre-Production Tests |
| **Production** (Build) | Immer Real ⚡ | Live App |

### Wann welches Environment?

- **Dev:** 90% Mock für schnelle Entwicklung
- **Preview:** Real API zum Testen vor Deployment
- **Production:** Immer Real API

---

## 📝 Services mit API Mode Support

Bereits implementiert:
- ✅ `TabellenService.loadTabelleFromUrl()`

TODO - Noch hinzufügen:
- [ ] `BBBApiService` 
- [ ] `BBBSyncService`
- [ ] `SpielplanService`

---

## 🐛 Debugging

### Console-Logs checken:

```typescript
// Wenn Toggle auf Real API:
⚡ Dev Mode: Using Real API

// Wenn Toggle auf Mock:
🎭 Dev Mode: Using Mock Data (Toggle in DevTools to use Real API)
```

### DevTools öffnen:
1. App starten: `npm run dev`
2. Browser öffnen: `http://localhost:5173`
3. Rechts unten: 🛠️ DEV MODE Panel
4. Toggle umschalten → Console prüfen

---

## 🔧 Troubleshooting

**Toggle funktioniert nicht?**
- Browser-Cache leeren
- localStorage prüfen: `localStorage.getItem('dev_use_real_api')`
- DevTools neu öffnen

**Services nutzen weiter Mock?**
- `useRealApiMode()` importiert?
- Service implementiert Toggle-Check?
- Console-Logs prüfen

**Preview verwendet Mock?**
- Preview sollte **immer** Real API nutzen
- `isDevelopment()` gibt in Preview `false` zurück
- Kein Toggle verfügbar in Preview

---

**Letzte Aktualisierung:** 23. Oktober 2025  
**Version:** v1.0
