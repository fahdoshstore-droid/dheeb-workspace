# DHEEB SYSTEM - UNIFIED ARCHITECTURE

## Active Systems (Working Now)

### 1. dheeb-trading-system (MAIN)
- **Path:** `/home/ubuntu/dheeb-trading-system/`
- **PM2:** dheeb-trading (port varies)
- **Status:** ✅ ONLINE
- **Components:**
  - server.js (main)
  - webhook-server.js
  - orchestrator.js
  - smc-engine.js
  - agents/ (trading, risk, news, system)
  - modules/ (checklist, journal, psychology)
  - data/ (portfolio.json, state.json, trades.db)

### 2. dheeb-parts-system (API)
- **Path:** `/home/ubuntu/dheeb-parts-system/`
- **PM2:** dheeb-api (port 3000)
- **Status:** ✅ ONLINE
- **Components:**
  - Parts management
  - QITAA board integration

---

## Inactive/Archived

### dheeb-system (TRIL Project)
- **Path:** `/home/ubuntu/dheeb-system/`
- **Status:** ⚠️ NOT RUNNING
- **Contains:** AI Vision, Level 1 Evaluator, Pipeline v2
- **Action:** INTEGRATE into dheeb-trading-system

### dheeb-mvp
- **Status:** OLD - to be archived

### Backups
- dheeb-backup-2026-02-20/
- dheeb-system-backup-20260226.tar.gz

---

## Consolidation Plan

### Phase 1: Document (DONE)
- [x] Map active systems
- [x] Identify PM2 processes

### Phase 2: Backup (NEXT)
- [ ] Create fresh backup
- [ ] Archive old folders

### Phase 3: Integrate
- [ ] Move AI Vision to dheeb-trading-system
- [ ] Move Level 1 Evaluator to dheeb-trading-system
- [ ] Connect Pipeline v2

### Phase 4: Cleanup
- [ ] Remove duplicate files
- [ ] Delete old folders
- [ ] Update MEMORY.md

---

## Current Working State (March 1, 2026)

| System | PM2 | Port | Status |
|--------|-----|------|--------|
| dheeb-trading | dheeb-trading | 3002 | ✅ ONLINE |
| dheeb-api | dheeb-api | 3000 | ✅ ONLINE |

### Fixes Applied (March 1, 2026)
- [x] Fixed database schema (added tp1, tp2, rr, kill_zone columns)
- [x] Fixed empty portfolio.json
- [x] Fixed executionAgent.js export (ExecutionAgent → HardEnforcer conflict)
- [x] System now stable (22+ seconds uptime)
- [x] Integrated AI Vision module (formatTRIL, recordResult, getStats)
- [x] Added Level 1 Evaluator endpoint (session-based, 10 questions)

### New API Endpoints Added
- `POST /api/ai-vision/format` - Format TRIL from data
- `POST /api/ai-vision/record` - Record hit/miss
- `GET /api/ai-vision/stats` - Get probability stats
- `POST /api/level1/evaluate` - Level 1 decision evaluation (session-based)

## Files to Integrate
1. `/home/ubuntu/dheeb-system/ai-vision.js` → `/home/ubuntu/dheeb-trading-system/modules/`
2. `/home/ubuntu/dheeb-system/level1-evaluator.js` → `/home/ubuntu/dheeb-trading-system/modules/`
3. `/home/ubuntu/dheeb-system/pipeline-v2.js` → `/home/ubuntu/dheeb-trading-system/`

---

*Created: 2026-03-01 09:35 UTC*
