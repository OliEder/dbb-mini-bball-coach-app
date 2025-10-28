# 🚀 GitHub Pages Setup für OliEder/dbb-mini-bball-coach-app

## ✅ Was wurde angepasst:

### Für deine Repository-Struktur:
- **Repository:** `dbb-mini-bball-coach-app`
- **App-Ordner:** `basketball-app/` (Subfolder)
- **GitHub User:** `OliEder`
- **Live URL:** https://olieeder.github.io/dbb-mini-bball-coach-app/

### Angepasste Dateien:
1. **Workflows** für Subfolder-Struktur (working-directory: basketball-app)
2. **Vite Config** mit korrektem base path (/dbb-mini-bball-coach-app/)
3. **README** mit deinen URLs
4. **404.html** für SPA-Routing
5. **robots.txt** mit korrekten URLs

## 📋 Nächste Schritte:

### 1. Änderungen committen und pushen:
```bash
# Im basketball-app Ordner:
git add -A
git commit -m "fix: GitHub Pages deployment für Subfolder-Struktur"
git push
```

### 2. Workflows ins Hauptrepository verschieben:
Die `.github` Ordner muss im **Root** des Repositories sein, nicht im Subfolder!

```bash
# Vom basketball-app Ordner aus:
mv .github ../
cd ..
git add .github/
git commit -m "fix: GitHub Actions ins Root verschieben"
git push
```

### 3. GitHub Pages aktivieren:
1. Gehe zu: https://github.com/OliEder/dbb-mini-bball-coach-app/settings/pages
2. **Source:** GitHub Actions
3. **Save**

### 4. Workflow Permissions:
1. Gehe zu: https://github.com/OliEder/dbb-mini-bball-coach-app/settings/actions
2. Unter **General** → **Workflow permissions**
3. Wähle: **Read and write permissions**
4. **Save**

### 5. Deployment starten:
1. Gehe zu: https://github.com/OliEder/dbb-mini-bball-coach-app/actions
2. Wähle **"Deploy to GitHub Pages & Run Crawler"**
3. Klicke **"Run workflow"** → **"Run workflow"**

## 🎯 Nach 2-3 Minuten:

Deine App ist live unter:
### https://olieeder.github.io/dbb-mini-bball-coach-app/

## ⚠️ Wichtige Hinweise:

### Subfolder-Struktur:
- Die GitHub Actions sind für `basketball-app/` als Subfolder konfiguriert
- Der `.github` Ordner MUSS im Repository-Root sein
- Build-Output kommt aus `basketball-app/dist`

### Falls Probleme:
1. Check Actions Tab für Fehler: https://github.com/OliEder/dbb-mini-bball-coach-app/actions
2. Stelle sicher, dass `.github` im Root ist
3. Prüfe ob package-lock.json committed ist

## 📱 PWA Installation testen:

Nach dem Deployment:
1. Öffne https://olieeder.github.io/dbb-mini-bball-coach-app/
2. iOS: Safari → Teilen → Zum Home-Bildschirm
3. Android: Chrome → ⋮ → App installieren

## 🔄 Automatische Updates:

- **Bei jedem Push:** App wird neu deployed
- **Jeden Sonntag:** Club-Daten werden aktualisiert

---

**Viel Erfolg! 🏀**

Bei Fragen: Schau im Actions Tab nach den Logs.
