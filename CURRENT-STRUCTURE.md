# 🐺 DHEEB - الهيكل الحالي

## الانظمة

```
dheeb-trading-system/
├── execution/engine.js    ← المحرك
├── connectors/tradovate   ← الاتصال
├── webhook/server.js     ← استقبال الاشارات
├── ict/                  ← تحليل ICT
└── config/settings.js    ← الاعدادات

dheeb-mvp/
├── trading-agent.js
├── risk-agent.js
├── decision-engine.js
└── news-agent.js
```

## الملفات الرئيسية

| الملف | الوظيفة |
|-------|---------|
| SOUL.md | هويتي وقوايدي |
| IDENTITY.md | دوري |
| AGENTS.md | طريقة العمل |
| MEMORY.md | ذاكرتي |
| USER.md | عن المستخدم |
| HEARTBEAT.md | المهام الدورية |

## القواعد

- Max 2 trades/day
- $500 max risk
- RRR 2:1 minimum
- Kill Zones only
- 7 conditions check

## الحالة

- Tradovate: غير متصل
- Webhook: يحتاج تشغيل
- Execution Engine: يحتاج تفعيل

---

## ملخص

```
User → Telegram → Me (Dheeb)
                      ↓
               Analyze Chart
                      ↓
               Check 7 Conditions
                      ↓
               ALLOWED / NOT ALLOWED
                      ↓
               Execute (via Webhook)
```

**المشكلة:** المحرك ما يشتغل. Tradovate ما يتصل.
