# 🏗️ Club-Crawler Architektur - Neues Onboarding

## 🎯 Problem gelöst

**ALT (v2):** Filter-Kaskade → Verband → Gebiet → Altersklassen → Liga-Liste
**NEU (v3):** Direkte Vereinssuche → Team-Auswahl

## ✅ Vorteile

1. **UX:** Viel einfacher - User sucht einfach seinen Verein
2. **Performance:** Einmalig crawlen, dann statische Daten
3. **Offline:** Club-Daten sind lokal verfügbar
4. **Features:** Viele neue Möglichkeiten (Gegnersuche, Statistiken, etc.)

---

## 📋 Implementation Plan

### Phase 1: Club-Crawler Script ✅

**Script:** `scripts/crawl-clubs.js`
**Command:** `npm run crawl:clubs`

**Prozess:**
1. Lade ALLE Ligen (`POST /wam/liga/list?startAtIndex=0`)
2. Für jede Liga: Lade Tabelle (`GET /competition/table/id/:ligaId`)
3. Extrahiere ClubIDs aus Tabellen
4. Dedupliziere ClubIDs
5. Für jeden Club: Lade Details (`GET /club/id/:clubId/actualmatches`)
6. Speichere als JSON: `src/shared/data/bayern-clubs.json`

**Kosten:** ~380 Ligen + ~300 Clubs = ~680 API-Calls (einmalig!)

---

### Phase 2: TypeScript Types ✅

**File:** `src/shared/types/club.ts`

```typescript
interface BBBClub {
  clubId: string;
  name: string;
  fullName?: string;
  teamIds: string[];
  verbandId: number;
  ligen: ClubLigaInfo[];
  city?: string;
  // ... Kontaktdaten
}
```

---

### Phase 3: Neue Onboarding Components (v3)

#### VereinStepV3 (TODO)

**Features:**
- Suchfeld (Name oder Ort)
- Fuzzy-Search in Club-Daten
- Direkte Auswahl
- Zeigt Team-Anzahl & Altersklassen

#### TeamStepV3 (TODO)

**Features:**
- Zeigt ALLE Teams des gewählten Vereins
- Multi-Select für eigene Teams
- Lädt Details per API wenn nötig

---

### Phase 4: API-Integration

**Wenn Club gewählt:**
```typescript
// Lade aktuelle Teams des Clubs
GET /club/id/${clubId}/actualmatches?justHome=true&rangeDays=365
```

**Response enthält:**
- Alle Teams des Clubs
- Aktuelle Matches
- Liga-Zuordnungen

---

## 🚀 Nächste Schritte

### JETZT:

1. ✅ Script erstellen (`crawl-clubs.js`)
2. ✅ Types definieren (`club.ts`)
3. ⏳ Script ausführen: `npm run crawl:clubs`
4. ⏳ VereinStepV3 fertig implementieren
5. ⏳ TeamStepV3 erstellen

### SPÄTER:

- Mehrere Verbände unterstützen
- Regelmäßiger Re-Crawl (z.B. monatlich)
- Cache-Strategie für Club-Details
- Offline-Sync

---

## 📊 Daten-Struktur

```json
{
  "metadata": {
    "verbandId": 2,
    "verbandName": "Bayern",
    "crawledAt": "2025-10-22T12:00:00Z",
    "totalClubs": 300,
    "note": "Club → Teams → Seasons → Ligen"
  },
  "clubs": [
    {
      "clubId": "12345",
      "vereinsname": "DJK Neustadt a. d. Waldnaab e.V.",
      "city": "Neustadt a. d. Waldnaab",
      "teams": [
        {
          "teamPermanentId": "team123",
          "teamAkj": "U10",  // FIX!
          "seasons": [
            {
              "seasonId": 2025,
              "seasonName": "2025/2026",
              "ligen": [
                {
                  "ligaId": "liga789",
                  "liganame": "U10 Bezirksliga",
                  "akName": "U10"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🔧 Maintenance

**Wann re-crawlen?**
- Vor jeder neuen Saison
- Monatlich während der Saison (neue Vereine)
- Nach großen Änderungen im BBB-System

**Command:**
```bash
npm run crawl:clubs
git add src/shared/data/bayern-clubs.json
git commit -m "data: Update Bayern club data"
```

---

## 💡 Zukunft

Mit Club-Daten können wir bauen:
- ✅ Vereinssuche im Onboarding
- ✅ Gegnersuche (alle Clubs mit U10 Teams)
- ✅ Spielplan-Import (via clubId)
- ✅ Statistiken (Club-Vergleiche)
- ✅ Offline-Modus (lokale Club-DB)
- ✅ Push-Notifications (neue Spiele des Clubs)

---

**Bereit zum Crawlen?** `npm run crawl:clubs` 🚀
