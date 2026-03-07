---
name: signal-bot
description: Send trading signals and alerts to Discord. Use when: (1) Trade signal detected, (2) Daily status update, (3) Kill zone alert, (4) Setup detected. Requires: Discord bot token and channel ID configured.
---

# Signal Bot - Discord Notifications

## Overview
Automated Discord notifications for trading signals, alerts, and status updates.

## Files
- `dheeb-trading-system/signal-bot.js` - Main bot

## Commands

| Command | الوصف |
|---------|-------|
| `node signal-bot.js signal` | Send trade signal |
| `node signal-bot.js alert` | Send alert |
| `node signal-bot.js status` | Send daily status |
| `node signal-bot.js killzone` | Send kill zone alert |
| `node signal-bot.js test` | Test connection |

## Integration with Trading System

### Auto-send on Trade
```javascript
const { sendSignal } = require('./signal-bot');

if (decision === 'EXECUTE') {
  await sendSignal({
    direction: 'BUY',
    instrument: 'MNQ',
    entry: risk.entry,
    sl: risk.sl,
    tp: risk.tp,
    rrr: risk.rrr,
    risk: risk.riskAmount,
    contracts: risk.contracts,
    setup: 'A+++'
  });
}
```

### Auto-send on Kill Zone
```javascript
const { sendKillZoneAlert } = require('./signal-bot');

if (isKillZone()) {
  await sendKillZoneAlert({ name: 'NY AM', start: '09:50', end: '10:10' });
}
```

## Embed Types

| Type | Color | Use |
|------|-------|-----|
| BUY Signal | Green | Bullish setups |
| SELL Signal | Red | Bearish setups |
| Warning | Yellow | Caution alerts |
| Error | Red | Error alerts |
| Info | Blue | General info |
| Success | Green | Success messages |

## Status Fields
- Date
- Trades (X/2)
- P/L
- Win Rate
- Open Positions
- Buffer Status

---

*Last Updated: March 7, 2026*
