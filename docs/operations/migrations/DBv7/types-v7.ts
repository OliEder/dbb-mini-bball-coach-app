// ============================================
// DB v7.0 Types - Team-Liga-Relationships
// ============================================

/**
 * Team - Permanente Entität (unabhängig von Liga/Saison)
 * 
 * Ein Team repräsentiert eine Basketball-Mannschaft über mehrere Saisons.
 * Die Zuordnung zu Ligen/Saisons erfolgt über TeamLigaParticipation.
 * 
 * @changes v7.0:
 * - REMOVED: altersklasse (→ TeamLigaParticipation)
 * - REMOVED: saison (→ TeamLigaParticipation)  
 * - REMOVED: liga_id (→ TeamLigaParticipation)
 * - RENAMED: extern_team_id → extern_permanent_id
 * - ADDED: extern_permanent_id = BBB teamPermanentId
 */
export interface Team {
  team_id: UUID;
  extern_permanent_id: string;      // ✅ BBB teamPermanentId (bleibt über Saisons)
  verein_id: UUID;                  // → Verein
  name: string;                     // Display-Name
  trainer: string;                  // Trainer-Name
  team_typ: 'eigen' | 'gegner';     // Eigenes Team oder Gegner
  user_id?: UUID;                   // Optional: Zuordnung zum User/Trainer
  created_at: Date;
  updated_at?: Date;
}

/**
 * TeamLigaParticipation - Team spielt in Liga
 * 
 * Repräsentiert die Teilnahme eines Teams an einer Liga in einer Saison.
 * Ein Team kann über mehrere Saisons in verschiedenen Ligen spielen.
 * 
 * @example
 * Team "FC Tegernheim U12" spielt:
 * - 2024/25: U12 Bezirksliga (participation_1)
 * - 2025/26: U12 Bezirksoberliga (participation_2, aufgestiegen)
 * 
 * @since v7.0
 */
export interface TeamLigaParticipation {
  participation_id: UUID;
  team_id: UUID;                    // → Team (Foreign Key)
  liga_id: string;                  // BBB Liga-ID
  extern_season_team_id: string;    // BBB seasonTeamId (temporär pro Saison)
  altersklasse: Altersklasse;       // Altersklasse dieser Participation
  saison: string;                   // Format: "2024/25"
  ist_aktiv: boolean;               // Ist dies die aktuelle Saison?
  created_at: Date;
}

/**
 * Helper Type: Team mit aktueller Participation
 * Für UI-Darstellung: Team + aktuelle Liga/Saison
 */
export interface TeamMitParticipation extends Team {
  // Aktuelle Participation-Daten
  current_liga_id?: string;
  current_altersklasse?: Altersklasse;
  current_saison?: string;
  current_participation_id?: UUID;
}

/**
 * Helper Type: Team-Stats für Dashboard
 */
export interface TeamStats {
  team_id: UUID;
  name: string;
  altersklasse: Altersklasse;
  saison: string;
  spieler_count: number;
  spiele_total: number;
  spiele_gewonnen: number;
  spiele_verloren: number;
  naechstes_spiel?: {
    datum: Date;
    gegner: string;
    ist_heimspiel: boolean;
  };
  tabellenplatz?: number;
}

// ============================================
// BBB API Response Types (Reference)
// ============================================

/**
 * BBB API Team Response
 * @see DBB-API-COMPLETE-DOCUMENTATION.md
 */
export interface BBBTeamResponse {
  seasonTeamId: number;        // ❌ Temporär pro Saison
  teamCompetitionId: number;   // ❌ Temporär pro Liga
  teamPermanentId: number;     // ✅ PERMANENT über Saisons
  teamname: string;
  teamnameSmall: string | null;
  clubId: number;
  verzicht: boolean;
}

/**
 * BBB API Tabellen-Eintrag
 */
export interface BBBTabellenEintrag {
  rang: number;
  team: BBBTeamResponse;
  anzspiele: number;
  anzGewinnpunkte: number;
  anzVerlustpunkte: number;
  s: number;                   // Siege
  n: number;                   // Niederlagen
  koerbe: number;              // Erzielte Körbe
  gegenKoerbe: number;         // Erhaltene Körbe
  korbdiff: number;            // Differenz
}

/**
 * BBB API Spielplan-Eintrag
 */
export interface BBBSpielplanEintrag {
  matchId: number;
  gameNumber: number;
  gameDay: number;
  kickoffDate: string;         // YYYY-MM-DD
  kickoffTime: string;         // HH:MM
  homeTeam: BBBTeamResponse;
  guestTeam: BBBTeamResponse;
  result: string | null;       // "36:62" oder null
  ergebnisbestaetigt: boolean;
  statisticType: string | null;
  verzicht: boolean;
  abgesagt: boolean;
  matchResult: any;
  matchInfo: any;
  matchBoxscore: any;
  playByPlay: any;
  hasPlayByPlay: boolean | null;
}
