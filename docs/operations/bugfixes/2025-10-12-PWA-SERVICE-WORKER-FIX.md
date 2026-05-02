# PWA Service Worker - Dev vs. Production

**Letzte Aktualisierung:** 12. Oktober 2025

---

## 🔧 Problem: Reload-Schleife im Dev-Mode

### **Ursache:**
Service Worker war im Development-Mode aktiv und hat Konflikte mit Vite's HMR (Hot Module Replacement) verursacht.

### **Symptome:**
- ✗ Unendliche Reload-Schleife
- ✗ Änderungen werden nicht übernommen
- ✗ Browser cached alte Versionen
- ✗ HMR funktioniert nicht

---

## ✅ Lösung: Service Worker nur in Production

### **Was wurde geändert:**

#### **1. vite.config.ts**
```typescript
VitePWA({
  registerType: 'autoUpdate',
  devOptions: {
    enabled: false, // ✅ Service Worker im Dev deaktiviert
  },
  // ...
})
```

#### **2. main.tsx**
```typescript
// Development: Cleanup
if (import.meta.env.DEV) {
  // Deregistriert automatisch alle Service Worker
  // Löscht alle Caches
}

// Production: Register SW
if (import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

## 🚀 Anwendung starten

### **Nach den Fixes:**

1. **Stoppe den Dev-Server** (falls läuft)
   ```bash
   Ctrl+C
   ```

2. **Browser komplett schließen** (alle Tabs!)

3. **Dev-Server neu starten**
   ```bash
   npm run dev
   ```

4. **Browser öffnen**
   ```bash
   http://localhost:5173
   ```

### **Erwartetes Verhalten (Dev-Mode):**
- ✅ Keine Reload-Schleife
- ✅ HMR funktioniert
- ✅ Änderungen werden sofort sichtbar
- ✅ Kein Service Worker aktiv
- ✅ Console-Log: "🧹 DEV: Service Worker deregistriert"

---

## 🧪 Production Build testen

### **Service Worker ist NUR in Production aktiv:**

```bash
# 1. Build erstellen
npm run build

# 2. Production Preview
npm run preview

# 3. Browser öffnen
http://localhost:4173
```

### **Erwartetes Verhalten (Production):**
- ✅ Service Worker wird registriert
- ✅ App funktioniert offline
- ✅ Assets werden gecacht
- ✅ Console-Log: "✅ PROD: Service Worker registered"

---

## 🧹 Manuelle Bereinigung (falls nötig)

Falls die Reload-Schleife bestehen bleibt:

### **Chrome DevTools:**
1. Öffne DevTools (F12)
2. Tab: **Application**
3. Links: **Service Workers**
4. Klicke: **Unregister** bei allen
5. Links: **Storage**
6. Klicke: **Clear site data**
7. Browser neu starten

### **Oder: Incognito Mode**
```bash
# Teste im Inkognito-Fenster (keine Caches)
Ctrl+Shift+N (Chrome)
Cmd+Shift+N (Mac)
```

---

## 📊 Service Worker Status prüfen

### **Im Browser:**
```javascript
// Console (F12)
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registrierte SW:', regs.length);
  regs.forEach(r => console.log('Scope:', r.scope));
});
```

### **Erwartete Ausgabe:**

**Dev-Mode:**
```
Registrierte SW: 0
🧹 DEV: Service Worker deregistriert
```

**Production:**
```
Registrierte SW: 1
Scope: http://localhost:4173/
✅ PROD: Service Worker registered
```

---

## 🎯 Best Practices

### **Development:**
- ✅ Service Worker immer deaktiviert
- ✅ Keine Caches
- ✅ HMR aktiv
- ✅ Schnelle Entwicklung

### **Production:**
- ✅ Service Worker aktiv
- ✅ Assets gecacht
- ✅ Offline-Funktionalität
- ✅ Bessere Performance

### **Testing:**
- ✅ Dev-Mode: `npm run dev`
- ✅ Production-Preview: `npm run preview`
- ✅ Production-Deploy: `npm run build`

---

## 🐛 Troubleshooting

### Problem: "Immer noch Reload-Schleife"
**Lösung:**
1. Browser **komplett** schließen (alle Tabs!)
2. Browser-Cache löschen (Ctrl+Shift+Del)
3. Dev-Server neu starten
4. Im Incognito-Mode testen

### Problem: "Service Worker nicht aktiv in Production"
**Lösung:**
1. Prüfe `import.meta.env.PROD` ist `true`
2. Build neu erstellen: `npm run build`
3. Preview starten: `npm run preview`
4. Prüfe `/dist/sw.js` existiert

### Problem: "Änderungen werden nicht übernommen"
**Lösung:**
1. Hard Reload: Ctrl+Shift+R
2. Cache löschen: DevTools → Application → Clear storage
3. Service Worker deregistrieren

---

## 📝 Zusammenfassung

| Mode | Service Worker | Caches | HMR | Offline |
|------|----------------|--------|-----|---------|
| **Development** | ❌ Deaktiviert | ❌ Gelöscht | ✅ Aktiv | ❌ Nein |
| **Production** | ✅ Aktiv | ✅ Aktiv | ❌ Nein | ✅ Ja |

---

**Status:** ✅ Reload-Schleife behoben  
**Service Worker:** Funktioniert korrekt in Development & Production
