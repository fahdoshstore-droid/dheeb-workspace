/**
 * ═══════════════════════════════════════════════════════════════
 *  🐺 PORTFOLIO MANAGER — إدارة المحافظ المتعددة
 *  Wieland model: Multiple funded accounts + copy-trading
 *
 *  Features:
 *  - Track multiple prop firm accounts simultaneously
 *  - Aggregate risk across all accounts
 *  - Copy signals to selected accounts
 *  - Per-account drawdown protection
 *  - Combined P&L dashboard
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require("fs");
const path = require("path");
const SETTINGS = require("../config/settings");

const PORTFOLIO_FILE = path.join(__dirname, "..", "data", "portfolio.json");

class PortfolioManager {
  constructor() {
    this.accounts = this._load();
  }

  // ─── Account Management ───

  addAccount(account) {
    /**
     * account = {
     *   id: "apex_1",
     *   name: "Apex 50K #1",
     *   broker: "tradovate",          // "tradovate" | "rithmic"
     *   type: "funded",               // "funded" | "evaluation" | "personal"
     *   balance: 50000,
     *   maxDrawdown: 2500,            // Prop firm trailing DD
     *   maxDailyLoss: 1000,
     *   trailingDrawdown: true,       // Apex-style trailing
     *   active: true,
     *   copyTrade: true,              // Receives copy signals
     *   sizeMultiplier: 1.0,          // 1.0 = same size, 0.5 = half
     * }
     */
    const id = account.id || `acc_${Date.now()}`;
    this.accounts[id] = {
      ...account,
      id,
      currentBalance: account.balance,
      peakBalance: account.balance,
      todayPnL: 0,
      weekPnL: 0,
      totalPnL: 0,
      tradesTotal: 0,
      todayTrades: 0,
      currentDrawdown: 0,
      drawdownPercent: 0,
      status: "ACTIVE",      // ACTIVE | PAUSED | BLOWN | PASSED
      createdAt: new Date().toISOString(),
      history: [],
    };

    this._save();
    return this.accounts[id];
  }

  removeAccount(id) {
    delete this.accounts[id];
    this._save();
  }

  getAccount(id) {
    return this.accounts[id] || null;
  }

  listAccounts() {
    return Object.values(this.accounts);
  }

  getActiveAccounts() {
    return Object.values(this.accounts).filter(a => a.active && a.status === "ACTIVE");
  }

  getCopyAccounts() {
    return this.getActiveAccounts().filter(a => a.copyTrade);
  }

  // ─── Trade Recording ───

  recordTrade(accountId, trade) {
    const acc = this.accounts[accountId];
    if (!acc) return { error: `Account not found: ${accountId}` };

    acc.currentBalance += trade.pnl;
    acc.todayPnL += trade.pnl;
    acc.weekPnL += trade.pnl;
    acc.totalPnL += trade.pnl;
    acc.tradesTotal++;
    acc.todayTrades++;

    // Update peak (for trailing drawdown)
    if (acc.currentBalance > acc.peakBalance) {
      acc.peakBalance = acc.currentBalance;
    }

    // Calculate drawdown
    if (acc.trailingDrawdown) {
      // Trailing: drawdown from peak
      acc.currentDrawdown = acc.peakBalance - acc.currentBalance;
    } else {
      // Static: drawdown from initial balance
      acc.currentDrawdown = acc.balance - acc.currentBalance;
    }
    acc.drawdownPercent = ((acc.currentDrawdown / acc.balance) * 100).toFixed(2);

    // ─── Account Status Checks ───

    // Max drawdown blown
    if (acc.currentDrawdown >= acc.maxDrawdown) {
      acc.status = "BLOWN";
      acc.active = false;
      acc.copyTrade = false;
    }

    // Daily loss limit (don't override BLOWN)
    if (acc.status !== "BLOWN" && Math.abs(Math.min(0, acc.todayPnL)) >= acc.maxDailyLoss) {
      acc.status = "DAILY_LIMIT";
      // Don't deactivate permanently, just for today
    }

    // History
    acc.history.push({
      date: new Date().toISOString(),
      pnl: trade.pnl,
      balance: acc.currentBalance,
      drawdown: acc.currentDrawdown,
    });
    if (acc.history.length > 200) acc.history = acc.history.slice(-200);

    this._save();

    return {
      accountId,
      balance: acc.currentBalance,
      drawdown: acc.currentDrawdown,
      status: acc.status,
      pnl: trade.pnl,
    };
  }

  // ─── Copy Trade Distribution ───

  distributeTrade(signal) {
    /**
     * Distributes a signal to all active copy accounts
     * Returns array of { accountId, adjustedQty, symbol }
     */
    const targets = this.getCopyAccounts();
    const distributions = [];

    for (const acc of targets) {
      // Skip if account is at daily limit
      if (Math.abs(Math.min(0, acc.todayPnL)) >= acc.maxDailyLoss * 0.9) {
        distributions.push({
          accountId: acc.id,
          skipped: true,
          reason: "Near daily loss limit",
        });
        continue;
      }

      // Skip if drawdown too deep
      if (acc.currentDrawdown >= acc.maxDrawdown * 0.8) {
        distributions.push({
          accountId: acc.id,
          skipped: true,
          reason: "Near max drawdown",
        });
        continue;
      }

      // Adjust quantity by account multiplier
      const adjustedQty = Math.max(1, Math.round(signal.qty * (acc.sizeMultiplier || 1)));

      // Check risk per account
      const contract = signal.symbol.includes("MNQ")
        ? SETTINGS.contracts.MNQ
        : SETTINGS.contracts.NQ;
      const stopPoints = signal.stop ? Math.abs(signal.price - signal.stop) : 15;
      const risk = stopPoints * contract.pointValue * adjustedQty;

      // Max risk per trade = lesser of account max or remaining daily
      const maxRisk = Math.min(
        acc.maxDailyLoss * 0.5,  // Never risk more than 50% of daily limit in one trade
        acc.maxDrawdown - acc.currentDrawdown,
      );

      if (risk > maxRisk) {
        // Reduce qty
        const safeQty = Math.max(1, Math.floor(maxRisk / (stopPoints * contract.pointValue)));
        distributions.push({
          accountId: acc.id,
          symbol: signal.symbol,
          qty: safeQty,
          adjustedFromOriginal: true,
          riskDollars: safeQty * stopPoints * contract.pointValue,
        });
      } else {
        distributions.push({
          accountId: acc.id,
          symbol: signal.symbol,
          qty: adjustedQty,
          riskDollars: risk,
        });
      }
    }

    return distributions;
  }

  // ─── Aggregate Dashboard ───

  getPortfolioDashboard() {
    const accounts = this.listAccounts();
    const active = accounts.filter(a => a.status === "ACTIVE");
    const blown = accounts.filter(a => a.status === "BLOWN");

    const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
    const totalPnLToday = accounts.reduce((s, a) => s + a.todayPnL, 0);
    const totalPnLWeek = accounts.reduce((s, a) => s + a.weekPnL, 0);
    const totalPnLAll = accounts.reduce((s, a) => s + a.totalPnL, 0);

    // Account closest to blowing
    const mostAtRisk = active
      .map(a => ({
        id: a.id,
        name: a.name,
        remainingDD: a.maxDrawdown - a.currentDrawdown,
        percentUsed: ((a.currentDrawdown / a.maxDrawdown) * 100).toFixed(1),
      }))
      .sort((a, b) => a.remainingDD - b.remainingDD)[0];

    return {
      summary: {
        totalAccounts: accounts.length,
        activeAccounts: active.length,
        blownAccounts: blown.length,
        totalBalance: totalBalance.toFixed(0),
        todayPnL: totalPnLToday.toFixed(0),
        weekPnL: totalPnLWeek.toFixed(0),
        allTimePnL: totalPnLAll.toFixed(0),
      },
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.currentBalance.toFixed(0),
        todayPnL: a.todayPnL.toFixed(0),
        drawdown: `${a.currentDrawdown.toFixed(0)} / ${a.maxDrawdown}`,
        drawdownPct: `${a.drawdownPercent}%`,
        status: a.status,
        copyTrade: a.copyTrade,
        trades: a.tradesTotal,
      })),
      mostAtRisk,
    };
  }

  // ─── Day Reset ───

  resetDaily() {
    for (const id of Object.keys(this.accounts)) {
      this.accounts[id].todayPnL = 0;
      this.accounts[id].todayTrades = 0;
      if (this.accounts[id].status === "DAILY_LIMIT") {
        this.accounts[id].status = "ACTIVE";
      }
    }
    this._save();
  }

  resetWeekly() {
    for (const id of Object.keys(this.accounts)) {
      this.accounts[id].weekPnL = 0;
    }
    this._save();
  }

  // ─── Persistence ───

  _load() {
    try {
      const dir = path.dirname(PORTFOLIO_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(PORTFOLIO_FILE)) {
        return JSON.parse(fs.readFileSync(PORTFOLIO_FILE, "utf8"));
      }
    } catch { /* ignore */ }
    return {};
  }

  _save() {
    const dir = path.dirname(PORTFOLIO_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(this.accounts, null, 2));
  }
}

module.exports = PortfolioManager;
