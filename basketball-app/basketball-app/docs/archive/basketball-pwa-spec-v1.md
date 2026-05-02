# Basketball Einsatzplan PWA - Komplette Spezifikation

## 1. Überblick

Eine Progressive Web App zur Verwaltung von Basketball-Jugendmannschaften (U8, U10, U12), die Spielereinsätze optimiert, Spielerstatistiken verwaltet und Spielpläne organisiert.

### 1.1 Minibasketball Regelwerk (DBB) - Altersklassenübergreifend

**Gemeinsame Pflicht-Einsatzregel für ALLE Altersklassen:**
- ⚠️ **Jedes Kind MUSS mindestens 2 Perioden/Achtel spielen**
- ⚠️ **Jedes Kind MUSS mindestens 2 Perioden/Achtel aussetzen**
- **Spielerwechsel NUR in den Pausen** (zwischen Achteln)

**Altersklassen-spezifische Unterschiede:**

| Regelaspekt | U8 | U10 | U12 |
|-------------|----|----|-----|
| **Spielzeit** | 8 × 4 Min (gestoppt) | 8 × 5 Min (gestoppt) | 8 × 5 Min (gestoppt) |
| **Spieleranzahl** | 3 gegen 3 (Ganzfeld) | 4 gegen 4 | 4 gegen 4 (5v5 in höchster Klasse möglich) |
| **Spielball** | Größe 4 | Größe 5 (leichtere Modelle) | Größe 5 (Originalgewicht) |
| **Spielfeld** | Kleineres Feld/Grundschule | Normales Feld/Querfeld | Normales Feld/Querfeld |
| **Korbhöhe** | 2,05 - 2,60 m (variabel) | 2,60 m | 2,60 m |
| **Drei-Punkte** | ohne | außerhalb der Zone | außerhalb der Zone |
| **Freiwurflinie** | 2 m nach vorne | 1 m nach vorne | 1 m nach vorne |
| **Rückspiel** | nicht angewendet | nicht angewendet | normale Regel |
| **Punktestand anzeigen** | ❌ NEIN | ❌ NEIN | ✅ JA |
| **Tabelle/Rangliste** | ❌ NEIN | ❌ NEIN | ✅ JA |
| **Zeitregeln** | nicht angewendet | nicht angewendet | nicht angewendet* |
| **Auszeiten** | keine | keine | keine* |

*U12 "leistungsorientiert" (höchste Spielklasse): Zeitregeln (3,5,8,14/24), Auszeiten (1 pro Halbzeit), 2 SR möglich

**Ausnahme Spielerwechsel (gilt für alle Altersklassen):**
- Bei körperlichen oder seelisch-emotionalen Gründen (oder Ausschluss durch Fouls)
- In Abstimmung zwischen Betreuenden und Schiedsrichter
- Einzuwechseln: Kind mit der bisher geringsten Spielzeit
- Die Periode wird **nur für das ausgewechselte Kind** als gespielt gewertet

---

## 2. Datenmodell

### 2.0 Mannschaft / Team

**Primärschlüssel:** `team_id` (UUID)

| Feldname | Datentyp | Beschreibung |
|----------|----------|--------------|
| team_id | UUID | Eindeutige Team-ID |
| name | String | Teamname (z.B. "DJK Neustadt U10") |
| altersklasse | Enum | **"U8", "U10", "U12"** |
| saison | String | Saison (z.B. "2025/26") |
| trainer | String | Trainername |
| trainer_email | String | Trainer E-Mail |
| trainer_tel | String | Trainer Telefon |
| created_at | DateTime | Erstellungsdatum |

**Altersklassen-Konfiguration (automatisch aus altersklasse):**
```javascript
const altersklassenConfig = {
    "U8": {
        spielzeit_pro_achtel: 4, // Minuten
        spieler_auf_feld: 3,
        ball_groesse: 4,
        korbhoehe_min: 2.05,
        korbhoehe_max: 2.60,
        punktestand_anzeigen: false,
        tabelle_fuehren: false,
        rueckspiel_regel: false,
        drei_punkte: false,
        freiwurflinie_versatz: 2.0 // Meter
    },
    "U10": {
        spielzeit_pro_achtel: 5,
        spieler_auf_feld: 4,
        ball_groesse: 5,
        ball_gewicht: "leicht", // leichtere Modelle zulässig
        korbhoehe: 2.60,
        punktestand_anzeigen: false,
        tabelle_fuehren: false,
        rueckspiel_regel: false,
        drei_punkte: true,
        drei_punkte_zone: "außerhalb_zone",
        freiwurflinie_versatz: 1.0
    },
    "U12": {
        spielzeit_pro_achtel: 5,
        spieler_auf_feld: 4,
        ball_groesse: 5,
        ball_gewicht: "original",
        korbhoehe: 2.60,
        punktestand_anzeigen: true, // ✅ Anzeige erlaubt!
        tabelle_fuehren: true, // ✅ Rangliste erlaubt!
        rueckspiel_regel: true,
        drei_punkte: true,
        drei_punkte_zone: "außerhalb_zone",
        freiwurflinie_versatz: 1.0,
        // Optional: U12 leistungsorientiert
        leistungsorientiert_moeglich: true,
        leistungsorientiert_optionen: {
            spieler_auf_feld: 5, // 5 gegen 5
            zeitregeln: true, // 3, 5, 8, 14/24
            auszeiten: 1, // pro Halbzeit
            zwei_sr: true
        }
    }
}
```

### 2.1 Spieler (tbl_spieler)

**Primärschlüssel:** `U10ID` (Integer, Auto-Increment)

| Feldname | Datentyp | Beschreibung |
|----------|----------|--------------|
| U10ID | Integer | Eindeutige ID |
| Spieler | String | Vollständiger Name |
| Vorname | String | Vorname |
| Nachname | String | Nachname |
| Geburtsdatum | Date | Geburtsdatum |
| Konf_Gr_Oben | Integer | Konfektionsgröße Oberteil (116-170) |
| Konf_Gr_Unten | Integer | Konfektionsgröße Unterteil |
| TNA_Nr | String | Teilnehmerausweis-Nummer des DBB (Format: DDMMYYNNN) |
| Erz_berechtigter | String | Name des Erziehungsberechtigten |
| Tel | String | Telefonnummer |
| Kontakt_Email | String | E-Mail-Adresse |
| gemeldet | DateTime | Meldedatum (Format: "DD.MM.YYYY HH:MM") |
| in_easyVerein | Boolean | In easyVerein registriert |

**Skills (Bewertung 1-3):**
- Ballhandling_unter_Druck
- Passen_und_Fangen
- Spieluebersicht_Entscheiden
- Teamplay_FairPlay
- OnBall_Defense_Bereitschaft
- Laufbereitschaft_Belastbarkeit
- Rebound_Bereitschaft
- Positionsflex
- Abschlussbereitschaft

**Berechnete Felder:**

