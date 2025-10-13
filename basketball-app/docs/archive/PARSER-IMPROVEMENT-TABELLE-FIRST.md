# Parser Improvement: Tabelle First Strategy

**Datum:** 2025-10-13  
**Issue:** Spielplan-Parser interpretiert Team-Namen inkorrekt  
**Lösung:** Zuerst Tabelle parsen, dann Spielplan

## Problem

Der BBB-Parser hat Team-Namen aus dem Spielplan extrahiert, was zu Problemen führte:

1. **Inkonsistente Team-Namen**: Teams können im Spielplan mehrfach mit leicht unterschiedlichen Schreibweisen vorkommen
2. **Unvollständige Liste**: Nicht alle Teams sind immer im Spielplan vertreten
3. **Parsing-Fehler**: Teams ohne Mannschaftsnummer wurden falsch geparst

### Beispiel aus echten Daten

**Tabelle (eindeutig, jedes Team nur 1x):**
- `DJK Neustadt a. d. Waldnaab 1`
- `TSV 1880 Schwandorf` (OHNE Nummer!)
- `TB Weiden Basketball` (OHNE Nummer!)
- `Regensburg Baskets 1`
- `Regensburg Baskets 2`

**Spielplan (verwendet gleiche Namen):**
- Verwendet exakt die Namen aus der Tabelle
- Aber: Parser versuchte, Mannschaftsnummer zu trennen → Fehler bei Teams ohne Nummer

## Lösung: Tabelle First Strategy

### Neue Parse-Reihenfolge

```typescript
// ALT: Nur Spielplan parsen
parseLigaFromUrl(url) {
  fetch(spielplan_url)
  → parse teams from spielplan  // ❌ Problematisch
  → parse spiele
}

// NEU: Zuerst Tabelle, dann Spielplan
parseLigaFromUrl(url) {
  fetch(tabelle_url)             // ⭐ 1. Tabelle
  → parse teams from tabelle     // ⭐ Eindeutige Teams
  fetch(spielplan_url)           // ⭐ 2. Spielplan
  → parse spiele
}
```

### Implementierte Änderungen

#### 1. Neue Methode: `parseTeamsFromTabelle()`

```typescript
/**
 * Parst Teams aus der Tabelle (bevorzugte Methode)
 * Die Tabelle ist die zuverlässigste Quelle
 */
public parseTeamsFromTabelle(html: string): BBBTeamInfo[] {
  // Findet nur Zeilen mit sportItemEven/sportItemOdd Klassen
  // Filtert Header-Zeilen (sportViewHeader)
  // Filtert Titel-Zeilen (sportViewTitle)
  // Validiert Team-Namen (min. 3 Zeichen, keine reinen Zahlen)
  // Extrahiert Team-Name aus Spalte 2
  // Parsed korrekt mit/ohne Mannschaftsnummer
}
```

**Vorteile:**
- ✅ Jedes Team nur einmal
- ✅ Eindeutige Namen
- ✅ Korrekte Trennung von Verein und Mannschaftsnummer
- ✅ Teams ohne Nummer werden korrekt behandelt
- ✅ Filtert Header und Titel-Zeilen korrekt
- ✅ Validiert Team-Namen

**Verbesserungen nach Bugfix:**
- ✅ Filtert Zeilen mit `sportViewTitle` Klasse (Überschriften)
- ✅ Prüft auf `sportItemEven` oder `sportItemOdd` Klassen (echte Daten)
- ✅ Validiert Mindestlänge (3 Zeichen)
- ✅ Verhindert reine Zahlen als Team-Namen

#### 2. Angepasste `parseLigaFromUrl()`

```typescript
async parseLigaFromUrl(url: string) {
  // 1. Fetch Tabelle
  const tabelleHtml = await fetch(tabelle_url);
  const teams = this.parseTeamsFromTabelle(tabelleHtml);
  
  // 2. Fetch Spielplan mit Teams aus Tabelle
  const spielplanHtml = await fetch(spielplan_url);
  return this.parseSpielplanHtml(spielplanHtml, ligaId, urls, teams);
}
```

