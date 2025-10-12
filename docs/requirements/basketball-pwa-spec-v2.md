# Basketball Einsatzplan PWA - Komplette Spezifikation v2.0

**Stand:** Oktober 2025  
**Optimiert für:** DSGVO-Konformität, Datensparsamkeit, BBB-Integration

---

### 3.3 Intelligente Ersatz-Vorschläge (Phase 3: Im Spiel)

**Problem:** Trainer muss spontan einen Spieler auswechseln und braucht sofort den besten Ersatz.

**Lösung:** Intelligenter Algorithmus der die optimale Ersatzbank-Reihenfolge berechnet.

```javascript
function getSmartSubstitutionSuggestions(
    playerToReplace,      // Spieler der rausgenommen werden soll
    currentLineup,        // Aktuell auf dem Feld
    benchPlayers,         // Verfügbare Bank-Spieler
    einsatzplan,          // Bisherige Einsätze
    bewertungen,          // Aktuelle Spieler-Bewertungen
    altersklasse          // U8/U10/U12
) {
    // 1. Filter: Nur Spieler die noch einsetzbar sind
    let available = benchPlayers.filter(p => {
        let stats = einsatzplan.find(e => e.spieler_id === p.spieler_id)
        
        // DBB-Regel: Max. 6 Achtel gespielt?
        if (stats.gespielt >= 6) return false
        
        // Bereits genug pausiert?
        if (stats.pausen < 2 && stats.einsatzmoeglichkeiten === 0) return false
        
        return true
    })
    
    // 2. Berechne Score für jeden verfügbaren Spieler
    let suggestions = available.map(player => {
        let stats = einsatzplan.find(e => e.spieler_id === player.spieler_id)
        let bewertung = bewertungen.find(b => 
            b.spieler_id === player.spieler_id && 
            b.bewertungs_typ === 'aktuell' &&
            b.gueltig_bis === null
        )
        
        // Score-Komponenten
        let score = {
            // 1. DBB-Regel-Priorität (0-100)
            regelPrioritaet: calculateRegelPrioritaet(stats),
            
            // 2. Skill-Balance (0-100)
            skillBalance: calculateSkillBalance(
                player, 
                bewertung,
                currentLineup.filter(p => p.spieler_id !== playerToReplace.spieler_id),
                bewertungen
            ),
            
            // 3. Team-Fit (0-100)
            teamFit: calculateTeamFit(
                bewertung,
                currentLineup.filter(p => p.spieler_id !== playerToReplace.spieler_id),
                bewertungen,
                altersklasse
            ),
            
            // 4. Freshe (0-100) - wie lange schon auf Bank?
            freshe: calculateFreshe(stats)
        }
        
        // Gewichtete Gesamt-Score
        let totalScore = 
            (score.regelPrioritaet * 0.5) +  // DBB-Regeln am wichtigsten!
            (score.skillBalance * 0.25) +
            (score.teamFit * 0.15) +
            (score.freshe * 0.1)
        
        return {
            player: player,
            bewertung: bewertung,
            stats: stats,
            score: score,
            totalScore: totalScore,
            reason: generateReason(score, stats)
        }
    })
    
    // 3. Sortieren nach totalScore (höchster zuerst)
    suggestions.sort((a, b) => b.totalScore - a.totalScore)
    
    return suggestions
}

function calculateRegelPrioritaet(stats) {
    // Höchste Priorität: MUSS spielen (< 2 Achtel gespielt)
    if (stats.gespielt < 2) {
        let remaining = stats.einsatzmoeglichkeiten
        if (remaining <= 1) return 100 // Kritisch!
        if (remaining <= 2) return 90  // Dringend
        return 80                       // Bald nötig
    }
    
    // Mittlere Priorität: Hat schon 2+ gespielt aber noch nicht 4
    if (stats.gespielt < 4) return 60
    
    // Niedrige Priorität: Hat schon viel gespielt
    if (stats.gespielt >= 5) return 20
    
    return 40 // Normal (3-4 Achtel)
}

function calculateSkillBalance(player, playerBewertung, currentTeam, allBewertungen) {
    if (currentTeam.length === 0) return 50 // Neutral
    
    // Hole Bewertungen des aktuellen Teams
    let teamBewertungen = currentTeam.map(p => 
        allBewertungen.find(b => 
            b.spieler_id === p.spieler_id && 
            b.bewertungs_typ === 'aktuell' &&
            b.gueltig_bis === null
        )
    )
    
    // Berechne Durchschnitt der wichtigsten Skills im Team
    let teamAvg = {
        ballhandling: average(teamBewertungen.map(b => b.ballhandling_score)),
        defense: average(teamBewertungen.map(b => b.defense_score)),
        abschluss: average(teamBewertungen.map(b => b.abschluss_score)),
        laufbereitschaft: average(teamBewertungen.map(b => b.laufbereitschaft_score))
    }
    
    // Score: Wie gut ergänzt der Spieler die fehlenden Skills?
    let balance = 0
    
    if (playerBewertung.ballhandling_score > teamAvg.ballhandling) balance += 25
    if (playerBewertung.defense_score > teamAvg.defense) balance += 25
    if (playerBewertung.abschluss_score > teamAvg.abschluss) balance += 25
    if (playerBewertung.laufbereitschaft_score > teamAvg.laufbereitschaft) balance += 25
    
    return balance
}

function calculateTeamFit(playerBewertung, currentTeam, allBewertungen, altersklasse) {
    // Simuliere neues Team mit Spieler
    let newTeam = [...currentTeam, { gesamt_wert: playerBewertung.gesamt_wert }]
    
    // Hole Bewertungen
    let newTeamBewertungen = currentTeam.map(p => 
        allBewertungen.find(b => 
            b.spieler_id === p.spieler_id && 
            b.bewertungs_typ === 'aktuell' &&
            b.gueltig_bis === null
        )
    )
    newTeamBewertungen.push(playerBewertung)
    
    // Berechne neuen Teamschnitt
    let newTeamScore = average(newTeamBewertungen.map(b => b.gesamt_wert))
    
    // Ziel: > 2.0 ist gut
    if (newTeamScore >= 2.2) return 100
    if (newTeamScore >= 2.0) return 80
    if (newTeamScore >= 1.8) return 60
    if (newTeamScore >= 1.6) return 40
    return 20
}

function calculateFreshe(stats) {
    // Wie viele Achtel in Folge auf der Bank?
    let consecutiveRest = stats.pausen // Vereinfacht
    
    if (consecutiveRest >= 3) return 100 // Sehr frisch
    if (consecutiveRest >= 2) return 70
    if (consecutiveRest >= 1) return 40
    return 10 // Gerade erst gespielt
}

function generateReason(score, stats) {
    let reasons = []
    
    // DBB-Regel-Grund
    if (stats.gespielt < 2) {
        let remaining = stats.einsatzmoeglichkeiten
        if (remaining <= 1) {
            reasons.push("⚠️ MUSS JETZT spielen! (DBB-Regel)")
        } else {
            reasons.push(`⚠️ Muss noch ${2 - stats.gespielt}x spielen`)
        }
    } else if (stats.gespielt >= 5) {
        reasons.push(`Hat schon ${stats.gespielt}/6 Achtel gespielt`)
    }
    
    // Skill-Grund
    if (score.skillBalance >= 75) {
        reasons.push("✨ Ergänzt Team-Skills perfekt")
    } else if (score.skillBalance >= 50) {
        reasons.push("✅ Gute Skill-Ergänzung")
    }
    
    // Team-Fit
    if (score.teamFit >= 80) {
        reasons.push("🎯 Starker Team-Score")
    }
    
    // Freshe
    if (score.freshe >= 70) {
        reasons.push("💪 Sehr frisch")
    }
    
    return reasons.join(" | ")
}
```

**UI-Darstellung:**

```
╔══════════════════════════════════════════════════════╗
║  Spieler auswechseln: Max Mustermann (auf dem Feld) ║
╠══════════════════════════════════════════════════════╣
║                                                        ║
║  🥇 [1] Lisa Klein                   Score: 95/100   ║
║     ⚠️ MUSS JETZT spielen! (DBB-Regel)               ║
║     ✨ Ergänzt Team-Skills perfekt                   ║
║     💪 Sehr frisch                                    ║
║                                                        ║
║     Skills: Ballhandling ⭐⭐⭐ | Defense ⭐⭐        ║
║     Einsätze: 1/8 gespielt, 4/8 pausiert             ║
║                                                        ║
║     [EINWECHSELN]                                     ║
║                                                        ║
╠══════════════════════════════════════════════════════╣
║  🥈 [2] Tom Schmidt                  Score: 87/100   ║
║     ✅ Gute Skill-Ergänzung                          ║
║     🎯 Starker Team-Score                            ║
║                                                        ║
║     Skills: Abschluss ⭐⭐⭐ | Laufbereitschaft ⭐⭐ ║
║     Einsätze: 2/8 gespielt, 3/8 pausiert             ║
║                                                        ║
║     [EINWECHSELN]                                     ║
║                                                        ║
╠══════════════════════════════════════════════════════╣
║  🥉 [3] Anna Müller                  Score: 82/100   ║
║     ✅ Kann spielen (3/8 gespielt, 2/8 pausiert)    ║
║     🎯 Starker Team-Score                            ║
║                                                        ║
║     Skills: Teamplay ⭐⭐⭐ | Passen ⭐⭐⭐          ║
║     Einsätze: 3/8 gespielt, 2/8 pausiert             ║
║                                                        ║
║     [EINWECHSELN]                                     ║
║                                                        ║
╚══════════════════════════════════════════════════════╝

[Abbrechen]
```

**Vorteile:**
- ✅ **Sofortige Entscheidung:** Top-Vorschlag ist meistens richtig
- ✅ **DBB-Regelkonformität:** Wird automatisch priorisiert
- ✅ **Transparenz:** Trainer sieht WARUM der Vorschlag passt
- ✅ **Flexibilität:** Trainer kann trotzdem manuell wählen

---

## 1. Überblick

Eine Progressive Web App zur Verwaltung von Basketball-Jugendmannschaften (U8, U10, U12), die Spielereinsätze optimiert, Spielerstatistiken verwaltet und Spielpläne organisiert.

### 1.1 Design-Prinzipien

✅ **DSGVO-konform:** Minimale Datenspeicherung, nur notwendige Kontaktdaten  
✅ **Praxistauglich:** Fokus auf Spielplanung und Training  
✅ **BBB-kompatibel:** Integration mit basketball-bund.net (ohne API, manueller Sync)  
✅ **Offline-first:** Volle Funktionalität ohne Internet  
✅ **Skalierbar:** Trennung von Stammdaten und zeitabhängigen Bewertungen

### 1.2 Minibasketball Regelwerk (DBB) - Altersklassenübergreifend

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
| **Korbhöhe** | 2,05 - 2,60 m (variabel) | 2,60 m | 2,60 m |
| **Drei-Punkte** | ohne | außerhalb der Zone | außerhalb der Zone |
| **Punktestand anzeigen** | ❌ NEIN | ❌ NEIN | ✅ JA |
| **Tabelle/Rangliste** | ❌ NEIN | ❌ NEIN | ✅ JA |

---

## 2. Datenmodell

### 2.1 Kern-Tabellen

#### 2.1.1 SPIELER

**Primärschlüssel:** `spieler_id` (UUID)  
**Fremdschlüssel:** `team_id`, `verein_id`

**Beschreibung:** Stammdaten von Spielern - sowohl eigene als auch Gegenspieler für Scouting.

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| spieler_id | UUID | ✅ | Eindeutige ID |
| team_id | UUID | ❌ | FK zu TEAM (null bei Gegnern) |
| verein_id | UUID | ❌ | FK zu VEREIN (für Gegner-Tracking) |
| vorname | String | ✅ | Vorname |
| nachname | String | ✅ | Nachname |
| geburtsdatum | Date | ❌ | Geburtsdatum (Altersvalidierung) |
| spieler_typ | Enum | ✅ | `eigenes_team`, `gegner`, `scouting` |
| mitgliedsnummer | String | ❌ | Vereinssoftware-agnostisch (easyVerein, MeinVerein, etc.) |
| tna_nr | String | ❌ | DBB Teilnehmerausweis = Ligaberechtigung! |
| konfektionsgroesse_jersey | Integer | ❌ | Größe Oberteil (116-170) |
| konfektionsgroesse_hose | Integer | ❌ | Größe Unterteil (116-170) |
| aktiv | Boolean | ✅ | Aktiv im Training? |
| created_at | DateTime | ✅ | Erstellungsdatum |

**Wichtig:** 
- ❌ **KEINE Skill-Scores mehr im SPIELER!** → Ausgelagert in SPIELER_BEWERTUNG
- ❌ **KEINE Erziehungsberechtigten-Felder!** → Separate Tabelle mit n:m Beziehung
- ✅ **Gegner-Scouting:** `spieler_typ = 'gegner'` ermöglicht Matchup-Planung

**Beziehungen:**
```
SPIELER ← TEAM (team_id)
SPIELER ← VEREIN (verein_id)
SPIELER → SPIELER_EINSATZ (1:n)
SPIELER → SPIELER_BEWERTUNG (1:n)
SPIELER ← SPIELER_ERZIEHUNGSBERECHTIGTE → ERZIEHUNGSBERECHTIGTE (n:m)
SPIELER → SPIELER_NOTIZEN (1:n)
```

---

#### 2.1.2 SPIELER_BEWERTUNG

**Primärschlüssel:** `bewertung_id` (UUID)  
**Fremdschlüssel:** `spieler_id`

**Beschreibung:** Zeitabhängige Skill-Bewertungen. Ermöglicht historische Entwicklung, unterschiedliche Bewertungssysteme und Gegner-Scouting.

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| bewertung_id | UUID | ✅ | Eindeutige ID |
| spieler_id | UUID | ✅ | FK zu SPIELER |
| bewertungs_typ | Enum | ✅ | `aktuell`, `scouting`, `archiv` |
| saison | String | ✅ | z.B. "2024/25" |
| altersklasse | Enum | ✅ | `U8`, `U10`, `U12` |
| gueltig_ab | Date | ✅ | Ab wann gilt diese Bewertung? |
| gueltig_bis | Date | ❌ | null = aktuell gültig |
| bewertet_von | String | ✅ | Trainer-Name |
| ballhandling_score | Integer | ✅ | 1-3, **Default: 2** |
| passen_fangen_score | Integer | ✅ | 1-3, **Default: 2** |
| spieluebersicht_score | Integer | ✅ | 1-3, **Default: 2** |
| teamplay_score | Integer | ✅ | 1-3, **Default: 2** |
| defense_score | Integer | ✅ | 1-3, **Default: 2** |
| laufbereitschaft_score | Integer | ✅ | 1-3, **Default: 2** |
| rebound_score | Integer | ✅ | 1-3, **Default: 2** |
| positionsflex_score | Integer | ✅ | 1-3, **Default: 2** |
| abschluss_score | Integer | ✅ | 1-3, **Default: 2** |
| gesamt_wert | Float | ✅ | Berechnet (gewichteter Durchschnitt) |
| notizen | Text | ❌ | Kontext zur Bewertung |
| created_at | DateTime | ✅ | Erstellungsdatum |

**Berechnete Felder:**

```javascript
// Score-Berechnung mit Gewichtungen
Gesamt_Wert = 
    (ballhandling_score * 0.16) +
    (passen_fangen_score * 0.16) +
    (spieluebersicht_score * 0.12) +
    (laufbereitschaft_score * 0.12) +
    (abschluss_score * 0.12) +
    (teamplay_score * 0.11) +
    (defense_score * 0.09) +
    (rebound_score * 0.06) +
    (positionsflex_score * 0.06)

// Wertebereich: 1.0 - 3.0 (typisch: 1.5 - 2.5)
```

**Use Cases:**

```javascript
// 1. Aktuelle Bewertung für Einsatzplanung
SELECT * FROM spieler_bewertung 
WHERE spieler_id = '...' 
  AND bewertungs_typ = 'aktuell' 
  AND gueltig_bis IS NULL;

// 2. Historische Entwicklung
SELECT gueltig_ab, gesamt_wert, ballhandling_score
FROM spieler_bewertung
WHERE spieler_id = '...'
ORDER BY gueltig_ab DESC;

// 3. Gegner-Scouting
INSERT INTO spieler_bewertung (
  spieler_id, bewertungs_typ, saison, ...
) VALUES (
  '<gegner_spieler_id>', 'scouting', '2024/25', ...
);

// 4. Altersklassen-Wechsel (U10 → U12)
INSERT INTO spieler_bewertung (
  spieler_id, bewertungs_typ, saison, altersklasse, 
  gueltig_ab, ...
) VALUES (
  '...', 'aktuell', '2024/25', 'U12',
  '2024-09-01', ...
);
// Alte U10-Bewertung: gueltig_bis = '2024-08-31'
```

**Vorteile:**
- ✅ Matchup-Planung durch Gegner-Scouting
- ✅ Saison-Vergleiche: Wer hat sich am meisten verbessert?
- ✅ Mehrere Trainer können parallel bewerten
- ✅ Altersklassen-Wechsel mit neuen Metriken

---

#### 2.1.3 ERZIEHUNGSBERECHTIGTE

**Primärschlüssel:** `erz_id` (UUID)

**Beschreibung:** Separate Tabelle für Erziehungsberechtigte. n:m Beziehung zu SPIELER ermöglicht Geschwister-Support.

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| erz_id | UUID | ✅ | Eindeutige ID |
| vorname | String | ✅ | Vorname |
| nachname | String | ✅ | Nachname |
| telefon_mobil | String | ✅ | Primärer Kontakt (Notfall!) |
| email | String | ✅ | Kommunikation |
| datenschutz_akzeptiert | Boolean | ✅ | DSGVO-Konformität |
| created_at | DateTime | ✅ | Erstellungsdatum |

**DSGVO-Optimierung:**
- ❌ **KEINE Adressen** (strasse, plz, ort) - nicht notwendig für Spielplanung!
- ❌ **Keine Portal-Felder** (erst implementieren wenn Portal gebaut wird)
- ❌ **Kein telefon_fest** - telefon_mobil reicht für Notfälle
- ✅ Nur minimal notwendige Kontaktdaten

---

#### 2.1.4 SPIELER_ERZIEHUNGSBERECHTIGTE (Zwischentabelle)

**Primärschlüssel:** `spieler_erz_id` (UUID)  
**Fremdschlüssel:** `spieler_id`, `erz_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| spieler_erz_id | UUID | ✅ | Eindeutige ID |
| spieler_id | UUID | ✅ | FK zu SPIELER |
| erz_id | UUID | ✅ | FK zu ERZIEHUNGSBERECHTIGTE |
| beziehung | Enum | ✅ | `Mutter`, `Vater`, `Vormund`, `Sonstige` |
| ist_notfallkontakt | Boolean | ✅ | Primärer Notfallkontakt? |
| abholberechtigt | Boolean | ✅ | Darf Kind abholen? |
| created_at | DateTime | ✅ | Erstellungsdatum |

**Vorteile:**
- ✅ **Geschwister-Support:** Mehrere Kinder können dieselben Erziehungsberechtigten haben
- ✅ **Flexible Anzahl:** 0-n Erziehungsberechtigte pro Kind
- ✅ **Detaillierte Beziehung:** Kontaktpriorität, Abholberechtigung

**Query-Beispiel:**
```sql
-- Alle Kontakte für einen Spieler
SELECT e.*, se.beziehung, se.ist_notfallkontakt
FROM spieler s
JOIN spieler_erziehungsberechtigte se ON s.spieler_id = se.spieler_id
JOIN erziehungsberechtigte e ON se.erz_id = e.erz_id
WHERE s.spieler_id = '...'
ORDER BY se.ist_notfallkontakt DESC;
```

---

#### 2.1.5 TEAM

**Primärschlüssel:** `team_id` (UUID)  
**Fremdschlüssel:** `verein_id`

**Kategorie:** BBB-Integration

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| team_id | UUID | ✅ | Eindeutige ID |
| verein_id | UUID | ✅ | FK zu VEREIN |
| bbb_mannschafts_id | String | ❌ | Offizielle Mannschafts-ID vom DBB |
| name | String | ✅ | z.B. "DJK Neustadt U10-1" |
| altersklasse | Enum | ✅ | `U8`, `U10`, `U12` |
| saison | String | ✅ | z.B. "2024/25" |
| trainer | String | ✅ | Trainer-Name |
| leistungsorientiert | Boolean | ❌ | Nur U12: höchste Spielklasse |
| created_at | DateTime | ✅ | Erstellungsdatum |

**DSGVO-Optimierung:**
- ❌ **KEINE Trainer-Kontaktdaten** (trainer_email, trainer_tel) - du bist der Trainer!
- ❌ **KEINE meldenummer, gemeldet_am** - nicht für Spielplanung nötig

**Altersklassen-Konfiguration (automatisch aus altersklasse):**
```javascript
const altersklassenConfig = {
    "U8": {
        spielzeit_pro_achtel: 4,
        spieler_auf_feld: 3,
        ball_groesse: 4,
        korbhoehe_min: 2.05,
        korbhoehe_max: 2.60,
        punktestand_anzeigen: false
    },
    "U10": {
        spielzeit_pro_achtel: 5,
        spieler_auf_feld: 4,
        ball_groesse: 5,
        korbhoehe: 2.60,
        punktestand_anzeigen: false
    },
    "U12": {
        spielzeit_pro_achtel: 5,
        spieler_auf_feld: 4,
        ball_groesse: 5,
        korbhoehe: 2.60,
        punktestand_anzeigen: true,
        leistungsorientiert_optionen: {
            spieler_auf_feld: 5 // 5v5 möglich
        }
    }
}
```

---

#### 2.1.6 SPIEL

**Primärschlüssel:** `game_id` (UUID)  
**Fremdschlüssel:** `heim_team_id`, `gast_team_id`, `halle_id`, `spielplan_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| game_id | UUID | ✅ | Eindeutige ID |
| heim_team_id | UUID | ✅ | FK zu TEAM (Heimmannschaft) |
| gast_team_id | UUID | ✅ | FK zu TEAM (Gastmannschaft) |
| spielplan_id | UUID | ❌ | FK zu SPIELPLAN (BBB-Import) |
| halle_id | UUID | ✅ | FK zu HALLE (Navigation!) |
| datum | DateTime | ✅ | Datum und Uhrzeit |
| altersklasse | Enum | ✅ | `U8`, `U10`, `U12` |
| leistungsorientiert | Boolean | ❌ | Nur U12 |
| status | Enum | ✅ | `geplant`, `aktiv`, `beendet`, `abgesagt` |
| ergebnis_heim | Integer | ❌ | Nur U12, Statistik |
| ergebnis_gast | Integer | ❌ | Nur U12, Statistik |
| durchschnitt_team_score | Float | ❌ | Für Einsatzplanung |
| balance_index | Float | ❌ | Für Einsatzplanung |
| notizen | Text | ❌ | Freitext |

**Wichtige Änderungen:**
- ✅ **heim_team_id + gast_team_id** statt eigenes_team_id/gegner_team_id
- ❌ **KEIN heim_auswaerts Boolean** mehr - wird abgeleitet!
- ❌ **KEINE spielnummer, spieltag, schiedsrichter** - kommt aus SPIELPLAN wenn relevant

**Heim/Auswärts Ermittlung:**
```javascript
// Meine Spiele filtern
const meineSpiele = allSpiele.filter(spiel => 
  spiel.heim_team_id === meinTeam.team_id || 
  spiel.gast_team_id === meinTeam.team_id
);

// Heim oder Auswärts?
const istHeimspiel = (spiel) => spiel.heim_team_id === meinTeam.team_id;
const istAuswaertsspiel = (spiel) => spiel.gast_team_id === meinTeam.team_id;

// Gegner ermitteln
const getGegner = (spiel) => {
  return spiel.heim_team_id === meinTeam.team_id 
    ? spiel.gast_team_id 
    : spiel.heim_team_id;
};
```

---

#### 2.1.7 SPIELER_EINSATZ

**Primärschlüssel:** `spieler_einsatz_id` (UUID)  
**Fremdschlüssel:** `game_id`, `spieler_id`, `jersey_id`, `hose_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| spieler_einsatz_id | UUID | ✅ | Eindeutige ID |
| game_id | UUID | ✅ | FK zu SPIEL |
| spieler_id | UUID | ✅ | FK zu SPIELER |
| jersey_id | UUID | ✅ | FK zu TRIKOT (Wendejersey) |
| hose_id | UUID | ✅ | FK zu TRIKOT (Hose) |
| position | Integer | ✅ | Reihenfolge in Aufstellung |
| q1_1 | Enum | ✅ | `Im_Spiel`, `Bank` |
| q1_2 | Enum | ✅ | `Im_Spiel`, `Bank` |
| q2_1 | Enum | ✅ | `Im_Spiel`, `Bank` |
| q2_2 | Enum | ✅ | `Im_Spiel`, `Bank` |
| q3_1 | Enum | ✅ | `Im_Spiel`, `Bank` |
| q3_2 | Enum | ✅ | `Im_Spiel`, `Bank` |
| q4_1 | Enum | ✅ | `Im_Spiel`, `Bank` |
| q4_2 | Enum | ✅ | `Im_Spiel`, `Bank` |
| pausen | Integer | ✅ | Berechnet: COUNT(Bank) |
| gespielt | Integer | ✅ | Berechnet: COUNT(Im_Spiel) |

**Berechnete Felder:**

```javascript
// Anzahl Pausen
pausen = COUNT(q1_1:q4_2 WHERE value == "Bank")

// Anzahl gespielte Achtel
gespielt = COUNT(q1_1:q4_2 WHERE value == "Im_Spiel")

// Einsatzmöglichkeiten (flexibel einsetzbar)
einsatzmoeglichkeiten = 8 - gespielt - pausen

// Minibasketball-Regelvalidierung
if (gespielt < 2) {
    warnung = "Muss spielen!" // ⚠️ REGELVERSTOSS
} else if (pausen < 2) {
    warnung = "Sollte pausieren" // ⚠️ REGELVERSTOSS
} else if (einsatzmoeglichkeiten > 0) {
    warnung = "Flexibel"
} else {
    warnung = "" // Regelkonform
}
```

---

#### 2.1.8 ACHTEL_STATISTIK

**Primärschlüssel:** `achtel_stat_id` (UUID)  
**Fremdschlüssel:** `game_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| achtel_stat_id | UUID | ✅ | Eindeutige ID |
| game_id | UUID | ✅ | FK zu SPIEL |
| achtel_nummer | Integer | ✅ | 1-8 |
| team_score | Float | ✅ | Durchschnitt Gesamt-Wert auf Feld |
| spieler_auf_feld | Integer | ✅ | 3, 4 oder 5 |
| ballhandling_avg | Float | ❌ | Durchschnitt Ballhandling |
| defense_avg | Float | ❌ | Durchschnitt Defense |
| berechnet_am | DateTime | ✅ | Zeitstempel |

**Berechnung:**

```javascript
function calculateTeamAverage(quarter, altersklasse, bewertungen) {
    let playersOnCourt = getPlayersWhere(quarter == "Im_Spiel")
    let expectedCount = altersklasse === 'U8' ? 3 : 4 // (5 bei U12 leistungsorientiert)
    
    if (playersOnCourt.length !== expectedCount) {
        throw new Error(`Falsche Spieleranzahl!`)
    }
    
    // Hole aktuelle Bewertungen der Spieler
    let scores = playersOnCourt.map(p => {
        return bewertungen.find(b => 
            b.spieler_id === p.spieler_id && 
            b.bewertungs_typ === 'aktuell' &&
            b.gueltig_bis === null
        ).gesamt_wert
    })
    
    return scores.reduce((a, b) => a + b, 0) / scores.length
}
```

---

#### 2.1.9 TRIKOT

**Primärschlüssel:** `trikot_id` (UUID)  
**Fremdschlüssel:** `team_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| trikot_id | UUID | ✅ | Eindeutige ID |
| team_id | UUID | ✅ | FK zu TEAM |
| art | Enum | ✅ | `Wendejersey`, `Hose` |
| nummer | String | ❌ | Nur bei Jersey (4-15) |
| groesse | String | ✅ | 3xs, 2xs, xs, s, m, l, xl |
| eu_groesse | Integer | ✅ | 116, 122, 128, ..., 170 |
| farbe_dunkel | String | ❌ | Farbe dunkle Seite (Wendejersey) |
| farbe_hell | String | ❌ | Farbe helle Seite (Wendejersey) |
| status | Enum | ✅ | `verfügbar`, `im_einsatz`, `defekt` |
| besonderheiten | String | ❌ | z.B. "Trikotsatz", Beschädigungen |
| created_at | DateTime | ✅ | Erstellungsdatum |

**Keine DSGVO-Einschränkungen** - keine personenbezogenen Daten!

---

### 2.2 BBB-Kompatibilität (Basketball-Bund.net)

**Wichtig:** Es gibt keine offizielle API! Daten müssen manuell importiert oder gescraped werden.

#### 2.2.1 VEREIN

**Primärschlüssel:** `verein_id` (UUID)

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| verein_id | UUID | ✅ | Eindeutige ID |
| bbb_kontakt_id | String | ❌ | Original ID von BBB |
| verband_id | Integer | ❌ | z.B. 2 = Bayern |
| name | String | ✅ | Vollständiger Vereinsname |
| kurzname | String | ❌ | Kompakte Anzeige |
| ort | String | ❌ | Orientierung |
| ist_eigener_verein | Boolean | ✅ | Filter-Flag |
| sync_am | DateTime | ❌ | Letzter BBB-Sync |

**DSGVO-Optimierung:**
- ❌ **KEINE Adressen** (strasse, plz) - nur ort für Orientierung
- ❌ **KEINE Kontaktdaten** (telefon, email, website) - nicht für Spielplanung nötig

**BBB-URLs:**
- Vereine Oberpfalz: `https://www.basketball-bund.net/kontaktList.do?reqCode=list&verband_id=2&kontakttype_id=2&object_id=4`

---

#### 2.2.2 HALLE

**Primärschlüssel:** `halle_id` (UUID)

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| halle_id | UUID | ✅ | Eindeutige ID |
| bbb_halle_id | String | ❌ | Original ID von BBB |
| name | String | ✅ | Hallenname |
| strasse | String | ✅ | Navigation! |
| plz | String | ✅ | Navigation! |
| ort | String | ✅ | Navigation! |
| verein_id | UUID | ❌ | FK zu VEREIN (Heimhalle) |
| anzahl_felder | Integer | ❌ | z.B. 2 bei Querfeld |
| parken | String | ❌ | **Wichtig für Auswärtsspiele!** |
| oepnv | String | ❌ | **Wichtig für Auswärtsspiele!** |
| notizen | Text | ❌ | Zusatz-Infos |
| sync_am | DateTime | ❌ | Letzter BBB-Sync |

**BBB-URLs:**
- Hallenverzeichnis: `https://www.basketball-bund.net/halleSearch.do?reqCode=list`

---

#### 2.2.3 LIGA

**Primärschlüssel:** `liga_id` (UUID)

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| liga_id | UUID | ✅ | Eindeutige ID |
| bbb_liga_id | String | ❌ | Original ID von BBB |
| verband_id | Integer | ❌ | 2 = Bayern |
| name | String | ✅ | z.B. "U10 Oberpfalz Bezirksliga" |
| saison | String | ✅ | z.B. "2024/25" |
| altersklasse | Enum | ✅ | `U8`, `U10`, `U12` |
| spielklasse | String | ❌ | Bezirksliga, Kreisliga, ... |
| region | String | ❌ | Oberpfalz, Oberbayern, ... |
| sync_am | DateTime | ❌ | Letzter BBB-Sync |

**BBB-URLs:**
- Ligen Bayern: `https://www.basketball-bund.net/index.jsp?Action=100&Verband=2`

---

#### 2.2.4 LIGA_TEILNAHME

**Primärschlüssel:** `teilnahme_id` (UUID)  
**Fremdschlüssel:** `liga_id`, `verein_id`, `team_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| teilnahme_id | UUID | ✅ | Eindeutige ID |
| liga_id | UUID | ✅ | FK zu LIGA |
| verein_id | UUID | ✅ | FK zu VEREIN |
| team_id | UUID | ❌ | FK zu TEAM |
| platzierung | Integer | ❌ | Nur U12 |
| spiele | Integer | ❌ | Nur U12 |
| siege | Integer | ❌ | Nur U12 |
| niederlagen | Integer | ❌ | Nur U12 |
| punkte | Integer | ❌ | Nur U12 |

---

#### 2.2.5 SPIELPLAN

**Primärschlüssel:** `spielplan_id` (UUID)  
**Fremdschlüssel:** `liga_id`, `heim_verein_id`, `gast_verein_id`, `halle_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| spielplan_id | UUID | ✅ | Eindeutige ID |
| liga_id | UUID | ❌ | FK zu LIGA (null = Freundschaftsspiel) |
| bbb_spiel_id | String | ❌ | Original ID von BBB |
| spieltyp | Enum | ✅ | `Ligaspiel`, `Freundschaftsspiel`, `Turnier` |
| nr | Integer | ❌ | BBB-Spielnummer |
| tag | Integer | ❌ | BBB-Spieltag |
| datum | DateTime | ✅ | Datum und Uhrzeit |
| heim_verein_id | UUID | ❌ | FK zu VEREIN |
| heim_name | String | ✅ | Fallback wenn nicht im System |
| gast_verein_id | UUID | ❌ | FK zu VEREIN |
| gast_name | String | ✅ | Fallback wenn nicht im System |
| halle_id | UUID | ❌ | FK zu HALLE |
| importiert_als_spiel | Boolean | ✅ | Sync-Status |
| sync_am | DateTime | ❌ | Letzter BBB-Sync |

**Workflow:**

```javascript
// 1. BBB-Spielplan importieren (manuell/Scraping)
const spielplanImport = await importFromBBB('liga_id_123');

// 2. Spielplan → SPIEL übernehmen
const spiel = await createSpielFromSpielplan(spielplan_id, {
  eigenes_team_ist: 'heim', // oder 'gast'
  status: 'geplant'
});

// 3. Einsatzplanung erstellen
const einsatzplan = await createEinsatzplan(spiel.game_id);
```

---

### 2.3 Neue Erweiterungen

#### 2.3.1 TRAINING

**Primärschlüssel:** `training_id` (UUID)  
**Fremdschlüssel:** `team_id`, `halle_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| training_id | UUID | ✅ | Eindeutige ID |
| team_id | UUID | ✅ | FK zu TEAM |
| datum | DateTime | ✅ | Datum und Uhrzeit |
| dauer_minuten | Integer | ✅ | Trainingsdauer |
| halle_id | UUID | ❌ | FK zu HALLE |
| trainer | String | ✅ | Trainer-Name |
| ist_probetraining | Boolean | ✅ | Probetraining-Modus? |
| fokus | String | ❌ | Ballhandling, Defense, ... |
| notizen | Text | ❌ | Freitext |
| created_at | DateTime | ✅ | Erstellungsdatum |

**DSGVO-Optimierung:**
- ❌ **KEINE uebungen, anwesende_spieler, fehlende_spieler Arrays** → Wird über TRAINING_TEILNAHME getrackt

---

#### 2.3.2 TRAINING_TEILNAHME

**Primärschlüssel:** `teilnahme_id` (UUID)  
**Fremdschlüssel:** `training_id`, `spieler_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| teilnahme_id | UUID | ✅ | Eindeutige ID |
| training_id | UUID | ✅ | FK zu TRAINING |
| spieler_id | UUID | ✅ | FK zu SPIELER |
| anwesend | Boolean | ✅ | War anwesend? |
| entschuldigt | Boolean | ❌ | Falls abwesend |
| notiz | Text | ❌ | Freitext |

---

#### 2.3.3 PROBETRAINING_TEILNEHMER

**Primärschlüssel:** `probe_id` (UUID)

**Beschreibung:** Minimalistisches Tracking von Probetrainings-Kindern.

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| probe_id | UUID | ✅ | Eindeutige ID |
| vorname | String | ✅ | **EINZIGES PFLICHTFELD!** |
| nachname | String | ❌ | Optional |
| anzahl_teilnahmen | Integer | ✅ | Berechnet aus HISTORIE |
| eltern_telefon | String | ❌ | Erst bei Interesse |
| status | Enum | ✅ | `aktiv`, `interessiert`, `aufgenommen`, `abgesagt` |
| aufgenommen_als_spieler_id | UUID | ❌ | FK zu SPIELER wenn aufgenommen |
| notizen | Text | ❌ | Freitext |
| created_at | DateTime | ✅ | Erstellungsdatum |

**DSGVO-Optimierung:**
- ✅ **Minimalistisch:** Nur Vorname Pflicht!
- ❌ **Keine Adressen, keine Eltern-Details** - erst bei Aufnahme
- ✅ **Tracking über HISTORIE:** Wann war Kind da?

---

#### 2.3.4 PROBETRAINING_HISTORIE

**Primärschlüssel:** `historie_id` (UUID)  
**Fremdschlüssel:** `probe_id`, `training_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| historie_id | UUID | ✅ | Eindeutige ID |
| probe_id | UUID | ✅ | FK zu PROBETRAINING_TEILNEHMER |
| training_id | UUID | ✅ | FK zu TRAINING |
| datum | DateTime | ✅ | Wann war Kind da? |
| anwesend | Boolean | ✅ | War anwesend? |
| notiz | Text | ❌ | Kurznotiz |

**Workflow:**
```javascript
// 1. Kind kommt zum Probetraining
const probe = await createProbeTeilnehmer({ vorname: "Max" });

// 2. Jedes Training tracken
await createProbeHistorie({
  probe_id: probe.probe_id,
  training_id: training.training_id,
  anwesend: true
});

// 3. anzahl_teilnahmen wird automatisch berechnet
probe.anzahl_teilnahmen = COUNT(historie WHERE anwesend = true);

// 4. Bei Interesse → Kontaktdaten ergänzen
await updateProbeTeilnehmer(probe_id, {
  nachname: "Mustermann",
  eltern_telefon: "+49..."
});

// 5. Bei Aufnahme → SPIELER anlegen
const spieler = await createSpielerFromProbe(probe_id);
await updateProbeTeilnehmer(probe_id, {
  status: 'aufgenommen',
  aufgenommen_als_spieler_id: spieler.spieler_id
});
```

---

#### 2.3.5 SPIELER_NOTIZEN

**Primärschlüssel:** `notiz_id` (UUID)  
**Fremdschlüssel:** `spieler_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| notiz_id | UUID | ✅ | Eindeutige ID |
| spieler_id | UUID | ✅ | FK zu SPIELER |
| trainer | String | ✅ | Trainer-Name |
| datum | DateTime | ✅ | Notiz-Datum |
| kategorie | Enum | ✅ | `Entwicklung`, `Verhalten`, `Gesundheit`, `Elterngespräch` |
| text | Text | ✅ | Notiz-Text |
| vertraulich | Boolean | ✅ | Nur für Trainer sichtbar |
| created_at | DateTime | ✅ | Erstellungsdatum |

---

#### 2.3.6 SAISON_ARCHIV

**Primärschlüssel:** `archiv_id` (UUID)  
**Fremdschlüssel:** `team_id`

| Feldname | Datentyp | Pflicht | Beschreibung |
|----------|----------|---------|--------------|
| archiv_id | UUID | ✅ | Eindeutige ID |
| saison | String | ✅ | z.B. "2023/24" |
| team_id | UUID | ✅ | FK zu TEAM |
| team_snapshot | JSON | ✅ | Komplett-Backup Team-Daten |
| statistiken | JSON | ✅ | Aggregierte Saison-Stats |
| archiviert_am | DateTime | ✅ | Archivierungs-Zeitpunkt |
| archiviert_von | String | ✅ | Trainer-Name |

**Workflow:**
```javascript
// Saison abschließen
const archiv = await createSaisonArchiv({
  saison: "2023/24",
  team_id: team.team_id,
  team_snapshot: {
    team: team,
    spieler: alleSpieler,
    bewertungen: alleBewertungen,
    spiele: alleSpiele
  },
  statistiken: {
    spieler_count: 12,
    spiele_gesamt: 24,
    siege: 15,
    niederlagen: 9,
    team_avg_score: 2.1,
    beste_spieler: topSpieler,
    entwicklung: entwicklungsStats
  }
});
```

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

**Algorithmus:**

```javascript
function optimizeLineup(players, altersklasse, leistungsorientiert = false, numQuarters = 8) {
    // 1. Initialisierung
    let lineup = Array(numQuarters).fill([])
    
    // AltersklassenabhÃ¤ngige Spieleranzahl
    let playersPerQuarter = getPlayersOnCourtCount(altersklasse, leistungsorientiert)
    // U8: 3, U10: 4, U12: 4 (oder 5 bei leistungsorientiert)
    
    // Minibasketball-Regel
    const MIN_PLAYTIME = 2
    const MIN_REST = 2
    const MAX_PLAYTIME = numQuarters - MIN_REST // = 6
    
    // Optimale Spielzeit
    let targetPlaytime = Math.floor(numQuarters / 2) // = 4
    
    // 2. Hole aktuelle Bewertungen aller Spieler
    const bewertungen = await getAktuelleBewertungen(players.map(p => p.spieler_id));
    
    // 3. Iterative Besetzung jedes Achtels
    for (let q = 0; q < numQuarters; q++) {
        let available = players.filter(p => {
            let remainingQuarters = numQuarters - q
            let needsToPlay = (p.currentPlaytime < MIN_PLAYTIME) && 
                            (remainingQuarters <= (MIN_PLAYTIME - p.currentPlaytime))
            
            let maxPlaytimeReached = p.currentPlaytime >= MAX_PLAYTIME
            
            let needsRest = (p.currentRest < MIN_REST) && 
                          (remainingQuarters <= (MIN_REST - p.currentRest))
            
            // Minibasketball-Regellogik
            if (needsToPlay) return true // MUSS spielen
            if (maxPlaytimeReached) return false // DARF NICHT mehr
            if (needsRest) return false // MUSS pausieren
            
            return p.currentPlaytime < targetPlaytime + 1
        })
        
        // 4. Skill-Balance optimieren mit aktuellen Bewertungen
        let selected = selectBalancedTeam(available, bewertungen, playersPerQuarter)
        lineup[q] = selected
        
        // 5. Spieler-Status aktualisieren
        selected.forEach(p => {
            p.currentPlaytime++
            p.currentRest = 0
        })
        
        let benched = available.filter(p => !selected.includes(p))
        benched.forEach(p => p.currentRest++)
    }
    
    // 6. Minibasketball-Regelvalidierung
    let validation = validateMinibasketballRules(players, altersklasse)
    if (!validation.valid) {
        console.error("Minibasketball-Regelverstöße:", validation.violations)
    }
    
    return { lineup, validation }
}

function selectBalancedTeam(availablePlayers, bewertungen, count) {
    // Greedy-Ansatz: Wähle Spieler mit höchstem Gesamt-Wert
    // unter Berücksichtigung von Skill-Diversity
    let selected = []
    let remaining = [...availablePlayers]
    
    while (selected.length < count && remaining.length > 0) {
        // Score für jeden Spieler berechnen
        let scores = remaining.map(p => {
            const bewertung = bewertungen.find(b => 
                b.spieler_id === p.spieler_id && 
                b.bewertungs_typ === 'aktuell' &&
                b.gueltig_bis === null
            );
            
            return {
                player: p,
                score: calculateSelectionScore(p, bewertung, selected, bewertungen)
            }
        })
        
        // Besten auswählen
        scores.sort((a, b) => b.score - a.score)
        let best = scores[0].player
        
        selected.push(best)
        remaining = remaining.filter(p => p !== best)
    }
    
    return selected
}

function calculateSelectionScore(player, bewertung, currentTeam, allBewertungen) {
    let baseScore = bewertung.gesamt_wert
    
    // Bonus für fehlende Skills im aktuellen Team
    let skillBalance = 0
    if (currentTeam.length > 0) {
        // Hole Bewertungen des aktuellen Teams
        const teamBewertungen = currentTeam.map(p => 
            allBewertungen.find(b => 
                b.spieler_id === p.spieler_id && 
                b.bewertungs_typ === 'aktuell' &&
                b.gueltig_bis === null
            )
        );
        
        let avgBH = average(teamBewertungen.map(b => b.ballhandling_score))
        let avgLB = average(teamBewertungen.map(b => b.laufbereitschaft_score))
        let avgAB = average(teamBewertungen.map(b => b.abschluss_score))
        
        if (bewertung.ballhandling_score > avgBH) skillBalance += 0.1
        if (bewertung.laufbereitschaft_score > avgLB) skillBalance += 0.1
        if (bewertung.abschluss_score > avgAB) skillBalance += 0.1
    }
    
    return baseScore + skillBalance
}

async function getAktuelleBewertungen(spieler_ids) {
    return await db.spieler_bewertung.findMany({
        where: {
            spieler_id: { in: spieler_ids },
            bewertungs_typ: 'aktuell',
            gueltig_bis: null
        }
    });
}
```

---

### 3.2 Minibasketball-Regelvalidierung (U8, U10, U12)

```javascript
function validateMinibasketballRules(players, lineup, altersklasse, leistungsorientiert = false) {
    let violations = []
    
    const expectedPlayersOnCourt = getPlayersOnCourtCount(altersklasse, leistungsorientiert)
    
    // Spieler-individuelle Validierung
    players.forEach(player => {
        // Regel 1: Mindestens 2 Achtel spielen
        if (player.currentPlaytime < 2) {
            violations.push({
                player: player.vorname + ' ' + player.nachname,
                rule: "MIN_PLAYTIME",
                severity: "critical",
                altersklasse: altersklasse,
                message: `Hat nur ${player.currentPlaytime} Achtel gespielt (min. 2 erforderlich)`,
                current: player.currentPlaytime,
                required: 2,
                reference: "DBB Minibasketball Spielregeln §Einsatzzeiten (U8, U10, U12)"
            })
        }
        
        // Regel 2: Mindestens 2 Achtel pausieren
        if (player.currentRest < 2) {
            violations.push({
                player: player.vorname + ' ' + player.nachname,
                rule: "MIN_REST",
                severity: "critical",
                altersklasse: altersklasse,
                message: `Hat nur ${player.currentRest} Achtel pausiert (min. 2 erforderlich)`,
                current: player.currentRest,
                required: 2,
                reference: "DBB Minibasketball Spielregeln §Einsatzzeiten (U8, U10, U12)"
            })
        }
        
        // Regel 3: Maximum 6 Achtel Spielzeit
        if (player.currentPlaytime > 6) {
            violations.push({
                player: player.vorname + ' ' + player.nachname,
                rule: "MAX_PLAYTIME",
                severity: "critical",
                altersklasse: altersklasse,
                message: `Hat ${player.currentPlaytime} Achtel gespielt (max. 6 erlaubt)`,
                current: player.currentPlaytime,
                required: 6
            })
        }
    })
    
    // Achtel-spezifische Validierung
    lineup.forEach((quarter, index) => {
        let playersOnCourt = quarter.filter(p => p.status === "Im_Spiel").length
        if (playersOnCourt !== expectedPlayersOnCourt) {
            violations.push({
                rule: "WRONG_PLAYER_COUNT",
                severity: "critical",
                altersklasse: altersklasse,
                quarter: index + 1,
                message: `Achtel ${index + 1}: ${playersOnCourt} Spieler, aber ${expectedPlayersOnCourt} erforderlich`,
                current: playersOnCourt,
                required: expectedPlayersOnCourt,
                reference: `DBB Minibasketball §Spieleranzahl (${altersklasse})`
            })
        }
    })
    
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
```

---

## 4. UI/UX Anforderungen

### 4.1 Hauptbildschirme

**1. Dashboard**
- Übersicht nächstes Spiel mit Altersklassen-Anzeige
- Team-Status (Anzahl Spieler, Durchschnittswerte, Altersklasse)
- Schnellzugriff auf Einsatzplan und Spielerverwaltung
- **U12-spezifisch:** Tabellen-Position und Punktestand

**1. Dashboard**
- Übersicht nächstes Spiel mit Altersklassen-Anzeige
- Team-Status (Anzahl Spieler, Durchschnittswerte, Altersklasse)
- Schnellzugriff auf Einsatzplan und Spielerverwaltung
- **U12-spezifisch:** Tabellen-Position und Punktestand

**2. Einstellungen (Neu!)**

**Zweck:** Zentrale Konfiguration und Daten-Management

### **Allgemeine Einstellungen:**

- **Vereinszuordnung:**
  - Auswahl: "Welcher Verein steht im Fokus?" (= Heim-Verein)
  - Dropdown aus VEREIN-Tabelle
  - Markiert automatisch `ist_eigener_verein = true`
  - Wird für Heim/Auswärts-Logik verwendet
  
- **Meine Teams:**
  - Multi-Select: "Welche Mannschaften trainiere ich?"
  - Zeigt nur Teams des ausgewählten Vereins
  - Bestimmt Dashboard-Anzeige
  - Quick-Switch zwischen Teams
  
- **Trainer-Profil:**
  - Name (für Notizen, Bewertungen)
  - Lizenz-Nummer (optional)
  - Profilbild (optional)

### **Daten-Management:**

- **Import:**
  - **Spielerliste:** 
    - Excel/CSV Upload
    - Format-Vorlage herunterladen
    - Auto-Mapping: Spalten zuordnen
    - Validierung vor Import
  
  - **Spielplan (BBB):**
    - Manueller Import (falls kein Scraping)
    - CSV/Excel von basketball-bund.net
    - URL-Import: Spielplan-Link eingeben → Scraping-Versuch
    - Zuordnung: Liga auswählen
  
  - **Vereine & Hallen:**
    - CSV-Import für Batch-Anlage
    - BBB-Stammdaten (vorgefertigt)
  
  - **Trikotverwaltung:**
    - Inventar-Import (Excel)