```javascript
// Score-Berechnung (1-3): Textuelle Bewertung wird auf numerischen Score gemappt
AB_Score = mapTextToScore(Abschlussbereitschaft, bewertungslabels)
BH_Score = mapTextToScore(Ballhandling_unter_Druck, bewertungslabels)
LB_Score = mapTextToScore(Laufbereitschaft_Belastbarkeit, bewertungslabels)
OBD_Score = mapTextToScore(OnBall_Defense_Bereitschaft, bewertungslabels)
PuF_Score = mapTextToScore(Passen_und_Fangen, bewertungslabels)
P_Score = mapTextToScore(Positionsflex, bewertungslabels)
RB_Score = mapTextToScore(Rebound_Bereitschaft, bewertungslabels)
SuE_Score = mapTextToScore(Spieluebersicht_Entscheiden, bewertungslabels)
TP_Score = mapTextToScore(Teamplay_FairPlay, bewertungslabels)

// Gewichtete Skills
ABS_gewichtet = AB_Score * 0.12
BHS_gewichtet = BH_Score * 0.16
LBS_gewichtet = LB_Score * 0.12
OBDS_gewichtet = OBD_Score * 0.09
PFS_gewichtet = PuF_Score * 0.16
PS_gewichtet = P_Score * 0.06
RBS_gewichtet = RB_Score * 0.06
SUES_gewichtet = SuE_Score * 0.12
TPS_gewichtet = TP_Score * 0.11

// Gesamt-Wert (Spielerstärke)
Gesamt_Wert = SUM(ABS_gewichtet, BHS_gewichtet, LBS_gewichtet, 
                  OBDS_gewichtet, PFS_gewichtet, PS_gewichtet, 
                  RBS_gewichtet, SUES_gewichtet, TPS_gewichtet)
// Wertebereich: 0.84 - 2.52 (typisch: 1.5 - 2.5)
```

---

### 2.2 Einsatzplan (tbl_einsatzplan)

**Pro Spiel wird ein Einsatzplan erstellt mit mehreren Zeilen (eine pro Spieler)**

**Primärschlüssel:** `einsatzplan_id` (UUID)
**Fremdschlüssel:** `game_id`, `spieler_id`

| Feldname | Datentyp | Beschreibung | Berechnung |
|----------|----------|--------------|------------|
| einsatzplan_id | UUID | Eindeutige ID dieser Zeile | Auto-generiert |
| game_id | UUID | Referenz zum Spiel | Fremdschlüssel |
| spieler_id | UUID | Referenz zum Spieler | Fremdschlüssel |
| POs | Integer | Position/Zeilennummer | `ROW() - 1` |
| TNA_Nr | String | Teilnehmerausweis-Nummer | Lookup aus Spielerverwaltung |
| Tr_Nr | Integer | Trikotnummer | Manuelle Eingabe |
| Jersey_Groesse | Integer | Trikotgröße | Lookup aus Spielerverwaltung |
| Achtung | String | Warnung/Hinweis | Berechnet aus Pausen/Gespielt |
| Spieler | String | Spielername | Lookup aus Spielerverwaltung |

**Quartiereinteilung (8 Achtel pro Spiel):**
- Q1_1, Q1_2 (1. Viertel, 1. + 2. Achtel)
- Q2_1, Q2_2 (2. Viertel)
- Q3_1, Q3_2 (3. Viertel)
- Q4_1, Q4_2 (4. Viertel)

**Werte:** "Im Spiel" oder "Bank"

**Wichtig:** Die Anzahl der Spieler "Im Spiel" pro Achtel ist altersklassenabhängig:
- **U8:** 3 Spieler auf dem Feld
- **U10:** 4 Spieler auf dem Feld
- **U12:** 4 Spieler auf dem Feld (5 bei "leistungsorientiert")

**Berechnete Felder:**

```javascript
// Anzahl Pausen
Pausen = COUNT(Q1_1:Q4_2 WHERE value == "Bank")

// Anzahl gespielte Achtel
Gespielt = COUNT(Q1_1:Q4_2 WHERE value == "Im Spiel")

// Einsatzmöglichkeiten (flexibel einsetzbar)
Einsatzmoeglichkeiten = 8 - Gespielt - Pausen

// Hinweis-Logik (Minibasketball-Regelkonformität)
if (Gespielt < 2) {
    Achtung = "Muss spielen!" // ⚠️ REGELVERSTOSS - kritisch!
} else if (Pausen < 2) {
    Achtung = "Sollte pausieren" // ⚠️ REGELVERSTOSS - kritisch!
} else if (Einsatzmoeglichkeiten > 0) {
    Achtung = "Flexibel"
} else {
    Achtung = "" // Regelkonform: 2+ gespielt, 2+ pausiert
}

// Gewichtete Skills werden aus Spielerverwaltung übernommen (XLOOKUP)
BHS_gewichtet = lookup(Spieler, tbl_u10mix_team, "BHS_gewichtet")
// ... analog für alle anderen gewichteten Skills

Gesamt_Wert = lookup(Spieler, tbl_u10mix_team, "Gesamt_Wert")
```

**Teamstatistiken pro Achtel:**

```javascript
// Altersklassenabhängige Spieleranzahl auf dem Feld
function getPlayersOnCourtCount(altersklasse, leistungsorientiert = false) {
    if (altersklasse === "U8") return 3;
    if (altersklasse === "U10") return 4;
    if (altersklasse === "U12") {
        return leistungsorientiert ? 5 : 4;
    }
}

// Teamschnitt (durchschnittliche Spielerstärke auf dem Feld)
// Zielwert: > 2.0
function calculateTeamAverage(quarter, altersklasse) {
    let playersOnCourt = getPlayersWhere(quarter == "Im Spiel")
    let expectedCount = getPlayersOnCourtCount(altersklasse)
    
    // Validierung
    if (playersOnCourt.length !== expectedCount) {
        throw new Error(`Falsche Spieleranzahl: ${playersOnCourt.length}, erwartet: ${expectedCount}`)
    }
    
    let totalScore = SUM(playersOnCourt.map(p => p.Gesamt_Wert))
    return totalScore / playersOnCourt.length
}

// Durchschnittlicher Skill-Level pro Achtel
// z.B. für Ballhandling unter Druck:
function calculateSkillAverage(quarter, skillName, skillWeight) {
    let playersOnCourt = getPlayersWhere(quarter == "Im Spiel")
    let totalWeightedSkill = SUM(playersOnCourt.map(p => p[skillName + "_gewichtet"]))
    let count = playersOnCourt.length
    let avgWeighted = totalWeightedSkill / count
    return avgWeighted / skillWeight // Zurück auf 1-3 Skala
}
```

---

### 2.3 Spiel (tbl_spiele)

**Primärschlüssel:** `game_id` (UUID)
**Fremdschlüssel:** `team_id`

| Feldname | Datentyp | Beschreibung |
|----------|----------|--------------|
| game_id | UUID | Eindeutige Spiel-ID |
| team_id | UUID | Eigenes Team |
| Datum | DateTime | Datum und Uhrzeit |
| Gegner | String | Gegnermannschaft |
| Heim_Auswaerts | Enum | "Heim" oder "Auswärts" |
| Spielhalle | String | Austragungsort |
| Altersklasse | Enum | "U8", "U10", "U12" |
| Leistungsorientiert | Boolean | Nur U12: Höchste Spielklasse mit erweiterten Regeln |
| Spielnummer | String | Optional: Spielnummer aus Spielplan |
| Spieltag | Integer | Optional: Spieltag-Nummer |
| Schiedsrichter | String | Optional: Schiedsrichter |
| Ergebnis_Eigenes_Team | Integer | Optional: Eigene Punkte (nur U12!) |
| Ergebnis_Gegner | Integer | Optional: Gegnerpunkte (nur U12!) |
| Status | Enum | "geplant", "aktiv", "beendet", "abgesagt" |
| Notizen | Text | Freitext für Bemerkungen |

