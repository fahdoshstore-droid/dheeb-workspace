/**
 * DHEEB Trading System Integration
 * Combines strategies, performance tracking, and psychological support
 */

const fs = require('fs');
const path = require('path');

class TradingSystem {
  constructor() {
    this.trades = [];
    this.strategies = this.loadStrategies();
    this.psychology = this.loadPsychology();
    this.performanceFile = path.join(__dirname, 'trading-trades.json');
    this.loadTrades();
  }

  // ==================== استراتيجيات ====================

  loadStrategies() {
    return {
      'smc-scalping': {
        name: 'SMC Scalping',
        timeframe: '1M-5M',
        targetWinRate: 0.60,
        riskPercent: 0.01,
        tpPoints: 8,
        slPoints: 3,
        indicators: ['ema9-21', 'rsi', 'delta', 'ob']
      },
      'day-trading': {
        name: 'Day Trading - SMC',
        timeframe: '15M-1H',
        targetWinRate: 0.55,
        riskPercent: 0.02,
        tpPoints: 35,
        slPoints: 10,
        indicators: ['macd', 'volume', 'ob', 'fvg']
      },
      'swing-trading': {
        name: 'Swing Trading',
        timeframe: '4H-1D',
        targetWinRate: 0.50,
        riskPercent: 0.02,
        tpPoints: 150,
        slPoints: 30,
        indicators: ['ema50-200', 'macd', 'atr', 'ob']
      },
      'rejection': {
        name: 'Rejection Strategy',
        timeframe: '1H-4H',
        targetWinRate: 0.58,
        riskPercent: 0.015,
        tpPoints: 35,
        slPoints: 15,
        indicators: ['resistance', 'wick', 'volume', 'rsi']
      },
      'fvg-recovery': {
        name: 'FVG Recovery',
        timeframe: '1H-4H',
        targetWinRate: 0.62,
        riskPercent: 0.01,
        tpPoints: 25,
        slPoints: 20,
        indicators: ['fvg', 'poc', 'support', 'volume']
      }
    };
  }

  // ==================== تسجيل الصفقات ====================

  recordTrade(tradeData) {
    const trade = {
      id: `trade_${Date.now()}`,
      timestamp: new Date().toISOString(),
      strategy: tradeData.strategy,
      symbol: tradeData.symbol,
      type: tradeData.type, // BUY/SELL
      entryPrice: tradeData.entryPrice,
      entryTime: new Date().toISOString(),
      quantity: tradeData.quantity || 1,
      stopLoss: tradeData.stopLoss,
      takeProfit: tradeData.takeProfit,
      riskAmount: tradeData.riskAmount,
      riskPercent: tradeData.riskPercent,
      status: 'open',
      result: null,
      pnl: null,
      pnlPercent: null,
      duration: null,
      closeTime: null,
      notes: tradeData.notes || ''
    };

    this.trades.push(trade);
    this.saveTrades();

    return this.getPsychologyMessage('trade-opened', trade);
  }

  closeTrade(tradeId, exitPrice, reason = 'take-profit') {
    const trade = this.trades.find(t => t.id === tradeId);
    if (!trade) return { error: 'Trade not found' };

    trade.closeTime = new Date().toISOString();
    trade.status = 'closed';
    
    // حساب الـ PnL
    const direction = trade.type === 'BUY' ? 1 : -1;
    const pnlPoints = (exitPrice - trade.entryPrice) * direction;
    trade.pnl = pnlPoints * trade.quantity;
    trade.pnlPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    
    // حساب المدة
    const duration = new Date(trade.closeTime) - new Date(trade.entryTime);
    trade.duration = Math.round(duration / 60000); // بالدقائق
    
    // تحديد النتيجة
    if (reason === 'stop-loss' || pnlPoints < 0) {
      trade.result = 'loss';
    } else if (reason === 'take-profit' || pnlPoints > 0) {
      trade.result = 'win';
    } else {
      trade.result = 'breakeven';
    }

    this.saveTrades();
    return this.getPsychologyMessage('trade-closed', trade);
  }

