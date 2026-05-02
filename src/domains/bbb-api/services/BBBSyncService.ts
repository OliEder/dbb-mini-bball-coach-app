/**
 * BBBSyncService v7.0 - Synchronisiert Liga-Daten aus DBB REST API
 * 
 * CHANGES v7.0:
 * - Team-Deduplizierung über teamPermanentId (extern_permanent_id)
 * - Neue Methode: createOrUpdateParticipation()
 * - Team-Creation ohne altersklasse/saison/liga_id
 * - Spiel-Queries berücksichtigen Participations
 * 
 * Funktionen:
 * - Vollständige Liga-Daten laden (alle Teams, alle Spiele)
 * - Teams & Vereine aus Tabelle extrahieren
 * - Spielplan mit Team-Referenzen
 * - Venues aus Match-Info
 */

import { db } from '@/shared/db/database';
import { bbbApiService } from './BBBApiService';
import type {
  Liga,
  Team,
  TeamLigaParticipation,
  Verein,
  Spiel,
  Halle,
  Spieler,
  Altersklasse,
  DBBTabellenEintrag,
  DBBSpielplanEintrag
} from '@/shared/types';

export class BBBSyncService {
  private apiService: typeof bbbApiService;
  
  constructor(apiService?: typeof bbbApiService) {
    this.apiService = apiService || bbbApiService;
  }

  /**
   * Extrahiert Altersklasse aus Liga-Namen
   * Beispiele: "U14 männlich Bezirksoberliga" → U14
   *            "U10 mixed Bezirksliga" → U10
   *            "U21 Regionalliga" → U21
   *            "U23 Oberliga" → U23
   *            "Herren Bezirksliga" → Senioren
   *            "Damen Regionalliga" → Senioren
   */
  private extractAltersklasseFromLiganame(liganame: string): Altersklasse {
    // Prüfe auf UXX Pattern (U7 bis U23)
    const match = liganame.match(/U(\d{1,2})/);
    if (match) {
      const altersklasse = `U${match[1]}` as Altersklasse;
      // ✅ Erweiterte Validierung für alle möglichen Altersklassen
      const validAltersklassen = [
        'U7', 'U8', 'U9',
        'U10', 'U11', 'U12', 'U13',
        'U14', 'U15', 'U16', 'U17',
        'U18', 'U19', 'U20', 'U21', 'U23'
      ];
      if (validAltersklassen.includes(altersklasse)) {
        return altersklasse;
      }
    }
    
    // Prüfe auf Senioren-Ligen (Herren/Damen/Senioren)
    const seniorenPattern = /(Herren|Damen|Senioren)/i;
    if (seniorenPattern.test(liganame)) {
      return 'Senioren';
    }
    
    // Fallback für unbekannte Ligen
    console.warn(`Could not extract Altersklasse from: ${liganame}, using Senioren as fallback`);
    return 'Senioren';
  }

  /**
   * Extrahiert Altersklasse aus Team-Namen
   * Beispiele: "SV Postbauer U12" → U12
   *            "TSV Neumarkt U14" → U14
   *            "Fibalon Baskets U21" → U21
   *            "TSV München Herren" → Senioren
   *            "DJK Augsburg Damen" → Senioren
   * 
   * WICHTIG: Team-Altersklasse kann von Liga-Altersklasse abweichen!
   * Ein U12-Team kann in einer U14-Liga spielen (hochspielen)
   */
  private extractAltersklasseFromTeamname(teamname: string): Altersklasse | null {
    // Prüfe auf UXX Pattern (U7 bis U23)
    const match = teamname.match(/U(\d{1,2})/);
    if (match) {
      const altersklasse = `U${match[1]}` as Altersklasse;
      // ✅ Erweiterte Validierung für alle möglichen Altersklassen
      const validAltersklassen = [
        'U7', 'U8', 'U9',
        'U10', 'U11', 'U12', 'U13',
        'U14', 'U15', 'U16', 'U17',
        'U18', 'U19', 'U20', 'U21', 'U23'
      ];
      if (validAltersklassen.includes(altersklasse)) {
        return altersklasse;
      }
    }
    
    // Prüfe auf Senioren-Teams (Herren/Damen)
    const seniorenPattern = /(Herren|Damen|Senioren)/i;
    if (seniorenPattern.test(teamname)) {
      return 'Senioren';
    }
    
    // Kein Fallback - gebe null zurück wenn nicht gefunden
    return null;
  }

