# Bugfix: Parser filtert jetzt Header und Titel korrekt

**Datum:** 2025-10-13  
**Problem:** Parser erkannte 9 Teams statt 7 (inkl. Überschriften und Header)

## Das Problem

Der Parser hat folgende Zeilen fälschlicherweise als Teams interpretiert:

1. ❌ **Überschrift**: "Tabelle - U10 mixed Bezirksliga (U10 Oberpfalz; Liganr.: 1040)"
2. ❌ **Header-Zeilen**: Spaltenköpfe wie "Rang", "Name", "Spiele" etc.
3. ❌ **Inkorrekte Namen**: "DJK Neustadt a. d. Waldnaab" ohne die "1"

→ **Resultat: 9 "Teams" statt 7 echten Teams**

## Die Ursache

### Alte Filterung (zu schwach)
```typescript
const hasHeader = Array.from(cells).some(cell => 
  cell.className.includes('sportViewHeader')
);
if (hasHeader) return;
```

**Problem:** Reichte nicht aus, um alle Nicht-Daten-Zeilen zu filtern!

### BBB-HTML-Struktur
Die echte BBB-Tabelle hat verschiedene Arten von Zeilen:

```html
<!-- Überschrift (sportViewTitle) -->
<td class="sportViewTitle">Tabelle - U10 mixed Bezirksliga...</td>

<!-- Header (sportViewHeader) -->
<td class="sportViewHeader">Rang</td>
<td class="sportViewHeader">Name</td>

<!-- ECHTE Daten (sportItemEven / sportItemOdd) -->
<td class="sportItemEven">1</td>
<td class="sportItemEven">DJK Neustadt a. d. Waldnaab 1</td>
```

## Die Lösung

### 3-Stufen-Filterung

```typescript
// STUFE 1: Nur echte Daten-Zeilen
const hasDataClass = Array.from(cells).some(cell => 
  cell.className.includes('sportItemEven') || 
  cell.className.includes('sportItemOdd')
);
if (!hasDataClass) return;  // ⭐ Filtert ALLE Nicht-Daten-Zeilen

// STUFE 2: Zusätzlicher Check für Header und Titel
const hasHeader = Array.from(cells).some(cell => 
  cell.className.includes('sportViewHeader') || 
  cell.className.includes('sportViewTitle')  // ⭐ NEU
);
if (hasHeader) return;

// STUFE 3: Validiere Team-Namen
if (teamName && teamName.length >= 3 && !/^\d+$/.test(teamName)) {
  const teamInfo = this.parseTeamName(teamName);
  teams.push(teamInfo);
}
```

### Neue Validierung
- ✅ Mindestlänge: 3 Zeichen
- ✅ Keine reinen Zahlen (verhindert "1", "2" als Team-Namen)
- ✅ Nur Zeilen mit `sportItemEven` oder `sportItemOdd`

## Das Ergebnis

### Vorher: ❌ 9 "Teams"
1. ❌ Team Statistik - U10 mixed Bezirksliga... (Überschrift)
2. ❌ Stand: nicht verfügbar (Header)
3. ⚠️ DJK Neustadt a. d. Waldnaab (fehlt "1")
4. ✅ TSV 1880 Schwandorf
5. ✅ TB Weiden Basketball
6. ...und mehr falsche Einträge

### Nachher: ✅ 7 echte Teams
1. ✅ DJK Neustadt a. d. Waldnaab 1
2. ✅ TSV 1880 Schwandorf
3. ✅ TB Weiden Basketball
4. ✅ Regensburg Baskets 1
5. ✅ TV Amberg-Sulzbach BSG 2
6. ✅ Regensburg Baskets 2
7. ✅ Fibalon Baskets Neumarkt

## Tests

### 3 neue Unit-Tests für Bugfix
```typescript
it('should skip title rows with sportViewTitle class')
it('should skip rows without sportItemEven or sportItemOdd class')
it('should validate team names (min 3 chars, no numbers-only)')
```

**Gesamt: 9 Unit-Tests + 4 Integration-Tests = 13 Tests ✅**

## Validierung mit echten Daten

Die Integration-Tests verwenden die echte `tabelle.jsp` Datei:

```typescript
it('should parse teams from real tabelle.jsp file', () => {
  const html = readFileSync('test-data/bbb/tabelle.jsp', 'utf-8');
  const teams = service.parseTeamsFromTabelle(html);
  
  expect(teams.length).toBeGreaterThanOrEqual(5);  // ✅
  expect(teamNames).toContain('DJK Neustadt a. d. Waldnaab 1');  // ✅
  expect(teamNames).toContain('TSV 1880 Schwandorf');  // ✅
});
```

## Auswirkung auf die App

### Team-Auswahl im Onboarding
**Vorher:**
- Zeigt falsche Einträge an
- "Team Statistik" als auswählbares Team
- Verwirrende Header-Zeilen
- Inkorrekte Team-Namen

**Nachher:**
- Zeigt nur echte Teams an
- Korrekte Team-Namen mit Mannschaftsnummern
- Saubere, verständliche Auswahl
- Keine Header oder Überschriften

## Zusammenfassung

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| **Team-Anzahl** | 9 (falsch) | 7 (korrekt) |
| **Überschriften** | ❌ Als Teams geparst | ✅ Gefiltert |
| **Header-Zeilen** | ❌ Als Teams geparst | ✅ Gefiltert |
| **Team-Namen** | ⚠️ Teilweise falsch | ✅ Korrekt |
| **Validierung** | ❌ Keine | ✅ 3-Stufen |
| **Tests** | 6 | 13 |

## Technische Details

### Geänderte Dateien
- ✅ `BBBParserService.ts` - Verbesserte Filterlogik
- ✅ `BBBParserService.test.ts` - 3 neue Tests
- ✅ `PARSER-IMPROVEMENT-TABELLE-FIRST.md` - Dokumentation aktualisiert
- ✅ `BUGFIX-HEADER-FILTERING.md` - Diese Datei

### Keine Breaking Changes
- API bleibt gleich
- Onboarding funktioniert automatisch besser
- Alle alten Tests bleiben grün
- Rückwärtskompatibel

## Deployment

**Status: ✅ Produktionsbereit**

Alle Änderungen wurden auf die Festplatte geschrieben und sind ready für Deployment.

### Verification Steps
1. Tests laufen lassen: `npm test`
2. App starten: `npm run dev`
3. BBB-URL eingeben und Team-Auswahl prüfen
4. Erwartung: Genau 7 Teams, keine Header/Überschriften

## Lessons Learned

1. **HTML-Struktur genau analysieren**: Nicht nur auf Element-Namen achten, sondern auf CSS-Klassen
2. **Multi-Level-Filterung**: Eine Prüfung reicht nicht - mehrere Schichten nötig
3. **Positive Filterung > Negative Filterung**: Prüfe auf "was es IST" nicht nur "was es NICHT ist"
4. **Validierung ist wichtig**: Team-Namen validieren verhindert falsche Daten
5. **Tests mit echten Daten**: Integration-Tests mit echter `tabelle.jsp` fanden den Bug

## Related Files

- `src/domains/bbb/services/BBBParserService.ts`
- `src/domains/bbb/services/BBBParserService.test.ts`
- `src/domains/bbb/services/BBBParserService.integration.test.ts`
- `test-data/bbb/tabelle.jsp`
- `PARSER-IMPROVEMENT-TABELLE-FIRST.md`
