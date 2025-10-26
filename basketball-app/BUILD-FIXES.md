/**
 * Build Error Fixes
 * 
 * Systematische Korrektur aller TypeScript Build-Fehler
 * Stand: 19.10.2025
 */

// ============ FIX 1: team_typ in Tests ============
// Alle Test-Teams brauchen team_typ Property

// src/domains/spieler/services/SpielerService.test.ts - Line 37
// ADD: team_typ: 'eigen' as const,

// src/domains/spieler/services/SpielerService.integration.test.ts - Line 43
// ADD: team_typ: 'eigen' as const,

// src/domains/spielplan/services/SpielService.test.ts - Line 40
// ADD: team_typ: 'eigen' as const,

// src/domains/spielplan/services/SpielService.integration.test.ts - Line 39
// ADD: team_typ: 'eigen' as const,

// src/domains/verein/services/VereinService.test.ts - Lines 341, 413, 442, 455
// ADD: team_typ: 'eigen' as const,

// ============ FIX 2: team_id in Spieler ============
// src/domains/spieler/services/SpielerService.test.ts - Line 69
// ADD: team_id: testTeam.team_id,

// ============ FIX 3: TeamService ============
// src/domains/team/services/TeamService.ts - Line 27
// ADD: team_typ: 'eigen' as TeamTyp,

// src/domains/team/team.service.ts - Line 36
// ADD: team_typ: 'eigen' as TeamTyp,

// ============ FIX 4: BBBSyncService null checks ============
// Already fixed in previous edit