  /**
   * Extrahiert Saison aus Liga-Namen oder ermittelt aktuelle Saison
   * Beispiele: "U14 männlich 2024/25" → "2024/25"
   *            "U10 mixed Bezirksliga" → aktuelle Saison basierend auf Datum
   * Basketball-Saison: August bis Juli
   */
  private extractSaisonFromLiganame(liganame: string): string {
    // Versuche Saison aus Liga-Namen zu extrahieren
    // Pattern: "YYYY/YY" oder "YYYY-YY"
    const saisonMatch = liganame.match(/(\d{4})[\/\-](\d{2,4})/);
    if (saisonMatch) {
      const startYear = saisonMatch[1];
      const endYear = saisonMatch[2];
      // Normalisiere auf Format "YYYY/YY"
      return `${startYear}/${endYear.length === 4 ? endYear.slice(-2) : endYear}`;
    }
    
    // Fallback: Berechne aktuelle Saison basierend auf Datum
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    
    // Wenn August-Dezember: Saison startet im aktuellen Jahr
    // Wenn Januar-Juli: Saison startete im Vorjahr
    const startYear = month >= 7 ? year : year - 1; // 7 = August
    const endYear = startYear + 1;
    
    return `${startYear}/${endYear.toString().slice(-2)}`;
  }
  
  /**
   * Synchronisiert eine komplette Liga (Tabelle + Spielplan)
   */
  async syncLiga(ligaId: number, options?: { skipMatchInfo?: boolean }): Promise<void> {
    console.log(`🔄 Syncing Liga ${ligaId}...`);

    try {
      // 1. Tabelle laden → Teams & Vereine
      console.log('📊 Loading Tabelle...');
      await this.syncTabelleAndTeams(ligaId);

      // 2. Spielplan laden → Spiele
      console.log('📅 Loading Spielplan...');
      await this.syncSpielplan(ligaId);

      // 3. Venues aus Match-Infos (optional, da API-intensiv)
      if (!options?.skipMatchInfo) {
        console.log('🏟️ Loading Venues...');
        await this.syncVenues(ligaId);
      }

      console.log(`✅ Liga ${ligaId} synced successfully`);
    } catch (error) {
      console.error(`❌ Failed to sync Liga ${ligaId}:`, error);
      throw error;
    }
  }

