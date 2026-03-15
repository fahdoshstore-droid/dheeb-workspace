# 🐺 DHEEB DIRECTOR SYSTEM v2

## Architecture

```
┌─────────────────────────────────────────┐
│           🐺 ذيب DIRECTOR               │
│         (Port 8000 - Gateway)          │
│    التوزيع + المقارنة + القرار النهائي    │
└─────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Primary │   │ Shadow A│   │ Shadow B│
│  Team   │   │(Backup) │   │(Verify) │
│(Kimi/DS)│   │(DeepSeek)│   │(MiniMax)│
└────┬────┘   └────┬────┘   └────┬────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
            ┌────────────┐
            │  Consensus │
            │   Engine   │
            └────────────┘
```

---

## Teams

### Primary Team (Decision Maker)
- Kimi Agent - Fast Arabic analysis
- DeepSeek Agent - Deep research

### Shadow A (Backup)
- Alternative perspective
- Validates Primary decisions

### Shadow B (Verify)
- Final verification
- Risk check

### Consensus Engine
- Compares all teams
- Final decision
- Confidence score

---

## Flow

1. **Input** → Gateway (Port 8000)
2. **Primary** → Quick analysis
3. **Shadow A** → Alternative view
4. **Shadow B** → Risk verification
5. **Consensus** → Final decision + confidence

---

## Implementation

### Gateway (8000)
- Route all requests
- Aggregate responses

### Agents
| Port | Agent | Role |
|------|-------|------|
| 8001 | Primary | Quick analysis |
| 8002 | Shadow A | Alternative |
| 8003 | Shadow B | Verify |
| 8004 | Consensus | Final |

---

## Consensus Rules

| Scenario | Decision |
|----------|----------|
| 3/3 agree | ✅ High confidence |
| 2/3 agree | ⚠️ Medium confidence |
| 1/3 agree | ❌ Low confidence - Review |

---

## Memory Integration

- PostgreSQL + pgvector (Active)
- All decisions logged
- Searchable history

---

*Updated: 2026-02-23*
