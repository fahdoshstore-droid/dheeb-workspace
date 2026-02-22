# 🏗️ نظام ذيب - الهيكلة الكاملة

**Updated: 2026-02-13 08:33 UTC**

---

## 📁 البنية الأساسية

```
/home/ubuntu/
├── dheeb-parts-system/          ← 🔴 النظام الأساسي الحالي
│   ├── agents/
│   │   ├── logs/               ← لوجات الأنظمة الفرعية
│   │   │   └── orchestrator.log  ← لوج البوت الرئيسي
│   │   └── orchestrator/        ← المنسق الرئيسي
│   │       ├── src/
│   │       │   ├── index.js          ← البوت الرئيسي
│   │       │   └── dheeb-connector.js ← وصلة الإشراف (Dheeb Interface)
│   │       ├── .env            ← إعدادات البوت
│   │       ├── package.json     ← الاعتماديات
│   │       ├── node_modules/
│   │       └── whatsapp-session/  ← جلسة واتساب
│   │
│   ├── data/                   ← قاعدة البيانات
│   ├── scripts/                ← أوامر ومهام
│   ├── docker-compose.yml      ← إعدادات Docker
│   └── logs/                   ← لوجات النظام
│
└── .openclaw/workspace/        ← ذاكرة وملفات ذيب الشخصية
    ├── SOUL.md                 ← هويتي (ذيب)
    ├── IDENTITY.md             ← اسمي وشخصيتي
    ├── USER.md                 ← بيانات فهد
    ├── memory/
    │   ├── YYYY-MM-DD.md       ← يوميات يومية
    │   └── trading-system-deployment.md
    └── ... (تطبيقات التداول والتحليل)
```

---

## 🔴 الأنظمة الفعالة الحالية

### 0. **🐺 DHEEB BRIDGE** (الموجّه المركزي) ⭐ NEW
- **المسار**: `~/dheeb-ecosystem/bridge/`
- **الملف الرئيسي**: `dheeb-bridge.js`
- **الوظيفة**: موجّه مركزي يتحكم بجميع الأنظمة
- **الحالة**: ✅ LIVE

**المسؤوليات**:
- توجيه الرسائل للنظام الصحيح
- مراقبة صحة جميع الأنظمة
- تسجيل جميع الأحداث
- معالجة الأزمات والأخطاء

**الأدوات**:
- `dheeb-cli.sh` - واجهة سطر الأوامر
- `commands/enter.sh` - البيئة التفاعلية
- `commands/goto.sh` - الانتقال بين الأنظمة
- `commands/files.sh` - فتح ملفات النظام

**اللوجات**: `~/dheeb-ecosystem/logs/bridge.log`

### 1. **Orchestrator Bot** (البوت الرئيسي)
- **المسار**: `~/dheeb-parts-system/agents/orchestrator/`
- **الملف الرئيسي**: `src/index.js`
- **وظيفة**: إدارة WhatsApp + Redis + Dheeb Integration
- **الحالة**: ✅ RUNNING

**الاتصالات**:
- WhatsApp (with QR code auth)
- Redis (Event pubsub)
- DHEEB BRIDGE (Central Routing)

**اللوجات**: `~/dheeb-parts-system/agents/logs/orchestrator.log`

### 2. **Trading Mind** (دماغ التداول)
- **المسار**: `~/dheeb-ecosystem/trading/`
- **الملف الرئيسي**: `trading-mind.js`
- **وظيفة**: معالجة قرارات التداول وفقاً لـ T.R.I.L. Framework
- **الحالة**: ✅ ACTIVE

**المسؤوليات**:
- تحليل طلبات الدخول
- فحص الـ Framework (HTF, Entry, SL, TP, Size)
- اتخاذ قرار (GO/WAIT/NO)
- مراقبة الصفقات الحية

**اللوجات**: `~/dheeb-ecosystem/logs/trading-mind.log`

### 3. **Rescue System** (نظام الإنقاذ)
- **المسار**: `~/dheeb-ecosystem/agents/rescue/`
- **الملف الرئيسي**: `bot.js`
- **وظيفة**: معالجة الأزمات والأخطاء
- **الحالة**: ⏸️ STANDBY

**المسؤوليات**:
- إيقاف الصفقات الخاطئة
- إغلاق الصفقات المفتوحة
- إرسال تنبيهات فورية
- تفعيل وضع الطوارئ

**اللوجات**: `~/dheeb-ecosystem/logs/rescue.log`

### 4. **Strategy Agent** (محرك الاستراتيجيات)
- **المسار**: `~/dheeb-ecosystem/agents/strategy/`
- **وظيفة**: تحليل SMC و LTA Framework
- **الحالة**: ✅ ACTIVE

### 5. **Workspace** (ذاكرة ذيب)
- **المسار**: `~/.openclaw/workspace/`
- **الملفات المهمة**:
  - SOUL.md - هويتي
  - memory/YYYY-MM-DD.md - يومياتي
  - SYSTEM-ARCHITECTURE.md (هذا الملف)

---

## 🔧 ملفات التكوين المهمة

| الملف | المسار | الوصف |
|------|--------|-------|
| **البوت الرئيسي** | `~/dheeb-parts-system/agents/orchestrator/src/index.js` | كود البوت الأساسي |
| **وصلة الإشراف** | `~/dheeb-parts-system/agents/orchestrator/src/dheeb-connector.js` | واجهة التواصل مع ذيب |
| **الإعدادات** | `~/dheeb-parts-system/agents/orchestrator/.env` | متغيرات البيئة |
| **الاعتماديات** | `~/dheeb-parts-system/agents/orchestrator/package.json` | مكتبات Node |
| **اللوجات** | `~/dheeb-parts-system/agents/logs/orchestrator.log` | سجل الأحداث |

---

## ⚡ أوامر الوصول السريع

```bash
# عرض حالة النظام
ls -la ~/dheeb-parts-system/agents/orchestrator/src/

# فتح اللوجات
tail -f ~/dheeb-parts-system/agents/logs/orchestrator.log

# دخول مجلد البوت
cd ~/dheeb-parts-system/agents/orchestrator/

# فحص حالة الخدمة
pm2 list

# عرض الإعدادات
cat ~/dheeb-parts-system/agents/orchestrator/.env
```

---

## 🔍 حالة النظام الحالية

✅ **جاري التشغيل**:
- Orchestrator Bot
- WhatsApp connection (QR auth)
- Redis messaging system
- Dheeb Connector active

⚠️ **بحاجة تفعيل**:
- dheeb-ecosystem/bridge/ (إذا كانت مطلوبة)
- Trading system integration
- Full Notion sync

---

## 📋 الملاحظات

1. **Bridge System**: الـ dheeb-ecosystem/bridge/ لم تكن موجودة - قد تحتاج إنشاء
2. **Trading Integration**: نظام التداول الحالي في `.openclaw/workspace` ويحتاج ربط مع البوت الرئيسي
3. **Notion Access**: API token موجود لكن الاتصال يحتاج تحديث
4. **WhatsApp Status**: مرتبط حالياً عبر Orchestrator bot (Redis-based)