  /**
   * Synchronisiert Tabelle und extrahiert Teams + Vereine
   * 
   * v7.0: Nutzt teamPermanentId für Team-Deduplizierung
   * v7.0: API-Response-Struktur ist verschachtelt: eintrag.team.*
   */
  async syncTabelleAndTeams(ligaId: number): Promise<void> {
    const tableResponse = await this.apiService.getTabelle(ligaId);
    console.log('📊 Tabelle Response:', tableResponse);
    
    // Validiere Response - leere Arrays sind valide (neue Ligen)
    if (!tableResponse) {
      console.error('Invalid table response - no response:', tableResponse);
      throw new Error(`No table response for Liga ${ligaId}`);
    }
    
    if (!Array.isArray(tableResponse.teams)) {
      console.error('Invalid table response - teams is not an array:', tableResponse);
      throw new Error(`Invalid teams structure in table response for Liga ${ligaId}`);
    }
    
    console.log('📊 Teams count:', tableResponse.teams.length);

    // 1. Liga erstellen/updaten
    const liga = await this.createOrUpdateLiga({
      ligaId: ligaId, // Use passed ligaId, not from response
      liganame: tableResponse.liganame || `Liga ${ligaId}`,
    });
    console.log('✅ Liga created/updated:', liga.liga_id);

    // 2. Für jedes Team in der Tabelle
    for (const eintrag of tableResponse.teams) {
      // ✅ KRITISCH: API-Response hat verschachtelte Struktur!
      // OLD (falsch): eintrag.teamId, eintrag.teamName
      // NEW (korrekt): eintrag.team.teamPermanentId, eintrag.team.teamname
      
      // Prüfe ob team-Objekt existiert (alte vs. neue API-Response)
      const teamData = (eintrag as any).team || eintrag; // Backward compatibility
      
      console.log('🔄 Processing team:', teamData.teamname || teamData.teamName, 
                  'permanentId:', teamData.teamPermanentId, 
                  'seasonId:', teamData.seasonTeamId || teamData.teamId);
      
      // 2.1 Verein erstellen/finden
      const verein = await this.createOrFindVerein({
        clubId: teamData.clubId,
        clubName: teamData.clubName,
      });
      console.log('✅ Verein:', verein.name);

      // 2.2 Team erstellen/finden (v7.0: über teamPermanentId)
      // teamData.teamPermanentId ist jetzt korrekt gemappt, teamId ist seasonTeamId (Fallback)
      const team = await this.createOrFindTeam({
        teamPermanentId: teamData.teamPermanentId || teamData.teamId,
        teamName: teamData.teamname || teamData.teamName,
        vereinId: verein.verein_id,
      });
      console.log('✅ Team:', team.name);

      // 2.3 Team-Liga-Participation erstellen/updaten (NEU v7.0)
      const teamAltersklasse = this.extractAltersklasseFromTeamname(team.name);
      const altersklasse = teamAltersklasse || liga.altersklasse; // Fallback zur Liga-AK
      
      await this.createOrUpdateParticipation({
        teamId: team.team_id,
        ligaId: liga.liga_id,
        seasonTeamId: teamData.seasonTeamId || teamData.teamId, // seasonTeamId für diese Saison
        altersklasse: altersklasse,
        saison: liga.saison,
      });
      console.log('✅ Participation created/updated');

      // 2.4 Tabellen-Eintrag speichern
      await this.saveTabellenEintrag(liga.liga_id, eintrag);
      console.log('✅ Tabellen-Eintrag gespeichert');
    }
    
    console.log('✅ syncTabelleAndTeams completed');
  }

