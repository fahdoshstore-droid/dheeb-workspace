/**
 * 🐺 PERFORMANCE TRACKER
 * Tracks and analyzes trading performance
 */

class PerformanceTracker {
  constructor() {
    this.history = [];
  }

  // Calculate win rate
  getWinRate(trades) {
    const closed = trades.filter(t => t.status === 'closed');
    if (closed.length === 0) return 0;
    const wins = closed.filter(t => t.result === 'win').length;
    return Math.round(wins / closed.length * 100);
  }

  // Average win/loss
  getAvgWinLoss(trades) {
    const closed = trades.filter(t => t.status === 'closed');
    const wins = closed.filter(t => t.result === 'win');
    const losses = closed.filter(t => t.result === 'loss');
    
    const avgWin = wins.length > 0 
      ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length 
      : 0;
    
    const avgLoss = losses.length > 0 
      ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length)
      : 0;
    
    return { avgWin, avgLoss };
  }

  // Risk/Reward ratio
  getRR(trades) {
    const { avgWin, avgLoss } = this.getAvgWinLoss(trades);
    if (avgLoss === 0) return 0;
    return (avgWin / avgLoss).toFixed(2);
  }

  // Best/worst trade
  getBestWorst(trades) {
    const closed = trades.filter(t => t.status === 'closed');
    if (closed.length === 0) return { best: 0, worst: 0 };
    
    const best = Math.max(...closed.map(t => t.pnl));
    const worst = Math.min(...closed.map(t => t.pnl));
    
    return { best, worst };
  }

  // By strategy
  getByStrategy(trades) {
    const strategies = {};
    trades.forEach(t => {
      if (!strategies[t.strategy]) {
        strategies[t.strategy] = { wins: 0, losses: 0, pnl: 0 };
      }
      if (t.result === 'win') strategies[t.strategy].wins++;
      else if (t.result === 'loss') strategies[t.strategy].losses++;
      strategies[t.strategy].pnl += t.pnl;
    });
    return strategies;
  }

  // Daily breakdown
  getByDay(trades) {
    const days = {};
    trades.forEach(t => {
      const day = t.timestamp.split('T')[0];
      if (!days[day]) days[day] = { wins: 0, losses: 0, pnl: 0 };
      if (t.result === 'win') days[day].wins++;
      else if (t.result === 'loss') days[day].losses++;
      days[day].pnl += t.pnl;
    });
    return days;
  }

  // Full report
  report(trades) {
    return {
      total: trades.length,
      winRate: this.getWinRate(trades),
      ...this.getAvgWinLoss(trades),
      rr: this.getRR(trades),
      ...this.getBestWorst(trades),
      byDay: this.getByDay(trades)
    };
  }
}

module.exports = PerformanceTracker;
