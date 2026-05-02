/**
 * Fix für BBBSyncService - Team-ID Mapping Problem
 * 
 * Problem: Spiele werden mit BBB team_id statt lokaler UUID gespeichert
 * Lösung: Beim Sync das eigene Team identifizieren und korrekte team_id setzen
 */

// In BBBSyncService.ts muss die createOrUpdateSpiel Methode gefixt werden:

// ALT (fehlerhaft):
team_id: data.heimTeamId, // Das ist die BBB Team-ID!

// NEU (korrekt):
// Bestimme welches Team das eigene ist
const eigenesTeam = await db.teams.where('team_typ').equals('eigenes').first();
const istEigenesTeamHeim = eigenesTeam && data.heimTeamId === eigenesTeam.team_id;
const istEigenesTeamGast = eigenesTeam && data.gastTeamId === eigenesTeam.team_id;

// Setze team_id nur wenn eigenes Team beteiligt ist
team_id: istEigenesTeamHeim || istEigenesTeamGast ? eigenesTeam.team_id : '',

// Und setze ist_heimspiel korrekt:
ist_heimspiel: istEigenesTeamHeim,

// ====================================
// Komplette gefixte Methode:
// ====================================

private async createOrUpdateSpiel(data: {
  matchId: number;
  gameNumber: number;
  gameDay: number;
  date: string;
  time: string;
  heimTeamId: string;
  gastTeamId: string;
  ligaId: string;
  halleId?: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
}): Promise<Spiel> {
  // Suche nach extern_spiel_id
  const existingSpiel = await db.spiele
    .where('extern_spiel_id')
    .equals(data.matchId.toString())
    .first();

  const statusMap: Record<string, 'geplant' | 'live' | 'abgeschlossen' | 'abgesagt'> = {
    'scheduled': 'geplant',
    'live': 'live',
    'finished': 'abgeschlossen',
    'cancelled': 'abgesagt',
  };

  const heimTeam = await db.teams.get(data.heimTeamId);
  const gastTeam = await db.teams.get(data.gastTeamId);

  // ⭐ NEU: Finde das eigene Team
  const eigenesTeam = await db.teams.where('team_typ').equals('eigenes').first();
  
  // ⭐ NEU: Prüfe ob eigenes Team beteiligt ist
  let teamId = '';
  let istHeim = false;
  
  if (eigenesTeam) {
    // Check via extern_team_id
    if (heimTeam?.extern_team_id === eigenesTeam.extern_team_id) {
      teamId = eigenesTeam.team_id;
      istHeim = true;
    } else if (gastTeam?.extern_team_id === eigenesTeam.extern_team_id) {
      teamId = eigenesTeam.team_id;
      istHeim = false;
    }
    // Fallback: Check via Name
    else if (heimTeam?.name === eigenesTeam.name) {
      teamId = eigenesTeam.team_id;
      istHeim = true;
    } else if (gastTeam?.name === eigenesTeam.name) {
      teamId = eigenesTeam.team_id;
      istHeim = false;
    }
  }

  const spielData = {
    extern_spiel_id: data.matchId.toString(),
    spielnr: data.gameNumber,
    spieltag: data.gameDay,
    datum: new Date(data.date),
    uhrzeit: data.time,
    heim_team_id: data.heimTeamId,
    gast_team_id: data.gastTeamId,
    liga_id: data.ligaId,
    heim: heimTeam?.name || '',
    gast: gastTeam?.name || '',
    halle_id: data.halleId,
    ist_heimspiel: istHeim, // ⭐ Korrekt gesetzt!
    status: statusMap[data.status] || 'geplant',
    ergebnis_heim: data.homeScore,
    ergebnis_gast: data.awayScore,
    altersklasse: 'U10' as Altersklasse,
    updated_at: new Date(),
  };

  if (existingSpiel) {
    // Update
    await db.spiele.update(existingSpiel.spiel_id, spielData);
    return { ...existingSpiel, ...spielData };
  }

  // Create new
  const spiel: Spiel = {
    spiel_id: crypto.randomUUID(),
    team_id: teamId, // ⭐ Jetzt die richtige lokale UUID!
    ...spielData,
    created_at: new Date(),
  };

  await db.spiele.add(spiel);
  return spiel;
}
