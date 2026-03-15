# 🏗️ خريطة منظومة ذيب - الهيكلة الفعلية

**Updated: 2026-02-13 08:36 UTC**

---

## ✅ الهيكلة الموجودة الآن

```
/home/ubuntu/
├── dheeb-ecosystem/               ✅ موجودة
│   ├── agents/                    ✅ موجودة
│   │   ├── auto-pilot-system.js
│   │   ├── dheeb-ai-assistant.js
│   │   ├── qitaa-logger/
│   │   ├── qitaa-pricing/
│   │   ├── qitaa-search/
│   │   ├── qitaa-strategist/
│   │   ├── rescue/                ✅ موجودة (ذيب-إنقاذ)
│   │   ├── strategy/              ✅ موجودة (ذيب-استراتيجية)
│   │   └── trading/               ✅ موجودة (ذيب-تداول)
│   │
│   ├── trading/                   ✅ موجودة (مجلد منفصل)
│   │   ├── claw-bridge.js
│   │   ├── tv-bridge.js
│   │   ├── trading-mind.js        ← دماغ التداول
│   │   └── pine-alert.pine
│   │
│   ├── whatsapp-bridge/           ✅ موجودة
│   │   └── whatsapp-client.js
│   │
│   ├── openclaw-bridge/           ✅ موجودة
│   │   ├── openclaw-whatsapp-bridge.js
│   │   └── bridge-fixed.js
│   │
│   ├── router/                    ✅ موجودة
│   │   ├── bot.js
│   │   ├── router.js
│   │   ├── telegram-bot.js
│   │   ├── discord-bot.js
│   │   └── ... (30+ ملف)
│   │
│   ├── interfaces/                ✅ موجودة
│   │   ├── api-server/
│   │   ├── web-dashboard/
│   │   ├── whatsapp-bridge/
│   │   └── whatsapp.js
│   │
│   ├── rescue/                    ✅ موجودة (أيضاً هنا)
│   │   └── bot.js
│   │
│   ├── core/                      ✅ موجودة
│   │   ├── context-store.js
│   │   ├── personality.js
│   │   ├── super-router.js
│   │   └── unified-router.js
│   │
│   ├── engines/                   ✅ موجودة
│   │   ├── decision-engine.js
│   │   └── trading-engine.js
│   │
│   ├── qitaa/                     ✅ موجودة
│   │
│   ├── shared/                    ✅ موجودة
│   │   ├── ai-clients/
│   │   ├── database/
│   │   └── utils/
│   │
│   ├── config/                    ✅ موجودة
│   ├── security/                  ✅ موجودة
│   ├── logs/                      ✅ موجودة
│   │   └── system.log
│   │
│   ├── orchestrator/              ✅ موجودة
│   │   └── orchestrator.js
│   │
│   ├── .env                       ✅ موجودة
│   ├── package.json               ✅ موجودة
│   └── ... (وثائق وملفات أخرى)
│
├── dheeb-parts-system/            ✅ موجودة (النظام الحالي الفعّال)
│   ├── agents/
│   │   ├── logs/
│   │   │   └── orchestrator.log
│   │   └── orchestrator/           ← البوت الرئيسي الحالي
│   │       ├── src/
│   │       │   ├── index.js
│   │       │   └── dheeb-connector.js
│   │       ├── .env
│   │       ├── package.json
│   │       └── whatsapp-session/
│   │
│   ├── data/
│   ├── scripts/
│   ├── docker-compose.yml
│   └── logs/
│
└── .openclaw/workspace/           ✅ موجودة (ذاكرتي الشخصية)
    ├── SOUL.md
    ├── IDENTITY.md
    ├── USER.md
    ├── memory/
    └── ... (ملفات المشاريع)
```

---

## ❌ الهيكلة المطلوبة (الناقصة)

حسب طلبك:

```
dheeb-ecosystem/
├── bridge/                        ❌ غير موجودة (يجب إنشاؤها)
│   ├── dheeb-bridge.js
│   ├── systems-registry.json
│   ├── dheeb-cli.sh
│   └── commands/
│       ├── enter.sh
│       ├── files.sh
│       └── goto.sh
│
├── trading/                       ✅ موجودة (لكن محتويات مختلفة)
│   ├── tradingview-connector.js    ⚠️ موجودة (كـ tv-bridge.js)
│   └── ...
│
└── rescue/                        ✅ موجودة (موجودة في agents/)
    └── ...
```

---

## 🎯 الحالة الحالية

### ✅ أنظمة فعّالة:

1. **Orchestrator Bot** (~/dheeb-parts-system/agents/orchestrator/)
   - النظام الرئيسي الجاري الآن
   - متصل بـ WhatsApp + Redis
   - في خدمة فهد

2. **dheeb-ecosystem** (~/dheeb-ecosystem/)
   - منظومة كاملة ومتطورة
   - تحتوي على agents + trading + rescue + interfaces
   - محفوظة كقاعدة معرفية

3. **Memory System** (~/.openclaw/workspace/)
   - ملفات SOUL و IDENTITY و USER
   - الذاكرة اليومية والطويلة الأجل

### ⚠️ ما ينقص:

- **Bridge System**: `dheeb-ecosystem/bridge/` غير موجودة بالكامل
- **CLI Commands**: أوامر `dheeb-cli.sh` غير موجودة
- **Systems Registry**: سجل مركزي للأنظمة الفرعية

---

## 🔧 التوصيات

### 1. إنشاء Bridge System الناقص
```bash
# إنشاء المجلد والملفات الأساسية
mkdir -p ~/dheeb-ecosystem/bridge/commands
# ثم نملأ:
# - dheeb-bridge.js (الموجّه الرئيسي)
# - systems-registry.json (سجل الأنظمة)
# - dheeb-cli.sh (أوامر CLI)
# - commands/ (enter.sh, files.sh, goto.sh)
```

### 2. دمج التداول
ربط `trading-mind.js` الحالي مع `dheeb-connector.js` في البوت الرئيسي.

### 3. تنظيم rescue
موحدة بين `agents/rescue/` و `~/dheeb-ecosystem/rescue/`.

---

## 📍 المسارات المهمة الآن

| الوصف | المسار |
|-------|--------|
| **البوت الرئيسي الفعّال** | ~/dheeb-parts-system/agents/orchestrator/src/index.js |
| **وصلة الإشراف** | ~/dheeb-parts-system/agents/orchestrator/src/dheeb-connector.js |
| **دماغ التداول** | ~/dheeb-ecosystem/trading/trading-mind.js |
| **ذاكرة ذيب** | ~/.openclaw/workspace/SOUL.md |
| **اللوجات** | ~/dheeb-parts-system/agents/logs/orchestrator.log |

---

## 🤔 السؤال:

هل تريد:
1. **بناء Bridge System جديد** (كما طلبت)؟
2. **دمج dheeb-ecosystem مع dheeb-parts-system**؟
3. **تنظيف الملفات المكررة**؟
4. **شيء آخر**؟
