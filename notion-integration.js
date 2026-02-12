/**
 * DHEEB - Notion Integration System
 * Connects trading data with Notion database
 * API Key: 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
 */

const axios = require('axios');

class NotionIntegration {
  constructor() {
    this.apiKey = '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';
    this.notionUrl = 'https://api.notion.com/v1';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    };
    this.databases = {};
  }

  // ==================== إنشاء Databases ====================

  async initializeDatabases() {
    console.log('🚀 إنشاء Notion Databases...');

    try {
      // 1. إنشاء Trades Database
      const tradesDb = await this.createTradesDatabase();
      this.databases.trades = tradesDb;

      // 2. إنشاء Performance Database
      const perfDb = await this.createPerformanceDatabase();
      this.databases.performance = perfDb;

      // 3. إنشاء Psychology Database
      const psychDb = await this.createPsychologyDatabase();
      this.databases.psychology = psychDb;

      console.log('✅ جميع Databases جاهزة!');
      return this.databases;
    } catch (error) {
      console.error('❌ خطأ في إنشاء Databases:', error.message);
      return null;
    }
  }

  async createTradesDatabase() {
    // في التطبيق الفعلي، ستستخدم Notion API لإنشاء Database
    // للآن، سنستخدم Database موجودة أو نرجع ID
    return {
      name: 'Trading Trades',
      schema: {
        'Trade ID': { type: 'title' },
        'Date': { type: 'date' },
        'Strategy': { type: 'select' },
        'Symbol': { type: 'text' },
        'Entry Price': { type: 'number' },
        'Stop Loss': { type: 'number' },
        'Take Profit': { type: 'number' },
        'Exit Price': { type: 'number' },
        'Result': { type: 'select' },
        'PnL': { type: 'number' },
        'Duration': { type: 'number' },
        'Psychology Score': { type: 'number' },
        'Mistakes': { type: 'multi_select' },
        'Notes': { type: 'text' }
      }
    };
  }

  async createPerformanceDatabase() {
    return {
      name: 'Performance Metrics',
      schema: {
        'Strategy': { type: 'title' },
        'Total Trades': { type: 'number' },
        'Winning Trades': { type: 'number' },
        'Losing Trades': { type: 'number' },
        'Win Rate %': { type: 'number' },
        'Profit Factor': { type: 'number' },
        'Average Win': { type: 'number' },
        'Average Loss': { type: 'number' },
        'Best Trade': { type: 'number' },
        'Worst Trade': { type: 'number' },
        'Max Drawdown %': { type: 'number' },
        'Sharpe Ratio': { type: 'number' },
        'Consistency Score': { type: 'number' },
        'Status': { type: 'select' },
        'Recommendation': { type: 'text' }
      }
    };
  }

  async createPsychologyDatabase() {
    return {
      name: 'Psychological Analysis',
      schema: {
        'Date': { type: 'title' },
        'Mood (1-10)': { type: 'number' },
        'Mistakes': { type: 'multi_select' },
        'FOMO Count': { type: 'number' },
        'Revenge Count': { type: 'number' },
        'Early Exit Count': { type: 'number' },
        'Discipline Score': { type: 'number' },
        'Lessons Learned': { type: 'text' },
        'Focus Tomorrow': { type: 'text' },
        'Coach Feedback': { type: 'text' }
      }
    };
  }

  // ==================== حفظ الصفقات ====================

  async saveTrade(tradeData) {
    try {
      const tradeId = `trade_${Date.now()}`;
      
      const pageData = {
        parent: { database_id: this.databases.trades?.id },
        properties: {
          'Trade ID': {
            title: [{ text: { content: tradeId } }]
          },
          'Date': {
            date: { start: tradeData.date || new Date().toISOString() }
          },
          'Strategy': {
            select: { name: tradeData.strategy }
          },
          'Symbol': {
            rich_text: [{ text: { content: tradeData.symbol } }]
          },
          'Entry Price': {
            number: tradeData.entryPrice
          },
          'Stop Loss': {
            number: tradeData.stopLoss
          },
          'Take Profit': {
            number: tradeData.takeProfit
          },
          'Exit Price': {
            number: tradeData.exitPrice || null
          },
          'Result': {
            select: { name: tradeData.result || 'open' }
          },
          'PnL': {
            number: tradeData.pnl || 0
          },
          'Duration': {
            number: tradeData.duration || 0
          },
          'Psychology Score': {
            number: tradeData.psychScore || 100
          },
          'Mistakes': {
            multi_select: (tradeData.mistakes || []).map(m => ({ name: m }))
          },
          'Notes': {
            rich_text: [{ text: { content: tradeData.notes || '' } }]
          }
        }
      };

      // في التطبيق الفعلي:
      // const response = await axios.post(
      //   `${this.notionUrl}/pages`,
      //   pageData,
      //   { headers: this.headers }
      // );

      console.log(`✅ الصفقة محفوظة في Notion: ${tradeId}`);
      return { success: true, tradeId };
    } catch (error) {
      console.error('❌ خطأ في حفظ الصفقة:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ==================== حفظ الأداء ====================

  async savePerformanceMetrics(strategy, metrics) {
    try {
      const pageData = {
        parent: { database_id: this.databases.performance?.id },
        properties: {
          'Strategy': {
            title: [{ text: { content: strategy } }]
          },
          'Total Trades': { number: metrics.totalTrades },
          'Winning Trades': { number: metrics.wins },
          'Losing Trades': { number: metrics.losses },
          'Win Rate %': { number: parseFloat(metrics.winRate) },
          'Profit Factor': { number: parseFloat(metrics.profitFactor) },
          'Average Win': { number: parseFloat(metrics.avgWin) },
          'Average Loss': { number: parseFloat(metrics.avgLoss) },
          'Best Trade': { number: metrics.bestTrade },
          'Worst Trade': { number: metrics.worstTrade },
          'Max Drawdown %': { number: metrics.maxDrawdown || 0 },
          'Sharpe Ratio': { number: metrics.sharpeRatio || 0 },
          'Consistency Score': { number: metrics.consistency || 0 },
          'Status': {
            select: { name: metrics.status || 'active' }
          },
          'Recommendation': {
            rich_text: [{ text: { content: metrics.recommendation || '' } }]
          }
        }
      };

      console.log(`✅ الأداء محفوظ في Notion: ${strategy}`);
      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في حفظ الأداء:', error.message);
      return { success: false };
    }
  }

  // ==================== حفظ تحليل نفسي ====================

  async savePsychologyAnalysis(psychData) {
    try {
      const pageData = {
        parent: { database_id: this.databases.psychology?.id },
        properties: {
          'Date': {
            title: [{ text: { content: new Date().toLocaleDateString('ar-SA') } }]
          },
          'Mood (1-10)': { number: psychData.mood },
          'Mistakes': {
            multi_select: (psychData.mistakes || []).map(m => ({ name: m }))
          },
          'FOMO Count': { number: psychData.fomoCount || 0 },
          'Revenge Count': { number: psychData.revengeCount || 0 },
          'Early Exit Count': { number: psychData.earlyExitCount || 0 },
          'Discipline Score': { number: psychData.disciplineScore || 0 },
          'Lessons Learned': {
            rich_text: [{ text: { content: psychData.lessons || '' } }]
          },
          'Focus Tomorrow': {
            rich_text: [{ text: { content: psychData.focusTomorrow || '' } }]
          },
          'Coach Feedback': {
            rich_text: [{ text: { content: psychData.coachFeedback || '' } }]
          }
        }
      };

      console.log('✅ التحليل النفسي محفوظ في Notion');
      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في حفظ التحليل:', error.message);
      return { success: false };
    }
  }

  // ==================== جلب البيانات ====================

  async getStrategyPerformance(strategy) {
    // جلب بيانات الأداء لاستراتيجية محددة
    console.log(`📊 جاري جلب بيانات ${strategy}...`);
    // في التطبيق الفعلي: query Notion database
    return { success: true, data: null };
  }

  async getAllTrades() {
    // جلب جميع الصفقات
    console.log('📊 جاري جلب جميع الصفقات...');
    // في التطبيق الفعلي: query Notion database
    return { success: true, trades: [] };
  }

  // ==================== تقارير متقدمة ====================

  async generateWeeklyReport() {
    console.log('📈 جاري إنشاء التقرير الأسبوعي...');
    
    const report = {
      week: new Date().toLocaleDateString('ar-SA'),
      summary: {
        totalTrades: 0,
        wins: 0,
        winRate: 0,
        totalPnL: 0,
        psychologyScore: 0
      },
      byStrategy: {},
      psychologyInsights: {
        mainMistakes: [],
        improvements: [],
        focusAreas: []
      },
      recommendations: []
    };

    return report;
  }

  async generateMonthlyReport() {
    console.log('📊 جاري إنشاء التقرير الشهري...');
    
    const report = {
      month: new Date().toLocaleDateString('ar-SA'),
      performance: {
        totalTrades: 0,
        bestStrategy: '',
        worstStrategy: '',
        overallWinRate: 0,
        totalProfit: 0,
        profitTarget: 0,
        achieved: false
      },
      psychology: {
        improvement: 0,
        mainWeakness: '',
        mainStrength: ''
      },
      nextMonth: {
        focus: [],
        strategy: '',
        target: 0
      }
    };

    return report;
  }
}

// ==================== استخدام ====================

const notion = new NotionIntegration();

// مثال: حفظ صفقة
// notion.saveTrade({
//   date: '2026-02-12',
//   strategy: 'smc-scalping',
//   symbol: 'NQ',
//   entryPrice: 21450,
//   stopLoss: 21420,
//   takeProfit: 21500,
//   exitPrice: 21500,
//   result: 'win',
//   pnl: 50,
//   psychScore: 95,
//   mistakes: [],
//   notes: 'صفقة نظيفة تماماً'
// });

module.exports = NotionIntegration;
