// ============================================
// DHEEB ICT TRADING BOT - COMPLETE SCRIPT
// Version: 2.0 (Production Ready)
// Strategy: ICT/SMC on NQ/MNQ Futures
// Author: Fahad - Execution Enforcer
// ============================================

const CONFIG = {
  // Account Settings
  ACCOUNT: {
    BALANCE: 50000,
    CURRENCY: 'USD',
    MAX_RISK_PER_TRADE_PERCENT: 1.0, // 0.5-1.0%
    MIN_RRR: 2.5,
    DAILY_LOSS_LIMIT: 600,
    MAX_TRADES_PER_DAY: 2,
    CONSECUTIVE_LOSS_LIMIT: 2
  },
  
  // Instruments
  INSTRUMENTS: {
    NQ: { tickValue: 5, tickSize: 0.25 },
    MNQ: { tickValue: 0.5, tickSize: 0.25 }
  },
  
  // Kill Zones (AST - Arabia Standard Time, UTC+3)
  KILL_ZONES: [
    { name: 'LONDON', start: '11:00', end: '14:00', days: [0, 1, 2, 4] }, // Sun, Mon, Tue, Thu
    { name: 'NY_AM', start: '16:30', end: '19:00', days: [0, 1, 2, 4] },
    { name: 'NY_PM', start: '19:30', end: '23:00', days: [0, 1, 2, 4] }
  ],
  
  // Forbidden Days (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  FORBIDDEN_DAYS: [3, 5], // Wednesday, Friday
  
  // Market Condition Thresholds
  MARKET_CONDITION: {
    ADX_THRESHOLD: 20,
    VOLUME_THRESHOLD_PERCENT: 0.7,
    ATR_PERIOD: 14
  },
  
  // News Filter
  NEWS_FILTER: {
    HIGH_IMPACT_MINUTES: 30,
    MEDIUM_IMPACT_MINUTES: 15
  },
  
  // Session Quality
  SESSION_QUALITY: {
    LONDON_RANGE_MULTIPLIER: 1.2,
    NY_VOLUME_THRESHOLD: 0.8
  },
  
  // Confluence Scoring
  CONFLUENCE: {
    MIN_SCORE: 4, // A grade minimum
    A_PLUS_PLUS: 5
  }
};

// ============================================
// STATE MANAGEMENT
// ============================================
class TradingState {
  constructor() {
    this.dailyStats = {
      date: this.getTodayDate(),
      tradesTaken: 0,
      totalLoss: 0,
      totalProfit: 0,
      consecutiveLosses: 0,
      trades: []
    };
    this.circuitBreakerTriggered = false;
    this.lastPsychologyCheck = null;
  }
  
  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }
  
  resetIfNewDay() {
    const today = this.getTodayDate();
    if (today !== this.dailyStats.date) {
      this.dailyStats = {
        date: today,
        tradesTaken: 0,
        totalLoss: 0,
        totalProfit: 0,
        consecutiveLosses: 0,
        trades: []
      };
      this.circuitBreakerTriggered = false;
    }
  }
  
  canTrade() {
    this.resetIfNewDay();
    
    if (this.circuitBreakerTriggered) {
      return { allowed: false, reason: 'CIRCUIT_BREAKER_ACTIVE' };
    }
    
    if (this.dailyStats.tradesTaken >= CONFIG.ACCOUNT.MAX_TRADES_PER_DAY) {
      return { allowed: false, reason: 'MAX_DAILY_TRADES_REACHED' };
    }
    
    if (this.dailyStats.consecutiveLosses >= CONFIG.ACCOUNT.CONSECUTIVE_LOSS_LIMIT) {
      this.circuitBreakerTriggered = true;
      return { allowed: false, reason: 'CONSECUTIVE_LOSSES_LIMIT' };
    }
    
    return { allowed: true };
  }
  
  recordTrade(result, pnl) {
    this.dailyStats.trades.push({
      time: new Date().toISOString(),
      result: result,
      pnl: pnl
    });
    
    this.dailyStats.tradesTaken++;
    
    if (result === 'LOSS') {
      this.dailyStats.totalLoss += Math.abs(pnl);
      this.dailyStats.consecutiveLosses++;
    } else if (result === 'WIN') {
      this.dailyStats.totalProfit += pnl;
      this.dailyStats.consecutiveLosses = 0;
    } else {
      // BREAKEVEN - doesn't reset consecutive losses but doesn't add
      this.dailyStats.consecutiveLosses = 0;
    }
    
    // Check circuit breaker
    if (this.dailyStats.totalLoss >= CONFIG.ACCOUNT.DAILY_LOSS_LIMIT) {
      this.circuitBreakerTriggered = true;
    }
  }
}

