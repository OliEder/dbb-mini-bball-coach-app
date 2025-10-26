/**
 * BBB API Types - Korrigiert basierend auf tatsächlichen API-Responses
 * Stand: 17.10.2025
 * 
 * WICHTIG: Diese Types basieren auf der realen API-Struktur,
 * nicht auf unseren Wunschvorstellungen!
 */

// ============= Response Wrapper =============
export interface ApiResponseWrapper<T = any> {
  timestamp: string;
  status: string;
  message: string;
  data: T;
  version?: string;
  dateFormat?: string;
  timeFormat?: string;
  timeFormatShort?: string;
  serverInstance?: string;
  username?: string | null;
  appContext?: string;
}

// ============= WAM Data Types =============

export interface WamDataRequest {
  token: number;  // 0-3 für progressive Filterung
  verbandIds: number[];
  gebietIds: string[];  // WICHTIG: String, nicht Number!
  ligatypIds: number[];
  akgGeschlechtIds: string[];
  altersklasseIds: number[];
  spielklasseIds: number[];
  sortBy?: number;
  start?: number;  // Für Paginierung
  size?: number;   // Für Paginierung
}

export interface WamDataResponseData {
  wam: WamDataRequest;  // Echo der Request-Parameter
  verbaende?: VerbandOption[];
  gebiete?: GebietOption[];
  ligatypen?: LigatypOption[];
  agkGeschlechtList?: AkgGeschlechtOption[];  // NICHT akgGeschlechtIds!
  altersklassen?: AltersklasseOption[];
  spielklassen?: SpielklasseOption[];
  ligaListe?: LigaListe;
}

export type WamDataResponse = ApiResponseWrapper<WamDataResponseData>;

export interface VerbandOption {
  id: number;
  label: string;
  hits: number;
}

export interface GebietOption {
  id: string;  // WICHTIG: String!
  bezirk: string | null;
  kreis: string | null;
  hits: number;
}

export interface AltersklasseOption {
  id: number;
  label: string;
  hits: number;
}

export interface LigatypOption {
  id: number;
  label: string;
  hits: number;
}

export interface AkgGeschlechtOption {
  id: string;
  akg: string;
  geschlecht: string;
  hits: number;
}

export interface SpielklasseOption {
  id: number;
  label: string;
  hits: number;
}

export interface LigaListe {
  startAtIndex: number;
  ligen: LigaEintrag[];
  hasMoreData: boolean;
  size: number;
}

export interface LigaEintrag {
  seasonId: number | null;
  seasonName: string | null;
  actualMatchDay: number | null;
  ligaId: number;
  liganame: string;
  liganr: number;
  skName: string;  // Spielklasse Name
  skNameSmall: string | null;
  skEbeneId: number;  // 0=Verband, 1=Bezirk, 2=Kreis
  skEbeneName: 'Verband' | 'Bezirk' | 'Kreis';
  akName: string;  // Altersklasse Name
  geschlechtId: number;
  geschlecht: string;
  verbandId: number;
  verbandName: string;
  bezirknr: number | null;
  bezirkName: string | null;
  kreisnr: number | null;
  kreisname: string | null;
  statisticType: string | null;
  vorabliga: boolean;
  tableExists: boolean | null;
  crossTableExists: boolean | null;
}

// ============= Competition Table =============

export interface CompetitionTableData {
  ligaId: number;
  liganame: string;
  teams: TabellenEintrag[];
}

export type CompetitionTableResponse = ApiResponseWrapper<CompetitionTableData>;

export interface TabellenEintrag {
  platzierung: number;  // NICHT position!
  teamId: number;
  teamname: string;  // NICHT teamName!
  spiele: number;
  gewonnen: number;  // NICHT wins!
  verloren: number;  // NICHT losses!
  punkte: number;
  korbpunkteGemacht: number;  // NICHT scoredPoints!
  korbpunkteGegen: number;    // NICHT concededPoints!
  differenz: number;
  siegeHeim: number;
  niederlagenHeim: number;
  siegeAuswaerts: number;
  niederlagenAuswaerts: number;
  // FEHLEN: clubId, clubName
}

// ============= Competition Spielplan =============

export interface CompetitionSpielplanData {
  ligaId: number;
  liganame: string;
  spielplan: SpielplanEintrag[];  // NICHT games!
}

