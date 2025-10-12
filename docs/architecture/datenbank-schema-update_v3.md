# Basketball PWA - Datenbank-Schema Update v3.0

**Stand:** 11. Oktober 2025  
**Version:** 3.0 - Erweitert für BBB-Integration & Benchmark-Analyse

---

## Änderungsübersicht

### Neue Tabellen
- **LIGAERGEBNISSE** - Alle Spiele der Liga mit Endständen (für Benchmark)

### Erweiterte Tabellen
- **SPIELPLAN** - BBB-URLs für Updates
- **SPIEL** - Spielnummer als Match-Key

### Keine Änderungen
- VEREIN, TEAM, SPIELER, TRIKOT-Tabellen bleiben unverändert

---

## 1. Tabelle: SPIELPLAN (erweitert)

### Neue Felder

| Feld | Typ | Beschreibung | Pflicht |
|------|-----|--------------|---------|
| `bbb_spielplan_url` | TEXT | Original BBB-Spielplan URL für Updates | Nein |
| `bbb_tabelle_url` | TEXT | Abgeleitete BBB-Tabelle URL | Nein |
| `bbb_ergebnisse_url` | TEXT | Abgeleitete BBB-Ergebnisse URL | Nein |
| `liga_nr_offiziell` | TEXT | Offizielle BBB-Liganr. aus Titel (nicht URL!) | Nein |
| `syncam` | DATETIME | Zeitstempel letzter Sync mit BBB | Nein |

### Vollständiges Schema

```sql
CREATE TABLE SPIELPLAN (
  id UUID PRIMARY KEY,
  teamid UUID NOT NULL,
  saison TEXT NOT NULL,
  liga TEXT,
  altersklasse TEXT,

  -- BBB-Integration (NEU)
  bbb_spielplan_url TEXT,
  bbb_tabelle_url TEXT,
  bbb_ergebnisse_url TEXT,
  liga_nr_offiziell TEXT,
  syncam DATETIME,

  FOREIGN KEY (teamid) REFERENCES TEAM(id)
);
```

### Beispiel-Daten

```json
{
  "id": "uuid-123",
  "teamid": "team-uuid-456",
  "saison": "2025/2026",
  "liga": "U10 mixed Bezirksliga",
  "altersklasse": "U10",
  "bbb_spielplan_url": "https://www.basketball-bund.net/public/spielplan_list.jsp?print=1&viewDescKey=sport.dbb.liga.SpielplanViewPublic/index.jsp_&liga_id=51961",
  "bbb_tabelle_url": "https://www.basketball-bund.net/liga/statistik_team.jsp?print=1&viewDescKey=sport.dbb.views.TeamStatView/templates/base_template.jsp_&liga_id=51961",
  "bbb_ergebnisse_url": "https://www.basketball-bund.net/public/ergebnisse.jsp?print=1&viewDescKey=sport.dbb.liga.ErgebnisseViewPublic/index.jsp_&liga_id=51961",
  "liga_nr_offiziell": "1040",
  "syncam": "2025-10-11T14:30:00Z"
}
```

---

## 2. Tabelle: SPIEL (erweitert)

### Neue Felder

| Feld | Typ | Beschreibung | Pflicht |
|------|-----|--------------|---------|
| `spielnr` | INTEGER | BBB-Spielnummer (Primary Key für Match) | Nein* |
| `spieltag` | INTEGER | Spieltag-Nummer (aus BBB) | Nein |

*Bei BBB-Import Pflicht, bei manueller Anlage optional

### Vollständiges Schema

```sql
CREATE TABLE SPIEL (
  id UUID PRIMARY KEY,
  spielplanid UUID NOT NULL,

  -- BBB-Integration (NEU)
  spielnr INTEGER,
  spieltag INTEGER,

  -- Bestehende Felder
  datum DATE NOT NULL,
  uhrzeit TIME,
  heim TEXT NOT NULL,
  gast TEXT NOT NULL,
  halle TEXT,
  istHeimspiel BOOLEAN,

  -- Ergebnisse
  ergebnisheim INTEGER,
  ergebnisgast INTEGER,
  status TEXT DEFAULT 'geplant',

  FOREIGN KEY (spielplanid) REFERENCES SPIELPLAN(id),
  UNIQUE (spielplanid, spielnr)
);
```