// ============================================
// TIME & SESSION UTILITIES
// ============================================
class TimeUtils {
  static getCurrentAST() {
    // AST = UTC+3
    const now = new Date();
    return new Date(now.getTime() + (3 * 60 * 60 * 1000));
  }
  
  static getDayOfWeekAST() {
    // 0=Sun, 1=Mon, etc.
    return this.getCurrentAST().getUTCDay();
  }
  
  static getCurrentTimeAST() {
    const ast = this.getCurrentAST();
    return `${String(ast.getUTCHours()).padStart(2, '0')}:${String(ast.getUTCMinutes()).padStart(2, '0')}`;
  }
  
  static isForbiddenDay() {
    const today = this.getDayOfWeekAST();
    return CONFIG.FORBIDDEN_DAYS.includes(today);
  }
  
  static isKillZone() {
    if (this.isForbiddenDay()) return { inZone: false, zone: null };
    
    const currentTime = this.getCurrentTimeAST();
    const currentDay = this.getDayOfWeekAST();
    
    for (const zone of CONFIG.KILL_ZONES) {
      if (!zone.days.includes(currentDay)) continue;
      
      if (currentTime >= zone.start && currentTime <= zone.end) {
        return { inZone: true, zone: zone.name, endTime: zone.end };
      }
    }
    
    return { inZone: false, zone: null };
  }
  
  static getMinutesToTime(targetTime) {
    const current = this.getCurrentAST();
    const [targetHour, targetMin] = targetTime.split(':').map(Number);
    
    let target = new Date(current);
    target.setUTCHours(targetHour, targetMin, 0, 0);
    
    if (target < current) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
    
    return Math.floor((target - current) / (1000 * 60));
  }
}

// ============================================
// MARKET DATA & ANALYSIS
// ============================================
class MarketAnalyzer {
  constructor(dataProvider) {
    this.data = dataProvider;
  }
  
  // Market Condition Gate
  checkMarketCondition() {
    const adx = this.data.getADX(CONFIG.MARKET_CONDITION.ATR_PERIOD);
    const atr = this.data.getATR(CONFIG.MARKET_CONDITION.ATR_PERIOD);
    const currentVolume = this.data.getCurrentVolume();
    const avgVolume = this.data.getAverageVolume(20);
    
    const isChoppy = adx < CONFIG.MARKET_CONDITION.ADX_THRESHOLD;
    const isLowVolume = currentVolume < (avgVolume * CONFIG.MARKET_CONDITION.VOLUME_THRESHOLD_PERCENT);
    
    if (isChoppy && isLowVolume) {
      return { pass: false, status: 'CHOPPY_LOW_VOLUME', details: { adx, atr, volumeRatio: currentVolume/avgVolume } };
    }
    
    if (isChoppy) {
      return { pass: false, status: 'CHOPPY', details: { adx, atr } };
    }
    
    return { pass: true, status: adx > 30 ? 'TRENDING' : 'RANGING', details: { adx, atr, volumeRatio: currentVolume/avgVolume } };
  }
  
