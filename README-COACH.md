# 🐺 DHEEB - Real-Time Trading Coaching System

**النظام الكامل للتدريب التجاري الفوري عبر Telegram مع Notion Integration**

---

## 📌 ما هو DHEEB؟

نظام تدريب تجاري مباشر 24/7:
- ✅ **تنبيهات فورية** قبل الدخول (Pre-Trade Checklist)
- ✅ **تحليل نفسي حي** لتحديد شخصيتك أثناء التداول
- ✅ **مراقبة RRR والحدود** (Max 2 صفقات، Max Loss $600)
- ✅ **تسجيل وتحليل تلقائي** لكل صفقة
- ✅ **Notion Dashboard** لتتبع الأداء والإحصائيات
- ✅ **Development Plan** مدّة 30 يوم للانضباط والنمو

---

## 🎯 الميزات الرئيسية

| الميزة | الوصف | الأداة |
|--------|-------|-------|
| **Pre-Trade Alert** | 7 أسئلة قبل كل صفقة | `/check` |
| **Personality Detector** | تحديد شخصيتك (Pro/Chaos/Greedy/Fear) | `/personality` |
| **RRR Monitor** | مراقبة Risk-Reward Ratio | تلقائي في التحليل |
| **Daily Limits** | Max 2 صفقات، Max Loss $600 | تلقائي |
| **Trade Analysis** | تحليل فوري بعد الصفقة | `/analyze` |
| **Notion Integration** | حفظ كل البيانات تلقائياً | تلقائي |
| **Performance Stats** | إحصائيات يومية/أسبوعية | `/stats` |
| **Daily Plan** | خطتك اليومية + أوقات التداول | `/plan` |

---

## 🚀 البدء السريع

### 1️⃣ المتطلبات:
```bash
- Node.js v14+
- Telegram account
- Notion account
- 10 دقائق للإعداد
```

### 2️⃣ التثبيت:
```bash
cd /home/ubuntu/.openclaw/workspace

# نسخ ملف الإعدادات
cp .env.example .env

# تثبيت المكتبات
npm install

# تشغيل البرنامج
npm start
```

### 3️⃣ الإعداد:
```bash
# افتح .env وأدخل:
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
NOTION_API_KEY=your_api_key
```

### 4️⃣ ابدأ التداول:
```
افتح Telegram → اذهب @DiscoFahad_bot
اكتب: /start
```

---

## 📋 الأوامر الأساسية

```
/start          ابدأ جلسة جديدة
/check          Pre-Trade Checklist (قبل كل صفقة)
/analyze        تحليل الصفقة (بعد الانتهاء)
/personality    من حاضر الآن؟ (Chaos/Greedy/Fear/Pro)
/plan           خطتك اليومية
/stats          إحصائياتك (Win Rate, Profit Factor, etc)
/trade          تسجيل صفقة جديدة
```

---

## 🔧 البنية التقنية

```
dheeb-coaching/
├── telegram-coach.js            ← البوت الرئيسي
├── master-coach.js              ← المدير المركزي
├── psychological-analyzer.js    ← تحليل السلوك
├── notion-integration.js        ← Notion API
├── backtest-engine.js           ← تحليل الأداء
├── trading-system.js            ← نظام التسجيل
├── run-coach.js                 ← نقطة البدء
├── TELEGRAM-COACH-GUIDE.md      ← دليل الاستخدام
├── SETUP.md                     ← دليل الإعداد
├── package.json                 ← المكتبات
├── .env.example                 ← قالب الإعدادات
└── README-COACH.md              ← هذا الملف
```

---

## 📊 سير العمل

```
1. Pre-Trade (قبل الصفقة)
   → /check → اجب 7 أسئلة
   → لو كل الإجابات "نعم" → ادخل الصفقة
   → لو فيه "لا" واحد → ما تدخل

2. In-Trade (أثناء الصفقة)
   → راقب المنصة
   → اتبع الـ SL و TP
   → بلا تحريك الأوامر

3. Post-Trade (بعد الصفقة)
   → /analyze → سجل البيانات
   → البوت يحفظ في Notion فوري
   → يعطيك تحليل فوري
   → اكتب الدرس والخطأ

4. Daily Summary
   → /stats → عرض إحصائياتك
   → مراجعة Notion Dashboard
   → تحضير اليوم التالي
```

---

## 🧠 نظام الشخصيات الأربع

البوت يحدد شخصيتك أثناء التداول:

| الشخصية | الخصائص | الحل |
|--------|--------|------|
| 🟢 **Mr. Pro** | منطقي، هادي، محترف (70% win) | ✅ استمر |
| 🟠 **Mr. Greedy** | مستعجل، خايف يفوت (7 مرات) | ⏰ صبر + 10 ثوان |
| 🔴 **Mr. Chaos** | عاطفي، يقاتل السوق (6 مرات) | 📖 اقرأ القواعس |
| 🔵 **Mr. Fear** | خايف من الدخول (1 مرة) | 💪 خذ نص الحجم |