### Index für Performance

```sql
CREATE INDEX idx_spiel_spielnr ON SPIEL(spielnr);
CREATE INDEX idx_spiel_datum ON SPIEL(datum);
```

### Beispiel-Daten

```json
{
  "id": "spiel-uuid-789",
  "spielplanid": "uuid-123",
  "spielnr": 1049,
  "spieltag": 3,
  "datum": "2025-10-12",
  "uhrzeit": "12:00",
  "heim": "DJK Neustadt a. d. Waldnaab 1",
  "gast": "Regensburg Baskets 2",
  "halle": "Gymnasium",
  "istHeimspiel": false,
  "ergebnisheim": null,
  "ergebnisgast": null,
  "status": "geplant"
}
```

---

## 3. Neue Tabelle: LIGAERGEBNISSE

Speichert alle Ergebnisse der Liga für Benchmark-Analysen.

### Schema

```sql
CREATE TABLE LIGAERGEBNISSE (
  id UUID PRIMARY KEY,
  ligaid UUID NOT NULL,

  -- Match mit SPIEL-Tabelle
  spielnr INTEGER,

  -- Teams
  heimteam TEXT NOT NULL,
  gastteam TEXT NOT NULL,

  -- Ergebnis
  ergebnisheim INTEGER NOT NULL,
  ergebnisgast INTEGER NOT NULL,

  -- Metadaten
  datum DATE NOT NULL,
  syncam DATETIME NOT NULL,

  FOREIGN KEY (ligaid) REFERENCES SPIELPLAN(id),
  UNIQUE (ligaid, spielnr)
);
```

### Index

```sql
CREATE INDEX idx_ligaergebnis_teams ON LIGAERGEBNISSE(heimteam, gastteam);
CREATE INDEX idx_ligaergebnis_datum ON LIGAERGEBNISSE(datum);
CREATE INDEX idx_ligaergebnis_spielnr ON LIGAERGEBNISSE(spielnr);
```

### Beispiel-Daten

```json
[
  {
    "id": "ergebnis-uuid-1",
    "ligaid": "uuid-123",
    "spielnr": 1041,
    "heimteam": "TSV 1880 Schwandorf",
    "gastteam": "TB Weiden Basketball",
    "ergebnisheim": 45,
    "ergebnisgast": 38,
    "datum": "2025-09-28",
    "syncam": "2025-10-11T14:30:00Z"
  },
  {
    "id": "ergebnis-uuid-2",
    "ligaid": "uuid-123",
    "spielnr": 1042,
    "heimteam": "Fibalon Baskets Neumarkt",
    "gastteam": "Regensburg Baskets 1",
    "ergebnisheim": 40,
    "ergebnisgast": 47,
    "datum": "2025-10-01",
    "syncam": "2025-10-11T14:30:00Z"
  }
]
```

### Verwendung für Benchmark

```javascript
// Gemeinsame Gegner finden
function findCommonOpponents(ownTeamName, opponentTeamName, ligaErgebnisse) {
  const ownGames = ligaErgebnisse.filter(e => 
    e.heimteam === ownTeamName || e.gastteam === ownTeamName
  );

  const opponentGames = ligaErgebnisse.filter(e => 
    e.heimteam === opponentTeamName || e.gastteam === opponentTeamName
  );

  const ownOpponents = ownGames.map(g => 
    g.heimteam === ownTeamName ? g.gastteam : g.heimteam
  );

  const opponentOpponents = opponentGames.map(g => 
    g.heimteam === opponentTeamName ? g.gastteam : g.heimteam
  );

  return ownOpponents.filter(o => opponentOpponents.includes(o));
}
```

---

## 4. Tabelle: LIGATABELLE (optional, für Dashboard)

Speichert aktuelle Tabellenplätze aller Teams.

### Schema

