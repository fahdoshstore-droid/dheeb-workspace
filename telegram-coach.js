/**
 * DHEEB Telegram Real-Time Coaching System
 * المدرب المباشر عبر Telegram - الإشعارات والنصائح الحية
 * 
 * استخدام:
 * const coach = new TelegramCoach();
 * await coach.start();
 * 
 * الأوامر:
 * /start - بدء الجلسة
 * /check - Pre-trade checklist
 * /analyze - تحليل الصفقة
 * /personality - من حاضر الآن؟
 * /plan - عرض الخطة اليومية
 * /stats - الإحصائيات
 */

const TelegramBot = require('node-telegram-bot-api');
const NotionIntegration = require('./notion-integration');
const PsychologicalAnalyzer = require('./psychological-analyzer');

class TelegramCoach {
  constructor(token = process.env.TELEGRAM_BOT_TOKEN) {
    this.bot = new TelegramBot(token, { polling: true });
    this.notion = new NotionIntegration();
    this.psychology = new PsychologicalAnalyzer();
    
    // حالة المستخدم الحالية
    this.userState = {
      tradingActive: false,
      tradesCount: 0,
      dailyLoss: 0,
      lastTrade: null,
      dailyLossLimit: 600,
      maxTradesPerDay: 2,
      lastCheckTime: null
    };

    // الاستراتيجيات والأنماط المراقبة
    this.watchPatterns = {
      'IFVG': 'Internal Fair Value Gap - تأكد من OB',
      'OB': 'Order Block - مستويات قوية',
      'BOS': 'Break of Structure - تأكيد الاتجاه',
      'FVG': 'Fair Value Gap - تعويض السيولة'
    };

    this.sessions = {
      'London': { start: '08:00', end: '12:00', tz: 'GMT' },
      'Asia': { start: '00:00', end: '06:00', tz: 'GMT' },
      'NewYork': { start: '13:00', end: '21:00', tz: 'GMT' }
    };

    // Personality detection
    this.personalities = {
      'Mr. Chaos': { color: '🔴', risk: 'high', action: 'block' },
      'Mr. Greedy': { color: '🟠', risk: 'medium', action: 'warn' },
      'Mr. Fear': { color: '🔵', risk: 'low', action: 'encourage' },
      'Mr. Pro': { color: '🟢', risk: 'low', action: 'go' }
    };

    this.setupHandlers();
  }

  // ==================== إعداد المعالجات ====================

  setupHandlers() {
    // /start
    this.bot.onText(/\/start/, (msg) => {
      this.handleStart(msg);
    });

    // /check - Pre-trade checklist
    this.bot.onText(/\/check/, (msg) => {
      this.handlePreTradeCheck(msg);
    });

    // /analyze - تحليل الصفقة
    this.bot.onText(/\/analyze/, (msg) => {
      this.handleTradeAnalysis(msg);
    });

    // /personality - من حاضر الآن؟
    this.bot.onText(/\/personality/, (msg) => {
      this.handlePersonalityDetector(msg);
    });

    // /plan - عرض الخطة اليومية
    this.bot.onText(/\/plan/, (msg) => {
      this.handleDailyPlan(msg);
    });

    // /stats - الإحصائيات
    this.bot.onText(/\/stats/, (msg) => {
      this.handleStatistics(msg);
    });

    // /trade - تسجيل صفقة جديدة
    this.bot.onText(/\/trade/, (msg) => {
      this.handleNewTrade(msg);
    });

    // معالج رسائل عادية (استقبال بيانات الصفقة)
    this.bot.on('message', (msg) => {
      if (!msg.text.startsWith('/')) {
        this.handleTradeData(msg);
      }
    });

    // رسائل الخطأ
    this.bot.on('polling_error', (error) => {
      console.error('❌ Telegram polling error:', error);
    });
  }

  // ==================== معالجات الأوامر ====================

