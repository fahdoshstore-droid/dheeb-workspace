# 🧠 DHEEB MEMORY SYSTEM - PostgreSQL + pgvector

## Status: ✅ IMPLEMENTED

### Components:
- PostgreSQL + pgvector (Docker)
- Database: `dheeb`
- Table: `memories`

---

## Commands

### Save Memory
```bash
docker exec pgvector psql -U postgres -d dheeb -c "INSERT INTO memories (label, content) VALUES ('label', 'content');"
```

### Search Memory
```bash
docker exec pgvector psql -U postgres -d dheeb -c "SELECT * FROM memories WHERE content ILIKE '%query%';"
```

### List All
```bash
docker exec pgvector psql -U postgres -d dheeb -c "SELECT * FROM memories ORDER BY created_at DESC;"
```

---

## Current Memories

| ID | Label | Content |
|----|-------|---------|
| 1 | trading_rules | Max risk 1%, max 2 trades per day, RRR >= 2.5 |
| 2 | priority_roadmap | 1. Risk Enforcement, 2. Price API, 3. Alerts, 4. Analysis, 5. Dashboard |
| 3 | system_status | 6 Agents on ports 8080-8085 |
| 4 | goals | Monthly +2500, Quarterly +10000, Yearly +50000 |

---

## Next Steps

1. Add more memories
2. Create search tool for agent
3. Auto-flush on heartbeat
4. Add vector embeddings for semantic search

---

*Updated: 2026-02-23*
