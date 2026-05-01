# 🔥 CRITICAL FIX: Import-Pfad nach Service Cleanup

**Datum:** 03. November 2025  
**Status:** ✅ GEFIXT

---

## 🚨 Problem

**Fehler:**
```
Failed to resolve import "@/domains/bbb-api/services/BBBSyncService"
```

**Ursache:**
Service Cleanup verschob BBBSyncService:
- ❌ ALT: `@/domains/bbb-api/services/`
- ✅ NEU: `@/shared/services/`

---

## ✅ Fixes

### 1. onboarding-simple.store.ts (Zeile 143)
```typescript
// ✅ GEFIXT: bbb-api → shared/services
const { bbbSyncService } = await import('@/shared/services/BBBSyncService');
```

### 2. Dashboard.tsx (Zeile 22)
```typescript
// ✅ GEFIXT: bbb-api → shared/services
import { bbbSyncService } from '@/shared/services/BBBSyncService';
```

### 3. Dashboard.tsx (Zeile 33)
```typescript
// ✅ GEFIXT: spiel → spielplan
import { spielService } from '@/domains/spielplan/services/SpielService';
```

---

## 🔍 Verifiziert

✅ Keine weiteren veralteten Imports gefunden

---

**Gefixt:** 03.11.2025
