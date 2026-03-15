# DHEEB SYSTEM - ملخص شامل

## النظمة الشغالة (March 1, 2026)

### 1. dheeb-trading-system
| | |
|---|---|
| **PM2** | dheeb-trading |
| **Port** | 3002 |
| **Status** | ✅ ONLINE (114s) |
| **Uptime** | ~3 min |

### 2. dheeb-parts-system (API)
| | |
|---|---|
| **PM2** | dheeb-api |
| **Port** | 3000 |
| **Status** | ✅ ONLINE |

---

## القدرات (Capabilities)

### ✅ الـ Endpoints (49 route)

| Endpoint | الوظيفة | الحالة |
|----------|---------|--------|
| `POST /webhook/ict` | استقبال إشارات TradingView | ✅ |
| `POST /test/setup` | اختبار setup | ✅ |
| `GET /health` | صحة النظام | ✅ |
| `GET /api/stats` | إحصائيات trades | ✅ |
| `GET /api/trades` | جميع trades | ✅ |
| `GET /api/news` | أخبار السوق | ✅ |
| `POST /api/record` | تسجيل trade | ✅ |
| `GET /api/price/:symbol` | سعر活着 | ✅ |
| `GET /api/scratchpad` | ذاكرة القرارات | ✅ |
| `POST /api/reflection/generate` | تحليل ما بعد trade | ✅ |

---

### ✅ الـ Agents (7)

| Agent | الوظيفة |
|-------|---------|
| **SentinelAgent** | مراقبة السوق + Kill Zones |
| **AnalystAgent** | تحليل الشموع + الدعم/مقاومة |
| **StrategyAgent** | استراتيجية ICT/SMC |
| **RiskAgent** | إدارة المخاطر |
| **NewsAgent** | أخبار السوق |
| **AiAgent** | ذكاء اصطناعي (MiniMax) |
| **ExecutionAgent** | تنفيذ الصفقات + Hard Enforcement |

---

### ✅ الـ Modules

| Module | الوظيفة | الحالة |
|--------|---------|--------|
| `trading-core.js` |Core التداول | ✅ |
| `risk-engine.js` |Risk计算 | ✅ |
| `psychology.js` |علم النفس | ⚠️ |
| `coach.js` |مدرب | ⚠️ |
| `level1-evaluator.js` |10 أسئلة قرار | 🆕 |
| `ai-vision/` |تحليل الصور | 🆕 |

---

## الإحصائيات

| | |
|---|---|
| **Total Trades** | 2 |
| **Wins** | 2 |
| **Losses** | 0 |
| **Win Rate** | 100% |
| **Total P/L** | $599 |
| **Balance** | $50,299 |

---

## القواعد (Hard Enforcement)

```
- Max Trades/Day: 2
- Max Contracts: 2
- Min RRR: 1:2.0
- Cooldown: 30 min
- Max Daily Loss: $600
```

---

## الـ Workflow

```
TradingView Webhook
    ↓
SentinelAgent (Kill Zone Check)
    ↓
AnalystAgent (Chart Analysis)
    ↓
StrategyAgent (ICT/SMC)
    ↓
RiskAgent (Risk Check)
    ↓
AiAgent (AI Confidence)
    ↓
ExecutionAgent (Hard Enforcement)
    ↓
WhatsApp Notification
```

---

## المشاكل المعروفة

| المشكلة | الحالة |
|---------|--------|
| SL/TP undefined in test | ⚠️ |
| Psychology module empty | ❌ |
| Coach module empty | ❌ |

---

## الملفات المطلوبة

- `/home/ubuntu/dheeb-trading-system/modules/ai-vision/` ✅
- `/home/ubuntu/dheeb-trading-system/modules/level1-evaluator.js` ✅

---

*Last Updated: 2026-03-01 09:50 UTC*
