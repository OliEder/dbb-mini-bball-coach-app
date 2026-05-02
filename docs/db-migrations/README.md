# Database Migrations

Dieser Ordner enthält alle Dokumentationen zu Datenbank-Migrationen.

## 📁 Struktur

```
db-migrations/
├── README.md                      # Diese Datei
├── DB-V10-MIGRATION-PLAN.md       # Master-Plan für v10
├── migration-templates/           # Templates für neue Migrationen
└── completed/                     # Abgeschlossene Migrationen
```

## 📋 Aktuelle Migrationen

| Version | Status | Dokument | Datum |
|---------|--------|----------|-------|
| v10 | 🟡 PLANUNG | [DB-V10-MIGRATION-PLAN.md](./DB-V10-MIGRATION-PLAN.md) | 2025-11-04 |
| v9 | ✅ ABGESCHLOSSEN | - | 2025-11-04 |
| v8 | ✅ ABGESCHLOSSEN | - | 2025-11-04 |
| v7 | ✅ ABGESCHLOSSEN | - | 2025-11-03 |

## 🚀 Neue Migration starten

1. **Kopiere Template:**
   ```bash
   cp migration-templates/MIGRATION-TEMPLATE.md DB-V{VERSION}-MIGRATION-PLAN.md
   ```

2. **Fülle alle Sections aus:**
   - Executive Summary
   - ERD (Mermaid)
   - Field Mapping
   - Impact-Analyse
   - Migrations-Plan

3. **Update diese README:**
   - Füge Zeile in "Aktuelle Migrationen" hinzu

4. **Feature-Branch erstellen:**
   ```bash
   git checkout -b feature/db-v{VERSION}-migration
   ```

## 📖 Best Practices

### DO ✅
- **Immer ERD zeichnen** (Mermaid)
- **Komplettes Field-Mapping** dokumentieren
- **Migration-Logic** mit Code-Beispielen
- **Rollback-Plan** definieren
- **Tests schreiben** BEVOR Migration
- **Backup erstellen** vor Migration

### DON'T ❌
- **Keine Breaking Changes** ohne Migration-Logic
- **Keine undokumentierten** Field-Änderungen
- **Keine Migrationen** ohne Tests
- **Kein Production Deployment** ohne Backup

## 🔍 Migration-Checkliste

Vor jeder Migration:
- [ ] Backup erstellt
- [ ] ERD dokumentiert
- [ ] Field-Mapping vollständig
- [ ] Migration-Logic geschrieben
- [ ] Unit Tests geschrieben
- [ ] Integration Tests geschrieben
- [ ] E2E Tests geschrieben
- [ ] Rollback-Plan definiert
- [ ] Code-Review durchgeführt

## 💬 Für neue Chats

**Quick-Start Prompt:**
```
Ich arbeite an der Datenbank-Migration.
Bitte lies: /docs/db-migrations/DB-V{VERSION}-MIGRATION-PLAN.md

Aktueller Status: [Status aus Dokument]
Nächster Schritt: [Was zu tun ist]
```

## 📚 Referenzen

- [Dexie Versioning Guide](https://dexie.org/docs/Tutorial/Design#database-versioning)
- [Dexie Upgrade](https://dexie.org/docs/Dexie/Dexie.version())
- [Schema Definition](https://dexie.org/docs/Version/Version.stores())

---

**Letzte Aktualisierung:** 2025-11-04
