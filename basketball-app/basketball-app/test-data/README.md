# Basketball PWA - Test-Daten

**Letzte Aktualisierung:** 12. Oktober 2025

---

## 📋 Übersicht

Dieser Ordner enthält Test-Daten für die Entwicklung und Testing der Basketball PWA. Diese Daten werden für Unit-Tests, Integration-Tests und manuelle Tests verwendet.

---

## 📂 Struktur

```
test-data/
├── bbb/                    # BBB Parser Test-Daten
│   ├── spielplan_list.jsp  # BBB Spielplan HTML
│   ├── tabelle.jsp         # BBB Tabellen HTML
│   └── ergebnisse.jsp      # BBB Ergebnisse HTML
│
├── csv/                    # CSV Import Test-Daten
│   ├── spieler_dummy.csv   # Spieler Test-Import
│   └── trikot_dummy.csv    # Trikot Test-Import
│
└── README.md               # Diese Datei
```

---

## 🔍 BBB Test-Daten (`/bbb/`)

### Zweck
HTML-Seiten von basketball-bund.net für das Testen des BBB-Parsers.

### Dateien

#### `spielplan_list.jsp`
**Quelle:** https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=XXXXX  
**Inhalt:** Spielplan einer Liga mit allen Spielen, Datum, Teams, Hallen  
**Verwendung:** 
- BBB-Parser Tests für Spielplan-Extraktion
- Integration-Tests für Spielplan-Import
- Validierung der Spielnummer-basierten Synchronisation

**Wichtige Datenfelder:**
- Spielnummer (Nr.)
- Spieltag
- Datum & Uhrzeit
- Heim-Team & Gast-Team
- Halle
- Liga-Informationen

#### `tabelle.jsp`
**Quelle:** https://www.basketball-bund.net/liga/statistik_team.jsp?liga_id=XXXXX  
**Inhalt:** Liga-Tabelle mit Platzierungen, Punkten, Statistiken  
**Verwendung:**
- BBB-Parser Tests für Tabellen-Extraktion
- Dashboard-Anzeige Tests
- Vergleichs-Analysen

**Wichtige Datenfelder:**
- Team-Name
- Platzierung
- Spiele, Siege, Niederlagen
- Punkte
- Körbe erzielt/erhalten
- Heim/Auswärts-Statistiken

#### `ergebnisse.jsp`
**Quelle:** https://www.basketball-bund.net/public/ergebnisse.jsp?liga_id=XXXXX  
**Inhalt:** Spiel-Ergebnisse der Liga  
**Verwendung:**
- BBB-Parser Tests für Ergebnis-Extraktion
- Benchmark-Analyse Tests (gemeinsame Gegner)
- Spielnummer-Matching Tests

**Wichtige Datenfelder:**
- Spielnummer
- Heim-Team & Gast-Team
- Ergebnis Heim & Gast
- Datum

---

## 📊 CSV Test-Daten (`/csv/`)

### Zweck
Dummy-Daten für das Testen des CSV-Imports (Spieler & Trikots).

### Dateien

#### `spieler_dummy.csv`
**Format:** CSV mit Semikolon-Separator  
**Verwendung:**
- CSV-Import Validierung
- Spieler-Domain Tests
- Erziehungsberechtigte-Mapping Tests

**Erwartete Spalten:**
```csv
vorname;nachname;geburtsdatum;tna_nr;konfektionsgroesse_jersey;konfektionsgroesse_hose;erz_vorname;erz_nachname;erz_telefon;erz_email
```

**Beispiel:**
```csv
Max;Mustermann;2015-05-12;TNA123456;140;140;Maria;Mustermann;0171-1234567;maria@example.com
Lisa;Beispiel;2014-08-23;TNA789012;134;134;Thomas;Beispiel;0172-9876543;thomas@example.com
```

**Validierungen:**
- ✅ Vorname & Nachname (Pflicht)
- ✅ Geburtsdatum (Optional, Format: YYYY-MM-DD)
- ✅ TNA-Nummer (Optional, ligaberechtigt)
- ✅ Konfektionsgrößen (Optional, 116-170)
- ✅ Erziehungsberechtigte (Optional, aber empfohlen)

#### `trikot_dummy.csv`
**Format:** CSV mit Semikolon-Separator  
**Verwendung:**
- CSV-Import Validierung
- Trikot-Inventar Tests
- Nummern-Duplikat Tests

**Erwartete Spalten:**
```csv
art;nummer;groesse;eu_groesse;farbe_dunkel;farbe_hell
```