  /**
   * Synchronisiert Venues und Spieler aus Match-Infos
   */
  async syncVenues(ligaId: number): Promise<void> {
    // Hole alle Spiele der Liga
    const liga = await db.ligen
      .where('bbb_liga_id')
      .equals(ligaId.toString())
      .first();

    if (!liga) {
      console.warn(`Liga ${ligaId} not found in DB`);
      return;
    }

    const spiele = await db.spiele
      .where('liga_id')
      .equals(liga.liga_id)
      .toArray();

    // Für jedes Spiel: Hole Match-Info für Spieler-Details
    for (const spiel of spiele) {
      if (!spiel.extern_spiel_id) continue;

      try {
        const matchId = parseInt(spiel.extern_spiel_id, 10);
        if (isNaN(matchId)) continue;

        const matchInfo = await this.apiService.getMatchInfo(matchId);

        // Sync Spieler des Heim-Teams
        if (matchInfo.homeTeam.players && matchInfo.homeTeam.players.length > 0) {
          const heimTeam = spiel.heim_team_id ? await db.teams.get(spiel.heim_team_id) : undefined;
          if (heimTeam) {
            for (const player of matchInfo.homeTeam.players) {
              await this.createOrUpdateSpieler({
                playerId: player.playerId,
                firstName: player.firstName,
                lastName: player.lastName,
                jerseyNumber: player.jerseyNumber,
                tnaNumber: player.tnaNumber,
                teamId: heimTeam.team_id,
              });
            }
          }
        }

        // Sync Spieler des Gast-Teams
        if (matchInfo.awayTeam.players && matchInfo.awayTeam.players.length > 0) {
          const gastTeam = spiel.gast_team_id ? await db.teams.get(spiel.gast_team_id) : undefined;
          if (gastTeam) {
            for (const player of matchInfo.awayTeam.players) {
              await this.createOrUpdateSpieler({
                playerId: player.playerId,
                firstName: player.firstName,
                lastName: player.lastName,
                jerseyNumber: player.jerseyNumber,
                tnaNumber: player.tnaNumber,
                teamId: gastTeam.team_id,
              });
            }
          }
        }

        // Update Venue details if more complete
        if (matchInfo.venue && spiel.halle_id) {
          const halle = await db.hallen.get(spiel.halle_id);
          if (halle && matchInfo.venue.city && !halle.ort) {
            await db.hallen.update(halle.halle_id, {
              ort: matchInfo.venue.city,
              plz: matchInfo.venue.zipCode || halle.plz,
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to sync match info for Spiel ${spiel.extern_spiel_id}:`, error);
        // Continue with next match
      }
    }
  }

  /**
   * Erstellt oder updated Spieler
   */
  private async createOrUpdateSpieler(data: {
    playerId: number;
    firstName: string;
    lastName: string;
    jerseyNumber?: number;
    tnaNumber?: string;
    teamId: string;
  }): Promise<Spieler> {
    // Suche nach extern_spieler_id
    const existingSpieler = await db.spieler
      .where('extern_spieler_id')
      .equals(data.playerId.toString())
      .first();

    const team = await db.teams.get(data.teamId);

    const spielerData = {
      extern_spieler_id: data.playerId.toString(),
      team_id: data.teamId,
      vorname: data.firstName,
      nachname: data.lastName,
      trikotnummer: data.jerseyNumber,
      tna_letzten_drei: data.tnaNumber,
      spieler_typ: team?.team_typ === 'eigen' ? 'eigenes_team' as const : 'gegner' as const,
      aktiv: true,
      updated_at: new Date(),
    };

    if (existingSpieler) {
      // Update
      await db.spieler.update(existingSpieler.spieler_id, spielerData);
      return { ...existingSpieler, ...spielerData };
    }

    // Create new
    const spieler: Spieler = {
      spieler_id: crypto.randomUUID(),
      ...spielerData,
      created_at: new Date(),
    };

    await db.spieler.add(spieler);
    return spieler;
  }

  /**
   * Synchronisiert Spielplan
   * 
   * v7.0: Team-IDs werden über teamPermanentId gefunden
   */
  async syncSpielplan(ligaId: number): Promise<void> {
    const spielplanResponse = await this.apiService.getSpielplan(ligaId);
    console.log('📈 Spielplan Response games count:', spielplanResponse.games?.length || 0);

    // Finde Liga in DB für interne liga_id (UUID)
    const liga = await db.ligen
      .where('bbb_liga_id')
      .equals(ligaId.toString())
      .first();
    
    if (!liga) {
      console.error('❌ Liga not found in DB:', ligaId);
      throw new Error(`Liga ${ligaId} not found in DB`);
    }
    
    console.log('✅ Liga gefunden, UUID:', liga.liga_id);

    // Für jedes Spiel
    for (const spielEintrag of spielplanResponse.games) {
      console.log('🔄 Processing Spiel:', spielEintrag.matchId, spielEintrag.homeTeam.teamName, 'vs', spielEintrag.awayTeam.teamName);
      
      // ✅ v7.0: Heim- und Gast-Team finden (über permanentId)
      const heimPermanentId = spielEintrag.homeTeam.teamPermanentId || spielEintrag.homeTeam.teamId;
      const gastPermanentId = spielEintrag.awayTeam.teamPermanentId || spielEintrag.awayTeam.teamId;
      const heimTeam = await this.findTeamByPermanentId(heimPermanentId);
      const gastTeam = await this.findTeamByPermanentId(gastPermanentId);

      if (!heimTeam || !gastTeam) {
        console.warn(`⚠️ Team not found for Spiel ${spielEintrag.matchId} - Heim: ${heimTeam?.name || 'NOT FOUND'}, Gast: ${gastTeam?.name || 'NOT FOUND'}`);
        continue;
      }
      
      console.log('✅ Teams found - Heim:', heimTeam.name, 'Gast:', gastTeam.name);

      // 2. Halle erstellen/finden (falls venue vorhanden)
      let halleId: string | undefined;
      if (spielEintrag.venue) {
        const halle = await this.createOrFindHalle(spielEintrag.venue);
        halleId = halle.halle_id;
        console.log('✅ Halle:', halle.name);
      }

      // 3. Spiel erstellen/updaten
      await this.createOrUpdateSpiel({
        matchId: spielEintrag.matchId,
        gameNumber: spielEintrag.gameNumber,
        gameDay: spielEintrag.gameDay,
        date: spielEintrag.date,
        time: spielEintrag.time,
        heimTeamId: heimTeam.team_id,
        gastTeamId: gastTeam.team_id,
        ligaId: liga.liga_id,  // ⭐ WICHTIG: Liga-UUID übergeben!
        halleId: halleId,
        status: spielEintrag.status,
        homeScore: spielEintrag.homeScore,
        awayScore: spielEintrag.awayScore,
      });
      console.log('✅ Spiel created/updated');
    }
    
    console.log('✅ syncSpielplan completed');
  }

  /**
   * Synchronisiert den Spielplan eines Teams über den /rest/team/id/{teamPermanentId}/matches Endpunkt.
   * Primär: ein einziger Call für alle Ligen.
   * Fallback: bei Fehler wird pro fallbackLigaId getSpielplan aufgerufen.
   */
  async syncSpielplanForTeam(
    teamPermanentId: number,
    options?: { fallbackLigaIds?: number[] }
  ): Promise<void> {
    if (teamPermanentId <= 0) {
      throw new Error(`Ungültige teamPermanentId: ${teamPermanentId}`);
    }

    try {
      const response = await this.apiService.getTeamMatches(teamPermanentId);
      console.log(`📈 getTeamMatches: ${response.matches.length} Spiele für Team ${response.teamName}`);

      for (const match of response.matches) {
        const heimPermanentId = match.homeTeam.teamPermanentId || match.homeTeam.teamId;
        const gastPermanentId = match.awayTeam.teamPermanentId || match.awayTeam.teamId;
        const heimTeam = await this.findTeamByPermanentId(heimPermanentId);
        const gastTeam = await this.findTeamByPermanentId(gastPermanentId);

        if (!heimTeam || !gastTeam) {
          console.warn(`⚠️ Team nicht gefunden für Spiel ${match.matchId} - Heim: ${heimTeam?.name || 'NOT FOUND'}, Gast: ${gastTeam?.name || 'NOT FOUND'}`);
          continue;
        }

        // Liga über bbb_liga_id finden
        const liga = await db.ligen
          .where('bbb_liga_id')
          .equals(String(match.ligaId))
          .first();

        if (!liga) {
          console.warn(`⚠️ Liga ${match.ligaId} (${match.liganame}) nicht in DB`);
          continue;
        }

        await this.createOrUpdateSpiel({
          matchId: match.matchId,
          gameNumber: match.gameNumber,
          gameDay: match.gameDay,
          date: match.date,
          time: match.time,
          heimTeamId: heimTeam.team_id,
          gastTeamId: gastTeam.team_id,
          ligaId: liga.liga_id,
          halleId: undefined,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        });
      }

      console.log('✅ syncSpielplanForTeam completed');
    } catch (error) {
      console.warn(`⚠️ getTeamMatches fehlgeschlagen für teamPermanentId ${teamPermanentId}:`, error);

      const fallbackLigaIds = options?.fallbackLigaIds ?? [];
      if (fallbackLigaIds.length === 0) {
        throw error;
      }

      console.log(`🔄 Fallback: syncSpielplan für ${fallbackLigaIds.length} Liga(en)`);
      for (const ligaId of fallbackLigaIds) {
        await this.syncSpielplan(ligaId);
      }
    }
  }

  /**
   * Synchronisiert Venues aus Match-Infos (Alternative Methode für Spielplan)
   */
  private async syncVenuesFromSpielplan(ligaId: number): Promise<void> {
    // Hole alle Spiele der Liga
    const spiele = await db.spiele
      .where('liga_id')
      .equals(ligaId.toString())
      .toArray();

    // Batch-Processing mit Rate-Limiting
    await this.apiService.batchProcess(
      spiele,
      async (spiel) => {
        if (!spiel.extern_spiel_id || spiel.halle_id) {
          return; // Skip: Kein extern_spiel_id oder Halle bereits gesetzt
        }

        try {
          const matchInfo = await this.apiService.getMatchInfo(
            parseInt(spiel.extern_spiel_id)
          );

          if (matchInfo.venue) {
            const halle = await this.createOrFindHalle(matchInfo.venue);

            // Update Spiel mit Halle
            await db.spiele.update(spiel.spiel_id, {
              halle_id: halle.halle_id,
            });

            // Optional: Spieler aus Match-Info extrahieren
            await this.extractPlayersFromMatchInfo(matchInfo);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load MatchInfo for Spiel ${spiel.spiel_id}:`, error);
        }
      },
      5, // 5 parallele Requests
      500 // 500ms Delay
    );
  }

  /**
   * Extrahiert Spieler aus Match-Info (für Gegner-Teams)
   */
  private async extractPlayersFromMatchInfo(matchInfo: any): Promise<void> {
    // Heim-Team Spieler
    if (matchInfo.homeTeam?.players) {
      const heimPermanentId = matchInfo.homeTeam.teamPermanentId || matchInfo.homeTeam.teamId;
      const heimTeam = await this.findTeamByPermanentId(heimPermanentId);
      if (heimTeam) {
        await this.syncPlayersForTeam(heimTeam.team_id, matchInfo.homeTeam.players);
      }
    }

    // Gast-Team Spieler
    if (matchInfo.awayTeam?.players) {
      const gastPermanentId = matchInfo.awayTeam.teamPermanentId || matchInfo.awayTeam.teamId;
      const gastTeam = await this.findTeamByPermanentId(gastPermanentId);
      if (gastTeam) {
        await this.syncPlayersForTeam(gastTeam.team_id, matchInfo.awayTeam.players);
      }
    }
  }

  /**
   * Synchronisiert Spieler für ein Team
   */
  private async syncPlayersForTeam(teamId: string, players: any[]): Promise<void> {
    for (const player of players) {
      // Prüfe ob Spieler bereits existiert
      const existingSpieler = await db.spieler
        .where('extern_spieler_id')
        .equals(player.playerId.toString())
        .first();

      if (!existingSpieler) {
        // Erstelle neuen Spieler
        const spieler: Spieler = {
          spieler_id: crypto.randomUUID(),
          extern_spieler_id: player.playerId.toString(),
          team_id: teamId,
          vorname: player.firstName,
          nachname: player.lastName,
          trikotnummer: player.jerseyNumber,
          tna_letzten_drei: player.tnaNumber,
          spieler_typ: 'gegner',
          aktiv: true,
          created_at: new Date(),
        };

        await db.spieler.add(spieler);
      }
    }
  }

  /**
   * Markiert ein Team als "eigen" (vom User)
   */
  async markAsOwnTeam(teamId: string, userId: string): Promise<void> {
    await db.teams.update(teamId, {
      team_typ: 'eigen',
      user_id: userId,
      updated_at: new Date(),
    });

    console.log(`✅ Team ${teamId} marked as own for User ${userId}`);
  }

  /**
   * Markiert mehrere Teams als "eigen"
   */
  async markMultipleAsOwnTeams(teamIds: string[], userId: string): Promise<void> {
    for (const teamId of teamIds) {
      await this.markAsOwnTeam(teamId, userId);
    }
  }

  // ============================================
  // HELPER METHODS v7.0
  // ============================================

  /**
   * Erstellt oder updated Liga
   */
  private async createOrUpdateLiga(data: {
    ligaId: number;
    liganame: string;
  }): Promise<Liga> {
    // Validate ligaId
    if (!data.ligaId || typeof data.ligaId !== 'number') {
      throw new Error(`Invalid ligaId: ${data.ligaId}`);
    }

    const existingLiga = await db.ligen
      .where('bbb_liga_id')
      .equals(data.ligaId.toString())
      .first();

    if (existingLiga) {
      // Update
      await db.ligen.update(existingLiga.liga_id, {
        name: data.liganame,
        sync_am: new Date(),
      });
      return { ...existingLiga, name: data.liganame };
    }

    // Create new - Extract Altersklasse and Saison from Liganame
    const altersklasse = this.extractAltersklasseFromLiganame(data.liganame);
    const saison = this.extractSaisonFromLiganame(data.liganame);
    
    const liga: Liga = {
      liga_id: crypto.randomUUID(),
      bbb_liga_id: data.ligaId.toString(),
      name: data.liganame,
      saison: saison,
      altersklasse: altersklasse,
      sync_am: new Date(),
      created_at: new Date(),
    };

    await db.ligen.add(liga);
    return liga;
  }

  /**
   * Erstellt oder findet Verein
   */
  private async createOrFindVerein(data: {
    clubId: number;
    clubName: string;
  }): Promise<Verein> {
    // Suche nach extern_verein_id
    let verein = await db.vereine
      .where('extern_verein_id')
      .equals(data.clubId.toString())
      .first();

    if (!verein) {
      // Suche nach Name (Fallback)
      verein = await db.vereine
        .where('name')
        .equals(data.clubName)
        .first();
    }

    if (verein) {
      return verein;
    }

    // Erstelle neuen Verein
    verein = {
      verein_id: crypto.randomUUID(),
      extern_verein_id: data.clubId.toString(),
      name: data.clubName,
      ort: '', // Unknown for API-synced clubs
      ist_eigener_verein: false, // Default: Gegner-Verein
      created_at: new Date(),
    };

    await db.vereine.add(verein);
    return verein;
  }

  /**
   * Erstellt oder findet Team (v7.0: über teamPermanentId)
   * 
   * WICHTIG: Team ist jetzt saisonen-unabhängig!
   * Liga/Saison-Zuordnung erfolgt über TeamLigaParticipation
   */
  private async createOrFindTeam(data: {
    teamPermanentId: number;
    teamName: string;
    vereinId: string;
  }): Promise<Team> {
    // ✅ v7.0: Suche nach teamPermanentId (permanent!)
    let team = await db.teams
      .where('extern_permanent_id')
      .equals(data.teamPermanentId.toString())
      .first();

    if (team) {
      // ✅ UPDATE: Aktualisiere Team-Name falls geändert
      if (team.name !== data.teamName) {
        await db.teams.update(team.team_id, {
          name: data.teamName,
          updated_at: new Date(),
        });
        return { ...team, name: data.teamName };
      }
      return team;
    }

    // Erstelle neues Team (ohne Liga/Saison/Altersklasse!)
    team = {
      team_id: crypto.randomUUID(),
      extern_permanent_id: data.teamPermanentId.toString(),
      verein_id: data.vereinId,
      name: data.teamName,
      trainer: '', // Wird später gesetzt
      team_typ: 'gegner', // Default: alle sind Gegner
      created_at: new Date(),
    };

    await db.teams.add(team);
    return team;
  }

  /**
   * Erstellt oder updated Team-Liga-Participation (NEU v7.0)
   * 
   * Repräsentiert: Team spielt in Liga in Saison mit Altersklasse
   */
  private async createOrUpdateParticipation(data: {
    teamId: string;
    ligaId: string;
    seasonTeamId: number;
    altersklasse: Altersklasse;
    saison: string;
  }): Promise<TeamLigaParticipation> {
    // Suche nach existierender Participation für Team+Liga
    const existing = await db.team_liga_participations
      .where('[team_id+liga_id]')
      .equals([data.teamId, data.ligaId])
      .first();

    const participationData = {
      team_id: data.teamId,
      liga_id: data.ligaId,
      extern_team_id: data.seasonTeamId.toString(),
      altersklasse: data.altersklasse,
      saison: data.saison,
      ist_aktiv: true, // Neu synchronisierte Participations sind aktiv
    };

    if (existing) {
      // Update existing
      await db.team_liga_participations.update(existing.id, participationData);
      return { ...existing, ...participationData };
    }

    // Create new - Let Dexie handle auto-increment
    const newParticipation = await db.team_liga_participations.add({
      ...participationData,
      created_at: new Date(),
    });

    // Fetch the created participation
    const participation = await db.team_liga_participations.get(newParticipation);
    if (!participation) {
      throw new Error('Failed to create participation');
    }
    
    return participation;
  }

  /**
   * Findet Team anhand teamPermanentId (v7.0)
   */
  private async findTeamByPermanentId(teamPermanentId: number): Promise<Team | undefined> {
    return await db.teams
      .where('extern_permanent_id')
      .equals(teamPermanentId.toString())
      .first();
  }

  /**
   * Erstellt oder findet Halle
   */
  private async createOrFindHalle(venue: {
    name: string;
    address?: string;
    city?: string;
    zipCode?: string;
  }): Promise<Halle> {
    // Suche nach Name
    let halle = await db.hallen
      .where('name')
      .equals(venue.name)
      .first();

    if (halle) {
      return halle;
    }

    // Parse Adresse
    let strasse = '';
    let plz = venue.zipCode || '';
    let ort = venue.city || '';

    if (venue.address) {
      // Try to parse address like "Hauptstraße 10, 92353 Postbauer-Heng"
      const fullAddressParts = venue.address.split(',');
      strasse = fullAddressParts[0]?.trim() || '';
      
      // If we have a second part and no city/zipCode, try to parse them
      if (fullAddressParts.length > 1 && (!venue.city || !venue.zipCode)) {
        const cityPart = fullAddressParts[1]?.trim() || '';
        // Match pattern like "92353 Postbauer-Heng"
        const cityMatch = cityPart.match(/^(\d{5})\s+(.+)$/);
        if (cityMatch) {
          plz = plz || cityMatch[1];
          ort = ort || cityMatch[2];
        } else {
          // Maybe it's just the city
          ort = ort || cityPart;
        }
      }
    }

    // Erstelle neue Halle
    halle = {
      halle_id: crypto.randomUUID(),
      name: venue.name,
      strasse: strasse,
      plz: plz,
      ort: ort,
      sync_am: new Date(),
      created_at: new Date(),
    };

    await db.hallen.add(halle);
    return halle;
  }

  /**
   * Erstellt oder updated Spiel
   */
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

    // ✅ v7.0: Hole Altersklasse über Participation
    const heimParticipation = await db.team_liga_participations
      .where('[team_id+liga_id]')
      .equals([data.heimTeamId, data.ligaId])
      .first();

    const heimTeam = await db.teams.get(data.heimTeamId);
    const gastTeam = await db.teams.get(data.gastTeamId);

    // Berechne ist_heimspiel basierend auf erstem eigenen Team
    let istHeim = false;
    
    if (heimTeam?.team_typ === 'eigen') {
      istHeim = true;
    } else if (gastTeam?.team_typ === 'eigen') {
      istHeim = false;
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
      ist_heimspiel: istHeim,
      status: statusMap[data.status] || 'geplant',
      ergebnis_heim: data.homeScore,
      ergebnis_gast: data.awayScore,
      altersklasse: heimParticipation?.altersklasse || 'U12' as Altersklasse,  // Fallback
      updated_at: new Date(),
    };

    if (existingSpiel) {
      // Update existing Spiel
      await db.spiele.update(existingSpiel.spiel_id, spielData);
      return { ...existingSpiel, ...spielData };
    }

    // Create new
    const spiel: Spiel = {
      spiel_id: crypto.randomUUID(),
      ...spielData,
      altersklasse: spielData.altersklasse as Altersklasse,
      created_at: new Date(),
    };

    await db.spiele.add(spiel);
    return spiel;
  }

  /**
   * Speichert Tabellen-Eintrag
   */
  private async saveTabellenEintrag(
    ligaId: string,
    eintrag: DBBTabellenEintrag
  ): Promise<void> {
    // ✅ KRITISCH: API-Response kann verschachtelt sein!
    const teamData = (eintrag as any).team || eintrag;
    const teamName = teamData.teamname || teamData.teamName;
    
    // Prüfe ob bereits vorhanden
    const existing = await db.liga_tabellen
      .where('[ligaid+teamname]')
      .equals([ligaId, teamName])
      .first();

    const data = {
      ligaid: ligaId,
      teamname: teamName,
      platz: eintrag.position,
      spiele: eintrag.games,
      siege: eintrag.wins,
      niederlagen: eintrag.losses,
      punkte: eintrag.points,
      korbe_erzielt: eintrag.scoredPoints,
      korbe_erhalten: eintrag.concededPoints,
      korb_differenz: eintrag.pointsDifference,
      heim_siege: 0, // TODO: Berechnen
      heim_niederlagen: 0,
      auswaerts_siege: 0,
      auswaerts_niederlagen: 0,
      syncam: new Date(),
    };

    if (existing) {
      await db.liga_tabellen.update(existing.id, data);
    } else {
      await db.liga_tabellen.add({
        id: crypto.randomUUID(),
        ...data,
      });
    }
  }

  /**
   * Holt alle Ligen für die ein Team Sync durchgeführt werden soll
   */
  async getLigenForSync(ligaIds: number[], options?: { skipMatchInfo?: boolean }): Promise<void> {
    for (const ligaId of ligaIds) {
      await this.syncLiga(ligaId, options);
      // Rate-Limiting zwischen Ligen
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

export const bbbSyncService = new BBBSyncService();
