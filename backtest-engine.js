/**
 * DHEEB Backtest Engine
 * يقيّم الاستراتيجيات بناءً على البيانات التاريخية (جورنال الصفقات)
 */

class BacktestEngine {
  constructor() {
    this.strategies = {
      'smc-scalping': { name: 'SMC Scalping', targetWR: 0.60, timeframe: '1M-5M' },
      'day-trading': { name: 'Day Trading', targetWR: 0.55, timeframe: '15M-1H' },
      'swing-trading': { name: 'Swing Trading', targetWR: 0.50, timeframe: '4H-1D' },
      'rejection': { name: 'Rejection', targetWR: 0.58, timeframe: '1H-4H' },
      'fvg-recovery': { name: 'FVG Recovery', targetWR: 0.62, timeframe: '1H-4H' }
    };
  }

  // ==================== تحليل الصفقات التاريخية ====================

  analyzeTrades(trades) {
    const byStrategy = {};

    // تجميع الصفقات حسب الاستراتيجية
    trades.forEach(trade => {
      if (!byStrategy[trade.strategy]) {
        byStrategy[trade.strategy] = [];
      }
      byStrategy[trade.strategy].push(trade);
    });

    // تحليل كل استراتيجية
    const results = {};
    for (const [strategyKey, strategyTrades] of Object.entries(byStrategy)) {
      results[strategyKey] = this.analyzeStrategy(strategyKey, strategyTrades);
    }

    return results;
  }

