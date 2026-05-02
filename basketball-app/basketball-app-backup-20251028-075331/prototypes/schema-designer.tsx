import React, { useState } from 'react';
import { Database, Table, ChevronDown, ChevronRight, Star, ExternalLink, Users, Building, MapPin, Shield, AlertTriangle } from 'lucide-react';

const BasketballSchemaDesigner = () => {
  const [selectedTable, setSelectedTable] = useState('TEAM');
  const [expandedTables, setExpandedTables] = useState({});
  const [filterCategory, setFilterCategory] = useState('alle');
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);

  const schema = {
    // ========== KERN-TABELLEN ==========
    TEAM: {
      color: 'bg-blue-100 border-blue-400',
      category: 'bbb',
      icon: Building,
      fields: [
        { name: 'team_id', type: 'UUID', pk: true, required: true },
        { name: 'verein_id', type: 'UUID', fk: 'VEREIN', required: true, reason: 'BBB-Sync' },
        { name: 'bbb_mannschafts_id', type: 'String', optional: true, reason: 'BBB-Sync', note: 'Offizielle Mannschafts-ID' },
        { name: 'name', type: 'String', required: true, reason: 'Anzeige' },
        { name: 'altersklasse', type: 'Enum', values: 'U8, U10, U12', required: true, reason: 'Regelwerk!' },
        { name: 'saison', type: 'String', required: true, reason: 'Zeitraum' },
        { name: 'trainer', type: 'String', required: true, reason: 'Kontakt' },
        { name: 'leistungsorientiert', type: 'Boolean', optional: true, reason: 'U12 Sonderregeln' },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['← VEREIN', '→ SPIELER', '→ SPIEL', '→ TRIKOT', '→ TRAINING', '→ LIGA_TEILNAHME'],
      removed: ['trainer_email', 'trainer_tel', 'meldenummer', 'gemeldet_am'],
      removedReason: 'Trainer ist der User selbst, keine externen Kontaktdaten nötig'
    },
    
    SPIELER: {
      color: 'bg-green-100 border-green-400',
      category: 'kern',
      fields: [
        { name: 'spieler_id', type: 'UUID', pk: true, required: true },
        { name: 'team_id', type: 'UUID', fk: 'TEAM', optional: true, reason: 'Null bei Gegnern' },
        { name: 'verein_id', type: 'UUID', fk: 'VEREIN', optional: true, reason: 'Für Gegner-Tracking' },
        { name: 'vorname', type: 'String', required: true, reason: 'Identifikation!' },
        { name: 'nachname', type: 'String', required: true, reason: 'Identifikation!' },
        { name: 'geburtsdatum', type: 'Date', optional: true, reason: 'Altersvalidierung' },
        { name: 'spieler_typ', type: 'Enum', values: 'eigenes_team, gegner, scouting', required: true, reason: 'Filter' },
        { name: 'mitgliedsnummer', type: 'String', optional: true, reason: 'easyVerein-Sync' },
        { name: 'tna_nr', type: 'String', optional: true, reason: 'Ligaberechtigung!' },
        { name: 'konfektionsgroesse_jersey', type: 'Integer', optional: true, reason: 'Trikotvergabe' },
        { name: 'konfektionsgroesse_hose', type: 'Integer', optional: true, reason: 'Trikotvergabe' },
        { name: 'aktiv', type: 'Boolean', required: true, reason: 'Trainingsteilnahme' },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['← TEAM', '← VEREIN', '→ SPIELER_EINSATZ', '→ SPIELER_ERZ', '→ SPIELER_BEWERTUNG', '→ SPIELER_NOTIZEN']
    },

    SPIEL: {
      color: 'bg-purple-100 border-purple-400',
      category: 'kern',
      fields: [
        { name: 'spiel_id', type: 'UUID', pk: true, required: true },
        { name: 'spielplan_id', type: 'UUID', fk: 'SPIELPLAN', optional: true, reason: 'BBB-Sync' },
        { name: 'team_id', type: 'UUID', fk: 'TEAM', required: true },
        { name: 'spielnr', type: 'Integer', optional: true, reason: 'BBB Spielnummer' },
        { name: 'spieltag', type: 'Integer', optional: true, reason: 'BBB Spieltag' },
        { name: 'datum', type: 'DateTime', required: true, reason: 'Planung!' },
        { name: 'uhrzeit', type: 'String', optional: true },
        { name: 'heim', type: 'String', required: true },
        { name: 'gast', type: 'String', required: true },
        { name: 'halle_id', type: 'UUID', fk: 'HALLE', optional: true, reason: 'Navigation' },
        { name: 'ist_heimspiel', type: 'Boolean', required: true },
        { name: 'altersklasse', type: 'Enum', values: 'U8, U10, U12', required: true, reason: 'Regelwerk' },
        { name: 'leistungsorientiert', type: 'Boolean', optional: true, reason: 'U12 Sonderregeln' },
        { name: 'status', type: 'Enum', values: 'geplant, live, abgeschlossen, abgesagt', required: true, reason: 'Workflow' },
        { name: 'ergebnis_heim', type: 'Integer', optional: true, reason: 'nur U12, Statistik' },
        { name: 'ergebnis_gast', type: 'Integer', optional: true, reason: 'nur U12, Statistik' },
        { name: 'durchschnitt_team_score', type: 'Float', optional: true, reason: 'Einsatzplanung' },
        { name: 'balance_index', type: 'Float', optional: true, reason: 'Einsatzplanung' },
        { name: 'notizen', type: 'Text', optional: true, reason: 'Freitext' }
      ],
      relations: ['← TEAM', '← SPIELPLAN', '← HALLE', '→ SPIELER_EINSATZ', '→ ACHTEL_STATISTIK']
    },

    SPIELER_EINSATZ: {
      color: 'bg-yellow-100 border-yellow-400',
      category: 'kern',
      fields: [
        { name: 'einsatz_id', type: 'UUID', pk: true, required: true },
        { name: 'spiel_id', type: 'UUID', fk: 'SPIEL', required: true },
        { name: 'spieler_id', type: 'UUID', fk: 'SPIELER', required: true },
        { name: 'jersey_id', type: 'UUID', fk: 'TRIKOT', required: true, reason: 'Trikotvergabe' },
        { name: 'hose_id', type: 'UUID', fk: 'TRIKOT', required: true, reason: 'Trikotvergabe' },
        { name: 'position', type: 'Integer', required: true, reason: 'Reihenfolge' },
        { name: 'q1_1', type: 'Enum', values: 'Im_Spiel, Bank', required: true },
        { name: 'q1_2', type: 'Enum', values: 'Im_Spiel, Bank', required: true },
        { name: 'q2_1', type: 'Enum', values: 'Im_Spiel, Bank', required: true },
        { name: 'q2_2', type: 'Enum', values: 'Im_Spiel, Bank', required: true },
        { name: 'q3_1', type: 'Enum', values: 'Im_Spiel, Bank', required: true },
        { name: 'q3_2', type: 'Enum', values: 'Im_Spiel, Bank', required: true },
        { name: 'q4_1', type: 'Enum', values: 'Im_Spiel, Bank', required: true },
        { name: 'q4_2', type: 'Enum', values: 'Im_Spiel, Bank', required: true },
        { name: 'pausen', type: 'Integer', computed: true, reason: 'DBB-Regelvalidierung' },
        { name: 'gespielt', type: 'Integer', computed: true, reason: 'DBB-Regelvalidierung' }
      ],
      relations: ['← SPIEL', '← SPIELER', '← TRIKOT (jersey)', '← TRIKOT (hose)']
    },

    ACHTEL_STATISTIK: {
      color: 'bg-orange-100 border-orange-400',
      category: 'kern',
      fields: [
        { name: 'achtel_stat_id', type: 'UUID', pk: true, required: true },
        { name: 'spiel_id', type: 'UUID', fk: 'SPIEL', required: true },
        { name: 'achtel_nummer', type: 'Integer', required: true, reason: '1-8' },
        { name: 'team_score', type: 'Float', required: true, reason: 'Einsatzplanung!' },
        { name: 'spieler_auf_feld', type: 'Integer', required: true, reason: '3/4/5' },
        { name: 'ballhandling_avg', type: 'Float', optional: true },
        { name: 'defense_avg', type: 'Float', optional: true },
        { name: 'berechnet_am', type: 'DateTime', required: true }
      ],
      relations: ['← SPIEL']
    },

    TRIKOT: {
      color: 'bg-pink-100 border-pink-400',
      category: 'kern',
      fields: [
        { name: 'trikot_id', type: 'UUID', pk: true, required: true },
        { name: 'team_id', type: 'UUID', fk: 'TEAM', required: true },
        { name: 'art', type: 'Enum', values: 'Wendejersey, Hose', required: true },
        { name: 'nummer', type: 'String', optional: true, reason: 'Nur bei Jersey' },
        { name: 'groesse', type: 'String', values: '3xs, 2xs, xs...', required: true },
        { name: 'eu_groesse', type: 'Integer', required: true, reason: '116-170' },
        { name: 'farbe_dunkel', type: 'String', optional: true, reason: 'Wendejerseys' },
        { name: 'farbe_hell', type: 'String', optional: true, reason: 'Wendejerseys' },
        { name: 'status', type: 'Enum', values: 'verfügbar, im_einsatz, defekt', required: true },
        { name: 'besonderheiten', type: 'String', optional: true, reason: 'Trikotsatz, Beschädigungen' },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['← TEAM', '→ SPIELER_EINSATZ']
    },

    // ========== BBB-KOMPATIBILITÄT ==========
    VEREIN: {
      color: 'bg-indigo-100 border-indigo-400',
      category: 'bbb',
      icon: Building,
      fields: [
        { name: 'verein_id', type: 'UUID', pk: true, required: true },
        { name: 'bbb_kontakt_id', type: 'String', optional: true, reason: 'BBB-Sync' },
        { name: 'verband_id', type: 'Integer', optional: true, reason: 'BBB (2=Bayern)' },
        { name: 'name', type: 'String', required: true, reason: 'Anzeige' },
        { name: 'kurzname', type: 'String', optional: true, reason: 'Kompakte Anzeige' },
        { name: 'ort', type: 'String', optional: true, reason: 'Orientierung' },
        { name: 'ist_eigener_verein', type: 'Boolean', required: true, reason: 'Filter' },
        { name: 'sync_am', type: 'DateTime', optional: true, reason: 'BBB-Sync' }
      ],
      relations: ['→ TEAM', '→ SPIELPLAN', '→ LIGA_TEILNAHME'],
      removed: ['strasse', 'plz', 'telefon', 'email', 'website'],
      removedReason: 'Nicht für Spielplanung nötig, nur Ort zur Orientierung'
    },

    HALLE: {
      color: 'bg-teal-100 border-teal-400',
      category: 'bbb',
      icon: MapPin,
      fields: [
        { name: 'halle_id', type: 'UUID', pk: true, required: true },
        { name: 'bbb_halle_id', type: 'String', optional: true, reason: 'BBB-Sync' },
        { name: 'name', type: 'String', required: true, reason: 'Anzeige' },
        { name: 'strasse', type: 'String', required: true, reason: 'Navigation!' },
        { name: 'plz', type: 'String', required: true, reason: 'Navigation!' },
        { name: 'ort', type: 'String', required: true, reason: 'Navigation!' },
        { name: 'verein_id', type: 'UUID', fk: 'VEREIN', optional: true, reason: 'Heimhalle zuordnen' },
        { name: 'anzahl_felder', type: 'Integer', optional: true, reason: 'Querfeld-Info' },
        { name: 'parken', type: 'String', optional: true, reason: 'Auswärtsspiele!' },
        { name: 'oepnv', type: 'String', optional: true, reason: 'Auswärtsspiele!' },
        { name: 'notizen', type: 'Text', optional: true, reason: 'Zusatz-Infos' },
        { name: 'sync_am', type: 'DateTime', optional: true, reason: 'BBB-Sync' }
      ],
      relations: ['← VEREIN', '→ SPIEL', '→ TRAINING']
    },

    LIGA: {
      color: 'bg-violet-100 border-violet-400',
      category: 'bbb',
      icon: Star,
      fields: [
        { name: 'liga_id', type: 'UUID', pk: true, required: true },
        { name: 'bbb_liga_id', type: 'String', optional: true, reason: 'BBB-Sync' },
        { name: 'verband_id', type: 'Integer', optional: true, reason: '2 = Bayern' },
        { name: 'name', type: 'String', required: true, reason: 'z.B. U10 Oberpfalz Bezirksliga' },
        { name: 'saison', type: 'String', required: true },
        { name: 'altersklasse', type: 'Enum', values: 'U8, U10, U12', required: true },
        { name: 'spielklasse', type: 'String', optional: true, reason: 'Bezirksliga, Kreisliga...' },
        { name: 'region', type: 'String', optional: true, reason: 'Oberpfalz, Oberbayern...' },
        { name: 'sync_am', type: 'DateTime', optional: true, reason: 'BBB-Sync' }
      ],
      relations: ['→ SPIELPLAN', '→ LIGA_TEILNAHME', '→ LIGA_ERGEBNISSE', '→ LIGA_TABELLE']
    },

    LIGA_TEILNAHME: {
      color: 'bg-slate-100 border-slate-400',
      category: 'bbb',
      fields: [
        { name: 'teilnahme_id', type: 'UUID', pk: true, required: true },
        { name: 'liga_id', type: 'UUID', fk: 'LIGA', required: true },
        { name: 'verein_id', type: 'UUID', fk: 'VEREIN', required: true },
        { name: 'team_id', type: 'UUID', fk: 'TEAM', optional: true },
        { name: 'platzierung', type: 'Integer', optional: true, reason: 'nur U12' },
        { name: 'spiele', type: 'Integer', optional: true, reason: 'nur U12' },
        { name: 'siege', type: 'Integer', optional: true, reason: 'nur U12' },
        { name: 'niederlagen', type: 'Integer', optional: true, reason: 'nur U12' },
        { name: 'punkte', type: 'Integer', optional: true, reason: 'nur U12' }
      ],
      relations: ['← LIGA', '← VEREIN', '← TEAM'],
      removed: ['korb_diff'],
      removedReason: 'Nice-to-have Statistik'
    },

    SPIELPLAN: {
      color: 'bg-cyan-100 border-cyan-400',
      category: 'bbb',
      icon: Star,
      important: true,
      fields: [
        { name: 'spielplan_id', type: 'UUID', pk: true, required: true },
        { name: 'team_id', type: 'UUID', fk: 'TEAM', required: true, reason: 'Zuordnung' },
        { name: 'saison', type: 'String', required: true, reason: '2025/2026' },
        { name: 'liga', type: 'String', optional: true, reason: 'Liga-Name' },
        { name: 'altersklasse', type: 'String', optional: true },
        { name: 'bbb_spielplan_url', type: 'String', optional: true, reason: 'BBB-Sync URL 1 von 3' },
        { name: 'bbb_tabelle_url', type: 'String', optional: true, reason: 'BBB-Sync URL 2 von 3' },
        { name: 'bbb_ergebnisse_url', type: 'String', optional: true, reason: 'BBB-Sync URL 3 von 3' },
        { name: 'liga_nr_offiziell', type: 'String', optional: true, reason: 'BBB Liga-ID (5-stellig)' },
        { name: 'syncam', type: 'DateTime', optional: true, reason: 'Letzter BBB-Sync' },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['← TEAM', '→ SPIEL'],
      removed: ['bbb_spiel_id', 'spieltyp', 'nr', 'tag', 'datum', 'heim_verein_id', 'heim_name', 'gast_verein_id', 'gast_name', 'halle_id', 'importiert_als_spiel'],
      removedReason: 'v4.0: SPIELPLAN ist nun Container für BBB-URLs + Team-Zuordnung. Einzelne Spiele in SPIEL-Tabelle mit spielnr.'
    },

    LIGA_ERGEBNISSE: {
      color: 'bg-sky-100 border-sky-400',
      category: 'bbb',
      icon: Star,
      important: true,
      fields: [
        { name: 'id', type: 'UUID', pk: true, required: true },
        { name: 'ligaid', type: 'UUID', fk: 'LIGA', required: true, reason: 'Zuordnung' },
        { name: 'spielnr', type: 'Integer', optional: true, reason: 'BBB Spielnummer' },
        { name: 'heimteam', type: 'String', required: true, reason: 'Team-Name' },
        { name: 'gastteam', type: 'String', required: true, reason: 'Team-Name' },
        { name: 'ergebnis_heim', type: 'Integer', required: true, reason: 'Punkte' },
        { name: 'ergebnis_gast', type: 'Integer', required: true, reason: 'Punkte' },
        { name: 'datum', type: 'Date', required: true },
        { name: 'syncam', type: 'DateTime', required: true, reason: 'BBB-Sync' }
      ],
      relations: ['← LIGA'],
      note: 'Für Benchmark-Analyse gegen gemeinsame Gegner'
    },

    LIGA_TABELLE: {
      color: 'bg-sky-50 border-sky-300',
      category: 'bbb',
      icon: Star,
      important: true,
      fields: [
        { name: 'id', type: 'UUID', pk: true, required: true },
        { name: 'ligaid', type: 'UUID', fk: 'LIGA', required: true },
        { name: 'teamname', type: 'String', required: true },
        { name: 'platz', type: 'Integer', required: true },
        { name: 'spiele', type: 'Integer', required: true },
        { name: 'siege', type: 'Integer', required: true },
        { name: 'niederlagen', type: 'Integer', required: true },
        { name: 'punkte', type: 'Integer', required: true },
        { name: 'korbe_erzielt', type: 'Integer', required: true },
        { name: 'korbe_erhalten', type: 'Integer', required: true },
        { name: 'korb_differenz', type: 'Integer', required: true },
        { name: 'heim_siege', type: 'Integer', required: true },
        { name: 'heim_niederlagen', type: 'Integer', required: true },
        { name: 'auswaerts_siege', type: 'Integer', required: true },
        { name: 'auswaerts_niederlagen', type: 'Integer', required: true },
        { name: 'syncam', type: 'DateTime', required: true }
      ],
      relations: ['← LIGA'],
      note: 'Für Dashboard-Anzeige und Vergleiche'
    },

    // ========== NEUE ERWEITERUNGEN ==========
    SPIELER_BEWERTUNG: {
      color: 'bg-emerald-100 border-emerald-400',
      category: 'neu',
      important: true,
      fields: [
        { name: 'bewertung_id', type: 'UUID', pk: true, required: true },
        { name: 'spieler_id', type: 'UUID', fk: 'SPIELER', required: true },
        { name: 'bewertungs_typ', type: 'Enum', values: 'aktuell, scouting, archiv', required: true },
        { name: 'saison', type: 'String', required: true },
        { name: 'altersklasse', type: 'Enum', values: 'U8, U10, U12', required: true },
        { name: 'gueltig_ab', type: 'Date', required: true },
        { name: 'gueltig_bis', type: 'Date', optional: true, reason: 'Null = aktuell' },
        { name: 'bewertet_von', type: 'String', required: true, reason: 'Trainer' },
        { name: 'ballhandling_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'passen_fangen_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'spieluebersicht_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'teamplay_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'defense_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'laufbereitschaft_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'rebound_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'positionsflex_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'abschluss_score', type: 'Integer', required: true, reason: 'Default: 2' },
        { name: 'gesamt_wert', type: 'Float', computed: true, reason: 'Einsatzplanung!' },
        { name: 'notizen', type: 'Text', optional: true },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['← SPIELER']
    },

    ERZIEHUNGSBERECHTIGTE: {
      color: 'bg-rose-100 border-rose-400',
      category: 'neu',
      icon: Users,
      important: true,
      fields: [
        { name: 'erz_id', type: 'UUID', pk: true, required: true },
        { name: 'vorname', type: 'String', required: true },
        { name: 'nachname', type: 'String', required: true },
        { name: 'telefon_mobil', type: 'String', required: true, reason: 'Notfall!' },
        { name: 'email', type: 'String', required: true, reason: 'Kommunikation!' },
        { name: 'datenschutz_akzeptiert', type: 'Boolean', required: true, reason: 'DSGVO' },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['→ SPIELER_ERZ'],
      removed: ['anrede', 'telefon_fest', 'strasse', 'plz', 'ort', 'portal_zugang', 'portal_code', 'benachrichtigungen'],
      removedReason: 'DSGVO-Datensparsamkeit! Adresse nicht nötig. Portal-Felder erst wenn Portal gebaut wird.'
    },

    SPIELER_ERZIEHUNGSBERECHTIGTE: {
      color: 'bg-rose-50 border-rose-300',
      category: 'neu',
      important: true,
      fields: [
        { name: 'se_id', type: 'UUID', pk: true, required: true },
        { name: 'spieler_id', type: 'UUID', fk: 'SPIELER', required: true },
        { name: 'erz_id', type: 'UUID', fk: 'ERZIEHUNGSBERECHTIGTE', required: true },
        { name: 'beziehung', type: 'Enum', values: 'Mutter, Vater, Vormund, Sonstige', required: true },
        { name: 'ist_notfallkontakt', type: 'Boolean', required: true, reason: 'Priorität!' },
        { name: 'abholberechtigt', type: 'Boolean', required: true, reason: 'Sicherheit' },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['← SPIELER', '← ERZIEHUNGSBERECHTIGTE'],
      removed: ['kontakt_prioritaet'],
      removedReason: 'ist_notfallkontakt reicht als Priorität'
    },

    TRAINING: {
      color: 'bg-lime-100 border-lime-400',
      category: 'neu',
      fields: [
        { name: 'training_id', type: 'UUID', pk: true, required: true },
        { name: 'team_id', type: 'UUID', fk: 'TEAM', required: true },
        { name: 'datum', type: 'DateTime', required: true },
        { name: 'dauer_minuten', type: 'Integer', required: true },
        { name: 'halle_id', type: 'UUID', fk: 'HALLE', optional: true },
        { name: 'trainer', type: 'String', required: true },
        { name: 'ist_probetraining', type: 'Boolean', required: true },
        { name: 'fokus', type: 'String', optional: true, reason: 'Ballhandling, Defense...' },
        { name: 'notizen', type: 'Text', optional: true },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['← TEAM', '← HALLE', '→ TRAINING_TEILNAHME', '→ PROBETRAINING_TEILNEHMER'],
      removed: ['uebungen', 'anwesende_spieler', 'fehlende_spieler'],
      removedReason: 'Wird über TRAINING_TEILNAHME getrackt'
    },

    TRAINING_TEILNAHME: {
      color: 'bg-lime-50 border-lime-300',
      category: 'neu',
      fields: [
        { name: 'teilnahme_id', type: 'UUID', pk: true, required: true },
        { name: 'training_id', type: 'UUID', fk: 'TRAINING', required: true },
        { name: 'spieler_id', type: 'UUID', fk: 'SPIELER', required: true },
        { name: 'anwesend', type: 'Boolean', required: true },
        { name: 'entschuldigt', type: 'Boolean', optional: true, reason: 'Falls abwesend' },
        { name: 'notiz', type: 'Text', optional: true }
      ],
      relations: ['← TRAINING', '← SPIELER'],
      removed: ['grund', 'leistung'],
      removedReason: 'Notiz-Feld reicht für Freitext'
    },

    PROBETRAINING_TEILNEHMER: {
      color: 'bg-lime-200 border-lime-500',
      category: 'neu',
      important: true,
      icon: Users,
      fields: [
        { name: 'probe_id', type: 'UUID', pk: true, required: true },
        { name: 'vorname', type: 'String', required: true, reason: 'Minimum!' },
        { name: 'nachname', type: 'String', optional: true },
        { name: 'anzahl_teilnahmen', type: 'Integer', computed: true, reason: 'Tracking' },
        { name: 'eltern_telefon', type: 'String', optional: true, reason: 'Bei Interesse' },
        { name: 'status', type: 'Enum', values: 'aktiv, interessiert, aufgenommen, abgesagt', required: true },
        { name: 'aufgenommen_als_spieler_id', type: 'UUID', fk: 'SPIELER', optional: true },
        { name: 'notizen', type: 'Text', optional: true },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['→ SPIELER', '→ PROBETRAINING_HISTORIE'],
      removed: ['training_id', 'geburtsdatum', 'altersklasse', 'eltern_name', 'eltern_email', 'wie_aufmerksam_geworden', 'bisherige_erfahrung', 'beurteilung_trainer', 'interesse_beitritt'],
      removedReason: 'Minimalistisch! Nur Vorname + Tracking. Rest in Notizen oder bei Aufnahme.'
    },

    PROBETRAINING_HISTORIE: {
      color: 'bg-lime-50 border-lime-400',
      category: 'neu',
      fields: [
        { name: 'historie_id', type: 'UUID', pk: true, required: true },
        { name: 'probe_id', type: 'UUID', fk: 'PROBETRAINING_TEILNEHMER', required: true },
        { name: 'training_id', type: 'UUID', fk: 'TRAINING', required: true },
        { name: 'datum', type: 'DateTime', required: true, reason: 'Wann war Kind da?' },
        { name: 'anwesend', type: 'Boolean', required: true },
        { name: 'notiz', type: 'Text', optional: true }
      ],
      relations: ['← PROBETRAINING_TEILNEHMER', '← TRAINING']
    },

    SPIELER_NOTIZEN: {
      color: 'bg-amber-100 border-amber-400',
      category: 'neu',
      fields: [
        { name: 'notiz_id', type: 'UUID', pk: true, required: true },
        { name: 'spieler_id', type: 'UUID', fk: 'SPIELER', required: true },
        { name: 'trainer', type: 'String', required: true },
        { name: 'datum', type: 'DateTime', required: true },
        { name: 'kategorie', type: 'Enum', values: 'Entwicklung, Verhalten, Gesundheit, Elterngespräch', required: true },
        { name: 'text', type: 'Text', required: true },
        { name: 'vertraulich', type: 'Boolean', required: true },
        { name: 'created_at', type: 'DateTime', required: true }
      ],
      relations: ['← SPIELER'],
      removed: ['titel', 'prioritaet'],
      removedReason: 'Kategorie + Datum reicht zur Einordnung'
    },

    SAISON_ARCHIV: {
      color: 'bg-gray-100 border-gray-400',
      category: 'neu',
      fields: [
        { name: 'archiv_id', type: 'UUID', pk: true, required: true },
        { name: 'saison', type: 'String', required: true },
        { name: 'team_id', type: 'UUID', fk: 'TEAM', required: true },
        { name: 'team_snapshot', type: 'JSON', required: true, reason: 'Backup' },
        { name: 'statistiken', type: 'JSON', required: true, reason: 'Aggregiert' },
        { name: 'archiviert_am', type: 'DateTime', required: true },
        { name: 'archiviert_von', type: 'String', required: true }
      ],
      relations: ['← TEAM'],
      removed: ['spieler_count', 'spiele_gesamt', 'siege', 'niederlagen', 'team_avg_score', 'beste_spieler', 'erfolge'],
      removedReason: 'Alles in statistiken JSON enthalten'
    }
  };

  const categories = {
    alle: { name: 'Alle Tabellen', count: Object.keys(schema).length },
    kern: { name: 'Kern-System', count: Object.values(schema).filter(t => t.category === 'kern').length },
    bbb: { name: 'BBB-Kompatibilität', count: Object.values(schema).filter(t => t.category === 'bbb').length },
    neu: { name: 'Erweiterungen', count: Object.values(schema).filter(t => t.category === 'neu').length }
  };

  const filteredTables = Object.entries(schema).filter(([_, data]) => 
    filterCategory === 'alle' || data.category === filterCategory
  );

  const toggleTable = (table) => {
    setExpandedTables(prev => ({
      ...prev,
      [table]: !prev[table]
    }));
  };

  const getFilteredFields = (fields) => {
    if (!showOnlyRequired) return fields;
    return fields.filter(f => f.required || f.pk || f.fk);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Basketball Schema v4.0</h1>
                <p className="text-gray-600">DSGVO-optimiert • Compound-Indizes • BBB-Integration</p>
              </div>
            </div>
            <button
              onClick={() => setShowOnlyRequired(!showOnlyRequired)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showOnlyRequired 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              {showOnlyRequired ? 'Nur Pflichtfelder' : 'Alle Felder'}
            </button>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabellen-Liste */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              Tabellen ({filteredTables.length})
            </h2>
            <div className="space-y-2 max-h-[700px] overflow-y-auto">
              {filteredTables.map(([tableName, tableData]) => {
                const Icon = tableData.icon;
                return (
                  <div key={tableName} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedTable(tableName);
                        toggleTable(tableName);
                      }}
                      className={`w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        selectedTable === tableName ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {expandedTables[tableName] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        {Icon && <Icon className="w-4 h-4 text-blue-600" />}
                        <span className={`px-2 py-1 rounded text-sm font-medium border-2 ${tableData.color}`}>
                          {tableName}
                        </span>
                        {tableData.important && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {tableData.removed && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {tableData.fields.length} Felder
                      </span>
                    </button>
                    
                    {expandedTables[tableName] && tableData.removed && (
                      <div className="p-3 bg-orange-50 border-t text-xs">
                        <div className="font-semibold text-orange-900 mb-1">🗑️ Entfernt:</div>
                        <div className="text-orange-800 mb-2">{tableData.removed.join(', ')}</div>
                        <div className="text-orange-700 italic">{tableData.removedReason}</div>
                      </div>
                    )}
                    
                    {expandedTables[tableName] && tableData.note && (
                      <div className="p-3 bg-blue-50 border-t text-xs">
                        <div className="font-semibold text-blue-900 mb-1">💡 Hinweis:</div>
                        <div className="text-blue-700">{tableData.note}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail-Ansicht */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                Felder: {selectedTable}
              </h2>
              {schema[selectedTable]?.important && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800">Priorität</span>
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-[650px] overflow-y-auto">
              {getFilteredFields(schema[selectedTable]?.fields || []).map((field, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-colors ${
                    field.required 
                      ? 'bg-green-50 border-green-200 hover:border-green-300' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-gray-900">
                          {field.name}
                        </span>
                        {field.pk && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded font-semibold">
                            PK
                          </span>
                        )}
                        {field.fk && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded font-semibold">
                            FK
                          </span>
                        )}
                        {field.required && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-semibold">
                            Pflicht
                          </span>
                        )}
                        {field.optional && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            Optional
                          </span>
                        )}
                        {field.computed && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                            Berechnet
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Typ: <span className="font-medium">{field.type}</span>
                        {field.values && (
                          <span className="text-xs ml-2">({field.values})</span>
                        )}
                      </div>
                      {field.reason && (
                        <div className="mt-1 text-xs text-blue-600">
                          💡 {field.reason}
                        </div>
                      )}
                      {field.note && (
                        <div className="mt-1 text-xs text-gray-500">
                          ℹ️ {field.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zusammenfassung v4.0 */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            Schema v4.0 Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="text-blue-800 font-semibold mb-2">🆕 v4.0 Features</div>
              <div className="text-xs text-gray-700">
                • Compound-Indizes für Performance<br/>
                • <strong>SPIELPLAN umstrukturiert</strong><br/>
                • <strong>LIGA_ERGEBNISSE hinzugefügt</strong><br/>
                • <strong>LIGA_TABELLE hinzugefügt</strong><br/>
                • [team_id+aktiv] Index<br/>
                • [spielplan_id+spielnr] Index
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-green-200">
              <div className="text-green-800 font-semibold mb-2">✅ DSGVO-Optimierung</div>
              <div className="text-xs text-gray-700">
                • Trainer-Kontaktdaten entfernt<br/>
                • Vereins-Adressen entfernt<br/>
                • <strong>Eltern-Adressen entfernt</strong><br/>
                • Portal-Felder erst bei Bedarf<br/>
                • Minimale Datenspeicherung
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-teal-200">
              <div className="text-teal-800 font-semibold mb-2">🔗 BBB-Integration</div>
              <div className="text-xs text-gray-700">
                • 3 BBB-URLs pro Team<br/>
                • Spielnummer-basierter Sync<br/>
                • Benchmark-Analysen<br/>
                • Dashboard-Tabelle<br/>
                • Offline-fähig
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketballSchemaDesigner;