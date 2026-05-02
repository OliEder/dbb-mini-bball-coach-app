# Basketball PWA - App-Start & Onboarding Flow

**Stand:** 11. Oktober 2025  
**Version:** 3.1 - mit URL Einzel-Eingabe für BBB-Liga

---

## 1. Erster App-Start: Onboarding

### 1.1 Ablauf

#### Schritt 1: Willkommensscreen
- Kurze App-Erklärung, DSGVO-konform, offlinefähig

#### Schritt 2: Trainer-Profil anlegen
- Name Pflichtfeld, Lizenz-Nr. + Profilbild optional

#### Schritt 3: Team-Setup (iterativ)

Der Trainer kann beliebig viele Teams importieren bzw. anlegen. Für jedes Team:

**Option A: BBB-Spielplan Import (Primär)**
- User gibt eine beliebige URL zu einer BBB-Liga-Seite ein, die den Parameter `liga_id` enthält.
- Applikation extrahiert automatisch die Liga-ID aus der URL (egal ob Spielplan, Tabellen oder Ergebnislink).
- Anschließend werden daraus die drei URLs für Spielplan, Tabelle und Ergebnis automatisch abgeleitet.
- Nutzer muss somit nur eine einzige URL eingeben, z.B. per Browser Teilen/Kopieren & Einfügen.

**Beispiel URL:**
```
https://www.basketball-bund.net/public/spielplan_list.jsp?print=1&viewDescKey=sport.dbb.liga.SpielplanViewPublic/index.jsp_&liga_id=51961
```

- User wählt aus allen Teams der Liga sein eigenes Team für den Import aus
- Verein wird als "Mein Verein" markiert oder bei mehreren Teams wiederverwendet

##### 3.2 Spieler CSV-Import (PFLICHT)
- Format mit Pflichtfeldern Vorname, Nachname, optional Geburtsdatum, TNA-Nr etc.
- Validierung auf Korrektheit & Duplikate

##### 3.3 Trikot-Inventar CSV-Import (PFLICHT)
- Format mit Feldern Art, Nummer, Größe, Farben, Status
- Validierung auf Duplikate, Pflichtfelder

##### 3.4 Team vollständig konfiguriert
- Speichern lokal und optional weiteres Team hinzufügen

#### Schritt 4: Dashboard
- Übersicht alle Teams, nächste Spiele, Tabelle, Benchmark

---

## 2. Regulärer App-Start: Automatisches Update

- Prüfe ob Gerät online ist
- Lädt für alle Teams mit BBB-URL die 3 URLs (Spielplan, Tabelle, Ergebnisse)
- Vergleicht Spielsaison-Daten anhand Spielnummer (Nr.)
- Erkennung und Anzeige von Änderungen
- Übernahme der Daten nach Bestätigung
- Sync-Timestamp wird aktualisiert
- Offline-Modus bei fehlender Verbindung

---

## 3. Benchmark-Analyse

- Vergleich der Punktedifferenzen gegen gemeinsame Gegner
- Ziel: Mindestens 5 Punkte besser als Gegner-Schnitt
- Anzeige der Benchmarkdaten im Dashboard und Spielvorbereitung

---

## 4. Technische Umsetzung Ausschnitt

```javascript
function extractLigaId(url) {
    const match = url.match(/liga_id=(\d{5})/);
    if (!match) throw new Error('Ungültige BBB-URL: Liga-ID nicht gefunden');
    return match[1];
}

function buildBBBUrls(inputUrl) {
    const ligaId = extractLigaId(inputUrl);
    return {
        spielplanUrl: `https://www.basketball-bund.net/public/spielplan_list.jsp?print=1&viewDescKey=sport.dbb.liga.SpielplanViewPublic/index.jsp_&liga_id=${ligaId}`,
        tabelleUrl: `https://www.basketball-bund.net/liga/statistik_team.jsp?print=1&viewDescKey=sport.dbb.views.TeamStatView/templates/base_template.jsp_&liga_id=${ligaId}`,
        ergebnisseUrl: `https://www.basketball-bund.net/public/ergebnisse.jsp?print=1&viewDescKey=sport.dbb.liga.ErgebnisseViewPublic/index.jsp_&liga_id=${ligaId}`
    };
}
```
