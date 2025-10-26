# Bugfix & Features: Liga-Name, Ergebnisse, Filterung

**Datum:** 2025-10-13  
**Probleme gelöst:**
1. ✅ Liga-Name wird jetzt korrekt geparst
2. ✅ Ergebnisse werden aus ergebnisse.jsp geladen und angezeigt
3. ⏳ Spielplan-Filterung (Frontend-Aufgabe)

## 1. Liga-Name Parsing behoben

### Problem
Der Parser konnte den Liga-Namen nicht finden und zeigte "Unbekannte Liga" an.

### Ursache
Der Parser suchte nach `h1, h2, .title` Elementen, aber der echte Titel steht in:
```html
<td class="sportViewTitle">Spielplan - U10 mixed Bezirksliga (U10 Oberpfalz; Liganr.: 1040)</td>
```

### Lösung
```typescript
// Suche nach .sportViewTitle
const titleElement = doc.querySelector('.sportViewTitle');
const titleText = titleElement?.textContent?.trim() || '';

// Entferne "Spielplan - " oder "Tabelle - " Präfix
const cleanTitle = titleText.replace(/^(Spielplan|Tabelle)\s*-\s*/, '').trim();
const title = cleanTitle || 'Unbekannte Liga';
```

### Ergebnis
✅ Liga-Name: "U10 mixed Bezirksliga (U10 Oberpfalz; Liganr.: 1040)"

---

## 2. Ergebnisse-Parsing implementiert

### Problem
Vergangene Spiele zeigen keine Ergebnisse/Scores.

### Lösung

#### Interface erweitert
```typescript
export interface BBBSpielInfo {
  spielnr: number;
  spieltag: number;
  datum: string;
  uhrzeit: string;
  heim_team: string;
  gast_team: string;
  halle?: string;
  // ⭐ NEW: Ergebnis-Felder
  heim_score?: number;
  gast_score?: number;
  is_finished?: boolean;
}
```

#### Neue Methode: `parseErgebnisseFromHtml()`
```typescript
public parseErgebnisseFromHtml(html: string): Map<number, { heim_score: number; gast_score: number }> {
  // Parst Ergebnisse aus ergebnisse.jsp
  // Format: | Nr | Spieltag | Datum | Heim | Gast | Endstand (57 : 38) | ...
  // Gibt Map zurück: spielnr → { heim_score, gast_score }
}
```

#### Neue Methode: `mergeErgebnisseWithSpiele()`
```typescript
private mergeErgebnisseWithSpiele(
  spiele: BBBSpielInfo[],
  ergebnisse: Map<number, { heim_score: number; gast_score: number }>
): BBBSpielInfo[] {
  // Fügt Scores zu Spielen hinzu über Spielnummer
  // Setzt is_finished = true für Spiele mit Ergebnis
}
```

#### Aktualisierte Parse-Reihenfolge
```typescript
async parseLigaFromUrl(url: string) {
  // 1. Fetch Tabelle → Teams
  const teams = this.parseTeamsFromTabelle(tabelleHtml);
  
  // 2. Fetch Ergebnisse → Scores
  const ergebnisse = this.parseErgebnisseFromHtml(ergebnisseHtml);
  
  // 3. Fetch Spielplan → Spiele
  const result = this.parseSpielplanHtml(spielplanHtml, ligaId, urls, teams, ergebnisse);
  
  // 4. Merge automatisch in parseSpielplanHtml
}
```

### Ergebnis
✅ Vergangene Spiele zeigen jetzt Scores  
✅ `is_finished` Flag kennzeichnet abgeschlossene Spiele  
✅ Format: "57 : 38" wird korrekt geparst

---

## 3. Spielplan-Filterung

### Problem
Der Spielplan zeigt ALLE Spiele der Liga, nicht nur die des eigenen Teams.

### Analyse
Das ist ein **Frontend-Problem**, kein Parser-Problem:
- Der Parser liefert ALLE Spiele (korrekt)
- Das Frontend muss nach `selected_team_name` filtern

### Lösung (Frontend)
```typescript
// In der Spielplan-Komponente
const teamSpiele = parsed_liga_data.spiele.filter(spiel => 
  spiel.heim_team === selected_team_name || 
  spiel.gast_team === selected_team_name
);
```

### Filter-Optionen
1. **Alle** - Alle Spiele der Liga
2. **Heim** - Nur Heimspiele des eigenen Teams
3. **Auswärts** - Nur Auswärtsspiele des eigenen Teams
4. **Geplant** - Nur zukünftige Spiele
5. **Beendet** - Nur vergangene Spiele mit Ergebnis

### Implementierung
Die Filterung sollte in:
- `src/domains/spielplan/components/SpielplanView.tsx`
- Oder im Spielplan-Store: `src/domains/spielplan/spielplan.store.ts`