---

### 2.4 Spielplan (tbl_spielplan)

| Feldname | Datentyp | Beschreibung |
|----------|----------|--------------|
| Nr | Integer | Spielnummer |
| Tag | Integer | Spieltag |
| Datum | DateTime | Datum und Uhrzeit |
| Heim | String | Heimmannschaft |
| Gast | String | Gastmannschaft |
| Spielhalle | String | Austragungsort |
| Schiedsrichter | String | Schiedsrichter (optional) |

**Quelle:** http://basketball-bund.net
**Format:** U10 mixed Bezirksliga (U10 Oberpfalz; Liganr.: 1040)

---

### 2.4 Spielplan (tbl_spielplan)

**Für Import von externen Spielplänen (z.B. basketball-bund.net)**

| Feldname | Datentyp | Beschreibung |
|----------|----------|--------------|
| spielplan_id | UUID | Eindeutige ID |
| Liga | String | Liga-Bezeichnung (z.B. "U10 Oberpfalz") |
| Nr | Integer | Spielnummer |
| Tag | Integer | Spieltag |
| Datum | DateTime | Datum und Uhrzeit |
| Heim | String | Heimmannschaft |
| Gast | String | Gastmannschaft |
| Spielhalle | String | Austragungsort |
| Schiedsrichter | String | Schiedsrichter (optional) |
| Quelle | String | Import-Quelle (z.B. "basketball-bund.net") |

**Format:** U8/U10/U12 mixed Bezirksliga

---

### 2.5 Trikotverwaltung (tbl_trikots)

**Primärschlüssel:** `trikot_id` (UUID)
**Fremdschlüssel:** `team_id`, `spieler_id`

| Feldname | Datentyp | Beschreibung |
|----------|----------|--------------|
| Art | String | "Wendejersey" oder "Hose" |
| Nummer | Integer/String | Trikotnummer (4-15) |
| Groesse | String | "3xs", "2xs", "xs", "s", "m", "l", "xl" |
| EU_Groesse | Integer | 116, 122, 128, 134, 140, 146, 152, 158, 164, 170 |
| Farbe_dunkel | String | Farbe der dunklen Seite |
| Farbe_hell | String | Farbe der hellen Seite |
| Zugewiesen | String | Spielername oder "frei" |
| Besonderheiten | String | "Trikotsatz" oder leer |

**Inventar-Übersicht:**
```javascript
inventar = {
    jerseys: {
        "2xs": 4,
        "3xs": 2,
        "xs": 5
    },
    hosen: {
        "2xs": 4,
        "3xs": 3,
        "xs": 2
    }
}
```

---

### 2.5 Konfiguration (Konfig)

**Zweck:** Zentrale Konfigurationsstelle für:
- Metrik-Gewichtungen
- Bewertungslabels und Validierungswerte
- Dropdown-Optionen (Größen, Farben, Teams, Status)
- Systemeinstellungen

**Metrik-Gewichtungen:**

| Metrik | Gewicht | Fokus/Bedeutung |
|--------|---------|-----------------|
| Ballhandling unter Druck | 0.16 | Ballkontrolle und Entscheidungsfindung |
| Passen und Fangen | 0.16 | Präzise Pässe, Ballkontrolle im Teamspiel |
| Spielübersicht/Entscheiden | 0.12 | Wahrnehmung, Passfreude, altersgerechte Entscheidungen |
| Laufbereitschaft/Belastbarkeit | 0.12 | Ausdauer über 8 Achtel, sportgerechte Belastung |
| Abschlussbereitschaft | 0.12 | Mut zum Abschluss, Trefferpotenzial in Korbnähe |
| Teamplay/Fair-Play | 0.11 | Ball teilen, Regeln, Fairness |
| On-Ball-Defense/Bereitschaft | 0.09 | Verteidigung, Grundhaltung |
| Rebound-Bereitschaft | 0.06 | Aktiv am Ball, Ballbesitzgewinn |
| Positionsflexibilität | 0.06 | Einsatz auf verschiedenen Positionen |

**Summe:** 1.00

**Bewertungslabels (Level 1-3):**

| Skill | Level 1 (schwach) | Level 2 (mittel) | Level 3 (stark) |
|-------|-------------------|------------------|-----------------|
| Ballhandling | "oft Ballverlust/Stoppen" | "meist sicher" | "sicher auch gegen Druck" |
| Passen & Fangen | "häufig ungenau" | "meist ankommend" | "präzise und rechtzeitig" |
| Spielübersicht | "sieht selten Optionen" | "sieht und nutzt manchmal" | "erkennt früh und handelt passend" |
| Teamplay | "braucht oft Erinnerung" | "hält meist ein" | "ist Vorbild" |
| Defense | "häufig zu spät" | "meist präsent" | "stabil und aufmerksam" |
| Laufbereitschaft | "braucht oft Pausen" | "hält meist mit" | "hält gut durch" |
| Rebound | "selten dabei" | "manchmal aktiv" | "konsequent aktiv" |
| Positionsflexibilität | "nur in einem Bereich sicher" | "in beiden Bereichen grundlegend" | "flexibel in beiden Bereichen, entsprechend der Mini-Empfehlung 'alle lernen alles'" |
| Abschluss | "Zögert häufig, traut sich kaum, einfache Chancen werden selten genutzt." | "Nimmt Abschlüsse manchmal, nutzt freie Korblagen und trifft solide." | "Sucht aktiv Abschlusschancen, zeigt Mut und trifft oft unter Mini-Bedingungen (Korbnähe, einfache Situationen)." |

**Teams Bezirksliga Oberpfalz 25-26:**
- DJK Neustadt a. d. Waldnaab 1
- Fibalon Baskets Neumarkt
- Regensburg Baskets 1
- Regensburg Baskets 2
- TB Weiden Basketball
- TSV 1880 Schwandorf
- TV Amberg-Sulzbach BSG 2

**Einsatzstatus:** "Im Spiel", "Bank"

---

## 3. Geschäftslogik & Algorithmen

### 3.1 Spielereinsatz-Optimierung (altersklassenübergreifend)

**Minibasketball-Pflichtregeln (ALLE Altersklassen: U8, U10, U12):**
1. ⚠️ Jedes Kind MUSS mindestens 2 Achtel spielen
2. ⚠️ Jedes Kind MUSS mindestens 2 Achtel pausieren
3. Maximum: 6 Achtel Spielzeit pro Kind (= 8 - 2 Pausen)

**Optimierungsziele (nach Pflichtregeln):**
1. Minibasketball-Regelkonformität (Priorität 1)
2. Faire Spielzeit (~4 Achtel optimal)
3. Ausgeglichener Teamschnitt (> 2.0 pro Achtel)
4. Ausgewogene Skills auf dem Feld

**Algorithmus (altersklassenabhängig):**