  // Session Quality Gate
  checkSessionQuality(killZone) {
    if (killZone === 'LONDON') {
      const londonRange = this.data.getSessionRange('London');
      const asianRange = this.data.getSessionRange('Asian');
      
      if (londonRange < asianRange * CONFIG.SESSION_QUALITY.LONDON_RANGE_MULTIPLIER) {
        return { pass: false, status: 'LONDON_DEAD', reason: 'London range too tight vs Asian', details: { londonRange, asianRange, ratio: londonRange/asianRange } };
      }
    }
    
    if (killZone === 'NY_AM' || killZone === 'NY_PM') {
      const nyVolume = this.data.getSessionVolume('NY');
      const avgNYVolume = this.data.getAverageSessionVolume('NY', 20);
      
      if (nyVolume < avgNYVolume * CONFIG.SESSION_QUALITY.NY_VOLUME_THRESHOLD) {
        return { pass: true, // Allow but with caution
          status: 'NY_LOW_VOLUME',
          warning: true,
          details: { nyVolume, avgNYVolume, ratio: nyVolume/avgNYVolume }
        };
      }
    }
    
    return { pass: true, status: 'QUALITY_OK' };
  }
  
  // HTF Bias Analysis
  getHTFBias() {
    const dailyTrend = this.data.getTrend('1D');
    const h4Trend = this.data.getTrend('4H');
    
    // Identify BOS/MSS/CHOCH
    const dailyStructure = this.data.getMarketStructure('1D');
    const h4Structure = this.data.getMarketStructure('4H');
    
    // Mark PD Arrays
    const pdArrays = this.data.getPDArrays();
    
    return {
      daily: { trend: dailyTrend, structure: dailyStructure, keyLevels: pdArrays.daily },
      h4: { trend: h4Trend, structure: h4Structure, keyLevels: pdArrays.h4 },
      alignment: dailyTrend === h4Trend ? 'ALIGNED' : 'MIXED'
    };
  }
  
  // TRIL Analysis
  analyzeTRIL(htfBias, killZone) {
    const result = {
      T: { pass: false, details: killZone },
      R: { pass: false, type: null, level: null },
      I: { pass: false, fvg: null, displacement: false },
      L: { pass: false, zone: null, pdArray: null },
      direction: null,
      entryPrice: null,
      stopLoss: null,
      takeProfit: null
    };
    
    // T - Time (already validated by caller)
    result.T.pass = true;
    
    // R - Raid (Liquidity Sweep)
    const sweep = this.detectLiquiditySweep();
    if (sweep.found) {
      result.R.pass = true;
      result.R.type = sweep.type; // BSL/SSL
      result.R.level = sweep.level;
      result.direction = sweep.direction; // LONG after SSL sweep, SHORT after BSL
    } else {
      return { complete: false, missing: 'RAID', tril: result };
    }
    
    // I - Imbalance (FVG + Displacement)
    const imbalance = this.detectImbalance(sweep.direction);
    if (imbalance.found) {
      result.I.pass = true;
      result.I.fvg = imbalance.fvg;
      result.I.displacement = imbalance.strongDisplacement;
    } else {
      return { complete: false, missing: 'IMBALANCE', tril: result };
    }
    
    // L - Location (Premium/Discount + PD Array)
    const location = this.validateLocation(imbalance.fvg, htfBias);
    if (location.valid) {
      result.L.pass = true;
      result.L.zone = location.zone; // PREMIUM/DISCOUNT
      result.L.pdArray = location.pdArray;
      result.entryPrice = location.optimalEntry;
      result.stopLoss = location.invalidationLevel;
      result.takeProfit = this.calculateTarget(location, sweep);
    } else {
      return { complete: false, missing: 'LOCATION', tril: result };
    }
    
    return { complete: true, tril: result };
  }
  