---

## ⚡ الحدود الصعبة

**لا استثناءات:**
- ✅ Max 2 صفقات يومياً
- ✅ RRR = 1:2 دقيق (بلا أقل)
- ✅ Daily Loss < $600
- ✅ Stop Loss دائماً (بلا استثناء)
- ✅ Pre-Trade Checklist قبل كل صفقة

**ممنوع:**
- ❌ FOMO entries (بدون تأكيدات)
- ❌ Revenge trades (بعد خسارة مباشرة)
- ❌ Oversizing (> 2% risk)
- ❌ Breaking Stop Loss
- ❌ Trading خارج الساعات

---

## 📈 النتائج المتوقعة

بعد التزام 30 يوم:

```
الأسبوع 1: التركيز والأساسيات
↳ 5-10 صفقات من الـ Best Strategy
↳ 100% التزام بـ SL/TP

الأسبوع 2: التحسن والتطبيق
↳ 10-15 صفقة
↳ تقليل الأخطاء بـ 50%
↳ Win Rate >= 55%

الأسبوع 3-4: الاستقرار والنمو
↳ 20-30 صفقة
↳ Win Rate >= 60%
↳ Profit >= 5% of capital
```

---

## 🔐 الأمان والخصوصية

- ✅ جميع البيانات محفوظة في Notion (account خاص بك)
- ✅ لا نرسل بيانات لطرف ثالث
- ✅ Telegram bot يعمل محلياً (بدون cloud)
- ✅ API keys محفوظة في .env (بدون push إلى Git)

---

## 🐛 Troubleshooting

### مشكلة: Bot not responding
```bash
pm2 logs dheeb-coach
pm2 restart dheeb-coach
```

### مشكلة: Notion connection error
```bash
# تحقق من API Key
curl -X GET "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer $NOTION_API_KEY"
```

### مشكلة: Token invalid
```bash
# اعادة نسخ من BotFather
# تأكد من عدم وجود مسافات في .env
```

---

## 📚 الملفات الأساسية للقراءة

**يومياً (5 دقائق):**
- PSYCHOLOGY-RULES.md
- OPERATING-RULES.md

**أسبوعياً:**
- Notion Dashboard
- Development Plan

**للمرجعية:**
- STRATEGIES.md
- COMPREHENSIVE-SYSTEM.md
- TELEGRAM-COACH-GUIDE.md

---

## 🎓 كيفية الاستفادة القصوى

1. **اقرأ كل الملفات أولاً** (خاصة PSYCHOLOGY-RULES)
2. **طبّق Pre-Trade Checklist** قبل كل صفقة
3. **سجّل كل صفقة فوري** (بلا تأخير)
4. **حلّل الأخطاء يومياً** (5 دقائق)
5. **راجع Notion أسبوعياً** (الإحصائيات والدروس)
6. **اطلب المساعدة عند الشك** (اكتب /personality)

---

## 💬 الدعم والمساعدة

لو عندك مشكلة:

1. **اقرأ SETUP.md** (معظم الحلول موجودة هناك)
2. **اقرأ TELEGRAM-COACH-GUIDE.md** (اللي لم تفهمه)
3. **اطلب مساعدة:**
   - "Bot not working"
   - "Notion not saving data"
   - "I don't understand /check"

---

## 📞 الاتصال والتحديثات

```
Telegram Bot: @DiscoFahad_bot
Status: 🟢 Active 24/7
Updates: تلقائية عند كل صفقة
```

---

## ⚖️ الشروط الأخيرة

هالـ نظام صُمّم بناءً على:
- ✅ أخطاؤك الفعلية (37 صفقة، 76% خسائر)
- ✅ شخصياتك الأربع (Mr. Chaos، Mr. Greedy، إلخ)
- ✅ معايير نفسية قوية (Discipline Score، Pattern Detection)
- ✅ حدود مادية صارمة (Max Loss $600، Max 2 Trades)

**الالتزام 100% = نتائج مؤكدة**
**التفاف على القواعس = خسارة مؤكدة**

ما في وسط.

---

## 🚀 ابدأ الآن

```bash
# خطوات البدء السريعة:
1. npm install
2. cp .env.example .env  (وأدخل البيانات)
3. npm start
4. افتح Telegram → @DiscoFahad_bot
5. اكتب: /start
```

**Ready?**

🐺 DHEEB نتظرك.

---

**آخر تحديث: 12 Feb 2026**
**النسخة: 1.0.0**
**الحالة: ✅ جاهز للعمل الفوري**
