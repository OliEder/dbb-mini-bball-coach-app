# Test-Coverage-Plan - Fehlende Tests

**Datum:** 30.10.2025
**Status:** 🔴 RED Phase - Tests schreiben

---

## 🎯 Ziel

Fehlende Test-Coverage schließen BEVOR weitere Implementation.

**Reihenfolge:**
1. Store Tests
2. UI Component Tests
3. Utility Tests

---

## 📋 Fehlende Tests

### Phase 1: Store Tests (1-2h)
- [ ] onboarding-simple.store.ts Tests
  - [ ] State Management
  - [ ] Step Navigation
  - [ ] Verein Selection
  - [ ] Team Selection
  - [ ] Form Validation
  - [ ] Reset Functionality

### Phase 2: UI Component Tests (3-4h)
- [ ] Dashboard Tests
  - [ ] Rendering
  - [ ] Loading States
  - [ ] Error States
  - [ ] Team Stats Display
  - [ ] Navigation
  
- [ ] TeamOverview Tests (falls existiert)
  - [ ] Team List Rendering
  - [ ] Stats Display
  - [ ] Empty State
  
- [ ] TeamSwitcher Tests (falls existiert)
  - [ ] Team Dropdown
  - [ ] Active Team Selection
  - [ ] Team Switch Action

### Phase 3: Utility Tests (30min)
- [ ] debugTeamData Tests (falls existiert)
  - [ ] Data Export
  - [ ] Console Output
  - [ ] Error Handling

---

## 🔍 Aktueller Stand

### Was existiert bereits:
- ✅ TeamService v7.0 Implementation (behalten!)
- ✅ TeamService.v7.test.ts (19 Tests geschrieben)
- ❓ Store Tests - zu prüfen
- ❓ UI Tests - zu prüfen
- ❓ Utils Tests - zu prüfen

---

## 🚀 Vorgehensweise

1. **Prüfen** welche Dateien existieren
2. **Tests schreiben** (RED Phase)
3. **Später:** Implementation falls nötig (GREEN Phase)

---

**Status:** Bereit zum Start - Store Tests zuerst!