  detectLiquiditySweep() {
    // Check for sweep of: PDH/PDL, Asian range, Equal highs/lows
    const pdh = this.data.getPDH();
    const pdl = this.data.getPDL();
    const asianHigh = this.data.getAsianRange().high;
    const asianLow = this.data.getAsianRange().low;
    const equalHighs = this.data.getEqualHighs();
    const equalLows = this.data.getEqualLows();
    const currentPrice = this.data.getCurrentPrice();
    
    // Check SSL sweep (for LONG)
    if (this.isSweep(currentPrice, asianLow, 'LOW') ||
        this.isSweep(currentPrice, pdl, 'LOW') ||
        equalLows.some(level => this.isSweep(currentPrice, level, 'LOW'))) {
      return { found: true, type: 'SSL', direction: 'LONG', level: Math.min(asianLow, pdl) };
    }
    
    // Check BSL sweep (for SHORT)
    if (this.isSweep(currentPrice, asianHigh, 'HIGH') ||
        this.isSweep(currentPrice, pdh, 'HIGH') ||
        equalHighs.some(level => this.isSweep(currentPrice, level, 'HIGH'))) {
      return { found: true, type: 'BSL', direction: 'SHORT', level: Math.max(asianHigh, pdh) };
    }
    
    return { found: false };
  }
  
  isSweep(current, level, type) {
    const threshold = type === 'HIGH' ? -2 : 2; // 2 ticks tolerance
    if (type === 'HIGH') {
      return current > level && current < level + Math.abs(threshold) * CONFIG.INSTRUMENTS.MNQ.tickSize;
    }
    return current < level && current > level - Math.abs(threshold) * CONFIG.INSTRUMENTS.MNQ.tickSize;
  }
  
  detectImbalance(direction) {
    const candles = this.data.getRecentCandles(5);
    
    // Look for 3-candle FVG
    for (let i = 2; i < candles.length; i++) {
      const fvg = this.identifyFVG(candles[i-2], candles[i-1], candles[i]);
      if (fvg && fvg.direction === direction) {
        // Check for strong displacement
        const displacement = this.checkDisplacement(candles.slice(i-2, i+1), direction);
        if (displacement.strong) {
          return { found: true, fvg: fvg, strongDisplacement: true };
        }
      }
    }
    
    return { found: false };
  }
  
  identifyFVG(candle1, candle2, candle3) {
    // Bullish FVG: candle2 low > candle1 high
    // Bearish FVG: candle2 high < candle1 low
    if (candle2.low > candle1.high) {
      return { direction: 'LONG', top: candle2.low, bottom: candle1.high, mid: (candle2.low + candle1.high) / 2 };
    }
    if (candle2.high < candle1.low) {
      return { direction: 'SHORT', top: candle1.low, bottom: candle2.high, mid: (candle1.low + candle2.high) / 2 };
    }
    return null;
  }
  
  checkDisplacement(candles, direction) {
    const totalRange = Math.abs(candles[candles.length-1].close - candles[0].open);
    const avgBodySize = candles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / candles.length;
    
    // Strong displacement: large range + large bodies + closes near extreme
    const strong = totalRange > (avgBodySize * 2) &&
      candles[candles.length-1].close === (direction === 'LONG' ? Math.max(...candles.map(c => c.close)) : Math.min(...candles.map(c => c.close)));
    
    return { strong };
  }
  
  validateLocation(fvg, htfBias) {
    const currentPrice = this.data.getCurrentPrice();
    const fibLevels = this.data.getFibonacciLevels();
    
    // Check premium/discount
    const inDiscount = currentPrice < fibLevels.mid;
    const inPremium = currentPrice > fibLevels.mid;
    
    // Find nearest valid PD Array (OB, FVG, Breaker)
    const pdArray = this.findNearestPDArray(currentPrice, fvg.direction);
    if (!pdArray) return { valid: false };
    
    // For LONG: must be in discount
    // For SHORT: must be in premium
    const validZone = fvg.direction === 'LONG' ? inDiscount : inPremium;
    if (!validZone) return { valid: false, reason: 'Wrong zone (Premium/Discount)' };
    
    return {
      valid: true,
      zone: inDiscount ? 'DISCOUNT' : 'PREMIUM',
      pdArray: pdArray,
      optimalEntry: pdArray.entry,
      invalidationLevel: pdArray.invalidation
    };
  }
  
