# Split-Clubs Script - Dokumentation

## 🎯 Zweck

Splittet `clubs-germany.json` (30MB) in handliche Chunks für bessere Performance.

---

## 🚀 Usage

```bash
cd basketball-app

# Nach dem Crawl:
npm run crawl:clubs:bulk
npm run split:clubs
```

**Dauer:** ~1 Sekunde

---

## 📦 Output-Struktur

```
basketball-app/src/shared/data/
├── clubs-germany.json          # 30MB - Master (für Crawler)
├── clubs-metadata.json         # 150KB - Sitemap (für App)
└── chunks/
    ├── clubs-chunk-0.json      # 2.1MB - Clubs 0-99
    ├── clubs-chunk-1.json      # 2.3MB - Clubs 100-199
    ├── clubs-chunk-2.json      # 2.0MB - Clubs 200-299
    └── ...
```

---

## 📋 clubs-metadata.json (Sitemap)

**Lightweight Liste aller Clubs mit Pointer auf Detail-Files:**

```json
{
  "metadata": {
    "generatedAt": "2025-10-22T18:00:00.000Z",
    "totalClubs": 1250,
    "totalChunks": 13,
    "chunkSize": 100,
    "verbaende": [1, 2, 3, ..., 100]
  },
  "clubs": [
    {
      "clubId": "619",
      "vereinsname": "FC Bayern München Basketball",
      "vereinsnummer": "0212033",
      "verbaende": [2, 29, 100],
      "teamCount": 15,
      "detailFile": "chunks/clubs-chunk-6.json"  // ← Pointer!
    }
  ],
  "index": {
    "clubs-chunk-0.json": {
      "clubIds": ["1", "45", "67", ...],
      "clubCount": 100,
      "verbaende": [1, 2, 3]
    }
  }
}
```

**Größe:** ~150KB (statt 30MB!)

---

## 📦 clubs-chunk-X.json (Details)

**Volle Club-Daten für 100 Clubs:**

```json
{
  "metadata": {
    "chunkId": 6,
    "clubCount": 100,
    "generatedAt": "2025-10-22T18:00:00.000Z"
  },
  "clubs": [
    {
      "clubId": "619",
      "vereinsname": "FC Bayern München Basketball",
      "verbaende": [2, 29, 100],
      "teams": [...]  // Volle Team-Daten
    }
  ]
}
```

**Größe:** ~2-3MB pro Chunk

---

## 🔍 App-Workflow (Lazy Loading)

### 1. Initial Load - Nur Metadata

```typescript
// App-Start: Lade nur Sitemap
const metadata = await fetch('clubs-metadata.json').then(r => r.json());
// → 150KB, <100ms
```

### 2. User sucht Club

```typescript
// User sucht "Bayern"
const results = metadata.clubs.filter(c => 
  c.vereinsname.includes('Bayern')
);

// Zeige Dropdown mit Results
// → Schnell, da nur Metadata
```

### 3. User wählt Club → Lade Details

```typescript
const selectedClub = results[0];
// → detailFile: "chunks/clubs-chunk-6.json"

// Lade Detail-Chunk on-demand
const chunk = await fetch(selectedClub.detailFile).then(r => r.json());
const fullClub = chunk.clubs.find(c => c.clubId === selectedClub.clubId);

// → 2MB, ~200ms
// → Cache in IndexedDB
```

---

## 📊 Performance-Vergleich

| Strategie | Initial Load | Club Load | Total |
|-----------|--------------|-----------|-------|
| **Monolith** | 30MB, 3-5s | Instant | 5s |
| **Split** | 150KB, <100ms | 2MB, ~200ms | 300ms |

**Speedup:** 15x schneller! 🚀

---

## 🎯 Split-Strategie

### Warum Range-basiert?

**Range-Split** (100 Clubs pro Chunk, sortiert nach clubId):
```
✅ Keine Duplikate
✅ Predictable File-Size
✅ Einfacher Lookup (Math.floor(index / 100))
```

**Verband-Split** (wäre schlechter):
```
❌ Duplikate (Multi-Verband Clubs)
❌ Ungleiche File-Sizes
❌ Komplexerer Lookup
```

---

## 🔧 Konfiguration

**CHUNK_SIZE ändern:**