```javascript
function optimizeLineup(players, altersklasse, leistungsorientiert = false, numQuarters = 8) {
    // Initialisierung
    let lineup = Array(numQuarters).fill([])
    
    // Altersklassenabhängige Spieleranzahl
    let playersPerQuarter = getPlayersOnCourtCount(altersklasse, leistungsorientiert)
    // U8: 3, U10: 4, U12: 4 (oder 5 bei leistungsorientiert)
    
    // Minibasketball-Regel: Jeder mindestens 2 Achtel spielen, 2 Achtel pausieren
    const MIN_PLAYTIME = 2
    const MIN_REST = 2
    const MAX_PLAYTIME = numQuarters - MIN_REST // = 6
    
    // Optimale Spielzeit: ~4 Achtel
    let targetPlaytime = Math.floor(numQuarters / 2)
    
    // 2. Iterative Besetzung jedes Achtels
    for (let q = 0; q < numQuarters; q++) {
        let available = players.filter(p => {
            // Muss noch Mindestspielzeit erfüllen?
            let remainingQuarters = numQuarters - q
            let needsToPlay = (p.currentPlaytime < MIN_PLAYTIME) && 
                            (remainingQuarters <= (MIN_PLAYTIME - p.currentPlaytime))
            
            // Hat schon Maximumspielzeit erreicht?
            let maxPlaytimeReached = p.currentPlaytime >= MAX_PLAYTIME
            
            // Muss noch Mindestpause erfüllen?
            let needsRest = (p.currentRest < MIN_REST) && 
                          (remainingQuarters <= (MIN_REST - p.currentRest))
            
            // Minibasketball-Regellogik
            if (needsToPlay) return true // MUSS spielen
            if (maxPlaytimeReached) return false // DARF NICHT mehr spielen
            if (needsRest) return false // MUSS pausieren
            
            // Normale Optimierung: Präferenz für ~4 Achtel
            return p.currentPlaytime < targetPlaytime + 1
        })
        
        // 3. Skill-Balance optimieren
        let selected = selectBalancedTeam(available, playersPerQuarter)
        lineup[q] = selected
        
        // 4. Spieler-Status aktualisieren
        selected.forEach(p => {
            p.currentPlaytime++
            p.currentRest = 0
        })
        
        let benched = available.filter(p => !selected.includes(p))
        benched.forEach(p => p.currentRest++)
    }
    
    // 5. Minibasketball-Regelvalidierung
    let validation = validateMinibasketballRules(players, altersklasse)
    if (!validation.valid) {
        console.error("Minibasketball-Regelverstöße:", validation.violations)
    }
    
    return { lineup, validation }
}

function getPlayersOnCourtCount(altersklasse, leistungsorientiert = false) {
    switch(altersklasse) {
        case "U8": return 3;
        case "U10": return 4;
        case "U12": return leistungsorientiert ? 5 : 4;
        default: throw new Error(`Unbekannte Altersklasse: ${altersklasse}`)
    }
}

function selectBalancedTeam(availablePlayers, count) {
    // Greedy-Ansatz: Wähle Spieler mit höchstem Gesamt-Wert
    // unter Berücksichtigung von Skill-Diversity
    let selected = []
    let remaining = [...availablePlayers]
    
    while (selected.length < count && remaining.length > 0) {
        // Score für jeden Spieler berechnen
        let scores = remaining.map(p => ({
            player: p,
            score: calculateSelectionScore(p, selected)
        }))
        
        // Besten auswählen
        scores.sort((a, b) => b.score - a.score)
        let best = scores[0].player
        
        selected.push(best)
        remaining = remaining.filter(p => p !== best)
    }
    
    return selected
}

function calculateSelectionScore(player, currentTeam) {
    let baseScore = player.Gesamt_Wert
    
    // Bonus für fehlende Skills im aktuellen Team
    let skillBalance = 0
    if (currentTeam.length > 0) {
        // Prüfe, welche Skills unterrepräsentiert sind
        let avgBH = average(currentTeam.map(p => p.BH_Score))
        let avgLB = average(currentTeam.map(p => p.LB_Score))
        let avgAB = average(currentTeam.map(p => p.AB_Score))
        
        if (player.BH_Score > avgBH) skillBalance += 0.1
        if (player.LB_Score > avgLB) skillBalance += 0.1
        if (player.AB_Score > avgAB) skillBalance += 0.1
    }
    
    return baseScore + skillBalance
}
```

### 3.2 Minibasketball-Regelvalidierung (U8, U10, U12)

```javascript
function validateMinibasketballRules(players, lineup, altersklasse, leistungsorientiert = false) {
    let violations = []
    
    // Erwartete Spieleranzahl pro Achtel
    const expectedPlayersOnCourt = getPlayersOnCourtCount(altersklasse, leistungsorientiert)
    
    // Spieler-individuelle Validierung
    players.forEach(player => {
        // Regel 1: Mindestens 2 Achtel spielen (ALLE Altersklassen)
        if (player.currentPlaytime < 2) {
            violations.push({
                player: player.Spieler,
                rule: "MIN_PLAYTIME",
                severity: "critical",
                altersklasse: altersklasse,
                message: `${player.Spieler} hat nur ${player.currentPlaytime} Achtel gespielt (min. 2 erforderlich - DBB Minibasketball)`,
                current: player.currentPlaytime,
                required: 2,
                reference: "DBB Minibasketball Spielregeln §Einsatzzeiten (gilt für U8, U10, U12)"
            })
        }
        
        // Regel 2: Mindestens 2 Achtel pausieren (ALLE Altersklassen)
        if (player.currentRest < 2) {
            violations.push({
                player: player.Spieler,
                rule: "MIN_REST",
                severity: "critical",
                altersklasse: altersklasse,
                message: `${player.Spieler} hat nur ${player.currentRest} Achtel pausiert (min. 2 erforderlich - DBB Minibasketball)`,
                current: player.currentRest,
                required: 2,
                reference: "DBB Minibasketball Spielregeln §Einsatzzeiten (gilt für U8, U10, U12)"
            })
        }
        
        // Regel 3: Maximum 6 Achtel Spielzeit (berechnet: 8 - 2 Pausen)
        if (player.currentPlaytime > 6) {
            violations.push({
                player: player.Spieler,
                rule: "MAX_PLAYTIME",
                severity: "critical",
                altersklasse: altersklasse,
                message: `${player.Spieler} hat ${player.currentPlaytime} Achtel gespielt (max. 6 erlaubt)`,
                current: player.currentPlaytime,
                required: 6
            })
        }
    })
    
    // Achtel-spezifische Validierung (korrekte Spieleranzahl)
    lineup.forEach((quarter, index) => {
        let playersOnCourt = quarter.filter(p => p.status === "Im Spiel").length
        if (playersOnCourt !== expectedPlayersOnCourt) {
            violations.push({
                rule: "WRONG_PLAYER_COUNT",
                severity: "critical",
                altersklasse: altersklasse,
                quarter: index + 1,
                message: `Achtel ${index + 1}: ${playersOnCourt} Spieler auf dem Feld, aber ${expectedPlayersOnCourt} erforderlich (${altersklasse})`,
                current: playersOnCourt,
                required: expectedPlayersOnCourt,
                reference: `DBB Minibasketball §Spieleranzahl (${altersklasse}: ${expectedPlayersOnCourt} gegen ${expectedPlayersOnCourt})`
            })
        }
    })
    
    // Warnung: Weniger als 2 Auswechselspieler
    let benchPlayers = players.filter(p => p.status === "Bank").length
    if (benchPlayers < 2) {
        violations.push({
            rule: "MIN_BENCH_PLAYERS",
            severity: "warning",
            altersklasse: altersklasse,
            message: `Nur ${benchPlayers} Auswechselspieler (empfohlen: mind. 2)`,
            current: benchPlayers,
            required: 2,
            reference: "DBB Minibasketball Spielregeln §Verstöße gegen Spielzeitvorgaben"
        })
    }
    
    return {
        valid: violations.filter(v => v.severity === "critical").length === 0,
        violations: violations,
        altersklasse: altersklasse,
        summary: {
            total: violations.length,
            critical: violations.filter(v => v.severity === "critical").length,
            warnings: violations.filter(v => v.severity === "warning").length
        }
    }
}

// Außerordentlicher Spielerwechsel (Ausnahmeregelung - gilt für ALLE Altersklassen)
function emergencySubstitution(currentQuarter, reason, altersklasse) {
    // Gründe: "injury", "emotional", "foul_disqualification"
    let availablePlayers = players.filter(p => 
        p.status === "Bank" &&
        !p.isSubstitutedOut
    )
    
    // Kind mit geringster Spielzeit einwechseln
    availablePlayers.sort((a, b) => a.currentPlaytime - b.currentPlaytime)
    let substitute = availablePlayers[0]
    
    return {
        playerOut: currentPlayer,
        playerIn: substitute,
        quarter: currentQuarter,
        reason: reason,
        altersklasse: altersklasse,
        note: "Periode wird NUR für ausgewechseltes Kind als gespielt gewertet",
        reference: "DBB Minibasketball §Ausnahme Spielerwechsel (gilt für U8, U10, U12)"
    }
}
```