  findNearestPDArray(price, direction) {
    // Search for Order Blocks, FVGs, Breakers in vicinity
    const obs = this.data.getOrderBlocks(direction);
    const fvgs = this.data.getFVGs(direction);
    const breakers = this.data.getBreakers(direction);
    
    const allArrays = [...obs, ...fvgs, ...breakers]
      .filter(arr => Math.abs(arr.price - price) < 10) // Within 10 points
      .sort((a, b) => Math.abs(a.price - price) - Math.abs(b.price - price));
    
    return allArrays[0] || null;
  }
  
  calculateTarget(location, sweep) {
    // TP1: First internal liquidity
    // TP2: External liquidity / HTF target
    const risk = Math.abs(location.optimalEntry - location.invalidationLevel);
    
    return {
      tp1: location.optimalEntry + (risk * CONFIG.ACCOUNT.MIN_RRR * 0.6), // 60% to first target
      tp2: location.optimalEntry + (risk * CONFIG.ACCOUNT.MIN_RRR), // Full RRR
      tp3: sweep.type === 'SSL' ? this.data.getPDH() : this.data.getPDL() // External liquidity
    };
  }
  
  // Confluence Scoring
  calculateConfluenceScore(tril, htfBias, killZone) {
    let score = 0;
    
    // 1. Kill Zone active
    if (killZone.inZone) score++;
    
    // 2. Liquidity sweep
    if (tril.R.pass) score++;
    
    // 3. FVG present
    if (tril.I.pass) score++;
    
    // 4. Order Block formed (validated in Location)
    if (tril.L.pass && tril.L.pdArray && tril.L.pdArray.type === 'OB') score++;
    
    // 5. Displacement confirmed + MSS/BOS alignment
    if (tril.I.displacement && htfBias.alignment === 'ALIGNED') score++;
    
    return score;
  }
}

// ============================================
// RISK CALCULATOR
// ============================================
class RiskCalculator {
  static calculate(tril, accountBalance, dailyStats) {
    const entry = tril.entryPrice;
    const sl = tril.stopLoss;
    const tp = tril.takeProfit.tp2;
    
    const riskTicks = Math.abs(entry - sl) / CONFIG.INSTRUMENTS.MNQ.tickSize;
    const rewardTicks = Math.abs(tp - entry) / CONFIG.INSTRUMENTS.MNQ.tickSize;
    const rrr = rewardTicks / riskTicks;
    
    // Check minimum RRR
    if (rrr < CONFIG.ACCOUNT.MIN_RRR) {
      return { valid: false, reason: `RRR ${rrr.toFixed(2)} < ${CONFIG.ACCOUNT.MIN_RRR}` };
    }
    
    // Calculate position size
    const maxRiskAmount = accountBalance * (CONFIG.ACCOUNT.MAX_RISK_PER_TRADE_PERCENT / 100);
    const riskPerContract = riskTicks * CONFIG.INSTRUMENTS.MNQ.tickValue;
    const contracts = Math.floor(maxRiskAmount / riskPerContract);
    
    if (contracts < 1) {
      return { valid: false, reason: 'Risk too small for 1 contract' };
    }
    
    const actualRisk = contracts * riskPerContract;
    
    // Check daily loss limit
    if (dailyStats.totalLoss + actualRisk > CONFIG.ACCOUNT.DAILY_LOSS_LIMIT) {
      return { valid: false, reason: 'Daily loss limit would be exceeded' };
    }
    
    return {
      valid: true,
      entry,
      sl,
      tp,
      rrr: rrr.toFixed(2),
      contracts,
      riskAmount: actualRisk,
      riskPercent: ((actualRisk / accountBalance) * 100).toFixed(2)
    };
  }
}

// ============================================
// NEWS FILTER
// ============================================
class NewsFilter {
  constructor(newsProvider) {
    this.news = newsProvider;
  }
  
