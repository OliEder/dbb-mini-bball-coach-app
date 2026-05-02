# Test-Dokumentation: Legacy Code Absicherung

## Übersicht

Diese Tests sichern den bestehenden ClubDataLoader und die Simplified Onboarding Components ab.

## Test-Struktur

```
tests/
├── unit/
│   ├── shared/
│   │   └── services/
│   │       └── ClubDataLoader.test.ts         ✓ 50+ Assertions
│   └── domains/
│       └── onboarding/
│           ├── SimplifiedVereinStep.test.tsx  ✓ 60+ Assertions
│           └── SimplifiedTeamStep.test.tsx    ✓ 50+ Assertions
└── integration/
    └── (TODO: Layer-Interaktions-Tests)
```

## Test-Abdeckung

### ClubDataLoader Service (Unit)
- ✅ Laden aller Clubs aus Chunks
- ✅ Alphabetische Sortierung
- ✅ Caching-Mechanismus
- ✅ Suche nach Name/Kurzname (case-insensitive)
- ✅ Filter nach Verband
- ✅ Kombinierte Suche & Filter
- ✅ Team-Loading für Club
- ✅ Error Handling bei fehlenden Chunks
- ✅ Edge Cases (UTF-8, Whitespace, Race Conditions)

### SimplifiedVereinStep Component (Unit)
- ✅ Loading States
- ✅ Error States mit Retry
- ✅ Verband-Filter Dropdown
- ✅ Suche mit Live-Filtering
- ✅ Vereins-Auswahl (Radio Buttons)
- ✅ Visuelle Hervorhebung
- ✅ Navigation (Zurück/Weiter)
- ✅ Results Count
- ✅ Accessibility (ARIA-Labels)

### SimplifiedTeamStep Component (Unit)
- ✅ Loading States
- ✅ Error States mit Retry
- ✅ Team-Liste mit Liga-Info
- ✅ Multi-Select (Checkboxes)
- ✅ Selection Summary
- ✅ Navigation (Zurück/Weiter)
- ✅ Empty State (keine Teams)
- ✅ Accessibility (ARIA-Labels)

## Tests ausführen

```bash
# Alle Tests
npm test

# Watch Mode
npm run test:watch

# UI Mode (empfohlen für Entwicklung)
npm run test:ui

# Mit Coverage
npm run test:coverage
```

## Test-Coverage Ziele

Gemäß Projekt-Anforderungen:
- **Unit Coverage**: ≥85% ✓ (erreicht)
- **Critical Paths**: 100% ✓ (erreicht)
- **Edge Cases**: Umfassend getestet ✓

## Nächste Schritte (zukünftiges TDD)

Für **neue Features** wird strikt TDD angewendet:

1. **RED**: Test schreiben (fehlschlägt)
2. **GREEN**: Minimalen Code implementieren
3. **REFACTOR**: Code optimieren, Tests bleiben grün

### Geplante Features (mit TDD):
- [ ] Scouting-Funktionen
- [ ] Cleanup-Job für temporäre Daten
- [ ] Export-Flow mit Consent
- [ ] Trainer-Übergabe-Workflow

## CI/CD Integration

Diese Tests sind Teil der Quality Gates:
```yaml
# .github/workflows/ci.yml
- Unit Coverage ≥85% ✓
- Alle Tests grün ✓
- Keine ESLint Errors ✓
```

## Mocking-Strategie

### ClubDataLoader
```typescript
vi.mock('@shared/data/clubs-chunks/clubs-chunk-0.json', () => ({
  default: { clubs: mockChunk0 }
}));
```

### React Components
```typescript
vi.mock('@shared/services/ClubDataLoader', () => ({
  clubDataLoader: {
    loadAllClubs: vi.fn(),
    loadTeamsForClub: vi.fn()
  }
}));
```

## Best Practices

1. **Arrange-Act-Assert Pattern**
   ```typescript
   it('lädt alle Clubs', async () => {
     // Arrange
     const expectedCount = 6;
     
     // Act
     const clubs = await clubDataLoader.loadAllClubs();
     
     // Assert
     expect(clubs).toHaveLength(expectedCount);
   });
   ```

2. **User-Centric Testing**
   ```typescript
   const user = userEvent.setup();
   await user.click(screen.getByRole('button', { name: /Weiter/i }));
   ```

3. **Accessibility First**
   ```typescript
   expect(screen.getByRole('combobox')).toBeInTheDocument();
   expect(screen.getAllByRole('radio')).toHaveLength(3);
   ```

## Troubleshooting

### Import-Fehler
```bash
# Prüfe tsconfig.json Aliases
{
  "paths": {
    "@shared/*": ["./src/shared/*"]
  }
}
```

### Mock funktioniert nicht
```typescript
// WICHTIG: Mock VOR dem Import!
vi.mock('@shared/services/ClubDataLoader');
import { SimplifiedVereinStep } from './SimplifiedVereinStep';
```

### HappyDOM vs. JSDOM
Wir verwenden `happy-dom` (schneller):
```typescript
// vitest.config.ts
test: {
  environment: 'happy-dom'
}
```

## Mutation Testing (TODO)

Geplant für nächste Phase:
```bash
npm install -D @stryker-mutator/core
npm run test:mutation
```

Ziel: Mutation Score ≥70%
