// Debug Helper für Spielplan-Problem
// Füge dies in die Browser Console ein oder temporär in deine App

import { db } from '@/shared/db/database';
import type { Spiel } from '@/shared/types';

export async function debugSpielplanIssue() {
  console.group('🔍 Spielplan Debug');
  
  // 1. Check was in DB ist
  const spiele = await db.spiele.toArray();
  const teams = await db.teams.toArray();
  
  console.log(`📊 Daten in IndexedDB:`);
  console.log(`   - ${spiele.length} Spiele`);
  console.log(`   - ${teams.length} Teams`);
  
  // 2. Check nach Duplikaten
  const uniqueGames = new Set();
  const duplicates: Spiel[] = [];
  
  spiele.forEach(spiel => {
    const key = `${spiel.heim}-${spiel.gast}-${spiel.datum}`;
    if (uniqueGames.has(key)) {
      duplicates.push(spiel);
    }
    uniqueGames.add(key);
  });
  
  if (duplicates.length > 0) {
    console.warn(`⚠️ ${duplicates.length} Duplikate gefunden:`, duplicates);
  }
  
  // 3. Check Team-Zuordnung
  if (teams.length > 0 && spiele.length > 0) {
    const teamId = teams[0].team_id;
    const teamSpiele = spiele.filter(s => s.team_id === teamId);
    console.log(`🎯 Spiele für Team ${teams[0].name}: ${teamSpiele.length}`);
  }
  
  console.groupEnd();
  
  return { spiele, teams, duplicates };
}

// Funktion zum Bereinigen
export async function clearSpielplanData() {
  const confirm = window.confirm('Alle Spielplan-Daten löschen?');
  if (confirm) {
    await db.spiele.clear();
    console.log('✅ Spielplan-Daten gelöscht');
    window.location.reload(); // UI neu laden
  }
}

// Automatisch ausführen
debugSpielplanIssue();