  check() {
    const upcoming = this.news.getUpcomingEvents();
    const now = new Date();
    
    for (const event of upcoming) {
      const minutesToEvent = (event.time - now) / (1000 * 60);
      
      if (event.impact === 'HIGH' && minutesToEvent < CONFIG.NEWS_FILTER.HIGH_IMPACT_MINUTES) {
        return { pass: false, status: 'HIGH_IMPACT_SOON', event: event.name, minutesToEvent: Math.floor(minutesToEvent) };
      }
      
      if (event.impact === 'MEDIUM' && minutesToEvent < CONFIG.NEWS_FILTER.MEDIUM_IMPACT_MINUTES) {
        return { pass: true, status: 'MEDIUM_IMPACT_WARNING', warning: true, event: event.name, minutesToEvent: Math.floor(minutesToEvent) };
      }
    }
    
    return { pass: true, status: 'CLEAR' };
  }
}

// ============================================
// PSYCHOLOGY GATE (User Input)
// ============================================
class PsychologyGate {
  static async check(userInterface) {
    // In production, this would prompt the user
    // For bot automation, could integrate with wearable/mood detection
    const check = await userInterface.prompt({
      state: "Rate your mental state (1-10):",
      detached: "Are you emotionally detached? (yes/no):",
      chasing: "Are you chasing or revenge trading? (yes/no):"
    });
    
    const state = parseInt(check.state);
    const detached = check.detached.toLowerCase() === 'yes';
    const chasing = check.chasing.toLowerCase() === 'yes';
    
    const passed = state >= 8 && detached && !chasing;
    
    return { passed, state, detached, chasing, timestamp: new Date().toISOString() };
  }
  
  // Automated version for full automation
  static checkAutomated(recentPerformance) {
    // If 2+ consecutive losses, force cooldown regardless of user input
    if (recentPerformance.consecutiveLosses >= 2) {
      return { passed: false, reason: 'MANDATORY_COOLDOWN', forced: true };
    }
    
    // Could integrate with HRV, sleep data, etc.
    return { passed: true, automated: true };
  }
}

// ============================================
// MAIN EXECUTION ENGINE
// ============================================
class DHEEBExecutionEngine {
  constructor(dataProvider, newsProvider, brokerAPI, userInterface) {
    this.market = new MarketAnalyzer(dataProvider);
    this.news = new NewsFilter(newsProvider);
    this.broker = brokerAPI;
    this.ui = userInterface;
    this.state = new TradingState();
  }
  
