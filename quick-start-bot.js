#!/usr/bin/env node

/**
 * DHEEB Quick Start Bot
 * نسخة مبسطة للاختبار السريع
 */

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
  process.exit(1);
}

console.log('🚀 Starting DHEEB Quick Start Bot...');
console.log('Token:', token.substring(0, 20) + '...');
console.log('Chat ID:', chatId);

const bot = new TelegramBot(token, { polling: true });

// ==================== معالجات الأوامر ====================

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  const welcome = `
🐺 أهلاً فهد

✅ النظام جاري التشغيل الآن

📊 الإحصائيات الأولية:
• Account: $49,072.52
• Max Loss Limit: $48,126.08
• Margin Left: $946.44 ⚠️

🎯 الخطوات التالية:
1. استراحة 14 يوم من التداول
2. بناء النظام والالتزام
3. تجربة Demo
4. حساب جديد بـ BOGO من uprofit

⚠️ القواعس الذهبية:
• Max 2 صفقات يومياً
• RRR = 1:2 دقيق
• Daily Loss < $600
• بلا FOMO. بلا انتقام.

🔧 الأوامر المتاحة:
/check   - Pre-Trade Checklist
/analyze - تسجيل صفقة
/personality - من حاضر الآن؟
/plan    - خطتك اليومية
/stats   - الإحصائيات
  `;

  await bot.sendMessage(chatId, welcome);
});

bot.onText(/\/check/, async (msg) => {
  const chatId = msg.chat.id;
  
  const checklist = `🔍 PRE-TRADE CHECKLIST

أجب عن كل سؤال (نعم أم لا):

1️⃣ تأكيدات على الماكرو (4H + 1D)?
2️⃣ نمط واضح (IFVG + OB + BOS)?
3️⃣ الوقت صحيح (London/Asia/NY)?
4️⃣ RRR = 1:2 بالضبط?
5️⃣ عد 10 ثوان قبل الدخول?
6️⃣ كام صفقة دخلت اليوم (≤2)?
7️⃣ خسرت كام بالفعل (<$600)?

➡️ اكتب الإجابات:
نعم نعم نعم نعم نعم 1 200

✅ الشرط:
كل الإجابات "نعم" → ادخل الصفقة
في "لا" واحد → ما تدخل`;

  await bot.sendMessage(chatId, checklist);
});

bot.onText(/\/analyze/, async (msg) => {
  const chatId = msg.chat.id;
  
  const analyze = `📊 تسجيل الصفقة الجديدة

الصيغة:
SYMBOL | ENTRY | EXIT | TP | SL | RESULT | TIME | PSYCHOLOGY

مثال:
EURUSD | 1.0850 | 1.0860 | 1.0900 | 1.0830 | WIN | 5MIN | Pro

الخيارات:
RESULT: WIN أو LOSS أو BREAKEVEN
PSYCHOLOGY: Pro أو Chaos أو Greedy أو Fear

➡️ اكتب الصفقة بالضبط بالترتيب`;

  await bot.sendMessage(chatId, analyze);
});

bot.onText(/\/personality/, async (msg) => {
  const chatId = msg.chat.id;
  
  const personality = `
🧠 PERSONALITY DETECTOR

اختر اللي حاضر الآن:

🟢 Mr. Pro (منطقي، محترف)
🟠 Mr. Greedy (مستعجل، خايف يفوت)
🔴 Mr. Chaos (عاطفي، يقاتل السوق)
🔵 Mr. Fear (خايف من الدخول)

من حاضر الآن؟
  `;

  await bot.sendMessage(chatId, personality);
});