#### 3. Angepasste Mock-Daten

Mock-Daten simulieren jetzt realistisch die Tabellen-Struktur:

```typescript
private getMockData(ligaId: string, urls: ...) {
  // Simuliere Tabellen-HTML
  const mockTabelleHtml = `<table>...</table>`;
  
  // Parse Teams aus simulierter Tabelle
  const teams = this.parseTeamsFromTabelle(mockTabelleHtml);
  
  return { liga, teams, spiele, ...urls };
}
```

## Tests

### Unit Tests

```typescript
describe('parseTeamsFromTabelle', () => {
  it('should parse teams from tabelle HTML')
  it('should handle teams without numbers correctly')
  it('should handle teams with numbers correctly')
  it('should skip header rows')
  it('should skip title rows with sportViewTitle class')  // ⭐ NEW
  it('should skip rows without sportItemEven/Odd class')  // ⭐ NEW
  it('should validate team names (min 3 chars, no numbers-only)')  // ⭐ NEW
  it('should return empty array for invalid HTML')
  it('should handle empty table')
});
```

**Gesamt: 9 Unit-Tests** (3 neue nach Bugfix)

### Integration Tests

```typescript
describe('Parse real tabelle.jsp file', () => {
  it('should parse teams from real tabelle.jsp file')
  it('should parse specific teams correctly')
  it('should handle teams with and without numbers')
  it('should have unique team names')
});
```

## Ergebnis

### Vorher (❌ Problematisch)
- Teams wurden aus Spielplan extrahiert
- Mehrfache Vorkommen möglich
- Inkonsistente Namen
- Falsche Trennung bei Teams ohne Nummer

### Nachher (✅ Korrekt)
- Teams werden aus Tabelle extrahiert
- Jedes Team nur einmal
- Eindeutige, konsistente Namen
- Korrekte Behandlung mit/ohne Mannschaftsnummer

## Bugfix: Header-Filterung (2025-10-13)

### Problem nach initialer Implementierung
Der Parser hat 9 Teams statt 7 erkannt:
1. **Überschrift als Team**: "Tabelle - U10 mixed Bezirksliga..." wurde als Team geparst
2. **Header-Zeilen**: "Rang", "Name" etc. wurden als Teams erkannt
3. **Fehlende Team-Nummer**: "DJK Neustadt a. d. Waldnaab" ohne die "1"

### Ursache
```typescript
// ALT - Zu schwache Filterung
const hasHeader = Array.from(cells).some(cell => 
  cell.className.includes('sportViewHeader')  // Reichte nicht!
);
```

Die BBB-HTML-Struktur hat mehrere Arten von Nicht-Daten-Zeilen:
- `sportViewTitle` - Überschriften-Zeilen
- `sportViewHeader` - Tabellen-Header
- Zeilen ohne `sportItemEven`/`sportItemOdd` - Sonstige Inhalte

### Lösung
```typescript
// NEU - Strikte Filterung
// 1. Prüfe ob es eine echte Daten-Zeile ist
const hasDataClass = Array.from(cells).some(cell => 
  cell.className.includes('sportItemEven') || 
  cell.className.includes('sportItemOdd')
);
if (!hasDataClass) return;  // Skip alle Zeilen ohne diese Klassen

// 2. Zusätzlicher Check für Titel und Header
const hasHeader = Array.from(cells).some(cell => 
  cell.className.includes('sportViewHeader') || 
  cell.className.includes('sportViewTitle')  // ⭐ NEU
);
if (hasHeader) return;

// 3. Validiere Team-Namen
if (teamName && teamName.length >= 3 && !/^\d+$/.test(teamName)) {
  // Nur gültige Team-Namen akzeptieren
}
```