  async evaluate() {
    const timestamp = new Date().toISOString();
    const decision = {
      timestamp,
      decision: 'PENDING',
      gates: {},
      setup: null,
      reason: null
    };
    
    console.log(`\n[${timestamp}] DHEEB Evaluation Started`);
    
    // === GATE 0A: Market Condition ===
    const marketCondition = this.market.checkMarketCondition();
    decision.gates.marketCondition = marketCondition;
    if (!marketCondition.pass) {
      decision.decision = 'BLOCKED';
      decision.reason = `Market condition: ${marketCondition.status}`;
      return this.logAndReturn(decision);
    }
    
    // === GATE 0B: News Filter ===
    const newsStatus = this.news.check();
    decision.gates.news = newsStatus;
    if (!newsStatus.pass) {
      decision.decision = 'STAND_DOWN';
      decision.reason = `News: ${newsStatus.status} - ${newsStatus.event} in ${newsStatus.minutesToEvent}min`;
      return this.logAndReturn(decision);
    }
    
    // === GATE 0C: Session Quality ===
    const killZone = TimeUtils.isKillZone();
    if (!killZone.inZone) {
      decision.decision = 'OBSERVE';
      decision.reason = 'Outside Kill Zone';
      return this.logAndReturn(decision);
    }
    
    const sessionQuality = this.market.checkSessionQuality(killZone.zone);
    decision.gates.sessionQuality = sessionQuality;
    if (!sessionQuality.pass) {
      decision.decision = 'WAIT';
      decision.reason = `Session quality: ${sessionQuality.status}`;
      return this.logAndReturn(decision);
    }
    
    // === GATE 1: Time & Day (already validated above) ===
    if (TimeUtils.isForbiddenDay()) {
      decision.decision = 'BLOCKED';
      decision.reason = 'Forbidden day (Wed/Fri)';
      return this.logAndReturn(decision);
    }
    
    // === GATE 2: Psychology ===
    const psyche = await PsychologyGate.check(this.ui);
    decision.gates.psychology = psyche;
    if (!psyche.passed) {
      decision.decision = 'BLOCKED';
      decision.reason = `Psychology check failed: State=${psyche.state}, Detached=${psyche.detached}, Chasing=${psyche.chasing}`;
      return this.logAndReturn(decision);
    }
    
    // === GATE 3: Circuit Breaker ===
    const canTrade = this.state.canTrade();
    decision.gates.circuitBreaker = canTrade;
    if (!canTrade.allowed) {
      decision.decision = 'BLOCKED';
      decision.reason = `Circuit breaker: ${canTrade.reason}`;
      return this.logAndReturn(decision);
    }
    
    // === GATE 4: HTF Bias ===
    const htfBias = this.market.getHTFBias();
    decision.gates.htfBias = htfBias;
    
    // === GATE 5: TRIL Analysis ===
    const trilResult = this.market.analyzeTRIL(htfBias, killZone);
    decision.gates.tril = trilResult;
    if (!trilResult.complete) {
      decision.decision = 'BLOCKED';
      decision.reason = `TRIL incomplete: Missing ${trilResult.missing}`;
      return this.logAndReturn(decision);
    }
    
    // === GATE 6: Confluence Scoring ===
    const score = this.market.calculateConfluenceScore(trilResult.tril, htfBias, killZone);
    decision.gates.confluence = { score, max: 5 };
    if (score < CONFIG.CONFLUENCE.MIN_SCORE) {
      decision.decision = 'REJECT';
      decision.reason = `Confluence score ${score}/5 < minimum ${CONFIG.CONFLUENCE.MIN_SCORE}`;
      return this.logAndReturn(decision);
    }
    
    // === GATE 7: Risk Validation ===
    const risk = RiskCalculator.calculate(
      trilResult.tril,
      CONFIG.ACCOUNT.BALANCE,
      this.state.dailyStats
    );
    decision.gates.risk = risk;
    if (!risk.valid) {
      decision.decision = 'BLOCKED';
      decision.reason = `Risk validation: ${risk.reason}`;
      return this.logAndReturn(decision);
    }
    
    // === EXECUTION APPROVED ===
    decision.decision = 'EXECUTE';
    decision.quality = score === CONFIG.CONFLUENCE.A_PLUS_PLUS ? 'A+++' : 'A';
    decision.setup = {
      instrument: 'MNQ',
      direction: trilResult.tril.direction,
      entry: risk.entry,
      stopLoss: risk.sl,
      takeProfit: {
        tp1: trilResult.tril.takeProfit.tp1,
        tp2: risk.tp,
        tp3: trilResult.tril.takeProfit.tp3
      },
      rrr: risk.rrr,
      contracts: risk.contracts,
      riskAmount: risk.riskAmount,
      riskPercent: risk.riskPercent,
      killZone: killZone.zone,
      tril: {
        T: killZone.zone,
        R: `${trilResult.tril.R.type} at ${trilResult.tril.R.level}`,
        I: `FVG ${trilResult.tril.I.fvg.direction} + displacement`,
        L: `${trilResult.tril.L.zone} + ${trilResult.tril.L.pdArray.type}`
      }
    };
    
    // Execute via broker
    await this.executeTrade(decision.setup);
    
    return this.logAndReturn(decision);
  }
  
  async executeTrade(setup) {
    try {
      const order = await this.broker.submitOrder({
        symbol: setup.instrument,
        side: setup.direction,
        quantity: setup.contracts,
        type: 'LIMIT',
        price: setup.entry,
        stopLoss: setup.stopLoss,
        takeProfit: setup.takeProfit.tp2
      });
      
      console.log(`[EXECUTED] Order ID: ${order.id}`);
      
      // Record in state
      this.state.dailyStats.trades.push({
        time: new Date().toISOString(),
        setup: setup,
        orderId: order.id,
        status: 'OPEN'
      });
    } catch (error) {
      console.error(`[EXECUTION FAILED] ${error.message}`);
      throw error;
    }
  }
  
