# 🐺 DHEEB Coaching System - نظام الإعداد الكامل

## **الخطوة 0: المتطلبات**

قبل الإعداد تأكد من:
- ✅ Node.js مثبت (v14+)
- ✅ Telegram account
- ✅ Notion account
- ✅ البريد الإلكتروني الخاص بـ Notion

---

## **الخطوة 1: إعداد Telegram Bot**

### 1.1 الدخول إلى BotFather:
```
1. افتح Telegram
2. ابحث عن: @BotFather
3. اضغط Start
```

### 1.2 إنشاء بوت جديد:
```
أكتب: /newbot
الرد سيكون:
"Alright, a new bot. How are we going to call it?"

أكتب: DHEEB Coach
ثم سيطلب اسم المستخدم:

أكتب: DiscoFahad_bot
(أو أي اسم ما استخدم قبل)
```

### 1.3 نسخ Token:
```
BotFather سيعطيك رسالة فيها:
"Use this token to access the HTTP API:
123456789:ABCDefghijklmnopqrstuvwxyz..."

👉 انسخ كل هالـ رقم والحروف (هذا هو Token)
```

### 1.4 الحصول على Chat ID:
```
1. افتح Telegram
2. ابحث عن: @userinfobot
3. اضغط Start
4. سيعطيك رسالة فيها Chat ID
   مثال: "User ID: 123456789"

👉 انسخ الرقم (هذا هو Chat ID)
```

---

## **الخطوة 2: إعداد Notion Integration**

### 2.1 فتح Integrations Dashboard:
```
1. اذهب: https://www.notion.so/my-integrations
2. اضغط: Create new integration
```

### 2.2 ملء التفاصيل:
```
Name: DHEEB Coach
Logo: (اختياري)
Description: Real-time trading coaching system
```

### 2.3 نسخ API Key:
```
بعد الإنشاء سيعطيك صفحة فيها:
"Internal Integration Token
secret_abc123def456..."

👉 انسخ كل الـ Token (ابدأ من secret_...)
```

### 2.4 قبول الـ Invitation (من Notion):
```
فهد أرسل لك رابط:
https://www.notion.so/invite/...

👉 اضغط عليه واقبل الـ invitation
```

---

## **الخطوة 3: إعداد ملف .env**

### 3.1 نسخ template:
```bash
cp .env.example .env
```

### 3.2 فتح الملف وملء البيانات:
```bash
nano .env
```

### 3.3 أدخل البيانات:
```env
# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCDefghijklmnopqrstuvwxyz
TELEGRAM_CHAT_ID=123456789

# Notion
NOTION_API_KEY=secret_abc123def456...

# (اختياري) Trading Config
MAX_TRADES_PER_DAY=2
DAILY_LOSS_LIMIT=600
MIN_RRR=2
```

### 3.4 حفظ الملف:
```bash
# اضغط: Ctrl + X
# اضغط: Y (للتأكيد)
# اضغط: Enter
```

---

## **الخطوة 4: تثبيت المكتبات**

```bash
cd /home/ubuntu/.openclaw/workspace

# تثبيت المكتبات المطلوبة
npm install node-telegram-bot-api
npm install @notionhq/client
npm install dotenv
```

---

## **الخطوة 5: اختبار الاتصال**

### 5.1 تشغيل البرنامج:
```bash
node run-coach.js
```

### 5.2 ما تتوقع:
```
╔════════════════════════════════════════════════════════════╗
║         🐺 DHEEB COACHING SYSTEM - نظام التدريب المباشر    ║
╚════════════════════════════════════════════════════════════╝

📱 جاري تهيئة Telegram Bot...
📋 جاري اختبار الاتصال بـ Notion...
✅ Notion متصل
🤖 جاري بدء Telegram Bot...

✅ النظام جاهز للعمل
```

### 5.3 اختبار البوت:
```bash
# في Telegram
# اذهب إلى @DiscoFahad_bot
# اكتب: /start

# يجب تستقبل رسالة ترحيب
```

---

## **الخطوة 6: تشغيل في الخلفية (اختياري)**

### 6.1 تثبيت pm2:
```bash
npm install -g pm2
```

### 6.2 بدء البرنامج:
```bash
pm2 start run-coach.js --name "dheeb-coach"

# عرض الحالة
pm2 status

# عرض السجلات
pm2 logs dheeb-coach

# إيقاف
pm2 stop dheeb-coach

# إعادة تشغيل
pm2 restart dheeb-coach
```