```sql
CREATE TABLE LIGATABELLE (
  id UUID PRIMARY KEY,
  ligaid UUID NOT NULL,

  -- Team-Info
  teamname TEXT NOT NULL,
  platz INTEGER NOT NULL,

  -- Statistik
  spiele INTEGER DEFAULT 0,
  siege INTEGER DEFAULT 0,
  niederlagen INTEGER DEFAULT 0,
  punkte INTEGER DEFAULT 0,

  -- Tore
  korbeerzielt INTEGER DEFAULT 0,
  korbeerhalten INTEGER DEFAULT 0,
  korbdifferenz INTEGER DEFAULT 0,

  -- Heim/Auswärts
  heimsiege INTEGER DEFAULT 0,
  heimniederlagen INTEGER DEFAULT 0,
  auswaertssiege INTEGER DEFAULT 0,
  auswaertsniederlagen INTEGER DEFAULT 0,

  -- Metadaten
  syncam DATETIME NOT NULL,

  FOREIGN KEY (ligaid) REFERENCES SPIELPLAN(id),
  UNIQUE (ligaid, teamname)
);
```

### Index

```sql
CREATE INDEX idx_ligatabelle_platz ON LIGATABELLE(ligaid, platz);
```

### Beispiel-Daten

```json
[
  {
    "id": "tabelle-uuid-1",
    "ligaid": "uuid-123",
    "teamname": "Regensburg Baskets 1",
    "platz": 1,
    "spiele": 8,
    "siege": 7,
    "niederlagen": 1,
    "punkte": 14,
    "korbeerzielt": 380,
    "korbeerhalten": 310,
    "korbdifferenz": 70,
    "heimsiege": 4,
    "heimniederlagen": 0,
    "auswaertssiege": 3,
    "auswaertsniederlagen": 1,
    "syncam": "2025-10-11T14:30:00Z"
  },
  {
    "id": "tabelle-uuid-2",
    "ligaid": "uuid-123",
    "teamname": "Regensburg Baskets 2",
    "platz": 2,
    "spiele": 7,
    "siege": 5,
    "niederlagen": 2,
    "punkte": 10,
    "korbeerzielt": 320,
    "korbeerhalten": 290,
    "korbdifferenz": 30,
    "syncam": "2025-10-11T14:30:00Z"
  }
]
```

---

## 5. Migration von v2.0 zu v3.0

### Migrations-Script (SQL)

```sql
-- 1. SPIELPLAN erweitern
ALTER TABLE SPIELPLAN ADD COLUMN bbb_spielplan_url TEXT;
ALTER TABLE SPIELPLAN ADD COLUMN bbb_tabelle_url TEXT;
ALTER TABLE SPIELPLAN ADD COLUMN bbb_ergebnisse_url TEXT;
ALTER TABLE SPIELPLAN ADD COLUMN liga_nr_offiziell TEXT;
ALTER TABLE SPIELPLAN ADD COLUMN syncam DATETIME;

-- 2. SPIEL erweitern
ALTER TABLE SPIEL ADD COLUMN spielnr INTEGER;
ALTER TABLE SPIEL ADD COLUMN spieltag INTEGER;

-- 3. LIGAERGEBNISSE erstellen
CREATE TABLE LIGAERGEBNISSE (
  id UUID PRIMARY KEY,
  ligaid UUID NOT NULL,
  spielnr INTEGER,
  heimteam TEXT NOT NULL,
  gastteam TEXT NOT NULL,
  ergebnisheim INTEGER NOT NULL,
  ergebnisgast INTEGER NOT NULL,
  datum DATE NOT NULL,
  syncam DATETIME NOT NULL,
  FOREIGN KEY (ligaid) REFERENCES SPIELPLAN(id),
  UNIQUE (ligaid, spielnr)
);

-- 4. LIGATABELLE erstellen (optional)
CREATE TABLE LIGATABELLE (
  id UUID PRIMARY KEY,
  ligaid UUID NOT NULL,
  teamname TEXT NOT NULL,
  platz INTEGER NOT NULL,
  spiele INTEGER DEFAULT 0,
  siege INTEGER DEFAULT 0,
  niederlagen INTEGER DEFAULT 0,
  punkte INTEGER DEFAULT 0,
  korbeerzielt INTEGER DEFAULT 0,
  korbeerhalten INTEGER DEFAULT 0,
  korbdifferenz INTEGER DEFAULT 0,
  heimsiege INTEGER DEFAULT 0,
  heimniederlagen INTEGER DEFAULT 0,
  auswaertssiege INTEGER DEFAULT 0,
  auswaertsniederlagen INTEGER DEFAULT 0,
  syncam DATETIME NOT NULL,
  FOREIGN KEY (ligaid) REFERENCES SPIELPLAN(id),
  UNIQUE (ligaid, teamname)
);

-- 5. Indizes erstellen
CREATE INDEX idx_spiel_spielnr ON SPIEL(spielnr);
CREATE INDEX idx_spiel_datum ON SPIEL(datum);
CREATE INDEX idx_ligaergebnis_teams ON LIGAERGEBNISSE(heimteam, gastteam);
CREATE INDEX idx_ligaergebnis_datum ON LIGAERGEBNISSE(datum);
CREATE INDEX idx_ligaergebnis_spielnr ON LIGAERGEBNISSE(spielnr);
CREATE INDEX idx_ligatabelle_platz ON LIGATABELLE(ligaid, platz);

-- 6. UNIQUE Constraint für Spielnr
CREATE UNIQUE INDEX idx_spiel_unique_spielnr ON SPIEL(spielplanid, spielnr) 
  WHERE spielnr IS NOT NULL;
```

