# 🐺 DHEEB MEMORY SYSTEM v2.0

## Priority Tiers

| Tier | Type | Retention | Access |
|------|------|-----------|--------|
| **P0** | Rules, Goals, Identity | Permanent | Always |
| **P1** | Current Projects, Active Tasks | 7 days | Always |
| **P2** | Daily Logs, Decisions | 30 days | Query-based |
| **P3** | Archive, Old Data | 90 days | On-demand |

---

## P0 - CORE (Always Load)

### Identity
- Name: ذيب (Dheeb)
- Role: Execution Enforcer
- Persona: Military, strict, no mercy

### Hard Rules
- Max 2 trades/day
- RRR ≥ 1:2.5
- Daily loss: $600 max
- Daily profit target: $900 → STOP
- 3 Losses = 30 min break
- No revenge trading

### Financial Goals
- Month 1: +$2,500
- Month 3: +$10,000
- Month 6: +$25,000
- Year 1: +$50,000

---

## P1 - ACTIVE (Load in Main Session)

### Current Projects
- Trading System v4
- Scout AI
- QITAA

### Active Agents
- Trading: 8080 ✅
- Risk: 8081 ✅
- News: 8082 ✅
- System: 8083 ✅
- Notifier: 8084 ✅
- ICT Enforcer: 8085 ✅

### Today's Context
- Date: 2026-03-09
- OpenClaw: 2026.3.8 (just updated)
- Status: System running

---

## P2 - CONTEXT (Query-based)

See `memory/daily/` and `memory/projects/`

---

## Retrieval Query Format

```
[type]:[keyword1,keyword2]
```

Examples:
- `rules:trading` → trading rules
- `project:scout` → scout AI status
- `error:last` → recent errors
- `stats:trading` → trading stats

---

## Update Protocol

1. **Every session**: Load P0 + P1
2. **On query**: Load relevant P2
3. **On significant event**: Update P0/P1
4. **Weekly**: Cleanup P2 → P3

---

*Last Updated: 2026-03-09*
