/**
 * 🐺 DHEEB ACTIVE MONITOR
 * Real-time market monitoring and alerts
 */

const SETTINGS = require('../config/settings');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  checkInterval: 60000, // 1 minute
  psychCheckInterval: 30 * 60 * 1000, // 30 minutes
  newsCheckInterval: 5 * 60 * 1000, // 5 minutes
  killzoneStart: '09:30',
  killzoneEnd: '11:30',
  timezone: 'UTC',
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let state = {
  lastPsychCheck: Date.now(),
  lastNewsCheck: Date.now(),
  lastKillzoneAlert: null,
  consecutiveLosses: 0,
  lastTradeResult: null,
  isKillzone: false,
  alerts: [],
};

// Load trades
function getTrades() {
  try {
    return JSON.parse(fs.readFileSync('../../trading-trades.json', 'utf8'));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. KILLZONE MONITOR
// ═══════════════════════════════════════════════════════════════

function checkKillzone() {
  const now = new Date();
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const mins = String(now.getUTCMinutes()).padStart(2, '0');
  const time = `${hours}:${mins}`;
  
  const wasKillzone = state.isKillzone;
  state.isKillzone = time >= CONFIG.killzoneStart && time < CONFIG.killzoneEnd;
  
  // Killzone started
  if (!wasKillzone && state.isKillzone) {
    return {
      type: 'KILLZONE_START',
      message: '🐺 KILLZONE STARTED!\n9:30-11:30 UTC\nStay focused. Wait for setup.',
      priority: 'high'
    };
  }
  
  // Killzone ending
  if (wasKillzone && !state.isKillzone && time >= CONFIG.killzoneEnd) {
    return {
      type: 'KILLZONE_END',
      message: '🐺 KILLZONE ENDED!\nTake profits. Close trades.',
      priority: 'medium'
    };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// 2. PSYCHOLOGY CHECK
// ═══════════════════════════════════════════════════════════════

function checkPsychology() {
  const trades = getTrades();
  const now = Date.now();
  
  // Check interval
  if (now - state.lastPsychCheck < CONFIG.psychCheckInterval) {
    return null;
  }
  
  state.lastPsychCheck = now;
  
  // Get last 3 trades
  const recent = trades.slice(-3);
  const lastTrade = trades[trades.length - 1];
  
  // Check consecutive losses
  if (recent.length >= 3) {
    const losses = recent.filter(t => t.result === 'loss').length;
    if (losses >= 3) {
      state.consecutiveLosses += losses;
      return {
        type: 'PSYCH_WARNING',
        message: '⚠️ 3 CONSECUTIVE LOSSES!\nPause for 30 min.\nYou may be emotional.',
        priority: 'high'
      };
    }
  }
  
  // Check revenge trading (trade within 5 min of loss)
  if (trades.length >= 2) {
    const last = trades[trades.length - 1];
    const prev = trades[trades.length - 2];
    
    if (prev.result === 'loss') {
      const timeDiff = new Date(last.timestamp) - new Date(prev.timestamp);
      if (timeDiff < 5 * 60 * 1000) {
        return {
          type: 'REVENGE_DETECTED',
          message: '🚨 REVENGE TRADING!\nStop immediately.\nWait 60 min before next trade.',
          priority: 'critical'
        };
      }
    }
  }
  
  // Check daily loss limit
  const today = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter(t => t.timestamp.startsWith(today));
  const dailyLoss = todayTrades
    .filter(t => t.result === 'loss')
    .reduce((s, t) => s + t.pnl, 0);
  
  if (dailyLoss <= -1100) {
    return {
      type: 'DAILY_LIMIT',
      message: '🚨 DAILY LOSS LIMIT!\nStop trading.\nYou exceeded -$1,100',
      priority: 'critical'
    };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// 3. NEWS MONITOR (Mock - would need API)
// ═══════════════════════════════════════════════════════════════

function checkNews() {
  // This would integrate with news API
  // For now, return scheduled news reminders
  
  const now = new Date();
  const hour = now.getUTCHours();
  
  // Mock: High impact news times (would be API in production)
  const newsSchedule = {
    13: 'FOMC Minutes',
    14: 'Fed Speech',
    8: 'CPI Data',
    8: 'NFP Report',
  };
  
  if (newsSchedule[hour]) {
    return {
      type: 'NEWS_WARNING',
      message: `📰 ${newsSchedule[hour]} in ~30 min\nReduce size or sit out.`,
      priority: 'medium'
    };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// 4. ICT SETUP DETECTOR (Basic)
// ═══════════════════════════════════════════════════════════════

function detectICTSetup() {
  // This would analyze price data
  // For now, just a placeholder
  return null;
}

// ═══════════════════════════════════════════════════════════════
// 5. COT REPORT CHECK
// ═══════════════════════════════════════════════════════════════

function checkCOT() {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  
  // COT report releases Friday
  if (day === 5 && hour === 13) {
    return {
      type: 'COT_REPORT',
      message: '📊 COT Report released!\nCheck net positions.',
      priority: 'low'
    };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════

function run() {
  console.log('🐺 DHEEB MONITOR STARTED');
  console.log('Interval:', CONFIG.checkInterval / 1000, 'seconds');
  console.log('');
  
  setInterval(() => {
    // Check Killzone
    const killzone = checkKillzone();
    if (killzone) {
      console.log(`[${new Date().toISOString()}] ${killzone.type}: ${killzone.message}`);
    }
    
    // Check Psychology (every check)
    const psych = checkPsychology();
    if (psych) {
      console.log(`[${new Date().toISOString()}] ${psych.type}: ${psych.message}`);
    }
    
    // Check News
    const news = checkNews();
    if (news) {
      console.log(`[${new Date().toISOString()}] ${news.type}: ${news.message}`);
    }
    
    // Check COT
    const cot = checkCOT();
    if (cot) {
      console.log(`[${new Date().toISOString()}] ${cot.type}: ${cot.message}`);
    }
    
  }, CONFIG.checkInterval);
}

// Export for CLI
module.exports = {
  checkKillzone,
  checkPsychology,
  checkNews,
  detectICTSetup,
  checkCOT,
  run,
};

// Run if called directly
if (require.main === module) {
  run();
}
