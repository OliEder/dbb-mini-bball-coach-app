/**
 * BBBSyncService - Synchronisiert Liga-Daten aus DBB REST API
 * 
 * Funktionen:
 * - Vollständige Liga-Daten laden (alle Teams, alle Spiele)
 * - Teams & Vereine aus Tabelle extrahieren
 * - Spielplan mit Team-Referenzen
 * - Venues aus Match-Info
 */

import { db } from '../../../shared/db/database';
import { bbbApiService } from './BBBApiService';
import type {
  Liga,
  Team,
  Verein,
  Spiel,
  Halle,
  Spieler,
  Altersklasse,
  WamLigaEintrag,
  DBBTabellenEintrag,
  DBBSpielplanEintrag
} from '../../../shared/types';

export class BBBSyncService {
  private apiService: typeof bbbApiService;
  
  constructor(apiService?: typeof bbbApiService) {
    this.apiService = apiService || bbbApiService;
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
   */
  async syncTabelleAndTeams(ligaId: number): Promise<void> {
    const tableResponse = await this.apiService.getTabelle(ligaId);

    // 1. Liga erstellen/updaten
    const liga = await this.createOrUpdateLiga({
      ligaId: ligaId, // Use passed ligaId, not from response
      liganame: tableResponse.liganame,
    });

    // 2. Für jedes Team in der Tabelle
    for (const eintrag of tableResponse.teams) {
      // 2.1 Verein erstellen/finden
      const verein = await this.createOrFindVerein({
        clubId: eintrag.clubId,
        clubName: eintrag.clubName,
      });

      // 2.2 Team erstellen/finden
      const team = await this.createOrFindTeam({
        teamId: eintrag.teamId,
        teamName: eintrag.teamName,
        vereinId: verein.verein_id,
        ligaId: liga.liga_id,
      });

      // 2.3 Tabellen-Eintrag speichern
      await this.saveTabellenEintrag(liga.liga_id, eintrag);
    }
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
      .where('heim_team_id')
      .notEqual('')
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
   */
  async syncSpielplan(ligaId: number): Promise<void> {
    const spielplanResponse = await this.apiService.getSpielplan(ligaId);

    // Für jedes Spiel
    for (const spielEintrag of spielplanResponse.games) {
      // 1. Heim- und Gast-Team finden
      const heimTeam = await this.findTeamByExternId(spielEintrag.homeTeam.teamId);
      const gastTeam = await this.findTeamByExternId(spielEintrag.awayTeam.teamId);

      if (!heimTeam || !gastTeam) {
        console.warn(`⚠️ Team not found for Spiel ${spielEintrag.matchId}`);
        continue;
      }

      // 2. Halle erstellen/finden (falls venue vorhanden)
      let halleId: string | undefined;
      if (spielEintrag.venue) {
        const halle = await this.createOrFindHalle(spielEintrag.venue);
        halleId = halle.halle_id;
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
        halleId: halleId,
        status: spielEintrag.status,
        homeScore: spielEintrag.homeScore,
        awayScore: spielEintrag.awayScore,
      });
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
      const heimTeam = await this.findTeamByExternId(matchInfo.homeTeam.teamId);
      if (heimTeam) {
        await this.syncPlayersForTeam(heimTeam.team_id, matchInfo.homeTeam.players);
      }
    }

    // Gast-Team Spieler
    if (matchInfo.awayTeam?.players) {
      const gastTeam = await this.findTeamByExternId(matchInfo.awayTeam.teamId);
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
  // HELPER METHODS
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

    // Create new
    const liga: Liga = {
      liga_id: crypto.randomUUID(),
      bbb_liga_id: data.ligaId.toString(),
      name: data.liganame,
      saison: '2025/26', // TODO: Aus API extrahieren
      altersklasse: 'U10' as Altersklasse, // TODO: Aus API extrahieren
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
      ist_eigener_verein: false, // Default: Gegner-Verein
      created_at: new Date(),
    };

    await db.vereine.add(verein);
    return verein;
  }

  /**
   * Erstellt oder findet Team
   */
  private async createOrFindTeam(data: {
    teamId: number;
    teamName: string;
    vereinId: string;
    ligaId: string;
  }): Promise<Team> {
    // Suche nach extern_team_id
    let team = await db.teams
      .where('extern_team_id')
      .equals(data.teamId.toString())
      .first();

    if (team) {
      return team;
    }

    // Erstelle neues Team
    team = {
      team_id: crypto.randomUUID(),
      extern_team_id: data.teamId.toString(),
      verein_id: data.vereinId,
      name: data.teamName,
      trainer: '', // Wird später gesetzt
      altersklasse: 'U10' as Altersklasse, // TODO: Aus Liga extrahieren
      saison: '2025/26', // TODO: Aus Liga extrahieren
      team_typ: 'gegner', // Default: alle sind Gegner
      created_at: new Date(),
    };

    await db.teams.add(team);
    return team;
  }

  /**
   * Findet Team anhand extern_team_id
   */
  private async findTeamByExternId(teamId: number): Promise<Team | undefined> {
    return await db.teams
      .where('extern_team_id')
      .equals(teamId.toString())
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

    const spielData = {
      extern_spiel_id: data.matchId.toString(),
      spielnr: data.gameNumber,
      spieltag: data.gameDay,
      datum: new Date(data.date),
      uhrzeit: data.time,
      heim_team_id: data.heimTeamId,
      gast_team_id: data.gastTeamId,
      heim: heimTeam?.name || '',
      gast: gastTeam?.name || '',
      halle_id: data.halleId,
      ist_heimspiel: false, // Wird später gesetzt
      status: statusMap[data.status] || 'geplant',
      ergebnis_heim: data.homeScore,
      ergebnis_gast: data.awayScore,
      altersklasse: 'U10' as Altersklasse, // TODO: Aus Liga
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
      team_id: data.heimTeamId, // Hauptteam setzen
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
    // Prüfe ob bereits vorhanden
    const existing = await db.liga_tabellen
      .where('[ligaid+teamname]')
      .equals([ligaId, eintrag.teamName])
      .first();

    const data = {
      ligaid: ligaId,
      teamname: eintrag.teamName,
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