### Ergebnis nach Bugfix
- ✅ Genau 7 Teams (wie in der echten Tabelle)
- ✅ Keine Überschriften oder Header
- ✅ Korrekte Team-Namen mit Mannschaftsnummern
- ✅ Alle 9 Unit-Tests grün
- ✅ Alle 4 Integration-Tests grün

### Getestete Edge Cases
1. ✅ Überschrift mit `sportViewTitle` wird übersprungen
2. ✅ Header mit `sportViewHeader` wird übersprungen  
3. ✅ Zeilen ohne Data-Klassen werden übersprungen
4. ✅ Team-Namen < 3 Zeichen werden abgelehnt
5. ✅ Reine Zahlen als Team-Namen werden abgelehnt

## Auswirkungen

### BBB Parser Service
- ✅ Neue public Methode: `parseTeamsFromTabelle()`
- ✅ Angepasste `parseLigaFromUrl()` - fetcht zuerst Tabelle
- ✅ Angepasste `parseSpielplanHtml()` - akzeptiert Teams-Parameter
- ✅ Verbesserte Mock-Daten

### Onboarding
- ✅ Keine Änderungen notwendig
- ✅ Verwendet automatisch die korrekten Teams aus der Tabelle
- ✅ Team-Auswahl zeigt nun konsistente Namen

### Tests
- ✅ 9 neue Unit-Tests (6 initial + 3 nach Bugfix)
- ✅ 4 neue Integration-Tests mit echter tabelle.jsp
- ✅ Alle bestehenden Tests bleiben grün
- ✅ Alle neuen Tests grün

## Domain-Driven Design

Diese Änderung folgt DDD-Prinzipien:

1. **Ubiquitous Language**: "Tabelle" ist die offizielle BBB-Quelle für Team-Standings
2. **Domain Logic**: Parser spiegelt die echte Struktur der BBB-Website wider
3. **Single Source of Truth**: Tabelle als primäre Quelle für Teams
4. **Separation of Concerns**: 
   - Tabelle → Teams (eindeutig)
   - Spielplan → Spiele (mit Team-Referenzen)

## Accessibility (WCAG 2.0 AA)

Keine Auswirkungen auf Accessibility:
- Parsing läuft im Backend
- Frontend-Komponenten unverändert
- Team-Anzeige bleibt barrierefrei

## Performance

**Vorher:** 1 HTTP Request  
**Nachher:** 2 HTTP Requests  

**Analyse:**
- ➕ Bessere Datenqualität
- ➕ Weniger Fehler
- ➖ +1 HTTP Request (aber parallel möglich)
- ✅ Akzeptabel für bessere Korrektheit

## Migration

Keine Breaking Changes:
- API bleibt gleich
- Bestehender Code funktioniert weiter
- Mock-Daten kompatibel
- Onboarding unverändert

## Nächste Schritte

1. ✅ Parser-Logik implementiert
2. ✅ Tests geschrieben und grün
3. ⏳ Production-Test mit echter BBB-Website
4. ⏳ Monitoring für Parsing-Fehler
5. ⏳ Optional: Ergebnisse-Parsing ähnlich verbessern

## Related Files

- `src/domains/bbb/services/BBBParserService.ts` - Hauptlogik
- `src/domains/bbb/services/BBBParserService.test.ts` - Unit-Tests
- `src/domains/bbb/services/BBBParserService.integration.test.ts` - Integration-Tests
- `test-data/bbb/tabelle.jsp` - Echte Test-Daten
- `test-data/bbb/spielplan_list.jsp` - Echte Test-Daten

## Lessons Learned

1. **HTML-Struktur zuerst verstehen**: Echte BBB-Dateien analysieren
2. **Single Source of Truth**: Tabelle als eindeutige Quelle verwenden
3. **Test-Driven**: Tests mit echten Daten schreiben
4. **Fallback-Logik**: Alte Methode als Fallback behalten
5. **Documentation**: Änderungen klar dokumentieren
