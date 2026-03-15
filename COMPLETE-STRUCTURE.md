# Complete System Structure

## Trading System

```
/home/ubuntu/dheeb-trading-system/
├── src/
│   ├── server.js
│   ├── orchestrator.js
│   ├── dheeb-unified.js
│   └── agents/
│       ├── executionAgent.js    ← CORE RULES
│       ├── dheebStrategy.js   ← TRIL Engine
│       ├── ictAgent.js       ← ICT Analysis
│       ├── smcAgent.js       ← SMC Analysis
│       ├── trilAgent.js       ← Output Format
│       └── twitterAgent.js    ← Twitter
│
├── modules/
│   ├── autoAnalyzer.js
│   ├── tradeLogger.js
│   ├── dheeb-tril.js
│   ├── risk-engine.js
│   ├── psychology.js
│   └── ai-vision/
│
└── data/
    ├── trades.db
    └── trading-log.json
```

## Core Rules (executionAgent.js)

```javascript
MIN_RRR: 2.0
MAX_RISK: $300
MAX_TRADES: 2
MAX_DAILY_LOSS: $1,000
KILL_ZONES: ['LONDON', 'NY']
```

## Documentation Files

```
/home/ubuntu/.openclaw/workspace/
├── SOUL.md                 ← Persona
├── IDENTITY.md             ← Rules
├── MEMORY.md               ← Memory
├── USER.md                 ← User Info
├── TOOLS.md                ← Tools
├── ICT-CONCEPTS-FULL.md   ← Full ICT Guide
├── SESSION-MACROS.md       ← Session Times
├── ORDERFLOW-KOROUSH.md    ← Order Flow
├── ICT-UPDATED-CONCEPTS.md ← Updated ICT
├── ICT-TIMEFRAMES-TRIL.md ← Timeframes
├── DHEEB-STRUCTURE.md     ← System Structure
├── ALPHA-ZERO-RISK.md      ← Risk Rules
├── DHEEB-TRIL-CLEAN.pine   ← TradingView Indicator
└── TOMORROW-PLAN.md        ← Tomorrow's Plan
```

## Workflow

```
1. Send Chart
2. Give Numbers (Entry, SL, TP)
3. Calculate RRR
4. Verify Rules
5. Output ALLOWED/NOT ALLOWED
```

## Rules

- RRR ≥ 2:1
- Kill Zone: London/NY
- Max 2 trades
- Max $300 risk
- Psychology check