### 3.3 Warnungen & Hinweise (altersklassenübergreifend)

```javascript
function generateWarnings(player, einsatzplan, altersklasse) {
    let warnings = []
    
    // Minibasketball-Regel: Mindestens 2 Achtel spielen (ALLE Altersklassen)
    if (player.Gespielt < 2) {
        warnings.push({
            type: "critical",
            icon: "⚠️",
            message: "Muss spielen!",
            reason: "Minibasketball-Regel: Mindestens 2 Achtel erforderlich",
            detail: `Aktuell: ${player.Gespielt}/2 Achtel`,
            altersklasse: altersklasse,
            reference: "DBB Minibasketball (U8/U10/U12)"
        })
    }
    
    // Minibasketball-Regel: Mindestens 2 Achtel pausieren (ALLE Altersklassen)
    if (player.Pausen < 2) {
        warnings.push({
            type: "critical",
            icon: "⏸️",
            message: "Sollte pausieren",
            reason: "Minibasketball-Regel: Mindestens 2 Achtel Pause erforderlich",
            detail: `Aktuell: ${player.Pausen}/2 Achtel`,
            altersklasse: altersklasse,
            reference: "DBB Minibasketball (U8/U10/U12)"
        })
    }
    
    // Maximum erreicht (6 Achtel gespielt)
    if (player.Gespielt >= 6) {
        warnings.push({
            type: "warning",
            icon: "🛑",
            message: "Maximum erreicht",
            reason: "Minibasketball-Regel: Max. 6 Achtel erlaubt",
            detail: "Keine weitere Spielzeit möglich",
            altersklasse: altersklasse
        })
    }
    
    // Flexibel einsetzbar (Regeln erfüllt)
    if (player.Gespielt >= 2 && player.Pausen >= 2 && player.Einsatzmoeglichkeiten > 0) {
        warnings.push({
            type: "info",
            icon: "✓",
            message: "Flexibel",
            reason: "Minibasketball-Regeln erfüllt",
            detail: `${player.Einsatzmoeglichkeiten} Achtel frei verfügbar`,
            altersklasse: altersklasse
        })
    }
    
    return warnings
}
```

### 3.4 Team-Analyse (altersklassenabhängig)

```javascript
function analyzeTeamBalance(lineup) {
    let stats = {
        quarters: []
    }
    
    for (let q = 0; q < lineup.length; q++) {
        let quarter = lineup[q]
        let onCourt = quarter.filter(p => p.status === "Im Spiel")
        
        stats.quarters.push({
            teamAverage: average(onCourt.map(p => p.Gesamt_Wert)),
            ballhandling: average(onCourt.map(p => p.BH_Score)),
            passing: average(onCourt.map(p => p.PuF_Score)),
            overview: average(onCourt.map(p => p.SuE_Score)),
            stamina: average(onCourt.map(p => p.LB_Score)),
            shooting: average(onCourt.map(p => p.AB_Score)),
            teamplay: average(onCourt.map(p => p.TP_Score)),
            defense: average(onCourt.map(p => p.OBD_Score)),
            rebound: average(onCourt.map(p => p.RB_Score)),
            flexibility: average(onCourt.map(p => p.P_Score))
        })
    }
    
    return stats
}
```

---

## 4. UI/UX Anforderungen

### 4.0 Team-Auswahl & Altersklassen-Management

**Team-Übersicht:**
- Liste aller Teams mit Altersklasse-Badge (U8/U10/U12)
- Filter nach Altersklasse
- "Neues Team erstellen" → Altersklassen-Auswahl

**Team erstellen/bearbeiten:**
- Pflichtfeld: **Altersklasse** (U8, U10, U12)
- Bei U12: Checkbox "Leistungsorientiert" (höchste Spielklasse)
- Automatische Konfiguration basierend auf Altersklasse:
  - Spieleranzahl auf Feld (U8: 3, U10: 4, U12: 4/5)
  - Spielzeit pro Achtel (U8: 4 Min, U10/U12: 5 Min)
  - Punktestand-Anzeige (nur U12)
  - Tabellen-Führung (nur U12)

### 4.1 Hauptbildschirme

**1. Dashboard**
- Übersicht nächstes Spiel **mit Altersklassen-Anzeige**
- Team-Status (Anzahl Spieler, Durchschnittswerte, Altersklasse)
- Schnellzugriff auf Einsatzplan und Spielerverwaltung
- **U12-spezifisch:** Tabellen-Position und Punktestand (falls aktiviert)

**2. Spielerverwaltung**
- Tabelle aller Spieler mit Filterung/Sortierung
- **Altersklassen-Filter** im Header
- Detailansicht: Persönliche Daten + Skills
- Skill-Bewertung mit Dropdown (Level 1-3 mit Beschreibungen)
- Gesamt-Wert Visualisierung (Radar-Chart)
- **Altersvalidierung:** Geburtsdatum muss zur Altersklasse passen

**3. Einsatzplan**
- **Header zeigt Altersklasse und Spieleranzahl an** (z.B. "U8: 3 gegen 3" oder "U10: 4 gegen 4")
- Matrix-View: Spieler (Zeilen) × Achtel (Spalten)
- **Dynamische Spaltenanzahl:** Zeigt erwartete Spieleranzahl pro Achtel
  - U8: Zeigt "3 von 3" Indikatoren
  - U10: Zeigt "4 von 4" Indikatoren
  - U12: Zeigt "4 von 4" (oder "5 von 5" bei leistungsorientiert)
