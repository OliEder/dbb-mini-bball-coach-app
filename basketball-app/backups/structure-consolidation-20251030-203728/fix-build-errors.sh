#!/bin/bash
# Fix all team_typ build errors

echo "Fixing build errors by adding team_typ to all test teams..."

# Fix SpielerService.test.ts
sed -i '' "s/trainer: 'Test Trainer',$/trainer: 'Test Trainer',\n      team_typ: 'eigen' as const,/" \
  src/domains/spieler/services/SpielerService.test.ts

# Fix SpielService tests
sed -i '' "s/trainer: 'Test Trainer',$/trainer: 'Test Trainer',\n      team_typ: 'eigen' as const,/" \
  src/domains/spielplan/services/SpielService.test.ts

sed -i '' "s/trainer: 'Test Trainer',$/trainer: 'Test Trainer',\n      team_typ: 'eigen' as const,/" \
  src/domains/spielplan/services/SpielService.integration.test.ts

# Fix TeamService
sed -i '' "s/trainer: teamData.trainer,$/trainer: teamData.trainer,\n      team_typ: 'eigen' as TeamTyp,/" \
  src/domains/team/services/TeamService.ts

sed -i '' "s/trainer: teamData.trainer,$/trainer: teamData.trainer,\n      team_typ: 'eigen' as TeamTyp,/" \
  src/domains/team/team.service.ts

# Fix VereinService.test.ts
sed -i '' "s/trainer: 'Test Trainer',$/trainer: 'Test Trainer',\n        team_typ: 'eigen' as const,/" \
  src/domains/verein/services/VereinService.test.ts

echo "Build fixes applied!"