### Migrations-Script (JavaScript für IndexedDB)

```javascript
// Version 3 Migration
const request = indexedDB.open('BasketballPWA', 3);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const transaction = event.target.transaction;

  // 1. SPIELPLAN erweitern
  if (db.objectStoreNames.contains('spielplan')) {
    const spielplanStore = transaction.objectStore('spielplan');
    // Neue Felder werden beim ersten Schreibvorgang hinzugefügt
  }

  // 2. SPIEL erweitern
  if (db.objectStoreNames.contains('spiel')) {
    const spielStore = transaction.objectStore('spiel');
    // Index für Spielnummer
    if (!spielStore.indexNames.contains('spielnr')) {
      spielStore.createIndex('spielnr', 'spielnr', { unique: false });
    }
  }

  // 3. LIGAERGEBNISSE erstellen
  if (!db.objectStoreNames.contains('ligaergebnisse')) {
    const ligaergebnisseStore = db.createObjectStore('ligaergebnisse', { 
      keyPath: 'id' 
    });
    ligaergebnisseStore.createIndex('ligaid', 'ligaid', { unique: false });
    ligaergebnisseStore.createIndex('spielnr', 'spielnr', { unique: false });
    ligaergebnisseStore.createIndex('teams', ['heimteam', 'gastteam'], { unique: false });
  }

  // 4. LIGATABELLE erstellen
  if (!db.objectStoreNames.contains('ligatabelle')) {
    const ligaTabelleStore = db.createObjectStore('ligatabelle', { 
      keyPath: 'id' 
    });
    ligaTabelleStore.createIndex('ligaid', 'ligaid', { unique: false });
    ligaTabelleStore.createIndex('platz', ['ligaid', 'platz'], { unique: false });
  }
};
```

---

## 6. ER-Diagramm (erweitert)

```
TRAINER (1) ----< (n) TEAM (1) ----< (n) SPIELPLAN (1) ----< (n) SPIEL
                       |                      |
                       |                      |----< (n) LIGAERGEBNISSE
                       |                      |
                       |                      |----< (n) LIGATABELLE
                       |
                       |----< (n) SPIELER
                       |
                       |----< (n) TRIKOT
```

### Beziehungen

- **SPIELPLAN** hat BBB-URLs für Updates
- **SPIEL** referenziert über `spielnr` (BBB Primary Key)
- **LIGAERGEBNISSE** gehört zu SPIELPLAN (gleiche Liga)
- **LIGATABELLE** gehört zu SPIELPLAN (gleiche Liga)

---

## 7. Daten-Synchronisation: Workflow

### Beim Onboarding (Erster Import)