- Drag & Drop für "Im Spiel" / "Bank"
- **Wechsel nur zwischen Achteln möglich** (nicht während laufender Perioden)
- **Minibasketball-Regelvalidierung in Echtzeit (alle Altersklassen):**
  - ⚠️ Roter Rahmen bei Regelverstößen (< 2 Achtel gespielt/pausiert)
  - 🛑 Blockierung bei falscher Spieleranzahl (z.B. 4 statt 3 bei U8)
  - 🛑 Blockierung bei Maximum (6 Achtel gespielt)
  - ✓ Grünes Häkchen bei regelkonformer Planung
  - 📢 Warnung bei < 2 Auswechselspielern
- **Außerordentlicher Spielerwechsel-Button:**
  - Für Verletzungen, emotionale Gründe, Foul-Disqualifikation
  - System schlägt automatisch Kind mit geringster Spielzeit vor
  - Markierung: "Periode nur für ausgewechseltes Kind gewertet"
- Live-Berechnung von:
  - Pausen/Gespielt pro Spieler
  - Teamschnitt pro Achtel (farbcodiert: grün > 2.0, gelb 1.5-2.0, rot < 1.5)
  - Warnungen (Icons: ⚠️ Muss spielen, ⏸️ Sollte pausieren, ✓ Flexibel)
- "Auto-Optimize" Button (berücksichtigt Altersklasse und Minibasketball-Regeln automatisch)
- **"DBB-Regelkonformität prüfen" Button:** Vollständige Validierung nach offiziellen Regeln
- **U12-spezifisch:** Punktestand-Eingabe nach Spielende (optional)

**4. Spielplan**
- Kalender-Ansicht oder Liste
- **Altersklassen-Filter**
- Filter nach Heim/Auswärts
- Verknüpfung zu Einsatzplan
- **U12-spezifisch:** Tabellenansicht mit Punkten, Siegen, Niederlagen

**5. Trikotverwaltung**
- Inventar-Übersicht
- Zuweisung Spieler ↔ Trikot
- Verfügbarkeits-Check

### 4.2 Visualisierungen

**Spieler-Radar-Chart:**
```
   Ballhandling (3)
        /\
       /  \
Defense -- Passing (2.5)
     \    /
      \  /
   Stamina (3)
```

**Teamschnitt pro Achtel (Line Chart):**
```
Score
3.0 |           ___
2.5 |      ___/   \___
2.0 |  ___/           \___  (Zielbereich)
1.5 |_/                   \
    Q1-1 Q1-2 ... Q4-2
```

**Spielzeit-Verteilung (Bar Chart):**
```
Spieler A: ████████ (4 Achtel)
Spieler B: ██████ (3 Achtel)
Spieler C: ████████████ (6 Achtel) ⚠️
```

---

## 5. Technische Anforderungen

### 5.1 PWA Features

- **Offline-Fähigkeit:** Service Worker für Cache
- **Installierbar:** manifest.json
- **Responsive:** Mobile-First Design
- **Performance:** Lazy Loading, Code Splitting

### 5.2 Datenspeicherung

**Option 1: IndexedDB (Offline-First)**
```javascript
const db = {
    players: ObjectStore,
    lineup: ObjectStore,
    schedule: ObjectStore,
    jerseys: ObjectStore,
    config: ObjectStore
}
```

**Option 2: Firebase/Supabase (Cloud-Sync)**
- Echtzeit-Synchronisation
- Multi-Device Support
- Backup & Restore

### 5.3 Export/Import

**Export-Formate:**
- JSON (Backup)
- Excel (.xlsx) (Kompatibilität)
- PDF (Einsatzplan-Druck)

**Import:**
- Excel-Datei hochladen
- CSV-Import (Spielplan von basketball-bund.net)

---

## 6. Feature-Roadmap

### Phase 1 (MVP)
- ✅ Spielerverwaltung (CRUD)
- ✅ Einsatzplan (manuell)
- ✅ Grundlegende Berechnungen
- ✅ PWA-Setup

### Phase 2
- Auto-Optimize Algorithmus
- Team-Analyse Dashboard
- Export/Import

### Phase 3
- Trikotverwaltung
- Spielplan-Integration
- Erweiterte Statistiken

### Phase 4
- Cloud-Sync
- Multi-Team Support
- Saison-Vergleiche

---

## 7. Validierungsregeln

