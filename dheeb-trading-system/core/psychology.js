/**
 * 🐺 PSYCHOLOGY MODULE
 * Extended features for trading psychology
 */

class PsychologyTracker {
  constructor() {
    this.consecutiveLosses = 0;
    this.consecutiveWins = 0;
    this.daysWinStreak = 0;
    this.daysLoseStreak = 0;
    this.lastTradeTime = null;
    this.emotionTags = [];
  }

  // Tag a trade with emotion
  tagTrade(tradeId, emotion) {
    // Valid emotions: 'calm', 'confident', 'hesitant', 'revenge', 'fear', 'greedy', 'bored'
    this.emotionTags.push({ tradeId, emotion, time: Date.now() });
    return { tagged: true, emotion };
  }

  // Get emotion for last trade
  getLastEmotion() {
    if (this.emotionTags.length === 0) return null;
    return this.emotionTags[this.emotionTags.length - 1].emotion;
  }

  // Check if should pause
  shouldPause(trades) {
    const recent = trades.slice(-3);
    const last3Losses = recent.filter(t => t.result === 'loss').length;
    
    // 3 consecutive losses = pause
    if (last3Losses >= 3) {
      return {
        pause: true,
        reason: '3 consecutive losses',
        duration: 30 // minutes
      };
    }

    // Check revenge (trade within 5 min of loss)
    if (trades.length >= 2) {
      const last = trades[trades.length - 1];
      const prev = trades[trades.length - 2];
      
      if (prev.result === 'loss') {
        const timeDiff = new Date(last.timestamp) - new Date(prev.timestamp);
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes
          return {
            pause: true,
            reason: 'revenge trading detected',
            duration: 60
          };
        }
      }
    }

    return { pause: false };
  }

  // Calculate win/lose streak
  getStreak(trades) {
    let wins = 0;
    let losses = 0;
    
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].result === 'win') wins++;
      else if (trades[i].result === 'loss') losses++;
      else break;
    }
    
    return { wins, losses };
  }

  // Get all emotions
  getEmotions() {
    return this.emotionTags;
  }

  // Weekly summary
  getWeeklySummary(trades) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekTrades = trades.filter(t => new Date(t.timestamp) > weekAgo);
    const wins = weekTrades.filter(t => t.result === 'win').length;
    const losses = weekTrades.filter(t => t.result === 'loss').length;
    const pnl = weekTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    return {
      trades: weekTrades.length,
      wins,
      losses,
      pnl,
      avgWin: wins > 0 ? pnl / wins : 0,
      avgLoss: losses > 0 ? Math.abs(pnl / losses) : 0
    };
  }
}

module.exports = PsychologyTracker;