- **Export:**
  - **Komplett-Backup:**
    - JSON-Export aller Daten
    - Inkl. Relationen und Historie
    - Verschlüsselt (optional)
  
  - **Einzelexporte:**
    - Spielerliste (Excel)
    - Spielplan (PDF/Excel)
    - Einsatzpläne (PDF)
    - Saison-Statistiken (Excel)
  
  - **DSGVO-Export:**
    - Alle Daten eines Spielers
    - Für Auskunftsrecht

- **Datenschutz:**
  - Datenschutzerklärung anzeigen
  - Einwilligungen verwalten
  - Löschfristen einstellen
  - Audit-Log

### **BBB-Integration:**

- **Sync-Einstellungen:**
  - "Automatisch nach Spielplan suchen?" (falls Scraping implementiert)
  - Sync-Intervall (täglich, wöchentlich)
  - Letzte Sync-Zeit anzeigen
  
- **Manuelle Aktionen:**
  - "Spielplan jetzt aktualisieren"
  - "Vereine & Hallen aktualisieren"
  - "Tabellenstände abrufen" (nur U12)

### **App-Einstellungen:**

- **Darstellung:**
  - Dark Mode / Light Mode
  - Schriftgröße (für Spielfeld-Sicht)
  - Farb-Schema (Team-Farben)

- **Benachrichtigungen:**
  - Erinnerung vor Spielen (1h, 2h, 1 Tag)
  - Erinnerung vor Training
  - Push-Benachrichtigungen (wenn Cloud-Sync)

- **Offline-Modus:**
  - Cache-Größe
  - Welche Daten offline verfügbar?
  - "Alle Daten herunterladen"

### **System:**

- **Über:**
  - Version
  - Changelog
  - Support/Kontakt
  
- **Diagnose:**
  - Speicherplatz-Nutzung
  - Sync-Status
  - Debug-Log exportieren

**3. Spielerverwaltung**
- Tabelle aller Spieler mit Filterung/Sortierung
- Altersklassen-Filter im Header
- Detailansicht: Persönliche Daten
- **Bewertungen:** Separate Ansicht für aktuelle/historische Bewertungen
- **Elternkontakte:** Separate Ansicht mit Notfallkontakt-Markierung
- Gesamt-Wert Visualisierung (Radar-Chart)
- Altersvalidierung: Geburtsdatum muss zur Altersklasse passen

**3. Einsatzplan (4-Phasen-Workflow)**

Der Einsatzplan ist workflow-orientiert und passt sich der Spielsituation an:

### **Phase 1: Planung (Vor dem Spiel)**

**Fokus:** Vorbereitung und Strategie

- **Spieler-Verfügbarkeit:** 
  - Checklist: Wer kann spielen? Wer fehlt?
  - Abwesenheiten markieren (Krankheit, Termin, etc.)
  - Automatische Filterung für Aufstellung
  
- **Aufstellungsplan:**
  - Übersicht alle 8 Achtel
  - "Auto-Optimize" Button für initiale Aufstellung
  - Drag & Drop für manuelle Anpassungen
  - Minibasketball-Regelvalidierung in Echtzeit
  - Teamschnitt-Vorschau pro Achtel
  - Warnungen: ⚠️ Muss spielen, ⏸️ Sollte pausieren, ✅ Flexibel
  
- **Trikotzuweisung:**
  - Automatische Vorschläge basierend auf Konfektionsgröße
  - Drag & Drop Trikot → Spieler
  - Verfügbarkeits-Check (defekte Trikots ausblenden)
  
- **Validierung:**
  - "DBB-Regelkonformität prüfen" Button
  - Zusammenfassung: Alle Spieler 2+ gespielt/pausiert?
  - Export als PDF (Backup für unterwegs)

### **Phase 2: In der Halle (Vor Spielbeginn)**

**Fokus:** Kampfgericht & Gegner-Scouting

- **Spielberichtsbogen:**
  - Übersicht für Kampfgericht
  - TNA-Nummern aller Spieler
  - Trikotnummern
  - PDF-Export oder Print-View
  - Schiedsrichter-Unterschrift (digital)
  
- **Gegner-Scouting (optional):**
  - Schnell-Erfassung Gegenspieler (Vorname, Trikotnummer)
  - Grobe Bewertung (Ballhandling, Athletik, Wurfgefahr)
  - Matchup-Hinweise: "Gegen #7 defensiv stark spielen"
  - Wird in SPIELER_BEWERTUNG gespeichert (typ='scouting')
  
- **Letzte Anpassungen:**
  - Kurzfristige Ausfälle markieren
  - Aufstellung anpassen
  - Team-Talk Notizen

### **Phase 3: Im Spiel (Live-Modus)**

**Fokus:** Aktuelles + nächstes Achtel, schnelle Entscheidungen

- **Haupt-Ansicht:**
  - **Großer Timer:** Zeigt aktuelles Achtel (Q1-1, Q1-2, ...)
  - **Aktuelles Feld:** 3/4/5 Spieler auf dem Feld (große Karten)
  - **Nächstes Achtel:** Preview der geplanten Aufstellung
  - **Bank:** Kompakte Liste wartender Spieler
  
- **Live-Funktionen:**
  - **Spieler-Bewertung on-the-fly:**
    - Tap auf Spieler → Quick-Rating (👍 gut, 👌 ok, 👎 schwach)
    - Wird in SPIELER_BEWERTUNG gespeichert mit Zeitstempel
  
  - **Achtel-Wechsel:**
    - Großer "Nächstes Achtel" Button
    - 30s vorher Warnung: "Spieler vorbereiten!"
    - Automatischer Wechsel zur nächsten Aufstellung
  
  - **Spontane Umstellung (WICHTIG!):**
    - Tap auf Spieler auf dem Feld → "Auswechseln"
    - **Intelligente Ersatz-Vorschläge:**
      ```
      Vorschlag-Algorithmus:
      1. Nur Spieler die noch nicht 6 Achtel gespielt haben
      2. Sortiert nach:
         - DBB-Regel-Priorität (muss spielen > kann spielen)
         - Skill-Balance (fehlende Skills ergänzen)
         - Teamschnitt (optimaler Gesamt-Wert)
      
      Anzeige:
      [1] Max M. ⚠️ MUSS SPIELEN (1/8 gespielt)
          Skills: ⭐⭐⭐ Ballhandling | Team-Fit: 95%
      
      [2] Lisa K. ✅ KANN (3/8 gespielt, 2/8 pausiert)
          Skills: ⭐⭐ Defense | Team-Fit: 89%
      
      [3] Tom S. ✅ KANN (2/8 gespielt, 3/8 pausiert)
          Skills: ⭐⭐⭐ Abschluss | Team-Fit: 87%
      ```
    
  - **Statistik-Tracking:**
    - Punkte-Counter (nur U12)
    - Fouls tracken
    - Timeouts tracken (nur U12 leistungsorientiert)
  
- **Bottom-Navigation:**
  - Aktuelles Achtel | Nächstes Achtel | Vollansicht | Statistik

### **Phase 4: Nachbereitung (Nach dem Spiel)**

**Fokus:** Reflexion & Dokumentation

- **Spielberichtsbogen:**
  - Endergebnis eintragen (nur U12)
  - Besondere Vorkommnisse notieren
  - Schiedsrichter-Bewertung (optional)
  - Export als PDF
  
- **Spieler-Reflexion:**
  - Übersicht aller eingesetzten Spieler
  - Schnell-Bewertung: 
    - "Wie hat X heute gespielt?" (1-5 Sterne)
    - Freitext-Notiz pro Spieler
    - Wird in SPIELER_NOTIZEN gespeichert
  
  - **Skill-Anpassung vorschlagen:**
    - "Max hatte heute Probleme mit Ballhandling → Score anpassen?"
    - Direkt neue SPIELER_BEWERTUNG erstellen
  
- **Team-Analyse:**
  - Teamschnitt pro Achtel (Verlauf)
  - Ausgeglichenheit der Aufstellung (Balance-Index)
  - Regelkonformität: Alle Kinder 2+ gespielt/pausiert? ✅
  
- **Nächste Schritte:**
  - "Training: Fokus auf Defense?" (aus Spielanalyse)
  - "Elterngespräch mit Lisa vereinbaren?" (aus Notizen)

**Workflow-Übergang:**
```
Planung → [Spiel erstellen] 
       → In der Halle → [Spiel starten] 
       → Im Spiel → [Spiel beenden] 
       → Nachbereitung → [Abschließen]
```