```javascript
async function importFromBBB(spielplanUrl) {
  // 1. Spielplan-HTML abrufen & parsen
  const spielplanData = await fetchAndParse(spielplanUrl);

  // 2. Liga-ID extrahieren und URLs ableiten
  const ligaId = extractLigaId(spielplanUrl);
  const tabelleUrl = buildTabelleUrl(ligaId);
  const ergebnisseUrl = buildErgebnisseUrl(ligaId);

  // 3. SPIELPLAN-Eintrag erstellen
  const spielplan = {
    id: uuid(),
    teamid: selectedTeamId,
    saison: '2025/2026',
    liga: spielplanData.ligaName,
    altersklasse: 'U10',
    bbb_spielplan_url: spielplanUrl,
    bbb_tabelle_url: tabelleUrl,
    bbb_ergebnisse_url: ergebnisseUrl,
    liga_nr_offiziell: spielplanData.ligaNr, // aus Titel!
    syncam: new Date().toISOString()
  };

  await db.spielplan.add(spielplan);

  // 4. SPIEL-Einträge erstellen
  for (const game of spielplanData.spiele) {
    await db.spiel.add({
      id: uuid(),
      spielplanid: spielplan.id,
      spielnr: game.nr,
      spieltag: game.tag,
      datum: game.datum,
      uhrzeit: game.uhrzeit,
      heim: game.heim,
      gast: game.gast,
      halle: game.halle,
      istHeimspiel: game.heim === selectedTeamName,
      status: 'geplant'
    });
  }

  // 5. Tabelle & Ergebnisse initial laden
  await updateLigaTabelle(spielplan.id, tabelleUrl);
  await updateLigaErgebnisse(spielplan.id, ergebnisseUrl);
}
```

### Beim App-Start (Update)

```javascript
async function syncAllTeams() {
  const teams = await db.team.toArray();

  for (const team of teams) {
    const spielplan = await db.spielplan
      .where('teamid').equals(team.id)
      .first();

    if (!spielplan?.bbb_spielplan_url) continue;

    // Parallel: 3 URLs abrufen
    const [spielplanData, tabelleData, ergebnisseData] = await Promise.all([
      fetchAndParse(spielplan.bbb_spielplan_url),
      fetchAndParse(spielplan.bbb_tabelle_url),
      fetchAndParse(spielplan.bbb_ergebnisse_url)
    ]);

    // Spielplan-Updates (Match über spielnr)
    const changes = await compareAndUpdate(spielplan.id, spielplanData);

    // Tabelle aktualisieren
    await updateLigaTabelle(spielplan.id, tabelleData);

    // Ergebnisse aktualisieren
    await updateLigaErgebnisse(spielplan.id, ergebnisseData);

    // Timestamp aktualisieren
    await db.spielplan.update(spielplan.id, {
      syncam: new Date().toISOString()
    });

    if (changes.length > 0) {
      showUpdateNotification(team.name, changes);
    }
  }
}
```

---

## 8. Zusammenfassung Schema-Änderungen

### Neue Felder (5)
- SPIELPLAN: `bbb_spielplan_url`, `bbb_tabelle_url`, `bbb_ergebnisse_url`, `liga_nr_offiziell`, `syncam`
- SPIEL: `spielnr`, `spieltag`

### Neue Tabellen (2)
- LIGAERGEBNISSE (für Benchmark-Analyse)
- LIGATABELLE (für Dashboard-Anzeige)

### Neue Indizes (6)
- SPIEL: `spielnr`, `datum`
- LIGAERGEBNISSE: `teams`, `datum`, `spielnr`
- LIGATABELLE: `platz`

### Breaking Changes
- **Keine!** Alle Änderungen sind rückwärtskompatibel

---

**Dokumenten-Ende**

# Basketball PWA - Datenbank Schema Update 3.1

## Änderung: Einzele URL Eingabe für BBB-Liga

### 4.1 URL-Struktur

- User gibt **eine einzige BBB-Liga-URL** ein, die den Parameter `liga_id` enthält.
- Die App extrahiert automatisch die Liga-ID aus jedem BBB-Link (Spielplan-, Tabelle- oder Ergebnislink).
- Die App generiert automatisiert die drei URLs für Spielplan, Tabelle und Ergebnisse.

### Beispiel Spielplan URL

```
https://www.basketball-bund.net/public/spielplan_list.jsp?print=1&viewDescKey=sport.dbb.liga.SpielplanViewPublic/index.jsp_&liga_id=51961
```

Andere URLs (Tabelle, Ergebnisse) werden aus der Liga-ID abgeleitet.

*(Keine weiteren Änderungen am DB-Schema)*