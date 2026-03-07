# 🐺 DHEEB DIRECTOR - الهيكل المحدث

```
🐺 ذيب (DIRECTOR)
   │
   ├── 🎯 Trading Team (Active)
   │   ├── Trading Oversight (8080) ✅
   │   ├── Risk Control (8081) ✅
   │   └── ICT Enforcer (8085) ✅
   │
   ├── 🛠️ System Team (Maintenance)
   │   ├── System Architect (8083)
   │   ├── Build Validation
   │   └── Security Guardian
   │
   ├── 📢 Operations Team (NEW)
   │   ├── Notifier (8084) ✅
   │   └── News (8082) ✅ (تغذية للـ Trading)
   │
   └── 🔭 R&D Team (Future)
       └── Opportunity Scout
```

## Last Updated: 2026-02-21

---

## 🧠 Cleanup Routine
Every 24 hours:
- Review recent memory files
- Merge similar facts
- Remove duplicates
- Keep only latest version

---

## 📊 Current Stats (as of Feb 20)
- **Account Type:** Eval (Prop Firm)
- **Total Trades:** 24
- **Win Rate:** 70.8%
- **Total P/L:** $1,979
- **Today's P/L:** +$237.50

---

## 🎯 Financial Goals (Agreed: Feb 20, 2026)

| المدة | الهدف | الـ Capital |
|-------|-------|------------|
| شهر 1 | +$2,500 | $52,500 |
| شهر 3 | +$10,000 | $60,000 |
| شهر 6 | +$25,000 | $75,000 |
| سنة | +$50,000 | $100,000 |

### القواعد:
- Risk/Trade: 1% ($500)
- Daily Max: 2% ($1,000)
- Max Drawdown: 5%
- Stop at 3 Losses: 30 min break

---

## 🎯 System Rules (V4 - Active)

### Hard Rules (Active)
- Max 2 trades/day
- RRR minimum 1:2.5
- Daily loss limit: $600
- Daily profit target: $900 → STOP
- Stop Loss always required
- Pre-Trade Checklist mandatory (10 items)
- 3 Losses = Stop 30 min
- Revenge trading = Immediate stop
- Killzones: London + NY (9:30-11:30 UTC)

### Psychology Rules
- 3 Losses = Stop 30 min
- Revenge trading = Immediate stop
- +$900 profit = Stop for the day

---

## 📈 Trading System (V4)
- **Strategy:** ICT/SMC (Order Blocks, FVG, Liquidity Sweeps)
- **Timeframes:** Weekly → Daily → 4H → 1H → 15m → 5m → 1m
- **Sessions:** NY + London Kill Zones ✅
  - NY: 9:30-11:30 NYC (3:30-5:30 PM السعودية)
  - London: 8:00-11:00 London (10:00-1:00 PM السعودية)
- **Entry:** 10 Confluences required (Checklist)

---

## 🤖 DHEEB DIRECTOR System (Added: Feb 21, 2026)

### الهيكل الجديد:
```
DHEEB DIRECTOR
   │
   ├── Trading Team (التداول)
   │   ├── Trading Oversight
   │   ├── Risk Control
   │   └── Performance Analyst
   │
   ├── System Team (الأنظمة)
   │   ├── System Architect
   │   ├── Build Validation
   │   └── Security Guardian
   │
   └── R&D Team (البحث والتطوير) ✨ NEW
       ├── Opportunity Scout
       ├── Market Research
       └── Monthly Review
```

### الـ 10 Agents:
1. Trading Oversight
2. Risk Control
3. Performance Analyst
4. System Architect
5. Build Validation
6. Security Guardian
7. Opportunity Scout
8. Market Research
9. Monthly Review

---

## 🤖 Agents Status
| Agent | Port | Status |
|-------|------|--------|
| Trading | 8080 | ✅ |
| Risk | 8081 | ✅ |
| News | 8082 | ✅ |
| System | 8083 | ✅ |
| Notifier | 8084 | ✅ |
| ICT Enforcer | 8085 | ✅ |
| DeepSeek Researcher | - | ✅ Active |
| Kimi Researcher | - | ✅ Active |
| Security Guardian | - | ✅ Active |

---

## 📋 Known Issues
- ~~Cron jobs: Some WhatsApp delivery failures~~ → ✅ Fixed (Feb 23)
- ~~Security: plugins.allow missing~~ → ✅ Fixed
- ~~Config writable~~ → ✅ Fixed (chmod 600)

## 🔴 Today's Errors Log (Feb 23)
| # | النوع | الوصف | الحالة |
|---|-------|-------|--------|
| 1 | CRITICAL | Config writable | ✅ Fixed |
| 2 | WARNING | plugins.allow | ✅ Fixed |
| 3 | WARNING | Cron delivery | ✅ Fixed |
| 4 | INFO | Kill Zone alert | ✅ Fixed |
| 5 | CRITICAL | Price API not working | ❌ Not fixed |
| 6 | CRITICAL | No live data | ❌ Not fixed |
| 7 | ERROR | Trade: Move SL | ❌ فهد |
| 8 | ERROR | Trade: 4 contracts (4% risk) | ❌ فهد |