### 6.3 تشغيل عند إعادة التشغيل:
```bash
pm2 startup
pm2 save
```

---

## **الخطوة 7: التحقق من Notion Setup**

### 7.1 التحقق من الوصول:
```bash
# في Terminal
curl -X GET "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28"

# يجب يعطيك JSON response (لا خطأ)
```

### 7.2 إنشاء Databases في Notion:
```
اذهب إلى Notion:
1. انشئ صفحة جديدة
2. أضف 4 Databases:
   - Trades
   - Performance
   - Psychology
   - Development Plan

(أو استخدم الـ templates الموجودة)
```

---

## **الخطوة 8: أول استخدام**

### 8.1 فتح Telegram:
```
اذهب إلى: @DiscoFahad_bot
اكتب: /start
```

### 8.2 الأوامر المتاحة:
```
/check      - Pre-Trade Checklist
/analyze    - تحليل الصفقة
/personality - من حاضر الآن؟
/plan       - خطتك اليومية
/stats      - إحصائياتك
```

### 8.3 أول صفقة:
```
1. اكتب: /check
2. أجب على الأسئلة
3. لما تدخل صفقة: اكتب /analyze
4. أدخل بيانات الصفقة
5. الكوتش بيحلل فوري
```

---

## **الخطوة 9: Troubleshooting**

### مشكلة: "Cannot find module"
```bash
# قد تحتاج تثبيت مكتبات إضافية
npm install
```

### مشكلة: "Invalid Token"
```bash
# تحقق من .env
cat .env

# تأكد من:
# - عدم وجود مسافات
# - Token صحيح (انسخ من BotFather مرة ثانية)
```

### مشكلة: "Notion 401 Unauthorized"
```bash
# تحقق من API Key
# تأكد من:
# - النسخ صحيح (ابدأ من secret_)
# - قبلت الـ Invitation
# - لم تنسخ "Internal Integration Token" بدل الـ API Key
```

### مشكلة: "Bot not responding"
```bash
# تحقق من الـ polling
pm2 logs dheeb-coach

# أعد التشغيل
pm2 restart dheeb-coach
```

---

## **الخطوة 10: التكوين المتقدم (اختياري)**

### السماح بـ Inline Buttons في Telegram:
```
في BotFather:
/mybots
اختر البوت
Bot Settings
Inline Mode
تشغيل الوضع
```

### تخصيص الرسائل:
```
في telegram-coach.js:
عدّل الرسائل والأوامر حسب احتياجك
```

### إضافة commands إضافية:
```javascript
// في telegram-coach.js
this.bot.onText(/\/command/, (msg) => {
  // معالج جديد
});
```

---

## **الخطوة 11: الصيانة الدورية**

### يومياً:
```bash
# تحقق من السجلات
pm2 logs dheeb-coach

# تأكد من عمل البوت
# (أرسل /start)
```

### أسبوعياً:
```bash
# قراءة Notion Dashboard
# مراجعة الإحصائيات
# تحديث الخطة إذا لزم
```

### شهرياً:
```bash
# تحديث المكتبات
npm update

# مراجعة الأخطاء في السجلات
# تحسين الأداء إذا لزم
```

---

## **الخطوة 12: الحد الأدنى للاستخدام**

إذا ما بتقدر تعدِّ كل شيء دفعة واحدة:

### اليوم الأول:
```
1. ✅ إنشاء Telegram Bot
2. ✅ ملء .env
3. ✅ تشغيل run-coach.js
```

### اليوم الثاني:
```
1. ✅ قبول Notion Invitation
2. ✅ إنشاء Databases
3. ✅ أول /start في البوت
```

### اليوم الثالث:
```
1. ✅ أول /check قبل صفقة
2. ✅ أول /analyze بعد صفقة
3. ✅ البدء بالعمل الفعلي
```

---

## **رسالة نهائية:**

هالـ نظام مو معقد. لكن يحتاج:
1. ✅ انتباه للتفاصيل (البيانات الصحيحة)
2. ✅ التزام كامل (كل صفقة سجلها)
3. ✅ قراءة الملفات (PSYCHOLOGY-RULES، إلخ)

**لو التزمت → الربح.**
**لو تحايلت → الخسارة.**

ما في وسط.

---

**قم بالإعداد الآن.**

إذا احتاجت مساعدة:
```bash
# اطلب:
"شنو اللي صار؟"
"شنو الخطأ؟"
"شنو الخطوة التالية؟"
```

سأساعدك.