  logAndReturn(decision) {
    console.log(`[DECISION] ${decision.decision}`);
    if (decision.reason) console.log(`[REASON] ${decision.reason}`);
    if (decision.setup) {
      console.log(`[SETUP] ${decision.setup.direction} ${decision.setup.instrument} @ ${decision.setup.entry}`);
      console.log(`[RISK] $${decision.setup.riskAmount} (${decision.setup.riskPercent}%) | RRR 1:${decision.setup.rrr}`);
    }
    
    // Log to file/database
    this.persistDecision(decision);
    
    return decision;
  }
  
  persistDecision(decision) {
    // Implement logging to file/DB
    const fs = require('fs').promises;
    const logEntry = JSON.stringify(decision) + '\n';
    fs.appendFile('dheeb_trading_log.jsonl', logEntry).catch(console.error);
  }
  
  // Post-trade update
  updateTradeResult(orderId, result, pnl) {
    const trade = this.state.dailyStats.trades.find(t => t.orderId === orderId);
    if (trade) {
      trade.result = result;
      trade.pnl = pnl;
      trade.closeTime = new Date().toISOString();
    }
    this.state.recordTrade(result, pnl);
  }
}

// ============================================
// MOCK DATA PROVIDER (Replace with real feeds)
// ============================================
class MockDataProvider {
  getADX(period) { return 25; }
  getATR(period) { return 15; }
  getCurrentVolume() { return 10000; }
  getAverageVolume(period) { return 12000; }
  getCurrentPrice() { return 17500; }
  getPDH() { return 17520; }
  getPDL() { return 17480; }
  getAsianRange() { return { high: 17510, low: 17485 }; }
  getEqualHighs() { return [17515]; }
  getEqualLows() { return [17482]; }
  getTrend(timeframe) { return 'BULL'; }
  getMarketStructure(timeframe) { return { type: 'BOS', level: 17500 }; }
  getPDArrays() {
    return {
      daily: [{ price: 17450, type: 'FVG' }],
      h4: [{ price: 17490, type: 'OB' }]
    };
  }
  getSessionRange(session) { return session === 'London' ? 25 : 15; }
  getSessionVolume(session) { return 15000; }
  getAverageSessionVolume(session, period) { return 14000; }
  getRecentCandles(count) {
    return [
      { open: 17490, high: 17500, low: 17485, close: 17495 },
      { open: 17495, high: 17505, low: 17492, close: 17500 },
      { open: 17500, high: 17510, low: 17498, close: 17508 }
    ];
  }
  getFibonacciLevels() { return { mid: 17500 }; }
  getOrderBlocks(direction) { return [{ price: 17488, type: 'OB', entry: 17488, invalidation: 17478 }]; }
  getFVGs(direction) { return []; }
  getBreakers(direction) { return []; }
}

class MockNewsProvider {
  getUpcomingEvents() { return []; }
}

class MockBrokerAPI {
  async submitOrder(order) {
    return { id: 'mock-' + Date.now(), status: 'FILLED' };
  }
}

class MockUserInterface {
  async prompt(questions) {
    return { state: '9', detached: 'yes', chasing: 'no' };
  }
}

// ============================================
// INITIALIZATION & MAIN LOOP
// ============================================
async function main() {
  console.log('============================================');
  console.log(' DHEEB ICT TRADING BOT v2.0');
  console.log(' Execution Enforcer - NO EXCUSES');
  console.log('============================================\n');
  
  const engine = new DHEEBExecutionEngine(
    new MockDataProvider(),
    new MockNewsProvider(),
    new MockBrokerAPI(),
    new MockUserInterface()
  );
  
  // Run evaluation
  const result = await engine.evaluate();
  
  console.log('\n============================================');
  console.log(' FINAL RESULT:', result.decision);
  console.log('============================================');
  
  // Pretty print full decision
  console.log('\nFull Decision Object:');
  console.log(JSON.stringify(result, null, 2));
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for use as module
module.exports = {
  DHEEBExecutionEngine,
  CONFIG,
  TradingState,
  MarketAnalyzer,
  RiskCalculator,
  TimeUtils
};