```javascript
const validations = {
    team: {
        name: { required: true, minLength: 3 },
        altersklasse: { 
            required: true, 
            enum: ["U8", "U10", "U12"],
            message: "Altersklasse muss U8, U10 oder U12 sein"
        },
        leistungsorientiert: {
            conditional: "altersklasse === 'U12'",
            message: "Leistungsorientiert nur für U12 verfügbar"
        }
    },
    
    player: {
        Vorname: { required: true, minLength: 2 },
        Nachname: { required: true, minLength: 2 },
        Geburtsdatum: { 
            required: true, 
            type: Date,
            validate: (value, team) => {
                const geburtsjahr = new Date(value).getFullYear()
                const saison_start = parseInt(team.saison.split('/')[0])
                const alter = saison_start - geburtsjahr
                
                // Altersklassen-Validierung
                switch(team.altersklasse) {
                    case "U8": return alter <= 8; // max 8 Jahre alt
                    case "U10": return alter <= 10; // max 10 Jahre alt
                    case "U12": return alter <= 12; // max 12 Jahre alt
                    default: return false;
                }
            },
            message: (team) => `Geburtsdatum muss für ${team.altersklasse}-Altersklasse passen`
        },
        TNA_Nr: { 
            pattern: /^\d{9}$/, 
            message: "TNA-Nr muss 9-stellig sein (Format: DDMMYYNNN)"
        },
        Tel: { pattern: /^\+?\d{10,15}$/ },
        Kontakt_Email: { type: Email },
        skills: { 
            range: [1, 3],
            message: "Skill-Bewertung muss zwischen 1-3 liegen"
        }
    },
    
    lineup: {
        // MINIBASKETBALL-PFLICHTREGELN (U8, U10, U12)
        minPlaytime: { 
            value: 2, 
            severity: "critical",
            blockUI: true,
            message: "DBB Minibasketball: Jedes Kind MUSS mindestens 2 Achtel spielen",
            reference: "DBB Minibasketball Spielregeln §Einsatzzeiten (U8, U10, U12)",
            applies_to: ["U8", "U10", "U12"]
        },
        minRest: { 
            value: 2, 
            severity: "critical",
            blockUI: true,
            message: "DBB Minibasketball: Jedes Kind MUSS mindestens 2 Achtel pausieren",
            reference: "DBB Minibasketball Spielregeln §Einsatzzeiten (U8, U10, U12)",
            applies_to: ["U8", "U10", "U12"]
        },
        maxPlaytime: { 
            value: 6,
            severity: "critical",
            blockUI: true,
            message: "DBB Minibasketball: Maximal 6 Achtel Spielzeit erlaubt",
            reference: "Berechnet: 8 Achtel - 2 Mindestpausen = 6 max. Spielzeit",
            applies_to: ["U8", "U10", "U12"]
        },
        
        // Altersklassenabhängige Spieleranzahl
        playersPerQuarter: { 
            validate: (altersklasse, leistungsorientiert) => {
                switch(altersklasse) {
                    case "U8": return { value: 3, message: "3 Spieler auf dem Feld (3 gegen 3)" };
                    case "U10": return { value: 4, message: "4 Spieler auf dem Feld (4 gegen 4)" };
                    case "U12": 
                        return leistungsorientiert 
                            ? { value: 5, message: "5 Spieler auf dem Feld (5 gegen 5 - leistungsorientiert)" }
                            : { value: 4, message: "4 Spieler auf dem Feld (4 gegen 4)" };
                }
            },
            severity: "critical",
            blockUI: true,
            reference: "DBB Minibasketball §Spieleranzahl"
        },
        
        totalQuarters: { 
            value: 8, 
            message: "Spiel hat 8 Achtel/Perioden",
            reference: "DBB Minibasketball §Spielzeit"
        },
        
        // Empfehlungen
        minBenchPlayers: {
            value: 2,
            severity: "warning",
            message: "Empfohlen: Mindestens 2 Auswechselspieler aufstellen",
            reference: "DBB Minibasketball §Verstöße gegen Spielzeitvorgaben"
        },
        
        // Wechsel nur in Pausen
        substitutionTiming: {
            rule: "only_between_periods",
            message: "Spielerwechsel nur in den Pausen zwischen Achteln",
            exception: "Außerordentlicher Wechsel bei Verletzung/emotionalen Gründen/Foul-Ausschluss",
            reference: "DBB Minibasketball §Spielerwechsel",
            applies_to: ["U8", "U10", "U12"]
        },
        
        // Außerordentlicher Spielerwechsel
        emergencySubstitution: {
            reasons: ["injury", "emotional", "foul_disqualification"],
            requirement: "Kind mit geringster Spielzeit einwechseln",
            rule: "Periode nur für ausgewechseltes Kind als gespielt gewertet",
            reference: "DBB Minibasketball §Ausnahme Spielerwechsel",
            applies_to: ["U8", "U10", "U12"]
        },
        
        // Optimierungsziele (keine Pflicht)
        targetPlaytime: { 
            value: 4, 
            severity: "info", 
            message: "Ideale Spielzeit: 4 Achtel (ausgewogen)"
        }
    },
    
    // Konfig-basierte Validierungen
    config: {
        metricWeights: {
            sum: { value: 1.0, message: "Summe aller Gewichte muss 1.0 ergeben" }
        },
        jerseys: {
            assignedToActive: { message: "Trikot nur aktiven Spielern zuweisen" }
        }
    }
}
```

---

## 8. API Endpunkte (Optional)

Falls Backend gewünscht:

```
POST   /api/players              - Spieler anlegen
GET    /api/players              - Alle Spieler
GET    /api/players/:id          - Spieler Details
PUT    /api/players/:id          - Spieler aktualisieren
DELETE /api/players/:id          - Spieler löschen

POST   /api/lineup               - Einsatzplan erstellen
GET    /api/lineup/:gameId       - Einsatzplan abrufen
PUT    /api/lineup/:gameId       - Einsatzplan aktualisieren

GET    /api/schedule             - Spielplan abrufen
POST   /api/schedule/sync        - Spielplan synchronisieren

GET    /api/jerseys              - Trikotverwaltung
PUT    /api/jerseys/:id/assign   - Trikot zuweisen
```

---

## 9. Beispiel-Datenflow

**Szenario: Einsatzplan für nächstes Spiel erstellen**

1. User öffnet "Einsatzplan" → "Neues Spiel"
2. System lädt alle verfügbaren Spieler aus DB
3. User klickt "Auto-Optimize"
4. System führt `optimizeLineup()` aus
5. Einsatzplan wird angezeigt mit:
   - Matrix-View (Spieler × Achtel)
   - Teamschnitt pro Achtel
   - Warnungen pro Spieler
6. User kann manuell anpassen (Drag & Drop)
7. System berechnet live neu
8. User speichert Einsatzplan
9. Export als PDF möglich

---

## 10. DBB Minibasketball Regelreferenz

### Offizielle Regelquelle
**Deutscher Basketball Bund (DBB) - Spielregeln Minibasketball Deutschland**

### Gemeinsame Regelkern für ALLE Altersklassen (U8, U10, U12)

**⚠️ PFLICHT-EINSATZREGELN (identisch für U8, U10, U12):**
- Jedes Kind MUSS mindestens 2 Perioden/Achtel spielen
- Jedes Kind MUSS mindestens 2 Perioden/Achtel aussetzen
- Spielerwechsel NUR in den Pausen (zwischen Perioden)
- Mindestens 2 Auswechselspieler sollten aufgestellt werden (Empfehlung)

**Gemeinsame Regelungen:**
- Keine Auszeiten
- Spezielle Regeln: Keine Blöcke/Handoffs, MMV Pflicht, Ganzfeld-Verteidigung zulässig, Doppeln verboten
- Zeitregeln (3, 5, 8, 24 Sekunden) werden nicht angewendet (SR ahndet bei massiven Überschreitungen)
- Teamfouls: 4 pro Achtel (ab dem 5. Freiwurf)
- Ballübergaben durch SR nur bei Freiwürfen und pädagogischem Bedarf
- Ballbesitz: Sprungball, danach wechselnder Ballbesitz

---

### Altersklassen-spezifische Regeln (Detailliert)

| Kategorie | **U8** | **U10** | **U12** |
|-----------|--------|---------|---------|
| **Spielzeit** | 8 × 4 Min (gestoppt) | 8 × 5 Min (gestoppt) | 8 × 5 Min (gestoppt) |
| **Halbzeitpause** | Seitenwechsel, kurze Pause | Seitenwechsel, kurze Pause | Seitenwechsel, kurze Pause |
| **Spielball** | Größe 4 | Größe 5 (leichtere Modelle) | Größe 5 (Originalgewicht) |
| **Spielfeld** | Kleineres Feld/Grundschule | Normales Feld/Querfeld | Normales Feld/Querfeld |
| **Spieleranzahl** | **3 gegen 3** (Ganzfeld) | **4 gegen 4** | **4 gegen 4** |
| **Einsatzzeiten** | ⚠️ Min. 2 spielen & 2 aussetzen | ⚠️ Min. 2 spielen & 2 aussetzen | ⚠️ Min. 2 spielen & 2 aussetzen |
| **Spielerwechsel** | Nur in den Pausen | Nur in den Pausen | Nur in den Pausen |
| **Korbhöhe** | 2,05 - 2,60 m (±5cm zulässig) | 2,60 m (±5cm) | 2,60 m (±5cm) |
| **Drei-Punkte-Wurf** | ❌ ohne | ✅ außerhalb der Zone | ✅ außerhalb der Zone |
| **Freiwurflinie** | 2 m nach vorne; oder soweit wie nötig | 1 m nach vorne; oder soweit wie nötig | 1 m nach vorne; oder soweit wie nötig |
| **3-,5-,8-,24-Sek-Regeln** | Nicht angewendet* | Nicht angewendet* | Nicht angewendet* |
| **Rückspiel** | ❌ nicht angewendet | ❌ nicht angewendet | ✅ normale Regel |
| **Spielergebnis** | Normale Wertung | Normale Wertung | Normale Wertung |
| **Punktestand** | ❌ nicht angezeigt | ❌ nicht angezeigt | ✅ angezeigt |
| **Tabelle** | ❌ keine Tabelle | ❌ keine Tabelle | ✅ normale Tabelle |

