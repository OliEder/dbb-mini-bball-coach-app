/**
 * Debug Helper - Team & Liga Data Inspector
 * 
 * Zeigt alle relevanten Daten für Debugging von:
 * - Teams & ihre Liga-Zuordnungen
 * - Spiele & ihre Team-Referenzen
 * - Tabellen-Einträge
 */

import { db } from '@/shared/db/database';

export async function debugTeamData() {
  console.log('🔍 ====== TEAM & LIGA DEBUG ======');
  
  // 1. Alle Teams
  const teams = await db.teams.toArray();
  console.log('\n📋 TEAMS:', teams.length);
  teams.forEach(team => {
    console.log(`  - ${team.name}`, {
      team_id: team.team_id,
      extern_permanent_id: team.extern_permanent_id,
      team_typ: team.team_typ,
      user_id: team.user_id
    });
  });

  // 1b. Team-Liga-Participations (v7.0)
  const participations = await db.team_liga_participations.toArray();
  console.log('\n🏆 TEAM-LIGA-PARTICIPATIONS:', participations.length);
  participations.forEach(p => {
    const team = teams.find(t => t.team_id === p.team_id);
    console.log(`  - ${team?.name || p.team_id}:`, {
      liga_id: p.liga_id,
      altersklasse: p.altersklasse,
      saison: p.saison,
      ist_aktiv: p.ist_aktiv,
      extern_team_id: p.extern_team_id,
    });
  });
  
  // 2. ✅ v6.0: Alle Spiele gruppiert nach heim_team_id / gast_team_id
  const spiele = await db.spiele.toArray();
  console.log('\n⚽ SPIELE:', spiele.length);
  
  const spieleByTeam = new Map<string, number>();
  spiele.forEach(spiel => {
    // Count Heimspiele
    if (spiel.heim_team_id) {
      spieleByTeam.set(spiel.heim_team_id, (spieleByTeam.get(spiel.heim_team_id) || 0) + 1);
    }
    // Count Auswärtsspiele
    if (spiel.gast_team_id) {
      spieleByTeam.set(spiel.gast_team_id, (spieleByTeam.get(spiel.gast_team_id) || 0) + 1);
    }
  });
  
  spieleByTeam.forEach((count, teamId) => {
    const team = teams.find(t => t.team_id === teamId);
    console.log(`  - ${team?.name || 'Unknown'} (${teamId}): ${count} Spiele`);
  });
  
  // 3. Spiele mit heim_team_id / gast_team_id
  const spieleWithTeamRefs = spiele.filter(s => s.heim_team_id || s.gast_team_id);
  console.log('\n🏠 SPIELE MIT TEAM-REFERENZEN:', spieleWithTeamRefs.length);
  
  const heimSpiele = new Map<string, number>();
  const gastSpiele = new Map<string, number>();
  
  spieleWithTeamRefs.forEach(spiel => {
    if (spiel.heim_team_id) {
      heimSpiele.set(spiel.heim_team_id, (heimSpiele.get(spiel.heim_team_id) || 0) + 1);
    }
    if (spiel.gast_team_id) {
      gastSpiele.set(spiel.gast_team_id, (gastSpiele.get(spiel.gast_team_id) || 0) + 1);
    }
  });
  
  console.log('  Heimspiele pro Team:');
  heimSpiele.forEach((count, teamId) => {
    const team = teams.find(t => t.team_id === teamId);
    console.log(`    - ${team?.name || 'Unknown'} (${teamId}): ${count}`);
  });
  
  console.log('  Auswärtsspiele pro Team:');
  gastSpiele.forEach((count, teamId) => {
    const team = teams.find(t => t.team_id === teamId);
    console.log(`    - ${team?.name || 'Unknown'} (${teamId}): ${count}`);
  });
  
  // 4. Tabellen-Einträge
  const tabellen = await db.liga_tabellen.toArray();
  console.log('\n📊 TABELLEN-EINTRÄGE:', tabellen.length);
  
  const tabellenByLiga = new Map<string, any[]>();
  tabellen.forEach(eintrag => {
    const key = eintrag.ligaid;
    if (!tabellenByLiga.has(key)) {
      tabellenByLiga.set(key, []);
    }
    tabellenByLiga.get(key)?.push(eintrag);
  });
  
  tabellenByLiga.forEach((eintraege, ligaId) => {
    console.log(`  Liga ${ligaId}: ${eintraege.length} Teams`);
    eintraege.forEach(e => {
      console.log(`    - ${e.teamname}: Platz ${e.platz}, ${e.spiele} Spiele`);
    });
  });
  
  // 5. Ligen
  const ligen = await db.ligen.toArray();
  console.log('\n🏆 LIGEN:', ligen.length);
  ligen.forEach(liga => {
    console.log(`  - ${liga.name} (${liga.liga_id})`, {
      bbb_liga_id: liga.bbb_liga_id,
      saison: liga.saison,
      altersklasse: liga.altersklasse
    });
  });
  
  // 6. Problem-Diagnose (v7.0)
  console.log('\n⚠️  PROBLEM-DIAGNOSE:');

  for (const team of teams.filter(t => t.team_typ === 'eigen' && t.user_id)) {
    const heimSpiele = spiele.filter(s => s.heim_team_id === team.team_id);
    const gastSpiele = spiele.filter(s => s.gast_team_id === team.team_id);
    const teamParticipation = participations.find(p => p.team_id === team.team_id && p.ist_aktiv);

    console.log(`\n  Team: ${team.name}`);
    console.log(`    - team_id: ${team.team_id}`);
    console.log(`    - extern_permanent_id: ${team.extern_permanent_id || 'FEHLT!'}`);
    console.log(`    - Participation liga_id: ${teamParticipation?.liga_id || 'FEHLT!'}`);
    console.log(`    - Participation altersklasse: ${teamParticipation?.altersklasse || 'FEHLT!'}`);
    console.log(`    - Participation saison: ${teamParticipation?.saison || 'FEHLT!'}`);
    console.log(`    - Heimspiele: ${heimSpiele.length}`);
    console.log(`    - Auswärtsspiele: ${gastSpiele.length}`);
    console.log(`    - GESAMT: ${heimSpiele.length + gastSpiele.length}`);

    if (teamParticipation?.liga_id) {
      const tabellenEintrag = tabellen.find(t =>
        t.ligaid === teamParticipation.liga_id && t.teamname === team.name
      );
      console.log(`    - Tabellen-Eintrag: ${tabellenEintrag ? '✅ JA' : '❌ NEIN'}`);
    }

    // Diagnose
    if (!team.extern_permanent_id) {
      console.log(`    ⚠️  PROBLEM: extern_permanent_id fehlt → Team-Merge fehlgeschlagen!`);
    }
    if (!teamParticipation) {
      console.log(`    ⚠️  PROBLEM: Keine aktive Participation → Keine Liga zugeordnet!`);
    }
    if (heimSpiele.length === 0 && gastSpiele.length === 0) {
      console.log(`    ⚠️  PROBLEM: Keine Spiele gefunden mit heim_team_id/gast_team_id!`);
    }
  }
  
  console.log('\n🔍 ====== DEBUG ENDE ======\n');
  
  return {
    teams,
    spiele,
    tabellen,
    ligen
  };
}

// Export für Console-Zugriff
if (typeof window !== 'undefined') {
  (window as any).__DEBUG_TEAM_DATA__ = debugTeamData;
}
