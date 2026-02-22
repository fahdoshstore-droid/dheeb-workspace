/**
 * Dheeb Trading Bot - Main Entry Point
 * Integrated with WhatsApp/Telegram for alerts
 */

const TradingSystem = require('./trading-system');

// تهيئة النظام
const trading = new TradingSystem();

// ==================== الأوامر ====================

const commands = {
  // تسجيل صفقة جديدة
  'entry': (args) => {
    const trade = trading.recordTrade({
      strategy: args.strategy || 'manual',
      symbol: args.symbol || 'MNQ',
      type: args.type, // BUY/SELL
      entryPrice: args.price,
      quantity: args.qty || 1,
      stopLoss: args.sl,
      takeProfit: args.tp,
      riskPercent: args.risk || 1,
      notes: args.notes || ''
    });
    return trade;
  },

  // إغلاق صفقة
  'close': (tradeId, exitPrice, reason) => {
    return trading.closeTrade(tradeId, exitPrice, reason);
  },

  // أداء التقرير
  'stats': () => {
    return trading.getPerformanceStats();
  },

  // تقرير يومي
  'daily': () => {
    return trading.generateDailyReport();
  },

  // تقرير أسبوعي
  'weekly': () => {
    return trading.generateWeeklyReport();
  },

  // فحص التحذيرات النفسية
  'check': () => {
    const warnings = trading.checkPsychologicalWarnings();
    return {
      warnings: warnings,
      stats: trading.getPerformanceStats()
    };
  }
};

// ==================== Cron Jobs ====================

const cronJobs = {
  // فحص السوق كل ساعة
  'market-check': {
    schedule: '0 * * * *', // كل ساعة
    action: () => {
      // TODO: جلب سعر NQ
      // TODO: فحص Setup
      // TODO: إرسال تنبيه إذاconditions met
      console.log('🔍 Market check...');
    }
  },

  // فحص وقت Killzone
  'killzone-check': {
    schedule: '30 9 * * 1-5', // 9:30 UTC يومياً
    action: () => {
      console.log('🎯 Killzone started - sending alert');
      // TODO: إرسال تنبيه للواتساب
    }
  },

  // فحص وقت الجلسة
  'london-check': {
    schedule: '30 8 * * 1-5', // 8:30 UTC
    action: () => {
      console.log('🇬🇧 London Session - sending alert');
    }
  }
};

module.exports = {
  trading,
  commands,
  cronJobs
};