**Beispiel:**
```csv
Wendejersey;4;s;140;Schwarz;Weiß
Wendejersey;7;m;152;Schwarz;Weiß
Hose;;m;152;;
```

**Validierungen:**
- ✅ Art (Pflicht: "Wendejersey" oder "Hose")
- ✅ Nummer (Optional bei Hosen, Pflicht bei Jerseys)
- ✅ Größe (Pflicht: 3xs, 2xs, xs, s, m, l, xl, 2xl, 3xl)
- ✅ EU-Größe (Pflicht: 116-170)
- ✅ Farben (Optional, nur bei Wendejerseys)
- ✅ Duplikat-Prüfung für Nummern

---

## 🧪 Verwendung in Tests

### Unit-Tests (Vitest)

```typescript
import { readFileSync } from 'fs';
import { parseBBBSpielplan } from '@/domains/bbb/parser';

describe('BBB Parser', () => {
  it('should parse spielplan correctly', () => {
    const html = readFileSync('./test-data/bbb/spielplan_list.jsp', 'utf-8');
    const result = parseBBBSpielplan(html);
    
    expect(result).toHaveLength(22); // 22 Spiele in der Saison
    expect(result[0]).toHaveProperty('nr');
    expect(result[0]).toHaveProperty('heim');
    expect(result[0]).toHaveProperty('gast');
  });
});
```

### Integration-Tests (PACT)

```typescript
import { importCSV } from '@/domains/spieler/services/csv-import';

describe('CSV Import', () => {
  it('should import spieler from CSV', async () => {
    const csvPath = './test-data/csv/spieler_dummy.csv';
    const result = await importCSV(csvPath, 'team-123');
    
    expect(result.imported).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });
});
```

### Manuelle Tests

```bash
# BBB Parser testen
npm run test:bbb

# CSV Import testen
npm run test:csv

# Alle Tests
npm test
```

---

## 📝 Test-Daten aktualisieren

### BBB-Daten aktualisieren

1. **Browser öffnen:** Gehe zu basketball-bund.net
2. **Liga auswählen:** Suche aktuelle Liga (z.B. U10 Bezirksliga)
3. **Seiten speichern:**
   - Spielplan: Rechtsklick → "Speichern unter" → `spielplan_list.jsp`
   - Tabelle: Rechtsklick → "Speichern unter" → `tabelle.jsp`
   - Ergebnisse: Rechtsklick → "Speichern unter" → `ergebnisse.jsp`
4. **Dateien ersetzen:** In `/test-data/bbb/` überschreiben
5. **Tests aktualisieren:** Falls nötig, Assertions anpassen

### CSV-Daten aktualisieren

1. **Editiere direkt:** Mit Excel, LibreOffice oder Texteditor
2. **Format beachten:** Semikolon-Separator, UTF-8 Encoding
3. **Validierung:** Stelle sicher, dass alle Pflichtfelder vorhanden sind
4. **Speichern:** Als CSV mit Semikolon-Separator

---

## ⚠️ Wichtige Hinweise

### Datenschutz
- ✅ **Nur Dummy-Daten verwenden!**
- ❌ **Keine echten Spieler-Namen, Telefonnummern oder E-Mails**
- ❌ **Keine echten TNA-Nummern**
- ⚠️ BBB-HTML-Daten enthalten öffentliche Vereinsnamen - das ist OK

### Git
```gitignore
# Falls echte Test-Daten lokal genutzt werden:
test-data/real-data/
test-data/**/*-real.csv
test-data/**/*-prod.csv
```

### Production
- ❌ Diese Test-Daten sind **NICHT** für Production
- ❌ Test-Daten werden **NICHT** in den Production-Build gepackt
- ✅ Nur für Development & Testing

---

## 🔗 Verwandte Dokumente

- **BBB Parser:** `/src/domains/bbb/parser/`
- **CSV Import:** `/src/domains/spieler/services/csv-import.ts`
- **Tests:** `/src/test/`
- **Dokumentation:** `/docs/architecture/`

---

## 📞 Anmerkungen

### Fehlende Test-Daten
Falls zusätzliche Test-Daten benötigt werden:
- Einsatzplan-Beispiele
- Benchmark-Szenarien
- Edge-Cases (leere Tabellen, fehlerhafte CSVs)

### Erweiterungen
- Snapshot-Tests mit Jest
- E2E-Tests mit Playwright
- Performance-Tests mit großen Datensätzen

---

**Letzte Änderungen:**
- 12.10.2025: Test-Daten-Ordner erstellt und strukturiert
- 12.10.2025: BBB-Dateien und CSV-Dateien organisiert
- 12.10.2025: README mit vollständiger Dokumentation