```javascript
// In scripts/split-clubs.js
const CHUNK_SIZE = 50;  // Kleinere Chunks (mehr Files)
// oder
const CHUNK_SIZE = 200; // Größere Chunks (weniger Files)
```

**Empfehlung:** 100 Clubs = ~2-3MB pro Chunk

---

## 🔄 Workflow

### Production

```bash
# 1. Bulk Crawl (monatlich via GitHub Actions)
npm run crawl:clubs:bulk

# 2. Split (automatisch nach Crawl)
npm run split:clubs

# 3. Commit (nur Master + Metadata, optional Chunks)
git add src/shared/data/clubs-germany.json
git add src/shared/data/clubs-metadata.json
git add src/shared/data/chunks/*.json  # Optional
git commit -m "chore: Update Club-Daten (2025-10)"
```

### Development

```bash
# Quick Test
npm run crawl:clubs -- --verband=5 --skip-kontakt
npm run split:clubs
```

---

## 📁 Git Strategy

**Option A: Commit Chunks** (empfohlen für kleine Repos)
```bash
git add src/shared/data/clubs-metadata.json
git add src/shared/data/chunks/*.json
```

**Option B: .gitignore Chunks** (für große Repos)
```gitignore
# In .gitignore
src/shared/data/chunks/
```

Dann im Build-Step:
```bash
npm run crawl:clubs:bulk
npm run split:clubs
```

---

## ✅ Validation

Das Script validiert automatisch:

✅ Alle Clubs aus Master in Chunks vorhanden  
✅ Keine Duplikate in Chunks  
✅ Metadata konsistent mit Chunks  

Bei Fehler: Script bricht ab mit Error

---

## 🧪 Example Output

```bash
npm run split:clubs

╔════════════════════════════════════════════╗
║  BBB Club Data Splitter v1.0               ║
╚════════════════════════════════════════════╝

[18:30:15] 📥 Lade Master-Datei...
[18:30:15]    ✅ 1250 Clubs geladen
[18:30:15]    📊 3500 Teams
[18:30:15]    📊 21 Verbände

[18:30:15] 🗑️  Lösche 13 alte Chunks...

[18:30:15] 📦 Erstelle Chunks...
[18:30:15]    100 Clubs pro Chunk
[18:30:15]    ✅ 13 Chunks erstellt

[18:30:15] 📋 Erstelle Metadata...
[18:30:15]    ✅ Metadata erstellt
[18:30:15]    📊 1250 Clubs
[18:30:15]    📊 13 Chunks

[18:30:15] 💾 Speichere Chunks...
[18:30:15]    ✅ Chunk 4: 2.1 KB (100 Clubs)
[18:30:15]    ✅ Chunk 9: 2.3 KB (100 Clubs)
[18:30:15]    ✅ Chunk 12: 1.8 KB (50 Clubs)

[18:30:15]    📊 Durchschnitt: 2.1 KB pro Chunk
[18:30:15]    📊 Gesamt: 27.4 MB

[18:30:16] 💾 Speichere Metadata...
[18:30:16]    ✅ 152.3 KB

[18:30:16] ✅ Validierung...
[18:30:16]    ✅ Alle Clubs vorhanden
[18:30:16]    ✅ Keine Duplikate
[18:30:16]    ✅ Metadata konsistent

══════════════════════════════════════════════════
✅ SPLIT ERFOLGREICH!
══════════════════════════════════════════════════
⏱️  Dauer: 1.23 Sekunden
📦 Chunks: 13 × ~2.1 KB
📋 Metadata: 152.3 KB
💾 Gesamt: 27.6 MB
══════════════════════════════════════════════════
```

---

## 🔄 Re-Split

**Wann erneut splitten?**

- Nach jedem Crawl (Daten haben sich geändert)
- Wenn CHUNK_SIZE geändert wurde
- Bei Problemen mit Chunks

**Cleanup:**

Alte Chunks werden automatisch gelöscht!

---

## 🚀 Nächste Schritte

1. ✅ Split-Script läuft
2. ⏭️ App anpassen für Lazy Loading
3. ⏭️ IndexedDB Cache implementieren
4. ⏭️ GitHub Actions integrieren

---

**Version:** v1.0.0  
**Datum:** 2025-10-22  
**Status:** ✅ Production Ready
