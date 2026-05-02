# Onboarding v2 Update - 15. Oktober 2025

## Was wurde geändert?

### ✅ Problem behoben
**Vorher:** Beim Start der App wurde direkt die URL-Abfrage angezeigt (alter Onboarding-Flow)  
**Jetzt:** Neuer geführter Onboarding-Flow mit Schritt-für-Schritt Anleitung

### 🔄 Umstellung in App.tsx
- Alter `OnboardingContainer` wurde durch `OnboardingV2Container` ersetzt
- Migration-Dialog für Nutzer mit altem Onboarding

### 🚀 Neuer Onboarding-Flow

1. **Begrüßung** - Übersicht über App-Features
2. **Persönliche Daten** - Name des Trainers
3. **Verband wählen** - z.B. Bayern
4. **Altersklassen** - Multi-Select (U8, U10, U12, etc.)
5. **Gebiet** - Bezirk/Kreis auswählen
6. **Ligen laden** - Automatischer Import aller relevanten Ligen
7. **Verein** (TODO)
8. **Teams auswählen** (TODO)
9. **Synchronisation** (TODO)
10. **Aktives Team** (TODO)

### 📁 Neue Dateien
- `/src/domains/onboarding/onboarding-v2.store.ts` - Zustand Store
- `/src/domains/onboarding/components/v2/` - Alle neuen Step-Komponenten
- `/src/domains/onboarding/components/OnboardingV2Container.tsx` - Container

### 🔧 Technische Details
- DBB REST API Integration statt HTML-Parsing
- CORS-Proxy mit Fallback-Strategie
- Rate-Limiting für API-Calls
- Progress-Anzeige beim Laden

## Nächste Schritte

1. Steps 7-10 fertig implementieren
2. Team-Dashboard entwickeln
3. Tests schreiben
4. Alte Onboarding-Komponenten entfernen (wenn stabil)

## Wie testen?

1. App starten
2. Der neue Onboarding-Flow sollte automatisch starten
3. Falls alter Onboarding durchlaufen wurde: Migration-Dialog erscheint

## Bei Problemen

- Browser-Cache leeren
- localStorage löschen: `localStorage.clear()`
- Neu laden

Der neue Flow ist DSGVO-konform und speichert alle Daten nur lokal auf dem Gerät.