  async handleStart(msg) {
    const chatId = msg.chat.id;
    
    const welcome = `
🐺 أهلاً فهد

أنا ذيب. مدرب تداول فوري. ما في كلام فارغ - فقط نتائج.

🎯 دورك:
1. لما بتبيء تدخل صفقة → اكتب /check
2. لما تخلص الصفقة → اكتب /trade ثم البيانات
3. بدي أعرف من حاضر → اكتب /personality
4. بدي أشوف الخطة → اكتب /plan

⚠️ القواعد:
• Max 2 صفقات يومياً
• RRR يجب يكون 1:2
• Daily Loss Limit: $600
• بلا انتقام. بلا FOMO. بلا خوف.

اختر من الخيارات:
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '✅ Pre-Trade Check', callback_data: 'check' }],
        [{ text: '📊 Daily Stats', callback_data: 'stats' }],
        [{ text: '🎯 My Plan', callback_data: 'plan' }],
        [{ text: '🧠 Who Am I?', callback_data: 'personality' }]
      ]
    };

    await this.bot.sendMessage(chatId, welcome, { reply_markup: keyboard });
    
    // تحميل البيانات من Notion
    this.loadUserDataFromNotion(chatId);
  }

  async handlePreTradeCheck(msg) {
    const chatId = msg.chat.id;

    const checklist = `
🔍 PRE-TRADE CHECKLIST

أجب عن كل سؤال بـ "نعم" أم "لا":

1️⃣ هل تأكدت من الفريم 4H و 1D?
   (هل في تأكيدات واضحة على الماكرو؟)

2️⃣ هل شفت النمط الواضح؟
   (IFVG + OB + BOS؟)

3️⃣ هل الوقت صحيح؟
   (London/Asia/NewYork فقط؟)

4️⃣ هل RRR = 1:2 بالضبط؟
   (للربح $200 = خسارة $100 ماكس؟)

5️⃣ هل عد 10 ثوان قبل الدخول؟
   (هل أنت هادي أم مستعجل؟)

6️⃣ كام صفقة دخلت اليوم؟
   (يجب تكون ≤2)

7️⃣ كام خسرت بالفعل؟
   (<$600 فقط؟)

---
اكتب الإجابات (نعم/لا) رقم 1 رقم 2 ... الخ

مثال: نعم نعم نعم نعم نعم ١ ٢٠٠
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '✅ Go Ahead', callback_data: 'trade_go' }],
        [{ text: '⛔ Stop - Not Ready', callback_data: 'trade_stop' }]
      ]
    };

    await this.bot.sendMessage(chatId, checklist, { reply_markup: keyboard });
  }

  async handleTradeAnalysis(msg) {
    const chatId = msg.chat.id;

    const analysis = `
📊 POST-TRADE ANALYSIS

اكتب معلومات الصفقة في هالشكل:

SYMBOL|ENTRY|EXIT|TP|SL|RESULT|DURATION|PSYCHOLOGY

مثال:
EURUSD|1.0850|1.0860|1.0900|1.0830|WIN|5MIN|Pro

الخيارات:
• RESULT: WIN / LOSS / BREAKEVEN
• PSYCHOLOGY: Pro / Chaos / Greedy / Fear

بعد التسجيل → بحلل الصفقة وبقول لك:
1. من فاز (أي شخصية)
2. وش الدرس
3. شنو الخطوة التالية
    `;

    await this.bot.sendMessage(chatId, analysis);
  }

  async handlePersonalityDetector(msg) {
    const chatId = msg.chat.id;

    const personality = `
🧠 PERSONALITY DETECTOR

اختر اللي تحس فيه الآن:

1️⃣ Mr. Chaos 🔴
   - تحليلك عاطفي ومايتطابق مع الخطة
   - تقاتل السوق وما تقبل الخسارة
   - دخول عشوائي بلا تأكيدات

2️⃣ Mr. Greedy 🟠
   - مستعجل على الدخول
   - خايف تفوت الفرصة
   - تبي ربح أسرع من الممكن

3️⃣ Mr. Fear 🔵
   - خايف من الدخول
   - تفكر كتير قبل لا تدخل
   - نقص في الثقة بالنفس

4️⃣ Mr. Pro 🟢
   - تحليلك واضح ومنطقي
   - تنتظر التأكيدات
   - قرارات هادئة بدون عجلة

👉 اختر الرقم اللي يطابقك الآن
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🔴 Mr. Chaos', callback_data: 'personality_chaos' }],
        [{ text: '🟠 Mr. Greedy', callback_data: 'personality_greedy' }],
        [{ text: '🔵 Mr. Fear', callback_data: 'personality_fear' }],
        [{ text: '🟢 Mr. Pro', callback_data: 'personality_pro' }]
      ]
    };

    await this.bot.sendMessage(chatId, personality, { reply_markup: keyboard });
  }

  async handleDailyPlan(msg) {
    const chatId = msg.chat.id;

    const currentHour = new Date().getHours();
    const currentSession = this.getCurrentSession();

    const plan = `
📋 خطتك اليوم

⏰ الجلسة الحالية: ${currentSession.name} (${currentSession.status})

🎯 الأهداف:
✓ تداول 1-2 صفقة فقط
✓ RRR = 1:2 دقيق
✓ بلا انتقام
✓ بلا FOMO
✓ Daily Loss < $600

📍 الأوقات المتاحة:
🇬🇧 London: 08:00-12:00 GMT (أفضل وقت)
🇯🇵 Asia: 00:00-06:00 GMT
🇺🇸 NewYork: 13:00-21:00 GMT

🔍 ابحث عن:
• IFVG + OB على 4H
• تأكيدات على 1D
• Break of Structure واضح

⚡ قبل كل صفقة:
☑️ شيك Pre-Trade Checklist
☑️ عد 10 ثوان
☑️ تأكد من RRR

📝 بعد كل صفقة:
☑️ سجل النتيجة فوراً
☑️ حلل الأخطاء
☑️ اكتب الدرس
    `;

    await this.bot.sendMessage(chatId, plan);
  }

  async handleStatistics(msg) {
    const chatId = msg.chat.id;

    // استحصل البيانات من Notion
    const stats = await this.notion.getRecentStats();

    const statsMessage = `
📊 إحصائياتك

الفترة: آخر 7 أيام

🏆 الأداء:
• إجمالي الصفقات: ${stats.totalTrades || 0}
• الفائز: ${stats.wins || 0}
• الخاسر: ${stats.losses || 0}
• Win Rate: ${stats.winRate || 0}%

💰 المالي:
• الربح/الخسارة: $${stats.pnl || 0}
• Profit Factor: ${stats.profitFactor || 0}
• Avg Win: $${stats.avgWin || 0}
• Avg Loss: $${stats.avgLoss || 0}

🧠 النفسي:
• Discipline Score: ${stats.disciplineScore || 0}/100
• أكثر خطأ: ${stats.topMistake || 'none'}
• Personality: ${stats.dominantPersonality || 'Unknown'}

📈 الترند:
${this.generateTrendEmoji(stats.trend)}
    `;

    await this.bot.sendMessage(chatId, statsMessage);
  }

  async handleNewTrade(msg) {
    const chatId = msg.chat.id;

    const prompt = `
📝 سجل الصفقة الجديدة

اكتب المعلومات بالترتيب:
الزوج | Entry | Exit | TP | SL | الوقت | النتيجة | الأخطاء

مثال:
EURUSD | 1.0850 | 1.0860 | 1.0900 | 1.0830 | 08:15 | WIN | none

أم اكتب كل معلومة على سطر:
Symbol: EURUSD
Entry: 1.0850
Exit: 1.0860
TP: 1.0900
SL: 1.0830
Time: 08:15
Result: WIN
Mistakes: none
    `;

    await this.bot.sendMessage(chatId, prompt);
  }

  // ==================== معالجة البيانات ====================

  async handleTradeData(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // محاولة فك البيانات
    const tradeData = this.parseTradeData(text);

    if (!tradeData.isValid) {
      await this.bot.sendMessage(
        chatId,
        `❌ بيانات غير صحيحة\n\nاكتب: EURUSD | 1.0850 | 1.0860 | 1.0900 | 1.0830 | WIN`
      );
      return;
    }

    // حفظ في Notion
    await this.notion.saveTrade(tradeData);

    // تحليل فوري
    const analysis = this.analyzeTradeQuick(tradeData);

    // إرسال النتيجة
    const response = `
✅ تم تسجيل الصفقة

📊 النتيجة: ${analysis.result}
💰 PnL: ${analysis.pnl}
⏱️ المدة: ${analysis.duration}

🧠 التحليل:
${analysis.personality} حاضر الآن
${analysis.lesson}

✨ الخطوة التالية:
${analysis.nextAction}
    `;

    await this.bot.sendMessage(chatId, response);

    // تحديث الحالة
    this.userState.tradesCount++;
    this.userState.dailyLoss += analysis.pnlValue;
    this.userState.lastTrade = tradeData;

    // التحقق من الحدود
    if (this.userState.tradesCount >= 2) {
      await this.bot.sendMessage(
        chatId,
        `⚠️ وصلت الحد اليومي (2 صفقات)\n\n❌ لا مزيد من الصفقات اليوم`
      );
    }

    if (this.userState.dailyLoss <= -600) {
      await this.bot.sendMessage(
        chatId,
        `🛑 STOP\n\nخسارة اليوم وصلت $600\n❌ جميع الحسابات مغلقة`
      );
    }
  }

  // ==================== تحليل سريع ====================

  parseTradeData(text) {
    // محاولة فك الصيغة: SYMBOL | ENTRY | EXIT | TP | SL | RESULT | DURATION | PSYCHOLOGY
    
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length < 6) {
      return { isValid: false };
    }

    return {
      isValid: true,
      symbol: parts[0],
      entry: parseFloat(parts[1]),
      exit: parseFloat(parts[2]),
      tp: parseFloat(parts[3]),
      sl: parseFloat(parts[4]),
      result: parts[5].toUpperCase(),
      duration: parts[6] || 'unknown',
      psychology: parts[7] || 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  analyzeTradeQuick(trade) {
    const pnl = trade.exit - trade.entry;
    const pnlValue = pnl > 0 ? pnl * 100000 : pnl * 100000; // تقريبي
    const riskReward = Math.abs((trade.tp - trade.entry) / (trade.sl - trade.entry));

    let personality = '🟢 Mr. Pro';
    let lesson = 'تحليل دقيق وتنفيذ صحيح';
    let nextAction = '✅ استمر بنفس الأسلوب';

    if (trade.psychology === 'Chaos') {
      personality = '🔴 Mr. Chaos';
      lesson = 'تحليل عاطفي. التالي: اعتمد على الماكرو فقط';
      nextAction = '⛔ توقف 30 دقيقة قبل الصفقة التالية';
    } else if (trade.psychology === 'Greedy') {
      personality = '🟠 Mr. Greedy';
      lesson = 'مستعجل. التالي: أنتظر تأكيدات إضافية';
      nextAction = '⏰ عد 10 ثوان قبل الدخول';
    } else if (trade.psychology === 'Fear') {
      personality = '🔵 Mr. Fear';
      lesson = 'خوف من الدخول. ركز على الثقة';
      nextAction = '💪 خذ نص الحجم وادخل';
    }

    return {
      result: trade.result,
      pnl: pnlValue > 0 ? `+$${Math.abs(pnlValue).toFixed(2)}` : `-$${Math.abs(pnlValue).toFixed(2)}`,
      pnlValue: pnlValue,
      riskReward: riskReward.toFixed(2),
      duration: trade.duration,
      personality: personality,
      lesson: lesson,
      nextAction: nextAction
    };
  }

  getCurrentSession() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 8 && hour < 12) {
      return { name: 'London', status: '🟢 Active', trades: 2 };
    } else if (hour >= 0 && hour < 6) {
      return { name: 'Asia', status: '🟢 Active', trades: 1 };
    } else if (hour >= 13 && hour < 21) {
      return { name: 'NewYork', status: '🟢 Active', trades: 2 };
    } else {
      return { name: 'Market Closed', status: '🔴 Closed', trades: 0 };
    }
  }

  generateTrendEmoji(trend) {
    if (!trend) return '📊 بيانات غير كافية';
    if (trend > 0) return '📈 اتجاه إيجابي';
    if (trend < 0) return '📉 اتجاه سلبي';
    return '➡️ ثابت';
  }

  async loadUserDataFromNotion(chatId) {
    // تحميل البيانات من Notion
    const recentStats = await this.notion.getRecentStats();
    
    // تحديث حالة المستخدم
    this.userState = {
      ...this.userState,
      tradesCount: recentStats.tradesCountToday || 0,
      dailyLoss: recentStats.dailyLoss || 0,
      lastTrade: recentStats.lastTrade || null
    };
  }

  // ==================== بدء النظام ====================

  async start() {
    console.log('🤖 DHEEB Telegram Coach جاري التشغيل...');
    console.log('Bot Token: ' + (process.env.TELEGRAM_BOT_TOKEN ? '✅' : '❌'));
    console.log('Notion Key: ' + (process.env.NOTION_API_KEY ? '✅' : '❌'));
    
    await this.bot.sendMessage(
      process.env.TELEGRAM_CHAT_ID || '1234567890',
      '🐺 تم تشغيل نظام التدريب الحي\n\nاكتب /start للبدء'
    );
  }

  async stop() {
    this.bot.stopPolling();
    console.log('❌ تم إيقاف الـ Coach');
  }
}

module.exports = TelegramCoach;