bot.onText(/\/plan/, async (msg) => {
  const chatId = msg.chat.id;
  
  const plan = `
📋 خطتك اليوم

🎯 الأهداف:
✓ 1-2 صفقة فقط
✓ RRR = 1:2
✓ بلا انتقام
✓ بلا FOMO
✓ Daily Loss < $600

⏰ الساعات المسموح:
🇬🇧 London: 08:00-12:00 GMT (أفضل)
🇯🇵 Asia: 00:00-06:00 GMT
🇺🇸 NewYork: 13:00-21:00 GMT

🔍 ابحث عن:
• IFVG + OB على 4H
• تأكيدات على 1D
• Break of Structure

⏱️ الخطوات:
1. /check قبل الدخول
2. أدخل الصفقة
3. /analyze بعد الانتهاء
4. اكتب الدرس
  `;

  await bot.sendMessage(chatId, plan);
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  
  const stats = `📊 إحصائياتك

الفترة: آخر 3 أيام

🏆 الأداء:
• إجمالي الصفقات: 17
• الفائز: 4 (23.5%)
• الخاسر: 13 (76.5%)
• Win Rate: 23.5% ❌

💰 المالي:
• الربح/الخسارة: -$1,964
• Profit Factor: 0.80 ❌
• Avg Win: $123.17
• Avg Loss: -$193.28

⚠️ الحالة الحالية:
• Account: $49,072.52
• Max Loss Limit: $48,126.08
• Margin Left: $946.44 🚨

🧠 النفسي:
• Discipline Score: 25/100 ❌
• أكثر خطأ: Revenge Trading
• Personality: Mr. Chaos + Mr. Greedy

📈 التوصية:
❌ توقف فوري لمدة 14 يوم
✅ بناء النظام والالتزام
✅ اختبار Demo بعدين`;

  await bot.sendMessage(chatId, stats);
});

bot.onText(/\/live/, async (msg) => {
  const chatId = msg.chat.id;
  
  const live = `📺 نظام LIVE COACHING

أرسل screenshot من TradingView + التفاصيل:

الخطوات:
1️⃣ خذ screenshot من الـ chart
2️⃣ اكتب البيانات:
   - الزوج
   - الفريم
   - Pattern (IFVG + OB)
   - Entry / SL / TP
3️⃣ اسأل: GO أم NO؟

➡️ أنا بحلل فوري وأقول لك

البديل: أرسل الصورة + الـ text`;

  await bot.sendMessage(chatId, live);
});

bot.onText(/\/market/, async (msg) => {
  const chatId = msg.chat.id;
  
  const market = `📊 حالة السوق الحالية

⏰ الوقت: 22:57 GMT (الآن)

جلسات التداول:
🇬🇧 London: مغلقة (ستفتح في 09:03)
🇯🇵 Asia: نشطة الآن ✅
🇺🇸 NewYork: مغلقة (ستفتح في 13:00)

📈 الأزواج الرئيسية:
• EURUSD: في اتجاه صاعد هادي
• GBPUSD: انتظار التأكيد
• USDJPY: متقلب

⚠️ الأخبار:
✓ بدون أخبار رئيسية الآن
✓ آمن للتداول

توصيتي:
→ استنى جلسة London (08:00)
→ أفضل volume + volatility`;

  await bot.sendMessage(chatId, market);
});

// معالج الصور (Screenshots)
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  
  const response = `📸 تم استقبال الصورة

📝 اكتب معلومات الـ chart:
• الزوج؟ (EURUSD)
• الفريم؟ (4H)
• شنو اللي تشوف؟ (IFVG + OB)
• SL و TP؟ (1.0830 / 1.0900)
• بدك تدخل ولا بتستنى؟

➡️ أرسل التفاصيل بعد الصورة`;

  await bot.sendMessage(chatId, response);
});

// معالج رسائل عادية
bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) {
    return;
  }
  
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  // تحليل البيانات إذا كانت تفاصيل الصفقة
  if (text.includes('eurusd') || text.includes('gbpusd') || text.includes('ifvg') || text.includes('sl')) {
    const response = `✅ تم استقبال التفاصيل

🔍 جاري التحليل:
• Pattern واضح؟ ✓
• Confluence موجودة؟ ✓
• RRR صحيح؟ ✓
• Timing موافق؟ ✓

⏳ لو كل شيء تمام → GO
⚠️ لو في مشكلة → WAIT أو NO

(في الواقع: بدي أشوف الصورة الفعلية)`;

    bot.sendMessage(chatId, response);
  } else {
    bot.sendMessage(chatId, 'استخدم الأوامر: /start, /check, /analyze, /personality, /plan, /stats');
  }
});

// معالج الأخطاء
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// رسالة البدء
(async () => {
  try {
    await bot.sendMessage(chatId, '🟢 DHEEB Coach Online\n✅ تم الاتصال الناجح!');
    console.log('✅ Bot started successfully');
    console.log('Send /start to begin');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

// معالج الخروج
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  bot.stopPolling();
  process.exit(0);
});
