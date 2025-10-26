# 🔧 Quick Fix Script für team_typ Fehler

Alle `Team` Objekte brauchen `team_typ: 'eigen'`

## Dateien zu fixen:

1. ✅ `/domains/team/services/TeamService.ts` - DONE
2. ✅ `/domains/team/team.service.ts` - DONE
3. ⏳ `/domains/spielplan/services/SpielService.integration.test.ts`
4. ⏳ `/domains/verein/services/VereinService.test.ts` (4x)

## Pattern:

```typescript
// VORHER:
const team: Team = {
  team_id: ...,
  verein_id: ...,
  name: ...,
  altersklasse: ...,
  saison: ...,
  trainer: ...,
  created_at: ...
};

// NACHHER:
const team: Team = {
  team_id: ...,
  verein_id: ...,
  name: ...,
  altersklasse: ...,
  saison: ...,
  trainer: ...,
  team_typ: 'eigen',  // ← ADD THIS
  created_at: ...
};
```

## Automatisch fixen mit sed:

```bash
# Für Test-Dateien:
find src -name "*.test.ts" -type f -exec sed -i '' 's/trainer: string;$/trainer: string;\n      team_typ: '\''eigen'\'',/' {} \;
```

Oder manuell jede Datei durchgehen...
