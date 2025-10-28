# React Router Migration - Umsetzungsplan

## ✅ Implementierte Features

### 1. Router Setup
- **App.tsx**: BrowserRouter mit Routes
- **Protected Routes**: Dashboard nur nach Onboarding
- **Root Redirect**: Automatische Weiterleitung basierend auf Onboarding-Status

### 2. CompletionStep
- **Auto-Redirect**: Navigiert automatisch zum Dashboard nach 1.5s
- **Error Handling**: Zeigt Fehler bei Completion-Problemen
- **Success Animation**: CheckCircle mit Bounce-Animation

### 3. Store Integration
- **completeOnboarding()**: Speichert Daten und updated appStore
- **Keine Navigation im Store**: Navigation erfolgt im CompletionStep

### 4. E2E-Tests
- Alle Tests auf `/onboarding` umgestellt (statt `/onboarding/v2`)
- Dashboard-Redirect wird getestet
- Store-Manipulation für Direct-Navigation zu Steps

## 📁 Geänderte Dateien

```
src/
├── App.tsx                                    # Router Setup
├── stores/appStore.ts                         # hasCompletedOnboarding
└── domains/onboarding/
    ├── onboarding-v2.store.ts                # completeOnboarding()
    └── components/
        ├── OnboardingV2Container.tsx          # CompletionStep Integration
        └── v2/
            └── CompletionStep.tsx             # NEU: Auto-Redirect Component

e2e/
└── onboarding-v3.spec.ts                     # Alle Tests aktualisiert
```

## 🧪 Testplan

### Manuell zu testen:

1. **Fresh Start**
   ```bash
   # LocalStorage & IndexedDB löschen
   localStorage.clear()
   indexedDB.deleteDatabase('BasketballPWA_v4')
   ```
   - Sollte zu `/onboarding` redirecten

2. **Kompletter Flow**
   - Welcome → User → Verband → Altersklassen → Gebiet → Verein → Team
   - Nach Team-Auswahl: Completion Screen mit "Geschafft! 🎉"
   - Auto-Redirect nach 1.5s zu `/dashboard`
   - URL sollte `/dashboard` sein

3. **Dashboard Protected**
   - Manuell zu `/dashboard` navigieren (ohne Onboarding)
   - Sollte zu `/onboarding` redirecten

4. **Session Persistence**
   - Onboarding starten, paar Steps durchlaufen
   - Page Reload
   - Sollte bei richtigem Step weitermachen

5. **Zurück-Navigation**
   - Während Onboarding Browser-Back-Button nutzen
   - Sollte zum vorherigen Step gehen

### E2E-Tests:

```bash
npm run test:e2e
```

## 🔄 Migration von Hash-Routing

Falls später Hash-Routing gewünscht:

```tsx
// App.tsx
import { HashRouter } from 'react-router-dom';

<HashRouter>
  <AppRouter />
</HashRouter>
```

URLs wären dann: `/#/onboarding`, `/#/dashboard`

## 🚀 Next Steps

1. ✅ Tests laufen lassen
2. ✅ Manuell durchklicken
3. Optional: Weitere Routes hinzufügen
   - `/dashboard/team/:teamId`
   - `/dashboard/spieler/:spielerId`
   - `/settings`
4. Optional: Navigation Guards erweitern
5. Optional: 404-Seite

## 📝 Hinweise

- **Navigation erfolgt immer mit `useNavigate()`** (React Router Hook)
- **Store macht KEINE Navigation** (würde außerhalb von React-Komponenten nicht funktionieren)
- **CompletionStep** ist die einzige Component, die auto-navigiert
- **Protected Routes** durch `<ProtectedRoute>` Component
- **Tests** nutzen `page.goto('/onboarding')` statt `/onboarding/v2`

## 🐛 Known Issues

- Keine bekannten Issues

## 📚 Dokumentation

- [React Router Docs](https://reactrouter.com/)
- [Protected Routes Pattern](https://reactrouter.com/en/main/start/tutorial#protecting-routes)
