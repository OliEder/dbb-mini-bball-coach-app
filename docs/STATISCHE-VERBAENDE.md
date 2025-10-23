# Basketball-Verbände (DBB) - ID-Struktur

**Stand:** 2025-10-22  
**Quelle:** `scripts/update-verbaende.js` + DBB API

---

## 📊 ID-Bereiche Übersicht

| ID-Bereich | Kategorie | Beschreibung | Anzahl |
|------------|-----------|--------------|---------|
| **1-16** | Landesverbände | Bundesländer | 16 |
| **29** | Deutsche Meisterschaften | Bundesweite Meisterschaftswettbewerbe | 1 |
| **30-33** | Regionalligen | Überregionale Ligen | 4 |
| **40+** | Rollstuhlbasketball | Spezialverbände | variabel |
| **100+** | Bundesligen | 1. und 2. Basketball-Bundesliga | variabel |

---

## 🏛️ Landesverbände (IDs 1-16)

Geografisch organisiert nach Bundesländern:

| ID | Label | Beschreibung |
|----|-------|--------------|
| 1 | Baden-Württemberg | BW Basketball |
| 2 | Bayern | BY Basketball |
| 3 | Berlin | BE Basketball |
| 4 | Brandenburg | BB Basketball |
| 5 | Bremen | HB Basketball |
| 6 | Hamburg | HH Basketball |
| 7 | Hessen | HE Basketball |
| 8 | Mecklenburg-Vorpommern | MV Basketball |
| 9 | Niedersachsen | NI Basketball |
| 10 | Nordrhein-Westfalen | NRW Basketball |
| 11 | Rheinland-Pfalz | RP Basketball |
| 12 | Saarland | SL Basketball |
| 13 | Sachsen | SN Basketball |
| 14 | Sachsen-Anhalt | ST Basketball |
| 15 | Schleswig-Holstein | SH Basketball |
| 16 | Thüringen | TH Basketball |

**Crawl-Beispiel:**
```bash
npm run crawl:clubs -- --verband=2   # Bayern
npm run crawl:clubs -- --verband=10  # NRW
```

---

## 🏆 Deutsche Meisterschaften (ID 29)

**Beschreibung:** Bundesweite Meisterschaftswettbewerbe  
**Kategorie:** `deutsche_meisterschaft`

**Crawl-Beispiel:**
```bash
npm run crawl:clubs -- --verband=29
```

---

## 🌍 Regionalligen (IDs 30-33)

Überregionale Ligen, die mehrere Bundesländer umfassen:

| ID | Label | Beschreibung |
|----|-------|--------------|
| 30 | Regionalliga (Region variiert) | Überregional |
| 31 | Regionalliga (Region variiert) | Überregional |
| 32 | Regionalliga (Region variiert) | Überregional |
| 33 | Regionalliga (Region variiert) | Überregional |

**Hinweis:** Die genaue regionale Zuordnung kann sich ändern.

**Crawl-Beispiel:**
```bash
npm run crawl:clubs -- --verband=30
npm run crawl:clubs -- --verband=31
npm run crawl:clubs -- --verband=32
npm run crawl:clubs -- --verband=33
```

---

## ♿ Rollstuhlbasketball (IDs 40+)

**Beschreibung:** Rollstuhlbasketball-Wettbewerbe  
**Kategorie:** `rollstuhl`  
**ID-Bereich:** 40-99 (exklusive 100+)

**Crawl-Beispiel:**
```bash
npm run crawl:clubs -- --verband=40  # Falls vorhanden
```

---

## 🏀 Bundesligen (IDs 100+)

**Beschreibung:** 1. und 2. Basketball-Bundesliga  
**Kategorie:** `bundesliga`  
**ID-Bereich:** 100 und höher

**Crawl-Beispiel:**
```bash
npm run crawl:clubs -- --verband=100
```

---

## 🔧 Technische Details

### Kategorisierung im Code

```typescript
function getVerbandKategorie(verbandId: number): VerbandOption['kategorie'] {
  if (verbandId >= 1 && verbandId <= 16) return 'landesverband';
  if (verbandId === 29) return 'deutsche_meisterschaft';
  if (verbandId >= 30 && verbandId <= 33) return 'regionalliga';
  if (verbandId >= 40 && verbandId < 100) return 'rollstuhl';
  if (verbandId >= 100) return 'bundesliga';
  return 'sonstige';
}
```

### Verbands-Daten aktualisieren

```bash
# Holt aktuelle Verbands-Liste von DBB API
npm run update:verbaende
```

**Generiert:** `src/shared/constants/verbaende.ts`

---

## 📝 Crawler-Logik

### Single-Verband Crawl

```bash
npm run crawl:clubs -- --verband=2
```

- Crawlt **nur** den angegebenen Verband
- Merged mit existierenden Daten
- Fügt Verband-ID zum `verbaende` Array hinzu

### Multi-Verband Support

```json
{
  "clubId": "619",
  "vereinsname": "FC Bayern München",
  "verbaende": [2, 29],  // Bayern + Deutsche Meisterschaft
  "teams": [...]
}
```

Ein Club kann in **mehreren Verbänden** spielen:
- Landesverband (z.B. Bayern)
- Deutsche Meisterschaft (U16/U19)
- Regionalliga
- Bundesliga

---

## 🎯 Verwendung im Onboarding

### Empfohlene Verbände für Mini-Basketball

```typescript
export const MINI_BASKETBALL_VERBAENDE = LANDESVERBAENDE; // IDs 1-16
```

**Grund:** Mini-Basketball findet primär auf Landesverband-Ebene statt.

### Standard-Auswahl

```typescript
export const DEFAULT_VERBAND_ID = null; // Nutzer muss bewusst auswählen
```

---

## 📊 Beispiel: Clubs in mehreren Verbänden

```json
{
  "clubId": "619",
  "vereinsname": "FC Bayern München Basketball",
  "verbaende": [2, 29, 100],
  "teams": [
    {
      "teamPermanentId": "12345",
      "teamAkj": "U16",
      "seasons": [
        {
          "seasonId": 2025,
          "ligen": [
            {
              "ligaId": "48014",
              "liganame": "U16 Bayernliga",
              "akName": "U16"
            },
            {
              "ligaId": "50000",
              "liganame": "Deutsche Meisterschaft U16",
              "akName": "U16"
            }
          ]
        }
      ]
    }
  ]
}
```

**Interpretation:**
- Club ist im **Bayerischen Basketball-Verband** (ID 2)
- Spielt auch bei **Deutscher Meisterschaft** (ID 29)
- Hat Team in **Bundesliga** (ID 100)

---

## 🔄 Wartung

### Wann aktualisieren?

1. **1x pro Saison** (September/Oktober)
2. Bei strukturellen Änderungen der Verbände (sehr selten)

### Update-Workflow

```bash
# 1. Verbands-Daten aktualisieren
npm run update:verbaende

# 2. Diff prüfen
git diff src/shared/constants/verbaende.ts

# 3. Bei neuen Verbänden: Crawler anpassen (falls nötig)
# 4. Committen
git commit -m "chore: Update Verbands-Daten für Saison 2025/26"
```

---

## 📚 Weiterführende Dokumentation

- **Crawler:** `docs/CRAWLER-EXPLAINED.md`
- **Update-Script:** `scripts/README-UPDATE-VERBAENDE.md`
- **API-Referenz:** `docs/API-SEQUENZ.md`

---

**Letzte Aktualisierung:** 2025-10-22  
**Generiert aus:** `scripts/update-verbaende.js` (v1.0.0)