## 📋 Meeting - Feb 23
- Total Loss: $230
- Trades: 2 (both lost)
- Root Cause: System failure + Rule violation
- Action: Fix Price API, Activate Alerts

---

## 🔗 Webhook (TradingView)
- **URL:** https://unnotational-gus-unsenescent.ngrok-free.dev/webhook/ict
- **Status:** Active
- **Killzone:** NY Only (9:30-11:30 AM NYC)

---

## 🔄 Self-Improvement System (CLAUDE.md Style)

**المبدأ:** كل خطأ → قاعدة → ما نكرره

### كيفية العمل:
1. كل جلسة → مراجعة سريعة
2. أي خطأ → توثيق
3. قاعدة جديدة → MEMORY.md
4. مراجعة أسبوعية

### Error Log Format:
```
### [التاريخ]
- الخطأ: [وصف]
- السبب: [لماذا]
- الحل: [كيف نتجنبه]
- القاعدة الجديدة: [قاعدة مضافة]
```

### القواعد الذهبية:
- لا نكرر نفس الغلط مرتين
- كل lesson يتعلمونه → يتوثق
- WEEKLY REVIEW للتعلم

---

## 🔄 Self-Healing System (Phase 1 - MVP)

### Error Classification:

| الرمز | النوع | أمثلة | الإجراء |
|-------|-------|-------|---------|
| 🔴 CRITICAL | Security, Data, Config | اختراق، تسريب، config تالف | Freeze + تحليل فوري + Fix |
| 🟡 WARNING | Performance, API, Integration | بطء، API fail، timeout | Log + قاعدة + متابعة |
| 🟢 INFO | UI, Cosmetic | خطأ مطبعي، تنبيه بسيط | Log فقط |

---

### Workflow:
```
خطأ → Classifier → تحديد النوع → الإجراء المناسب → Log to MEMORY
```

---

### القواعد:
1. كل خطأ → تصنيف خلال 5 ثواني
2. CRITICAL → توقف فوري + إصلاح
3. WARNING → توثيق + قاعدة
4. INFO → تسجيل فقط
5. كل أسبوع → مراجعة الـ errors + تحديث القواعد

## 🎯 KPIs - Week 1 (Feb 23-27)

| KPI | الهدف | الأسبوع |
|-----|-------|--------|
| Win Rate | ≥65% | - |
| Daily P/L | +$500 | - |
| Max Drawdown | ≤5% | - |
| Trades/Day | ≤2 | - |
| Alert Delivery | 100% | - |

---

## 📋 Quality Gates

### Entry (10/10 Required)
1. Kill Zone Active
2. HTF Trend
3. SMC Pattern
4. Liquidity Swept
5. FVG/OB
6. Entry Zone
7. RRR ≥ 1:2.5
8. SL
9. TP
10. Psychology Clear

## 📜 القرارات الرسمية (Feb 23, 2026)

###Risk Enforcement (نافذ الآن):
- Max Risk: 1% ($500)
- Max Contracts: 2
- Max Daily Loss: $600
- Min RRR: 1:2.5
- Max Trades: 2
- Lock بعد خسارتين متتاليتين
- SL غير قابل للتعديل
- Checklist إلزامي

### HARD ENFORCEMENT (Feb 23, 2026):
- Max Trades/Day: 2
- Max Contracts/Trade: 2
- Cooldown: 30 min between trades
- Cooldown After Loss: 30 min
- Max Daily Wins: 3 (then stop)
- Auto-reject عند أي مخالفة

### Price Infrastructure (24h):
- WebSocket live feed
- No live data = No trading

---

## 🎯 Priority Roadmap (Feb 23)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | Risk Hard Enforcement | ✅ Done |
| 2 | Price API + Heartbeat | ⏳ |
| 3 | Auto Alerts | ⏳ |
| 4 | Auto Analysis | ⏳ |
| 5 | Reporting Dashboard | ⏳ |

---

*Last updated: Feb 23, 2026*

---

# 🐺 DHEEB SYSTEM RULES - HIGH PRIORITY

## Based on Best AI Practices (Cursor, Manus, Devin, Windsurf, v0)

---

## 1. MEMORY SYSTEM (HIGH PRIORITY)
- Save important info proactively WITHOUT asking permission
- Any important context → create_memory
- Limited context = everything gets deleted
- Create memories liberally

---

## 2. RESPONSE STYLE (HIGH PRIORITY)
- Short responses (1-3 sentences max)
- No unnecessary preamble/postamble
- Use markdown for formatting
- Use backticks for code/files
- Arabic as primary language

---

## 3. TASK MANAGEMENT (HIGH PRIORITY)
- Use TodoWrite for tracking
- Break large tasks into smaller steps (max 3)
- Complete one step before next
- Show progress: active/complete

---

## 4. CODE QUALITY (HIGH PRIORITY)
- After correction → Update MEMORY.md
- Every error → new rule
- Don't modify tests
- Run lint after code changes
- Address root cause, not symptoms

---

## 5. SELF-IMPROVEMENT
- Every mistake → documented in MEMORY.md
- Every lesson → new rule
- Weekly review of errors
- NO repeated mistakes
