# 🏗️ DHEEB SYSTEM ARCHITECTURE

## Full Hierarchy

```
🐺 DHEEB DIRECTOR
│
├── 🧠 MEMORY LAYER
│   ├── PostgreSQL + pgvector
│   │   ├── Database: dheeb
│   │   └── Table: memories (20 records)
│   └── File-based: ~/dheeb-final/
│
├── 🤖 AGENTS LAYER
│   ├── Port 8080: Trading Agent
│   ├── Port 8081: Risk Control
│   ├── Port 8082: News Agent
│   ├── Port 8083: System Agent
│   ├── Port 8084: Notifier
│   └── Port 8085: ICT Enforcer
│
├── ⚙️ SERVICES LAYER
│   ├── auto-market-monitor.js
│   ├── second-brain.js
│   ├── setup-analyzer.js
│   ├── setup-alert.js
│   ├── consensus-agent.js
│   ├── dheeb-memory.js
│   └── scraper.py
│
├── 📊 MONITORING LAYER
│   ├── Second Brain (system monitoring)
│   ├── Foundation Monitor (price API)
│   ├── Auto Market Monitor (kill zones)
│   └── Cron Jobs (alerts)
│
├── 🗳️ DECISION LAYER
│   ├── Primary Agent
│   ├── Shadow A (backup)
│   ├── Shadow B (verify)
│   └── Consensus Engine
│
├── 💾 STORAGE LAYER
│   ├── PostgreSQL (memories)
│   ├── File System (~/dheeb-final/)
│   └── GitHub (backup)
│
└── 🔌 INTEGRATIONS
    ├── Telegram Bot
    ├── WhatsApp
    ├── TradingView API
    └── Binance API
```

---

## System Flow

```
USER REQUEST
    ↓
[Gateway 8000]
    ↓
┌─────────────────────────────────────┐
│         DIRECTOR LAYER              │
│  ┌─────────┐  ┌─────────┐           │
│  │ Primary │→│ Shadow A│→ Consensus│
│  │ (Fast)  │  │(Backup) │ (2/3)    │
│  └─────────┘  └─────────┘           │
└─────────────────────────────────────┘
    ↓
[Memory Check] → PostgreSQL + pgvector
    ↓
[Decision] → Alert / Action / Trade
    ↓
[Notification] → Telegram / WhatsApp
```

---

## Data Flow

```
1. User sends chart/image
2. Setup Analyzer extracts data
3. Confidence/RRR calculated
4. If ≥70% & RRR≥2.5 → Alert
5. User decides
6. Trade executed (if any)
7. Result logged to Memory
```

---

## Key Files

| File | Purpose |
|------|---------|
| MEMORY.md | Main memory |
| OFFICIAL-DECISION.md | Trading rules |
| PRIORITY-ROADMAP.md | Next tasks |
| DHEEB-KPI-SYSTEM.md | KPIs |
| MEMORY-SYSTEM.md | DB setup |
| DIRECTOR-SYSTEM-V2.md | Architecture |

---

## Agents & Ports

| Port | Agent | Function |
|------|-------|----------|
| 8000 | Gateway | Main router |
| 8080 | Trading | Execute trades |
| 8081 | Risk | Risk management |
| 8082 | News | Market news |
| 8083 | System | System ops |
| 8084 | Notifier | Send alerts |
| 8085 | ICT Enforcer | Trade rules |

---

## Memory Categories

1. **Trading Rules** - Max risk, RRR, etc.
2. **Setup Concepts** - FVG, OB, Liquidity
3. **Quality Gates** - Entry requirements
4. **System Status** - Current state
5. **Decisions** - Past decisions

---

## Technologies

| Category | Tech |
|----------|------|
| Database | PostgreSQL + pgvector |
| Runtime | Node.js + Python |
| AI | MiniMax + DeepSeek |
| Messaging | Telegram + WhatsApp |
| Trading | Tradovate |
| Backup | GitHub |

---

*Updated: 2026-02-23*
