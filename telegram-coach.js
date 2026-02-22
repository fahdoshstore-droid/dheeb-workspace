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
    
    const welcome = "/check /trade /personality /plan";

    await this.bot.sendMessage(chatId, welcome);
    
    // تحميل البيانات من Notion
    this.loadUserDataFromNotion(chatId);
  }

  async handlePreTradeCheck(msg) {
    const chatId = msg.chat.id;

    const checklist = `هل تأكدت من الفريم 4H و 1D؟ هل شفت النمط الواضح؟ هل الوقت صحيح؟ هل RRR = واحد إلى اثنين بالضبط؟ هل عد 10 ثوان قبل الدخول؟ كام صفقة دخلت اليوم؟ كام خسرت بالفعل؟`;

    await this.bot.sendMessage(chatId, checklist);
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

    const personality = `اختر اللي تحس فيه الآن:
Chaos - تحليل عاطفي تقاتل السوق دخول عشوائي
Greedy - مستعجل خايف تفوت الفرصة تبي ربح أسرع
Fear - خايف من الدخول تفكر كتير نقص ثقة
Pro - تحليل واضح تنتظر التأكيدات قرارات هادئة`;

    const keyboard = {
      inline_keyboard: [
        [{ text: 'Chaos', callback_data: 'personality_chaos' }, { text: 'Greedy', callback_data: 'personality_greedy' }],
        [{ text: 'Fear', callback_data: 'personality_fear' }, { text: 'Pro', callback_data: 'personality_pro' }]
      ]
    };

    await this.bot.sendMessage(chatId, personality, { reply_markup: keyboard });
  }

  async handleDailyPlan(msg) {
    const chatId = msg.chat.id;

    const currentSession = this.getCurrentSession();

    const plan = `الجلسة: ${currentSession.name}
الأهداف: صفقة أو اثنتين فقط RRR = واحد إلى اثنين بلا انتقام بلا FOMO Daily Loss أقل من ستمائة دولار
الأوقات: London صباح إلى ظهر GMT / Asia منتصف الليل إلى صباح GMT / NewYork بعد الظهر إلى المساء GMT
ابحث عن: IFVG و OB على الفريم الأكبر تأكيدات على الفريم الأعظم Break of Structure واضح
قبل الصفقة: شيك القائمة اعد عشر ثوان تأكد من RRR
بعد الصفقة: سجل النتيجة حلل الأخطاء اكتب الدرس`;

    await this.bot.sendMessage(chatId, plan);
  }

  async handleStatistics(msg) {
    const chatId = msg.chat.id;

    // استحصل البيانات من Notion
    const stats = await this.notion.getRecentStats();

    const statsMessage = `الإحصائيات: إجمالي الصفقات ${stats.totalTrades || '-'}, الفائز ${stats.wins || '-'}, الخاسر ${stats.losses || '-'}, Win Rate ${stats.winRate || '-'}%. الربح/الخسارة: ${stats.pnl || '-'}, Discipline Score: ${stats.disciplineScore || '-'}/100, أكثر خطأ: ${stats.topMistake || 'لا يوجد'}`;

    await this.bot.sendMessage(chatId, statsMessage);
  }

  async handleNewTrade(msg) {
    const chatId = msg.chat.id;

    const prompt = `سجل الصفقة: الزوج - دخول - خروج - هدف - ستوب - وقت - نتيجة.`;

    await this.bot.sendMessage(chatId, prompt);
  }

  // ==================== معالجة البيانات ====================

  async handleTradeData(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // محاولة فك البيانات
    const tradeData = this.parseTradeData(text);

    if (!tradeData.isValid) {
      await this.bot.sendMessage(chatId, `بيانات غير صحيحة. أعد المحاولة.`);
      return;
    }

    // حفظ في Notion
    await this.notion.saveTrade(tradeData);

    // تحليل فوري
    const analysis = this.analyzeTradeQuick(tradeData);

    // إرسال النتيجة
    const response = `تم تسجيل الصفقة. النتيجة: ${analysis.result}, PnL: ${analysis.pnl}. التحليل: ${analysis.personality}, ${analysis.lesson}. التالي: ${analysis.nextAction}`;

    await this.bot.sendMessage(chatId, response);

    // تحديث الحالة
    this.userState.tradesCount++;
    this.userState.dailyLoss += analysis.pnlValue;
    this.userState.lastTrade = tradeData;

    // التحقق من الحدود
    if (this.userState.tradesCount >= 2) {
      await this.bot.sendMessage(chatId, `وصلت الحد اليومي. لا صفقات جديدة.`);
    }

    if (this.userState.dailyLoss <= -600) {
      await this.bot.sendMessage(chatId, `STOP. خسارة اليوم وصلت الحد الأقصى.`);
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

    let personality = 'Pro';
    let lesson = 'تحليل دقيق وتنفيذ صحيح';
    let nextAction = 'استمر بنفس الأسلوب';

    if (trade.psychology === 'Chaos') {
      personality = 'Chaos';
      lesson = 'تحليل عاطفي - اعتمد على الماكرو فقط';
      nextAction = 'توقف قبل الصفقة التالية';
    } else if (trade.psychology === 'Greedy') {
      personality = 'Greedy';
      lesson = 'مستعجل - أنتظر تأكيدات إضافية';
      nextAction = 'عد ثوان قبل الدخول';
    } else if (trade.psychology === 'Fear') {
      personality = 'Fear';
      lesson = 'خوف من الدخول - ركز على الثقة';
      nextAction = 'خذ نص الحجم وادخل';
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
      return { name: 'London', status: 'Active' };
    } else if (hour >= 0 && hour < 6) {
      return { name: 'Asia', status: 'Active' };
    } else if (hour >= 13 && hour < 21) {
      return { name: 'NewYork', status: 'Active' };
    } else {
      return { name: 'Closed', status: 'Closed' };
    }
  }

  generateTrendEmoji(trend) {
    if (!trend) return 'بيانات غير كافية';
    if (trend > 0) return 'اتجاه إيجابي';
    if (trend < 0) return 'اتجاه سلبي';
    return 'ثابت';
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