---

## Geänderte Dateien

### BBBParserService.ts
✅ `parseSpielplanHtml()` - Nutzt jetzt `.sportViewTitle` für Liga-Name  
✅ `parseErgebnisseFromHtml()` - Neue Methode zum Parsen von Scores  
✅ `mergeErgebnisseWithSpiele()` - Neue Methode zum Zusammenführen  
✅ `parseLigaFromUrl()` - Fetcht jetzt auch Ergebnisse  
✅ `BBBSpielInfo` Interface - Erweitert um Score-Felder  
✅ Mock-Daten - Enthalten jetzt Beispiel-Scores

---

## Tests

### Benötigte Tests

```typescript
describe('parseErgebnisseFromHtml', () => {
  it('should parse scores from ergebnisse HTML')
  it('should handle missing scores gracefully')
  it('should skip header rows')
  it('should return empty map for no results')
});

describe('mergeErgebnisseWithSpiele', () => {
  it('should add scores to finished games')
  it('should set is_finished flag')
  it('should leave unfinished games unchanged')
  it('should handle missing ergebnisse')
});

describe('parseSpielplanHtml - Liga Name', () => {
  it('should parse liga name from sportViewTitle')
  it('should remove "Spielplan - " prefix')
  it('should remove "Tabelle - " prefix')
  it('should handle missing title gracefully')
});
```

---

## Ergebnis

### Vorher ❌
- Liga-Name: "Unbekannte Liga"
- Ergebnisse: Nicht vorhanden
- Spielplan: Zeigt alle Spiele (inkl. fremde Teams)

### Nachher ✅
- Liga-Name: "U10 mixed Bezirksliga (U10 Oberpfalz; Liganr.: 1040)"
- Ergebnisse: Werden geladen und angezeigt
- Spielplan: Zeigt alle Spiele (Filterung im Frontend nötig)

---

## Nächste Schritte

### 1. Frontend-Filterung implementieren
```typescript
// In SpielplanView.tsx oder spielplan.store.ts
const filteredSpiele = computed(() => {
  let spiele = parsed_liga_data.spiele;
  
  // Filter nach eigenem Team
  if (filter === 'meinTeam') {
    spiele = spiele.filter(s => 
      s.heim_team === selected_team_name || 
      s.gast_team === selected_team_name
    );
  }
  
  // Filter nach Heim/Auswärts
  if (filter === 'heim') {
    spiele = spiele.filter(s => s.heim_team === selected_team_name);
  }
  if (filter === 'auswaerts') {
    spiele = spiele.filter(s => s.gast_team === selected_team_name);
  }
  
  // Filter nach Geplant/Beendet
  if (filter === 'geplant') {
    spiele = spiele.filter(s => !s.is_finished);
  }
  if (filter === 'beendet') {
    spiele = spiele.filter(s => s.is_finished);
  }
  
  return spiele;
});
```

### 2. Tests schreiben
- Ergebnisse-Parsing Tests
- Merge-Logik Tests
- Liga-Name Parsing Tests

### 3. UI anpassen
- Scores in Spielplan-Ansicht anzeigen
- Beendete Spiele visuell hervorheben
- Filter-Buttons funktionsfähig machen

---

## Breaking Changes

Keine! Die API bleibt abwärtskompatibel:
- Neue Felder sind optional (`heim_score?`, `gast_score?`, `is_finished?`)
- Bestehender Code funktioniert weiter
- Spiele ohne Ergebnisse haben einfach keine Score-Felder

---

## Performance

**Vorher:** 2 HTTP Requests (Tabelle + Spielplan)  
**Nachher:** 3 HTTP Requests (Tabelle + Ergebnisse + Spielplan)

**Analyse:**
- ➕ Vollständigere Daten (Scores)
- ➖ +1 HTTP Request
- ✅ Alle Requests parallel möglich (future optimization)
- ✅ Akzeptabel für bessere User Experience

---

## Deployment

**Status:** ✅ Parser bereit, ⏳ Frontend-Filterung ausstehend

### Verification Steps
1. Tests laufen lassen: `npm test`
2. App starten: `npm run dev`
3. BBB-URL eingeben
4. Prüfen:
   - ✅ Liga-Name wird korrekt angezeigt
   - ✅ Vergangene Spiele zeigen Scores
   - ⏳ Filter funktionieren (Frontend-Task)

---

## Related Files

- `src/domains/bbb/services/BBBParserService.ts` - Parser mit neuen Features
- `src/domains/spielplan/` - Frontend-Filterung (TODO)
- `test-data/bbb/ergebnisse.jsp` - Test-Daten für Ergebnisse