**Navigation während Spiel:**
- Quick-Access zu allen Phasen möglich
- Aber: Fokus-Modus verhindert Ablenkung
- "Zurück zur Planung" für Anpassungen

**4. Bewertungen-Management**
- Liste aller Bewertungen pro Spieler
- Filter: aktuell / scouting / archiv
- Zeitstrahl-Ansicht für historische Entwicklung
- Skill-Radar-Chart
- Vergleichs-Ansicht: Saison-Vergleich

**5. Spielplan**
- Kalender-Ansicht oder Liste
- Altersklassen-Filter
- Filter nach Heim/Auswärts (abgeleitet aus heim_team_id/gast_team_id)
- Verknüpfung zu Einsatzplan
- **U12-spezifisch:** Tabellenansicht

**6. Trikotverwaltung**
- Inventar-Übersicht
- Zuweisung Spieler ↔ Trikot
- Verfügbarkeits-Check

**7. Training**
- Trainingsplan
- Anwesenheitsliste (TRAINING_TEILNAHME)
- Probetraining-Modus
- Probetraining-Teilnehmer-Liste

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
    spieler: ObjectStore,
    spieler_bewertung: ObjectStore,
    erziehungsberechtigte: ObjectStore,
    spieler_erziehungsberechtigte: ObjectStore,
    team: ObjectStore,
    spiel: ObjectStore,
    spieler_einsatz: ObjectStore,
    achtel_statistik: ObjectStore,
    trikot: ObjectStore,
    verein: ObjectStore,
    halle: ObjectStore,
    liga: ObjectStore,
    liga_teilnahme: ObjectStore,
    spielplan: ObjectStore,
    training: ObjectStore,
    training_teilnahme: ObjectStore,
    probetraining_teilnehmer: ObjectStore,
    probetraining_historie: ObjectStore,
    spieler_notizen: ObjectStore,
    saison_archiv: ObjectStore
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

## 6. Validierungsregeln

```javascript
const validations = {
    spieler: {
        vorname: { required: true, minLength: 2 },
        nachname: { required: true, minLength: 2 },
        geburtsdatum: { 
            required: false,
            type: Date,
            validate: (value, team) => {
                if (!value) return true; // Optional
                const geburtsjahr = new Date(value).getFullYear()
                const saison_start = parseInt(team.saison.split('/')[0])
                const alter = saison_start - geburtsjahr
                
                switch(team.altersklasse) {
                    case "U8": return alter <= 8;
                    case "U10": return alter <= 10;
                    case "U12": return alter <= 12;
                    default: return false;
                }
            },
            message: (team) => `Geburtsdatum muss für ${team.altersklasse} passen`
        },
        tna_nr: { 
            pattern: /^\d{9}$/,
            optional: true,
            message: "TNA-Nr muss 9-stellig sein"
        },
        mitgliedsnummer: {
            optional: true,
            message: "Vereinssoftware-agnostisch"
        }
    },
    
    spieler_bewertung: {
        bewertungs_typ: {
            enum: ['aktuell', 'scouting', 'archiv'],
            required: true
        },
        scores: {
            range: [1, 3],
            default: 2,
            message: "Skill-Bewertung muss 1-3 sein"
        },
        gueltig_ab: {
            required: true,
            type: Date
        }
    },
    
    erziehungsberechtigte: {
        telefon_mobil: {
            required: true,
            pattern: /^\+?\d{10,15}$/,
            message: "Notfallkontakt erforderlich!"
        },
        email: {
            required: true,
            type: Email
        },
        datenschutz_akzeptiert: {
            required: true,
            equals: true,
            message: "DSGVO-Zustimmung erforderlich"
        }
    },
    
    lineup: {
        // MINIBASKETBALL-PFLICHTREGELN
        minPlaytime: { 
            value: 2, 
            severity: "critical",
            blockUI: true,
            message: "DBB: Jedes Kind MUSS mindestens 2 Achtel spielen",
            applies_to: ["U8", "U10", "U12"]
        },
        minRest: { 
            value: 2, 
            severity: "critical",
            blockUI: true,
            message: "DBB: Jedes Kind MUSS mindestens 2 Achtel pausieren",
            applies_to: ["U8", "U10", "U12"]
        },
        maxPlaytime: { 
            value: 6,
            severity: "critical",
            blockUI: true,
            message: "DBB: Maximal 6 Achtel Spielzeit",
            applies_to: ["U8", "U10", "U12"]
        },
        playersPerQuarter: { 
            validate: (altersklasse, leistungsorientiert) => {
                switch(altersklasse) {
                    case "U8": return 3;
                    case "U10": return 4;
                    case "U12": return leistungsorientiert ? 5 : 4;
                }
            },
            severity: "critical",
            blockUI: true
        }
    }
}
```

---

## 7. Datenschutz & DSGVO

### 7.1 Minimale Datenspeicherung

**Gespeicherte personenbezogene Daten:**
- ✅ Spieler: Name, Geburtsdatum (optional), Konfektionsgröße
- ✅ Erziehungsberechtigte: Name, Telefon, Email
- ❌ **KEINE Adressen** (weder Spieler noch Eltern noch Vereine)
- ❌ **KEINE Trainer-Kontaktdaten** (Trainer ist der App-Nutzer)

### 7.2 Rechtsgrundlage

- **Art. 6 Abs. 1 lit. b DSGVO:** Erforderlich zur Erfüllung des Trainingszwecks
- **Art. 6 Abs. 1 lit. f DSGVO:** Berechtigtes Interesse (Spielplanung, Notfallkontakt)
- **Einwilligung:** Datenschutz-Akzeptanz bei Erziehungsberechtigten

### 7.3 Betroffenenrechte

- **Auskunftsrecht:** Export aller Spielerdaten
- **Löschrecht:** Spieler auf `aktiv = false` setzen, nach Aufbewahrungsfrist löschen
- **Berichtigungsrecht:** Daten jederzeit anpassbar

---

## 8. Feature-Roadmap

### Phase 1 (MVP)
- ✅ Spielerverwaltung (CRUD)
- ✅ Spieler-Bewertungen (zeitabhängig)
- ✅ Einsatzplan (manuell + Auto-Optimize)
- ✅ Minibasketball-Regelvalidierung
- ✅ PWA-Setup (Offline-Fähigkeit)
- ✅ DSGVO-konforme Datenspeicherung

### Phase 2
- ✅ Team-Analyse Dashboard
- ✅ Export/Import (JSON, Excel, PDF)
- ✅ Trikotverwaltung
- ✅ BBB-Integration (VEREIN, HALLE, LIGA)

### Phase 3
- ✅ Spielplan-Integration (manueller Import)
- ✅ Training-Management
- ✅ Probetraining-Tracking
- ✅ Erweiterte Statistiken (historische Entwicklung)

### Phase 4
- ⏳ Cloud-Sync (Firebase/Supabase)
- ⏳ Multi-Team Support
- ⏳ Saison-Vergleiche
- ⏳ Eltern-Portal (wenn gewünscht)

---

## 9. Zusammenfassung

### Kernprinzipien umgesetzt:

✅ **DSGVO-konform:** Minimale Datenspeicherung, keine Adressen  
✅ **Praxistauglich:** Fokus auf Spielplanung und Training  
✅ **BBB-kompatibel:** Integration ohne API möglich  
✅ **Offline-first:** Volle Funktionalität ohne Internet  
✅ **Flexibel:** Bewertungssysteme, Gegner-Scouting, historische Entwicklung  
✅ **Regelkonform:** Minibasketball-Validierung für U8, U10, U12

### Technische Highlights:

- **21 Tabellen** (schlank und fokussiert)
- **Trennung Stammdaten/Bewertungen** (SPIELER_BEWERTUNG)
- **n:m Beziehungen** (Erziehungsberechtigte, Geschwister-Support)
- **Gegner-Scouting** (spieler_typ = 'gegner')
- **Altersklassen-übergreifend** (U8, U10, U12)
- **Vereinssoftware-agnostisch** (mitgliedsnummer statt in_easyVerein)

### Empfohlener Tech-Stack:

- **Frontend:** React + TypeScript + Tailwind CSS
- **State:** Zustand oder Redux Toolkit
- **Storage:** IndexedDB (offline) + optional Firebase (cloud-sync)
- **Visualisierung:** Recharts für Statistiken
- **PWA:** Workbox für Service Worker

---

**Stand:** Oktober 2025  
**Version:** 2.0  
**Autor:** Basketball Trainer-Team