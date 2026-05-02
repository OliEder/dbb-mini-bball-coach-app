# Design: Team-Endpunkt & Onboarding-Neubau

**Datum:** 2026-05-01  
**Status:** Genehmigt

---

## Scope

Zwei zusammenhängende Teile:

1. **`getTeamMatches` in `BBBApiService`** — neuer Endpunkt `/rest/team/id/{teamPermanentId}/matches`, Spielplan-Sync in `BBBSyncService` umstellen
2. **Onboarding-Neubau** — kompletter Ersatz des bestehenden `onboarding-simple`-Flows durch Vereinssuche via `clubs.json` (Vereinsregister)

**Out of scope:** Liga-Anzeige im Onboarding, Geo-Suche, Migration bestehender Nutzer-Daten.

---

## Datenfluss

### `getTeamMatches`

- Input: `teamPermanentId: number`
- Endpunkt: `GET /rest/team/id/{teamPermanentId}/matches`
- Proxy: `fetchWithFallback` (wie alle anderen BBBApiService-Methoden)
- Output:

```typescript
interface DBBTeamMatchEintrag extends Omit<DBBSpielplanEintrag, 'homeTeam' | 'awayTeam'> {
  ligaId: number;
  liganame: string;
  homeTeam: {
    teamId: number;
    teamPermanentId?: number;
    teamName: string;
    clubId: number;
    clubName?: string; // nicht im Team-Endpunkt verfügbar
  };
  awayTeam: {
    teamId: number;
    teamPermanentId?: number;
    teamName: string;
    clubId: number;
    clubName?: string; // nicht im Team-Endpunkt verfügbar
  };
}

interface DBBTeamMatchesResponse {
  teamId: number;
  teamName: string;
  matches: DBBTeamMatchEintrag[];
}
```

### BBBSyncService Spielplan-Sync

- Primär: `getTeamMatches(extern_permanent_id)` — ein Call für alle Ligen
- Fallback: `getSpielplan(ligaId)` pro Liga (bleibt erhalten)
- `extern_permanent_id` ist bereits in DB vorhanden — kein Schema-Change

### Onboarding Datenfluss

```
fetch clubs.json (einmalig, gecacht im Store)
  URL: https://olieder.github.io/basketball-vereinsregister-deutschland/data/clubs.json
  CORS: kein Proxy nötig (GitHub Pages: Access-Control-Allow-Origin: *)
     ↓
User tippt Vereinsname
     ↓
Clientseitige Suche (case-insensitive substring auf club.name)
     ↓
User wählt Verein → ClubEntry.teams[] anzeigen
     ↓
User wählt Team (angezeigt: altersklasse, geschlecht, teamNumber)
     ↓
Speichern: teamPermanentId als extern_permanent_id im Team-Datensatz
```

---

## Komponenten & Dateien

| Datei | Änderung |
|---|---|
| `src/shared/types/index.ts` | `DBBTeamMatchEintrag`, `DBBTeamMatchesResponse` hinzugefügt |
| `src/domains/bbb-api/services/BBBApiService.ts` | `getTeamMatches(teamPermanentId)` hinzufügen |
| `src/domains/bbb-api/services/BBBSyncService.ts` | Sync auf `getTeamMatches` umstellen, Fallback erhalten |
| `src/domains/onboarding/` | Bestehenden Store/Flow ersetzen |

### Onboarding-Store (Zustand)

State: `clubs: ClubEntry[]`, `searchQuery: string`, `selectedClub: ClubEntry | null`, `selectedTeam: TeamEntry | null`

- `clubs.json` wird beim ersten Laden gecacht, kein eigener Service-Layer
- Bestehende UI-Komponenten soweit möglich wiederverwenden

---

## Fehlerbehandlung

- `getTeamMatches`: wirft bei `teamPermanentId ≤ 0` (analog zu `getSpielerDetails`)
- `clubs.json` Fetch schlägt fehl → Fehlermeldung mit Retry-Button, kein Silent-Fail
- `BBBSyncService`: `getTeamMatches` schlägt fehl → Fallback auf `getSpielplan(ligaId)`

---

## Tests

- Unit-Test `getTeamMatches` in `BBBApiService.test.ts` (analoges Pattern zu bestehenden Tests)
- `BBBSyncService`: bestehende Tests anpassen (Mock auf `getTeamMatches`)
- Onboarding-Store: Unit-Tests für Suche (Substring, case-insensitive, leere Ergebnisse)
- Kein Pact-Test (TS-03 — Pact-Library-Bug offen)

---

## Mapping-Hinweis

`DBBSpielplanEintrag` erwartet `homeTeam.clubId` und `clubName` als Felder. Der `/team/matches`-Endpunkt liefert `clubId` im homeTeam/guestTeam-Objekt — diese müssen beim Mapping befüllt werden (Fallback: `seasonTeamId` wie in `getCompetitionTable`).

---

## Verifizierter API-Response (2026-05-01)

Endpunkt `GET /rest/team/id/167889/matches` gibt zurück:
- 22 Ligaspiele + 1 Pokalspiel = 23 Spiele total
- Alle Spieltage 1–22 lückenlos vorhanden
- Felder: `matchId`, `matchDay`, `kickoffDate`, `kickoffTime`, `homeTeam.teamPermanentId`, `guestTeam.teamPermanentId`, `result`, `ligaData.ligaId`, `ligaData.liganame`
- Direkt erreichbar ohne Proxy (serverseitig); im Browser CORS-Proxy nötig
