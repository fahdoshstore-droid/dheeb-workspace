# 🐺 Dheeb Multi-Agent System - Documentation

## Last Updated: Feb 18, 2026

---

## Overview

Dheeb Trading System is now running as a **Multi-Agent Architecture** with 5 specialized agents working together.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN GATEWAY                         │
│                  (OpenClaw - أنا)                        │
└───────────────────────┬─────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │Trading  │  │  Risk   │  │  News   │
   │ Agent   │  │  Agent  │  │  Agent  │
   │  8080   │  │  8081   │  │  8082   │
   └─────────┘  └─────────┘  └─────────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              ┌─────────────┐
              │  Notifier  │
              │   8084     │
              └─────────────┘
                      │
                      ▼
               📱 WhatsApp
```

---

## Agents

### 1. 🤖 Trading Agent (Port 8080)
**Function:** ICT/SMC Analysis

**Concepts:**
- Order Blocks (OB)
- Fair Value Gaps (FVG)
- Liquidity Sweeps (BSL/SSL)
- Kill Zones (London, NY)
- Market Structure Shifts (MSS)
- Premium/Discount Zones

**Response:**
- HTF Bias
- Zone Analysis
- Recommendation
- Levels

### 2. 💼 Risk Agent (Port 8081)
**Function:** Risk & Money Management

**Pro Traders Rules:**
- **Raschke:** 1% max risk, 45min news blackout
- **Carter:** 2% = reduce, 4% = minimal, 8% = stop
- **Hougaard:** Psychology, no revenge trading
- **Wieland:** 4 trades/day, 2 losses = stop

### 3. 📰 News Agent (Port 8082)
**Function:** Economic Calendar

**Features:**
- High impact news detection
- News blackout alerts
- Trading hours awareness

### 4. ⚙️ System Agent (Port 8083)
**Function:** Monitoring

**Monitors:**
- Agent health
- System resources
- Process status

### 5. 📱 Notifier Agent (Port 8084)
**Function:** WhatsApp Notifications

**Features:**
- Auto-sends alerts for HIGH probability setups
- Probability calculation:
  - HIGH (40+): Discount + confluence OR Kill Zone
  - MEDIUM (30+): Mid + confluence
  - LOW: Premium zone

---

## Probability Calculation

| Factor | Points |
|--------|--------|
| Discount Zone | +30 |
| Mid Zone | +10 |
| Premium Zone | -20 |
| 3+ Confluences | +40 |
| 2 Confluences | +20 |
| Kill Zone Active | +20 |
| FVG Present | +10 |

**Thresholds:**
- HIGH: 40+ points
- MEDIUM: 30+ points
- LOW: < 30 points

---

## Commands

```bash
cd /home/ubuntu/.openclaw/workspace/dheeb-trading-system/src/agents

# Start all agents
./start-agents.sh start

# Stop all agents
./start-agents.sh stop

# Check status
./start-agents.sh status

# View logs
./start-agents.sh logs

# Restart
./start-agents.sh restart
```

---

## Webhook

**URL:**
```
https://unnotational-gus-unsenescent.ngrok-free.dev/webhook
```

**For TradingView:**
- Create Alert
- Webhook URL: above
- Any alert format works

---

## Files

| File | Description |
|------|-------------|
| `trading-agent.js` | ICT/SMC analysis |
| `risk-agent.js` | Pro traders rules |
| `news-agent.js` | Economic calendar |
| `system-agent.js` | Monitoring |
| `notifier-agent.js` | WhatsApp alerts |
| `start-agents.sh` | CLI management |

---

## ICT Concepts

### Order Blocks (OB)
- Bullish OB: Last green candle before down move
- Bearish OB: Last red candle before up move

### Fair Value Gaps (FVG)
- Areas of imbalance where price has gapped
- Often fill before continuation

### Liquidity
- BSL (Buy Side Liquidity): Equal highs, swing highs
- SSL (Sell Side Liquidity): Equal lows, swing lows

### Kill Zones
- London: 7-11 AM UTC
- NY Morning: 1-5 PM UTC
- NY Lunch: 5-9 PM UTC

### Zones
- **Premium:** Upper range (price expensive)
- **Discount:** Lower range (price cheap)

---

## Risk Rules

| Rule | Value |
|------|-------|
| Max Risk/Trade | 1% |
| Daily Loss Limit | 2% |
| Weekly Loss Limit | 4% |
| Max Trades/Day | 4 |
| Max Consecutive Losses | 2 |
| Min R:R | 1:1.5 |
| Friday Cutoff | 2 PM EST |

---

## Checklist

### Pre-Trade
- [ ] HTF Bias determined
- [ ] 3+ Confluences present
- [ ] Risk calculated
- [ ] SL & TP defined
- [ ] R:R ≥ 1:1.5
- [ ] Psychology clear

### During Trade
- [ ] Entry from zone
- [ ] Breakeven at 1:1
- [ ] Partial at 1:2
- [ ] Trail with structure

### Post-Trade
- [ ] Journal
- [ ] Review
- [ ] Reset psychology

---

**Execute with precision or stand down.**
