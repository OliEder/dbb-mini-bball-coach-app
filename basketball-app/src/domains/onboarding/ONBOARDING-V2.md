# Onboarding v2 - Geführter Setup-Flow

## Übersicht
Der neue Onboarding-Prozess führt Trainer Schritt für Schritt durch die Einrichtung ihrer Basketball-Teams mit direkter Integration der DBB-API.

## Flow-Ablauf

### ✅ Implementierte Steps (1-6)

1. **Welcome Step**
   - Begrüßung und Übersicht
   - Erklärung der App-Features
   - Start des Prozesses

2. **User Step**
   - Eingabe von Vor- und Nachname
   - Validierung der Eingaben
   - Lokale Speicherung

3. **Verband Step** (API-Call #1)
   - Abruf aller verfügbaren Verbände
   - Auswahl des Basketball-Verbands
   - Standard: Bayern (ID=2)

4. **Altersklassen Step** (API-Call #2)
   - Multi-Select für Altersklassen
   - Filterung basierend auf Verband
   - Minibasketball-Markierung (U8, U10, U12)

5. **Gebiet Step** (API-Call #3)
   - Auswahl von Bezirk/Kreis
   - Suchfunktion bei vielen Gebieten
   - Gruppierung nach Bezirken

6. **Ligen Loading Step** (API-Call #4-N)
   - Automatisches Laden aller relevanten Ligen
   - Progress-Anzeige während des Ladens
   - Abruf aller Teams pro Liga
   - Expandierbare Liga-Übersicht

### 🚧 Noch zu implementieren (Steps 7-10)

7. **Verein Step**
   - Auswahl aus geladenen Vereinen
   - Oder manuelles Anlegen eines neuen Vereins
   - Markierung als "eigener Verein"

8. **Team Select Step**
   - Multi-Auswahl eigener Teams
   - Anzeige aller Teams des gewählten Vereins
   - Zuordnung zu Altersklassen

9. **Sync Step**
   - Synchronisation von Tabellen und Spielplänen
   - Import von Spieler-Daten aus Match-Info
   - Progress-Anzeige

10. **Team Selection Step**
    - Auswahl des aktiven Teams
    - Speicherung der Einstellungen
    - Weiterleitung zum Dashboard

## Technische Details

### Store: `onboarding-v2.store.ts`
```typescript
- State für alle Steps
- API Response Caching
- Persistierung via localStorage
- Loading & Error States
```

### API Integration
- **BBBApiService**: REST API Wrapper mit CORS-Proxy
- **BBBSyncService**: Synchronisation von Liga-Daten
- **Rate-Limiting**: Max 10 parallele Requests

### CORS-Proxy Strategie
1. corsproxy.io (Primary)
2. cors-anywhere.herokuapp.com (Fallback)
3. allorigins.win (Fallback)

## Migration vom alten Onboarding

Nutzer, die bereits das alte URL-basierte Onboarding durchlaufen haben, erhalten beim Start eine Migration-Option um auf den neuen Flow umzusteigen.

## Verwendung

```typescript
import { OnboardingV2Container } from './domains/onboarding/components/OnboardingV2Container';

// In App.tsx
if (!hasCompletedOnboarding) {
  return <OnboardingV2Container />;
}
```

## Nächste Schritte

1. [ ] Steps 7-10 implementieren
2. [ ] Spieler-Import aus CSV optional anbieten
3. [ ] Team-Dashboard mit Liga-Tabelle
4. [ ] Tests für alle Steps schreiben
5. [ ] Offline-Fallback implementieren

## Datenbank-Integration

Nach Abschluss des Onboardings werden folgende Daten in IndexedDB gespeichert:
- USER (Trainer-Daten)
- VEREINE (mit extern_verein_id)
- TEAMS (mit extern_team_id und team_typ)
- LIGA (alle relevanten Ligen)
- LIGA_TABELLE (Tabellenstand)
- SPIELE (Spielplan)