export type CompetitionSpielplanResponse = ApiResponseWrapper<CompetitionSpielplanData>;

export interface SpielplanEintrag {
  tag: number;  // NICHT gameDay!
  nr: number;   // NICHT gameNumber!
  datum: string;
  uhrzeit: string;
  heimteamname: string;
  gastteamname: string;
  halle: string;
  heimteamid: number;
  gastteamid: number;
  spielbericht: string | null;
  spielid: number;  // NICHT matchId!
  heimTore: number | null;  // NICHT homeScore!
  gastTore: number | null;  // NICHT awayScore!
}

// ============= Match Info =============

export interface MatchInfoData {
  akgId: string;
  spielNr: string;
  spielTag: number;
  heimmannschaft: string;
  gastmannschaft: string;
  ort: string;
  datum: string;
  uhrzeit: string;
  heimErgebnis: number | null;
  gastErgebnis: number | null;
  schiedsrichter1: string | null;
  schiedsrichter2: string | null;
  kommissar: string | null;
  zuschauer: number | null;
  heimSpielerList: SpielerInfo[];
  gastSpielerList: SpielerInfo[];
  viertelErgebnisse: ViertelErgebnis[];
}

export type MatchInfoResponse = ApiResponseWrapper<MatchInfoData>;

export interface SpielerInfo {
  spielerNr: string;
  vorname: string;
  nachname: string;
  tnaLetzten3?: string;
}

export interface ViertelErgebnis {
  viertel: number;
  heimPunkte: number;
  gastPunkte: number;
}

// ============= Für Backwards Compatibility =============
// Diese Types werden in der App verwendet, müssen gemappt werden

export interface DBBTabellenEintrag {
  position: number;      // Map from platzierung
  teamId: number;
  teamName: string;      // Map from teamname
  clubId: number;        // Muss generiert werden!
  clubName: string;      // Muss extrahiert werden!
  games: number;         // Map from spiele
  wins: number;          // Map from gewonnen
  losses: number;        // Map from verloren
  points: number;        // Map from punkte
  scoredPoints: number;  // Map from korbpunkteGemacht
  concededPoints: number;// Map from korbpunkteGegen
  pointsDifference: number; // Map from differenz
}

export interface DBBSpielplanEintrag {
  matchId: number;       // Map from spielid
  gameNumber: number;    // Map from nr
  gameDay: number;       // Map from tag
  date: string;          // Map from datum
  time: string;          // Map from uhrzeit
  homeTeam: {
    teamId: number;      // Map from heimteamid
    teamName: string;    // Map from heimteamname
    clubId?: number;     // Nicht verfügbar
    clubName?: string;   // Nicht verfügbar
  };
  awayTeam: {
    teamId: number;      // Map from gastteamid
    teamName: string;    // Map from gastteamname
    clubId?: number;     // Nicht verfügbar
    clubName?: string;   // Nicht verfügbar
  };
  venue?: {
    name: string;        // Map from halle
    address?: string;    // Nicht verfügbar
  };
  status: string;        // Muss abgeleitet werden
  homeScore?: number;    // Map from heimTore
  awayScore?: number;    // Map from gastTore
}

// Alte Types für Compatibility (deprecated)
export type WamLigaEintrag = LigaEintrag;
export type WamFilterOption = VerbandOption | GebietOption | AltersklasseOption;

export interface DBBTableResponse {
  ligaId: number;
  liganame: string;
  teams: DBBTabellenEintrag[];
}

export interface DBBSpielplanResponse {
  ligaId: number;
  liganame: string;
  games: DBBSpielplanEintrag[];
}

export interface DBBMatchInfoResponse {
  matchId: number;
  gameNumber: number;
  date: string;
  time: string;
  ligaId: number;
  homeTeam: DBBTeamWithPlayers;
  awayTeam: DBBTeamWithPlayers;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    zipCode?: string;
  };
  score?: {
    home: number;
    away: number;
  };
  referees?: string[];
}

export interface DBBTeamWithPlayers {
  teamId: number;
  teamName: string;
  clubId: number;
  clubName: string;
  coach?: string;
  assistant?: string;
  players: DBBPlayer[];
}

export interface DBBPlayer {
  playerId: number;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  tnaNumber?: string;
}