*SR ahndet bei massiven/unfairen Überschreitungen

---

### U12 "leistungsorientiert" (Höchste Spielklasse)

Für die höchste landesweite Spielklasse sind in der U12 über die Ausschreibungen "Verschärfungen" möglich:

**Erlaubte Änderungen:**
- ✅ **5 gegen 5** (statt 4 gegen 4)
- ✅ **Zeitregeln** (3, 5, 8, 14/24 Sekunden)
- ✅ **Auszeiten** (eine pro Halbzeit)
- ✅ Nutzung der **regulären Freiwurflinie**
- ✅ Leitung durch **zwei Schiedsrichter**

**NICHT veränderbar (auch bei leistungsorientiert):**
- ⚠️ Korbhöhe (bleibt 2,60 m)
- ⚠️ Pflichteinsätze (bleibt 2 Achtel spielen & 2 pausieren)

---

### Wichtige Ergänzungen und Klarstellungen (gelten für ALLE Altersklassen)

**Hallensituation/Umrüstung:**
> Bei der Umrüstung von Korbanlagen können Höhenabweichungen bis zu 5 cm nach oben oder unten auftreten und sind zulässig.

**Ausnahme Spielerwechsel:**
> "Kann ein Kind aus körperlichen oder seelisch-emotionalen Gründen (oder bei Ausschluss durch Fouls) eine Periode nicht auf dem Feld beenden, so ist in Abstimmung zwischen Betreuenden und SR ein außerordentlicher Spielerwechsel zulässig. Eingewechselt werden muss in diesem Fall ein Kind, das zu diesem Zeitpunkt am wenigsten Spielzeit hatte. Die Periode wird nur für das ausgewechselte Kind als gespielt gewertet."

**Verstöße gegen Spielzeitvorgaben:**
> "Zur Einhaltung der Spielzeitvorgaben sollten immer mindestens zwei Auswechselspieler*innen aufgestellt werden. Sollten die Vorgaben durch eine von vornherein zu geringe Spieleranzahl nicht eingehalten werden können, so findet das Spiel dennoch regulär statt. Primär gilt dann die Vorgabe, dass alle Kinder mindestens zwei Perioden eingesetzt werden müssen."

**Unentschieden/Verlängerung:**
- Unentschieden als Ergebnis möglich (wenn kein Sieger erforderlich)
- Verlängerung: Jeweils 1 Periode von 3 Minuten
- Spielerwechsel vor Verlängerung möglich

**Ausnahmen Turnierformate:**
> "Bei der Durchführung von Wettbewerben in Turnierformaten können die Anzahl der zu spielenden Perioden und die Pflichteinsätze der Kinder entsprechend proportional angepasst werden."

---

### Implementation in der PWA (Altersklassenübergreifend)

Die PWA muss **alle kritischen Regeln für U8, U10 und U12 validieren** und **darf keine regelwidrigen Einsatzpläne zulassen**. 

**Altersklassen-spezifische Validierungen:**
1. **U8:** 3 Spieler auf dem Feld (3 gegen 3)
2. **U10:** 4 Spieler auf dem Feld (4 gegen 4)
3. **U12:** 4 Spieler auf dem Feld (4 gegen 4), bei "leistungsorientiert": 5 gegen 5

**Warn-Stufen:**
1. **Blockierung** (critical): Min. 2 gespielt/pausiert, Max. 6 gespielt, falsche Spieleranzahl
2. **Warnung** (warning): < 2 Auswechselspieler
3. **Info** (info): Optimale Spielzeit-Verteilung

**UI-Unterschiede:**
- **U8 & U10:** Punktestand wird NICHT angezeigt (pädagogischer Ansatz)
- **U12:** Punktestand WIRD angezeigt, Tabelle wird geführt

---

## Zusammenfassung

Diese Spezifikation deckt **alle drei Minibasketball-Altersklassen** (U8, U10, U12) ab:

### Analysierte Datenquellen:
- **8 Excel-Sheets** wurden analysiert
- **Offizielles DBB Minibasketball-Regelwerk** für U8, U10, U12 integriert

### Dokumentierte Bereiche:
- ✅ **Altersklassen-Management** mit automatischer Konfiguration
- ✅ **Vollständiges Datenmodell** mit allen Feldern, Beziehungen und Team-Verwaltung
- ✅ **Alle Berechnungsformeln** dokumentiert und altersklassenabhängig
- ✅ **Geschäftslogik** für Einsatzplan-Optimierung (U8: 3er-Teams, U10/U12: 4er-Teams)
- ✅ **Minibasketball-Regelvalidierung** für alle Altersklassen (gemeinsame Pflichtregeln)
- ✅ **UI/UX Konzept** mit altersklassenspezifischen Features:
  - U8 & U10: Punktestand wird NICHT angezeigt
  - U12: Punktestand und Tabelle werden angezeigt
  - U12 leistungsorientiert: 5 gegen 5, Zeitregeln, Auszeiten möglich
- ✅ **Technische Implementation** mit PWA-Features
- ✅ **DBB-Regelreferenz** mit vollständiger Übersicht aller Altersklassen

### Kernfunktionalität:

**Gemeinsame Minibasketball-Regeln (U8, U10, U12):**
- Jedes Kind MUSS mindestens 2 Achtel spielen
- Jedes Kind MUSS mindestens 2 Achtel pausieren
- Spielerwechsel nur in den Pausen
- Außerordentlicher Wechsel bei Verletzung/Emotion/Fouls

**Altersklassen-Unterschiede:**
- **U8:** 3 gegen 3, 4 Min/Achtel, Ballgröße 4, kein Punktestand
- **U10:** 4 gegen 4, 5 Min/Achtel, Ballgröße 5 (leicht), kein Punktestand
- **U12:** 4 gegen 4, 5 Min/Achtel, Ballgröße 5, Punktestand & Tabelle
  - Optional "leistungsorientiert": 5 gegen 5, Zeitregeln, Auszeiten

### Umsetzung:

Die PWA kann mit **React + TypeScript + IndexedDB** oder **Vue.js + Pinia + Firebase** umgesetzt werden. Das System unterstützt:
- Multi-Team-Management (verschiedene Altersklassen)
- Automatische Altersklassen-Konfiguration
- Altersklassen-spezifische Validierung
- Export/Import für alle Altersklassen
- Regelkonformitätsprüfung nach offiziellem DBB-Standard

**Empfohlener Tech-Stack:**
- Frontend: React + TypeScript + Tailwind CSS
- State: Zustand oder Redux Toolkit
- Storage: IndexedDB (offline) + optional Firebase (cloud-sync)
- Visualisierung: Recharts für Statistiken
- PWA: Workbox für Service Worker