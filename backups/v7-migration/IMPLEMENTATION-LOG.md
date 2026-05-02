# DBv7.0 Implementation Log

**Start:** 2025-10-30 11:20  
**Status:** 🚧 Phase 1 - TDD Preparation

---

## ✅ Phase 1: Vorbereitung & Backup

### 1.1 Backups erstellt
- ✅ types-v6-backup-20251030_112005.ts
- ✅ database-v6-backup-20251030_112005.ts

### 1.2 Aktueller Stand (v6.0)
**Types:**
- Team Interface hat: `extern_team_id`, `altersklasse`, `saison`, `liga_id`
- ❌ Keine `TeamLigaParticipation` Interface

**Database:**
- DB_VERSION = 6
- ❌ Keine `team_liga_participations` Tabelle
- Team Schema: `[verein_id+name+saison]`, `[user_id+team_typ]`

**Services:**
- BBBSyncService nutzt noch altes Team-Modell

---

## 🎯 Phase 2: Schema-Migration (NEXT)

### 2.1 Types anpassen
- [ ] Team Interface: `extern_team_id` → `extern_permanent_id`
- [ ] Team Interface: REMOVE `altersklasse`, `saison`, `liga_id`
- [ ] NEU: `TeamLigaParticipation` Interface hinzufügen

### 2.2 Database v7.0
- [ ] DB_VERSION = 7
- [ ] Neue Tabelle: `team_liga_participations`
- [ ] Team Indizes anpassen
- [ ] Migration-Logic schreiben

### 2.3 Tests (RED)
- [ ] Test für Team ohne `altersklasse` 
- [ ] Test für `TeamLigaParticipation` CRUD
- [ ] Test für BBBSyncService mit neuer Struktur

---

## 📋 Offene Tasks

- [ ] Tests schreiben (RED)
- [ ] Types implementieren
- [ ] Database v7.0 implementieren
- [ ] Tests laufen lassen → erwarte GRÜN
- [ ] BBBSyncService refactoren
- [ ] Consumer anpassen
- [ ] Full E2E Tests

---

## 📚 Referenz-Dokumentation

Vollständige Dokumentation in:
- `/docs/DBv7/DB-V7-MIGRATION.md`
- `/docs/DBv7/QUICK-START-V7.md`
- `/docs/DBv7/TEST-PLAN-V7.md`

---

**Letzte Aktualisierung:** 2025-10-30 11:20