  analyzeStrategy(strategyKey, trades) {
    if (trades.length === 0) {
      return { trades: 0, error: 'لا توجد صفقات لهذه الاستراتيجية' };
    }

    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const breakeven = trades.filter(t => t.result === 'breakeven').length;

    // حسابات أساسية
    const winRate = (wins / trades.length * 100).toFixed(2);
    const totalWinPnL = trades.filter(t => t.result === 'win').reduce((sum, t) => sum + t.pnl, 0);
    const totalLossPnL = Math.abs(trades.filter(t => t.result === 'loss').reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLossPnL > 0 ? (totalWinPnL / totalLossPnL).toFixed(2) : 0;

    // متوسطات
    const avgWin = wins > 0 ? (totalWinPnL / wins).toFixed(2) : 0;
    const avgLoss = losses > 0 ? (totalLossPnL / losses).toFixed(2) : 0;

    // أفضل وأسوأ صفقة
    const bestTrade = Math.max(...trades.map(t => t.pnl));
    const worstTrade = Math.min(...trades.map(t => t.pnl));

    // Max Drawdown
    const drawdown = this.calculateMaxDrawdown(trades);

    // Sharpe Ratio
    const sharpe = this.calculateSharpeRatio(trades);

    // Consistency (عدد الصفقات - أكثر = أفضل)
    const consistency = Math.min(100, trades.length * 5);

    // Overall Score
    const score = this.calculateOverallScore(winRate, profitFactor, sharpe, consistency);

    // Status و Recommendation
    const status = this.determineStatus(winRate, profitFactor, trades.length);
    const recommendation = this.getRecommendation(winRate, profitFactor, trades.length, strategyKey);

    return {
      strategy: this.strategies[strategyKey].name,
      totalTrades: trades.length,
      wins: wins,
      losses: losses,
      breakeven: breakeven,
      winRate: parseFloat(winRate),
      avgWin: parseFloat(avgWin),
      avgLoss: parseFloat(avgLoss),
      profitFactor: parseFloat(profitFactor),
      bestTrade: bestTrade,
      worstTrade: worstTrade,
      totalPnL: totalWinPnL - totalLossPnL,
      maxDrawdown: parseFloat(drawdown),
      sharpeRatio: parseFloat(sharpe),
      consistency: consistency,
      overallScore: score,
      status: status,
      recommendation: recommendation,
      performanceVsTarget: {
        targetWR: this.strategies[strategyKey].targetWR * 100,
        actualWR: parseFloat(winRate),
        achieved: parseFloat(winRate) >= this.strategies[strategyKey].targetWR * 100
      }
    };
  }

  // ==================== حسابات متقدمة ====================

  calculateMaxDrawdown(trades) {
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;

    trades.forEach(trade => {
      runningTotal += trade.pnl;
      if (runningTotal > peak) {
        peak = runningTotal;
      } else {
        const drawdown = ((peak - runningTotal) / peak) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    });

    return Math.max(0, maxDrawdown);
  }

  calculateSharpeRatio(trades) {
    if (trades.length < 2) return 0;

    const pnls = trades.map(t => t.pnl);
    const avgPnL = pnls.reduce((a, b) => a + b) / pnls.length;
    
    const variance = pnls.reduce((sum, pnl) => 
      sum + Math.pow(pnl - avgPnL, 2), 0) / pnls.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // افترض risk-free rate = 0
    const sharpe = (avgPnL / stdDev) * Math.sqrt(252); // annual
    return Math.max(-10, Math.min(10, sharpe)); // حد أقصى ±10
  }

  calculateOverallScore(wr, pf, sharpe, consistency) {
    // وزن المعايير:
    // Win Rate: 40%
    // Profit Factor: 35%
    // Sharpe Ratio: 15%
    // Consistency: 10%

    const wrScore = Math.min(100, (wr / 60) * 100) * 0.40;
    const pfScore = Math.min(100, (pf / 2) * 100) * 0.35;
    const sharpeScore = Math.min(100, ((sharpe + 10) / 20) * 100) * 0.15;
    const consistencyScore = consistency * 0.10;

    return (wrScore + pfScore + sharpeScore + consistencyScore).toFixed(2);
  }

  determineStatus(wr, pf, tradeCount) {
    if (tradeCount < 10) return 'تحت الاختبار';
    if (wr >= 55 && pf >= 1.5) return '⭐ ممتازة';
    if (wr >= 52 && pf >= 1.2) return '✅ جيدة';
    if (wr >= 50 && pf >= 1.0) return '⚠️ متوسطة';
    return '❌ ضعيفة';
  }

  getRecommendation(wr, pf, tradeCount, strategyKey) {
    if (tradeCount < 10) {
      return 'تراكم بيانات. أكمل التطبيق';
    }

    if (wr >= 55 && pf >= 1.5) {
      return `✅ FOCUS على ${this.strategies[strategyKey].name} - هذه استراتيجيتك الأساسية`;
    }

    if (wr >= 52 && pf >= 1.2) {
      return `👍 جيدة لكن حسنها - اركز على قواعس الدخول`;
    }

    if (wr >= 50) {
      return `⚠️ متوسطة - راجع المؤشرات وشروط الدخول`;
    }

    return `❌ ضعيفة - رقد هذه الاستراتيجية مؤقتاً`;
  }

  // ==================== استخراج أفضل استراتيجية ====================

  getBestStrategy(allResults) {
    let best = null;
    let bestScore = -1;

    for (const [key, result] of Object.entries(allResults)) {
      if (result.totalTrades >= 10 && result.overallScore > bestScore) {
        best = { key, ...result };
        bestScore = result.overallScore;
      }
    }

    if (!best) {
      // إذا ما فيش 10 صفقات، خذ الأفضل حسب Win Rate
      for (const [key, result] of Object.entries(allResults)) {
        if (result.winRate > (best?.winRate || 0)) {
          best = { key, ...result };
        }
      }
    }

    return best;
  }

  // ==================== تقرير Backtest شامل ====================

  generateBacktestReport(trades) {
    const allResults = this.analyzeTrades(trades);
    const bestStrategy = this.getBestStrategy(allResults);

    const report = {
      timestamp: new Date().toISOString(),
      totalTrades: trades.length,
      period: `${this.getPeriod(trades)}`,
      
      strategies: allResults,
      
      bestStrategy: bestStrategy ? {
        name: bestStrategy.strategy,
        key: bestStrategy.key,
        winRate: bestStrategy.winRate,
        profitFactor: bestStrategy.profitFactor,
        totalPnL: bestStrategy.totalPnL,
        recommendation: bestStrategy.recommendation,
        overallScore: bestStrategy.overallScore,
        focus: `ركز 100% على هذه الاستراتيجية للشهر القادم`
      } : null,

      worstStrategy: this.getWorstStrategy(allResults),

      ranking: this.getRanking(allResults),

      summary: {
        overallWinRate: (trades.filter(t => t.result === 'win').length / trades.length * 100).toFixed(2),
        totalProfit: trades.reduce((sum, t) => sum + t.pnl, 0),
        averageWin: (trades.filter(t => t.result === 'win').reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.result === 'win').length).toFixed(2),
        averageLoss: (Math.abs(trades.filter(t => t.result === 'loss').reduce((sum, t) => sum + t.pnl, 0)) / trades.filter(t => t.result === 'loss').length).toFixed(2)
      },

      nextSteps: [
        `1️⃣ ركز على: ${bestStrategy?.strategy}`,
        `2️⃣ تجنب: ${this.getWorstStrategy(allResults)?.strategy}`,
        `3️⃣ هدفك الشهري: ${bestStrategy ? bestStrategy.winRate * 1.5 : 60}% Win Rate`,
        `4️⃣ أهم شيء: الانضباط النفسي (لا FOMO, Revenge)`
      ]
    };

    return report;
  }

  getWorstStrategy(allResults) {
    let worst = null;
    let worstScore = Infinity;

    for (const [key, result] of Object.entries(allResults)) {
      if (result.totalTrades >= 3 && result.overallScore < worstScore) {
        worst = { key, ...result };
        worstScore = result.overallScore;
      }
    }

    return worst;
  }

  getRanking(allResults) {
    return Object.entries(allResults)
      .filter(([_, result]) => result.totalTrades >= 3)
      .map(([key, result]) => ({
        rank: 0,
        strategy: result.strategy,
        winRate: result.winRate,
        score: result.overallScore
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  getPeriod(trades) {
    if (trades.length === 0) return 'N/A';
    
    const dates = trades.map(t => new Date(t.date || t.timestamp));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const days = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    return `${days} أيام`;
  }
}

module.exports = BacktestEngine;