  // ==================== حسابات الأداء ====================

  getPerformanceStats() {
    const closedTrades = this.trades.filter(t => t.status === 'closed');
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        totalPnL: 0,
        byStrategy: {}
      };
    }

    const wins = closedTrades.filter(t => t.result === 'win');
    const losses = closedTrades.filter(t => t.result === 'loss');
    
    const totalWinPnL = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLossPnL = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    
    const stats = {
      totalTrades: closedTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: (wins.length / closedTrades.length * 100).toFixed(2),
      avgWin: wins.length > 0 ? (totalWinPnL / wins.length).toFixed(2) : 0,
      avgLoss: losses.length > 0 ? (totalLossPnL / losses.length).toFixed(2) : 0,
      profitFactor: totalLossPnL > 0 ? (totalWinPnL / totalLossPnL).toFixed(2) : 0,
      totalPnL: totalWinPnL - totalLossPnL,
      byStrategy: {}
    };

    // إحصائيات حسب الاستراتيجية
    for (const [strategyKey, strategy] of Object.entries(this.strategies)) {
      const stratTrades = closedTrades.filter(t => t.strategy === strategyKey);
      if (stratTrades.length > 0) {
        const stratWins = stratTrades.filter(t => t.result === 'win');
        stats.byStrategy[strategy.name] = {
          trades: stratTrades.length,
          wins: stratWins.length,
          winRate: (stratWins.length / stratTrades.length * 100).toFixed(2),
          pnl: stratTrades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)
        };
      }
    }

    return stats;
  }

  // ==================== الدعم النفسي ====================

  loadPsychology() {
    return {
      'trade-opened': [
        '✅ صفقة مفتوحة. الالتزام بـ SL/TP الآن.',
        '🎯 الصفقة محفوظة. لا تغيير بدون سبب قوي.',
        '⏱️ الوقت سيحكم. انتظر النتيجة.'
      ],
      'trade-closed-win': [
        '✅ صفقة رابحة. نمط صحيح. استمر.',
        '🎯 فوز = التزام بالنظام. كرر.',
        '💪 صفقة واحدة صحيحة اقتربك من الهدف.'
      ],
      'trade-closed-loss': [
        '⚠️ خسارة محدودة. النظام عمل. الصفقة القادمة مهمة.',
        '🛑 توقف 30 دقيقة قبل الصفقة التالية.',
        '📋 اكتب الخطأ. لا تكرره غداً.'
      ],
      'warning-overconfidence': [
        '⚠️ سلسلة فوز = خطر. قلل الحجم الآن.',
        '🚨 الإفراط في الثقة أكثر خطراً من الخوف.',
        '⛔ لا تغير Stop Loss. الاستراتيجية ثابتة.'
      ],
      'warning-fear': [
        '💡 الخوف لا يقلل الخسارة. يقللها التأخير.',
        '⏳ إذا خائف؟ انتظر صفقة أفضل.',
        '✔️ Breakeven > رابح بعاطفة. ثق بـ SL.'
      ],
      'warning-revenge': [
        '❌ لا تحاول استرجاع الخسارة بصفقة أكبر.',
        '🧠 Revenge Trade = أسوأ صفقة ستفتحها.',
        '⏸️ توقف 1 ساعة. الصفقة ستنتظرك.'
      ],
      'daily-report': [
        'النتائج واضحة. الالتزام يبني الثقة.',
        'كم صفقة وفزت كم؟ القسم بتبني النظام.',
        'أسبوع جديد = فرصة جديدة. استعد الآن.'
      ]
    };
  }

  getPsychologyMessage(messageType, tradeData = null) {
    const messages = this.psychology[messageType] || [];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    if (messageType === 'trade-closed-win' || messageType === 'trade-closed-loss') {
      const stats = this.getPerformanceStats();
      return {
        message: randomMsg,
        stats: {
          totalTrades: stats.totalTrades,
          winRate: stats.winRate,
          pnl: stats.totalPnL.toFixed(2)
        }
      };
    }

    return { message: randomMsg };
  }

  // ==================== التحذيرات السلوكية ====================

  checkPsychologicalWarnings() {
    const closedTrades = this.trades.filter(t => t.status === 'closed').slice(-10);
    const openTrades = this.trades.filter(t => t.status === 'open');
    
    const warnings = [];

    // تحذير من الإفراط في الثقة
    if (closedTrades.length >= 3) {
      const last3 = closedTrades.slice(-3).filter(t => t.result === 'win').length;
      if (last3 === 3) {
        warnings.push({
          type: 'overconfidence',
          severity: 'high',
          message: this.psychology['warning-overconfidence'][0]
        });
      }
    }

    // تحذير من سلسلة خسائر
    if (closedTrades.length >= 3) {
      const last3Losses = closedTrades.slice(-3).filter(t => t.result === 'loss').length;
      if (last3Losses === 3) {
        warnings.push({
          type: 'fear',
          severity: 'critical',
          message: '🛑 توقف فوراً. 3 خسائر متتالية. لا تتاجر الآن.'
        });
      }
    }

    // تحذير من Revenge Trade
    if (closedTrades.length >= 1) {
      const lastTrade = closedTrades[closedTrades.length - 1];
      if (lastTrade.result === 'loss' && openTrades.length > 0) {
        const timeSinceLoss = Date.now() - new Date(lastTrade.closeTime);
        if (timeSinceLoss < 300000) { // أقل من 5 دقائق
          warnings.push({
            type: 'revenge',
            severity: 'high',
            message: this.psychology['warning-revenge'][0]
          });
        }
      }
    }

    return warnings;
  }

  // ==================== ملفات الحفظ ====================

  saveTrades() {
    fs.writeFileSync(this.performanceFile, JSON.stringify(this.trades, null, 2));
  }

  loadTrades() {
    if (fs.existsSync(this.performanceFile)) {
      const data = fs.readFileSync(this.performanceFile, 'utf8');
      try {
        this.trades = JSON.parse(data);
      } catch (e) {
        this.trades = [];
      }
    }
  }

  // ==================== التقارير ====================

  generateDailyReport() {
    const today = new Date().toDateString();
    const todayTrades = this.trades.filter(t => 
      new Date(t.timestamp).toDateString() === today && t.status === 'closed'
    );

    if (todayTrades.length === 0) {
      return {
        date: today,
        summary: '📊 لا توجد صفقات مغلقة اليوم.',
        detail: []
      };
    }

    const wins = todayTrades.filter(t => t.result === 'win').length;
    const totalPnL = todayTrades.reduce((sum, t) => sum + t.pnl, 0);

    return {
      date: today,
      summary: `📊 ${todayTrades.length} صفقة | ${wins} فوز | PnL: ${totalPnL.toFixed(2)}`,
      detail: todayTrades.map(t => ({
        strategy: t.strategy,
        symbol: t.symbol,
        result: t.result,
        pnl: t.pnl,
        duration: `${t.duration}m`
      }))
    };
  }

  generateWeeklyReport() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekTrades = this.trades.filter(t => 
      new Date(t.timestamp) > sevenDaysAgo && t.status === 'closed'
    );

    const stats = this.getPerformanceStats();
    const bestTrade = weekTrades.reduce((max, t) => t.pnl > max.pnl ? t : max, { pnl: -Infinity });
    const worstTrade = weekTrades.reduce((min, t) => t.pnl < min.pnl ? t : min, { pnl: Infinity });

    return {
      period: 'آخر 7 أيام',
      trades: weekTrades.length,
      winRate: stats.winRate,
      totalPnL: stats.totalPnL.toFixed(2),
      bestTrade: bestTrade.pnl !== -Infinity ? bestTrade.pnl : 0,
      worstTrade: worstTrade.pnl !== Infinity ? worstTrade.pnl : 0,
      byStrategy: stats.byStrategy
    };
  }
}

module.exports = TradingSystem;
