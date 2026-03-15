/**
 * ═══════════════════════════════════════════════════════════════
 *  DHEEB TRADING MIND — State Manager
 *  يتتبع حالة الحساب، الأداء اليومي/الأسبوعي، والحالة النفسية
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "..", "data", "state.json");

class StateManager {
  constructor() {
    this.state = this._loadOrCreate();
  }

  // ─── Default State Structure ───
  _defaultState() {
    return {
      // Account
      accountProfile: "small",     // "small" ($50K) or "medium" ($150K)
      startingBalance: 50000,
      currentBalance: 50000,
      peakBalance: 50000,

      // Session tracking
      today: this._dateStr(),
      todayPnL: 0,
      todayTrades: 0,
      todayWins: 0,
      todayLosses: 0,
      todayConsecutiveLosses: 0,
      sessionActive: false,
      checklistCompleted: false,

      // Weekly tracking
      weekStartDate: this._weekStart(),
      weekPnL: 0,
      weekTrades: 0,
      consecutiveRedDays: 0,

      // Drawdown tracking
      currentDrawdown: 0,
      currentDrawdownPercent: 0,
      drawdownLevel: null,         // null | "REDUCE_HALF" | "MINIMAL_MODE" | "PAUSE_TRADING" | "FULL_STOP"
      pauseUntil: null,

      // Position tracking
      openPositions: [],
      maxPositionSize: null,       // Override from drawdown protocol

      // Psychology
      currentMood: null,
      lastPsychCheck: null,
      psychCleared: false,

      // Journal
      journal: [],

      // Historical daily summaries
      dailyHistory: [],
    };
  }

  // ─── Persistence ───
  _loadOrCreate() {
    try {
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        // Reset daily counters if new day
        if (data.today !== this._dateStr()) {
          return this._rolloverDay(data);
        }
        return data;
      }
    } catch (e) { /* ignore */ }
    return this._defaultState();
  }

  save() {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), "utf8");
  }

  // ─── Day Rollover ───
  _rolloverDay(prevState) {
    // Archive yesterday
    const daySummary = {
      date: prevState.today,
      pnl: prevState.todayPnL,
      trades: prevState.todayTrades,
      wins: prevState.todayWins,
      losses: prevState.todayLosses,
      balance: prevState.currentBalance,
    };

    const history = prevState.dailyHistory || [];
    history.push(daySummary);
    if (history.length > 90) history.shift(); // Keep 90 days

    // Track consecutive red days
    let consecutiveRedDays = prevState.consecutiveRedDays || 0;
    if (prevState.todayPnL < 0) consecutiveRedDays++;
    else consecutiveRedDays = 0;

    // Check week rollover
    let weekPnL = prevState.weekPnL || 0;
    let weekTrades = prevState.weekTrades || 0;
    let weekStartDate = prevState.weekStartDate;
    if (this._weekStart() !== weekStartDate) {
      weekPnL = 0;
      weekTrades = 0;
      weekStartDate = this._weekStart();
    }

    return {
      ...prevState,
      today: this._dateStr(),
      todayPnL: 0,
      todayTrades: 0,
      todayWins: 0,
      todayLosses: 0,
      todayConsecutiveLosses: 0,
      sessionActive: false,
      checklistCompleted: false,
      psychCleared: false,
      currentMood: null,
      lastPsychCheck: null,
      openPositions: [],
      consecutiveRedDays,
      weekPnL,
      weekTrades,
      weekStartDate,
      dailyHistory: history,
      // Recalculate drawdown
      currentDrawdown: prevState.peakBalance - prevState.currentBalance,
      currentDrawdownPercent: ((prevState.peakBalance - prevState.currentBalance) / prevState.peakBalance) * 100,
    };
  }

  // ─── Core Mutations ───

  recordTrade(trade) {
    /**
     * trade = {
     *   symbol: "NQ" | "MNQ",
     *   direction: "LONG" | "SHORT",
     *   contracts: number,
     *   entryPrice: number,
     *   exitPrice: number,
     *   stopPrice: number,
     *   pnl: number,
     *   rMultiple: number,
     *   entryReason: string,
     *   exitReason: string,
     *   emotionalState: string,
     *   timestamp: ISO string,
     * }
     */
    const s = this.state;
    s.todayTrades++;
    s.weekTrades++;
    s.todayPnL += trade.pnl;
    s.weekPnL += trade.pnl;
    s.currentBalance += trade.pnl;

    if (trade.pnl >= 0) {
      s.todayWins++;
      s.todayConsecutiveLosses = 0;
    } else {
      s.todayLosses++;
      s.todayConsecutiveLosses++;
    }

    // Update peak
    if (s.currentBalance > s.peakBalance) {
      s.peakBalance = s.currentBalance;
    }

    // Update drawdown
    s.currentDrawdown = s.peakBalance - s.currentBalance;
    s.currentDrawdownPercent = (s.currentDrawdown / s.peakBalance) * 100;

    // Journal entry
    s.journal.push({
      ...trade,
      date: this._dateStr(),
      balanceAfter: s.currentBalance,
      drawdownAfter: s.currentDrawdownPercent,
    });

    // Keep journal to 500 entries
    if (s.journal.length > 500) s.journal = s.journal.slice(-500);

    this.save();
    return this.getStatus();
  }

  setChecklistComplete() {
    this.state.checklistCompleted = true;
    this.save();
  }

  setPsychState(mood, cleared) {
    this.state.currentMood = mood;
    this.state.psychCleared = cleared;
    this.state.lastPsychCheck = new Date().toISOString();
    this.save();
  }

  setSessionActive(active) {
    this.state.sessionActive = active;
    this.save();
  }

  setAccountProfile(profile) {
    const SETTINGS = require("../config/settings");
    if (!SETTINGS.accounts[profile]) throw new Error(`Unknown profile: ${profile}`);
    const acc = SETTINGS.accounts[profile];
    this.state.accountProfile = profile;
    this.state.startingBalance = acc.balance;
    if (this.state.currentBalance === 50000 || this.state.currentBalance === 150000) {
      this.state.currentBalance = acc.balance;
      this.state.peakBalance = acc.balance;
    }
    this.save();
  }

  resetAccount() {
    this.state = this._defaultState();
    this.save();
  }

  // ─── Queries ───

  getStatus() {
    const s = this.state;
    const SETTINGS = require("../config/settings");
    const acc = SETTINGS.accounts[s.accountProfile];

    return {
      accountProfile: s.accountProfile,
      balance: s.currentBalance,
      todayPnL: s.todayPnL,
      weekPnL: s.weekPnL,
      todayTrades: s.todayTrades,
      todayConsecutiveLosses: s.todayConsecutiveLosses,
      consecutiveRedDays: s.consecutiveRedDays,
      drawdownDollars: s.currentDrawdown,
      drawdownPercent: s.currentDrawdownPercent.toFixed(2),
      drawdownLevel: s.drawdownLevel,
      pauseUntil: s.pauseUntil,
      checklistDone: s.checklistCompleted,
      psychCleared: s.psychCleared,
      sessionActive: s.sessionActive,
      canTrade: this._canTrade(),
      maxRisk: acc.maxRiskDollars,
      maxDailyLoss: acc.maxDailyLossDollars,
      remainingDailyRisk: acc.maxDailyLossDollars - Math.abs(Math.min(0, s.todayPnL)),
      remainingWeeklyRisk: acc.maxWeeklyLossDollars - Math.abs(Math.min(0, s.weekPnL)),
      tradesRemaining: SETTINGS.rules.maxTradesPerDay - s.todayTrades,
    };
  }

  _canTrade() {
    const s = this.state;
    const SETTINGS = require("../config/settings");
    const acc = SETTINGS.accounts[s.accountProfile];
    const reasons = [];

    if (!s.checklistCompleted) reasons.push("CHECKLIST_NOT_DONE");
    if (!s.psychCleared) reasons.push("PSYCH_NOT_CLEARED");
    if (s.todayTrades >= SETTINGS.rules.maxTradesPerDay) reasons.push("MAX_TRADES_REACHED");
    if (s.todayConsecutiveLosses >= SETTINGS.rules.maxConsecutiveLosses) reasons.push("CONSECUTIVE_LOSSES");
    if (Math.abs(Math.min(0, s.todayPnL)) >= acc.maxDailyLossDollars) reasons.push("DAILY_LOSS_LIMIT");
    if (Math.abs(Math.min(0, s.weekPnL)) >= acc.maxWeeklyLossDollars) reasons.push("WEEKLY_LOSS_LIMIT");
    if (s.pauseUntil && new Date() < new Date(s.pauseUntil)) reasons.push("PAUSE_ACTIVE");
    if (s.drawdownLevel === "PAUSE_TRADING" || s.drawdownLevel === "FULL_STOP") reasons.push("DRAWDOWN_PAUSE");

    return { allowed: reasons.length === 0, reasons };
  }

  getJournal(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.state.journal.filter(j => new Date(j.timestamp || j.date) >= cutoff);
  }

  getDailyHistory(days = 30) {
    return (this.state.dailyHistory || []).slice(-days);
  }

  // ─── Helpers ───
  _dateStr() { return new Date().toISOString().slice(0, 10); }
  _weekStart() {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().slice(0, 10);
  }
}

module.exports = StateManager;
