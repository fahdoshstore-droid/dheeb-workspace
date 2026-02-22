/**
 * ═══════════════════════════════════════════════════════════════
 *  🐺 EXECUTION ENGINE — المحرك الأساسي للتنفيذ
 *  TradingView Signal → Risk Checks → ICT Validation → Tradovate Order
 *
 *  Pipeline:
 *  1. Signal received (webhook or manual)
 *  2. Session/Time check
 *  3. Psychology gate
 *  4. Risk validation (size, drawdown, daily limit)
 *  5. ICT confluence check (optional enhancement)
 *  6. Order execution via Tradovate
 *  7. Position monitoring + trailing logic
 *  8. Journal entry
 * ═══════════════════════════════════════════════════════════════
 */

const EventEmitter = require("events");
const TradovateConnector = require("../connectors/tradovate");
const { WebhookServer } = require("../webhook/server");
const ICTConcepts = require("../ict/ict-concepts");
const StateManager = require("../core/state-manager");
const SETTINGS = require("../config/settings");

class ExecutionEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    // ─── State ───
    this.state = new StateManager();
    this.config = config;
    this.running = false;
    this.pendingSignals = [];
    this.activePositions = new Map();
    this.candleBuffer = [];       // Market data candles for ICT analysis

    // ─── Tradovate ───
    this.tradovate = null;
    if (config.tradovate) {
      this.tradovate = new TradovateConnector(config.tradovate);
    }

    // ─── Webhook ───
    this.webhook = null;
    if (config.webhook !== false) {
      this.webhook = new WebhookServer({
        port: config.webhookPort || process.env.WEBHOOK_PORT || 3000,
        secret: config.webhookSecret || process.env.WEBHOOK_SECRET || "",
      });
    }

    // ─── Settings shortcuts ───
    this.accountProfile = SETTINGS.accounts[
      config.accountProfile || process.env.ACCOUNT_PROFILE || "small"
    ];
    this.nqSymbol = config.nqSymbol || process.env.NQ_SYMBOL || "NQH6";
    this.mnqSymbol = config.mnqSymbol || process.env.MNQ_SYMBOL || "MNQH6";
  }

  // ═══════════════════════════════════════
  //  Startup
  // ═══════════════════════════════════════

  async start() {
    console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🐺 DHEEB EXECUTION ENGINE v2.0         ║
║   Tradovate + TradingView + ICT           ║
║                                           ║
╚═══════════════════════════════════════════╝
    `);

    // 1. Connect Tradovate
    if (this.tradovate) {
      try {
        await this.tradovate.authenticate();
        const accounts = await this.tradovate.getAccounts();
        console.log(`📊 Account: ${accounts[0]?.name || "N/A"} (ID: ${this.tradovate.accountId})`);

        // WebSocket for real-time data
        this.tradovate.connectWebSocket();
        this.tradovate.connectMarketData();

        // Listen for position/order updates
        this.tradovate.on("position:update", (pos) => this._onPositionUpdate(pos));
        this.tradovate.on("order:update", (order) => this._onOrderUpdate(order));
        this.tradovate.on("fill", (fill) => this._onFill(fill));
        this.tradovate.on("chart:data", (data) => this._onChartData(data));

        // Subscribe to NQ quotes + chart
        setTimeout(() => {
          this.tradovate.subscribeQuote(this.nqSymbol);
          this.tradovate.subscribeChart(this.nqSymbol, { value: 5, unit: "MinuteBar" });
          this.tradovate.subscribeUserSync();
        }, 2000);

      } catch (err) {
        console.error(`❌ Tradovate connection failed: ${err.message}`);
        console.log("⚠️  Running in WEBHOOK-ONLY mode (no execution)");
      }
    }

    // 2. Start Webhook Server
    if (this.webhook) {
      this.webhook.start();
      this.webhook.on("signal", (signal) => this._onSignal(signal));
    }

    // 3. Start monitoring loop
    this.running = true;
    this._monitorLoop();

    console.log(`\n✅ Engine running | Profile: ${this.state.state.accountProfile} | Symbol: ${this.nqSymbol}`);
    return this;
  }

  // ═══════════════════════════════════════
  //  Signal Processing Pipeline
  // ═══════════════════════════════════════

  async _onSignal(signal) {
    const log = (msg) => console.log(`  [${new Date().toISOString().slice(11, 19)}] ${msg}`);

    log(`📨 Signal: ${signal.action} ${signal.symbol} x${signal.qty} @ ${signal.price}`);

    // ─── CLOSE orders bypass most checks ───
    if (signal.action === "CLOSE") {
      return await this._executeClose(signal);
    }

    // ─── Step 1: Session Time Check ───
    const timeCheck = this._checkSessionTime();
    if (timeCheck.blocked) {
      log(`🛑 ${timeCheck.reason_ar}`);
      this.emit("signal:rejected", { signal, reason: timeCheck.reason_ar });
      return;
    }

    // ─── Step 2: Can We Trade? (limits, psychology, drawdown) ───
    const status = this.state.getStatus();
    if (!status.canTrade.allowed) {
      log(`🛑 Cannot trade: ${status.canTrade.reasons.join(", ")}`);
      this.emit("signal:rejected", { signal, reason: status.canTrade.reasons });
      return;
    }

    // ─── Step 3: Risk Validation ───
    const riskCheck = this._validateRisk(signal, status);
    if (!riskCheck.passed) {
      log(`🛑 Risk: ${riskCheck.message_ar}`);
      this.emit("signal:rejected", { signal, reason: riskCheck.message_ar });
      return;
    }

    // ─── Step 4: ICT Confluence (optional enhancement) ───
    let ictScore = null;
    if (this.candleBuffer.length >= 20) {
      ictScore = this._ictConfluenceCheck(signal);
      log(`📐 ICT Score: ${ictScore.confluenceCount} (${ictScore.quality || "N/A"})`);
    }

    // ─── Step 5: Adjust Position Size ───
    const adjustedSignal = this._adjustSize(signal, status, riskCheck);
    log(`📊 Adjusted: ${adjustedSignal.symbol} x${adjustedSignal.qty} | Risk: $${adjustedSignal.riskDollars}`);

    // ─── Step 6: Execute ───
    const result = await this._execute(adjustedSignal);

    // ─── Step 7: Record ───
    if (result.success) {
      log(`✅ Executed: Order ID ${result.orderId || "pending"}`);
      this._recordEntry(adjustedSignal, result, ictScore);
      this.emit("signal:executed", { signal: adjustedSignal, result });
    } else {
      log(`❌ Execution failed: ${result.error}`);
      this.emit("signal:failed", { signal: adjustedSignal, error: result.error });
    }
  }

  // ═══════════════════════════════════════
  //  Validation Steps
  // ═══════════════════════════════════════

  _checkSessionTime() {
    const now = new Date();
    const est = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const h = est.getHours();
    const m = est.getMinutes();
    const day = est.getDay();

    // Weekend
    if (day === 0 || day === 6) {
      return { blocked: true, reason_ar: "عطلة نهاية الأسبوع" };
    }

    // Friday after 2pm EST (Raschke)
    if (day === 5 && h >= 14) {
      return { blocked: true, reason_ar: "الجمعة بعد 2 ظهراً — لا حافة (Raschke)" };
    }

    // NY lunch — warn but allow
    if (h >= 12 && h < 13 && m < 30) {
      return { blocked: false, warning_ar: "⚠️ وقت الغداء — سيولة منخفضة" };
    }

    // Check killzone
    const kz = ICTConcepts.getCurrentKillzone();
    if (kz.avoid) {
      return { blocked: true, reason_ar: `${kz.label_ar} — تجنب التداول` };
    }

    return { blocked: false, killzone: kz };
  }

  _validateRisk(signal, status) {
    const contract = signal.symbol.includes("MNQ")
      ? SETTINGS.contracts.MNQ
      : SETTINGS.contracts.NQ;

    const stopPoints = signal.stop
      ? Math.abs(signal.price - signal.stop)
      : 15; // Default 15pts if no stop provided

    const riskDollars = stopPoints * contract.pointValue * signal.qty;

    // Per-trade limit
    if (riskDollars > this.accountProfile.maxRiskDollars) {
      return {
        passed: false,
        message_ar: `مخاطرة $${riskDollars.toFixed(0)} تتجاوز الحد $${this.accountProfile.maxRiskDollars}`,
      };
    }

    // Daily remaining
    if (riskDollars > status.remainingDailyRisk) {
      return {
        passed: false,
        message_ar: `مخاطرة $${riskDollars.toFixed(0)} تتجاوز المتبقي يومياً $${status.remainingDailyRisk}`,
      };
    }

    // Weekly remaining
    if (riskDollars > status.remainingWeeklyRisk) {
      return {
        passed: false,
        message_ar: `مخاطرة $${riskDollars.toFixed(0)} تتجاوز المتبقي أسبوعياً $${status.remainingWeeklyRisk}`,
      };
    }

    return {
      passed: true,
      riskDollars,
      stopPoints,
      contract,
      message_ar: `✅ مخاطرة $${riskDollars.toFixed(0)} مقبولة`,
    };
  }

  _ictConfluenceCheck(signal) {
    try {
      const analysis = ICTConcepts.analyze(this.candleBuffer, {
        obMinImpulse: 10,
        liqTolerance: 3,
      });

      let confluenceCount = 0;
      const factors = [];

      // Killzone active?
      if (analysis.killzone.active && !analysis.killzone.avoid) {
        confluenceCount++;
        factors.push("Killzone");
      }

      // Structure alignment
      if (analysis.structure.shift) {
        const aligned = (signal.action === "BUY" && analysis.structure.direction === "BULLISH")
          || (signal.action === "SELL" && analysis.structure.direction === "BEARISH");
        if (aligned) {
          confluenceCount++;
          factors.push("Structure");
        }
      }

      // FVG near entry
      const nearbyFVGs = analysis.fvgs.filter(f => {
        const dist = Math.abs(f.midpoint - signal.price);
        return dist < 30 && !f.filled;
      });
      if (nearbyFVGs.length > 0) {
        confluenceCount++;
        factors.push("FVG");
      }

      // OB near entry
      const nearbyOBs = analysis.orderBlocks.filter(ob => {
        const dist = Math.abs(ob.midpoint - signal.price);
        return dist < 30 && !ob.mitigated;
      });
      if (nearbyOBs.length > 0) {
        confluenceCount++;
        factors.push("OB");
      }

      const quality = confluenceCount >= 3 ? "A+" : confluenceCount >= 2 ? "A" : confluenceCount >= 1 ? "B" : "C";

      return { confluenceCount, factors, quality };
    } catch {
      return { confluenceCount: 0, factors: [], quality: "N/A" };
    }
  }

  _adjustSize(signal, status, riskCheck) {
    let qty = signal.qty;
    let symbol = signal.symbol;

    // Drawdown reduction
    const ddPercent = parseFloat(status.drawdownPercent);
    if (ddPercent >= 8) {
      // MINIMAL_MODE or worse — block
      return { ...signal, qty: 0, blocked: true, reason: "DRAWDOWN_PAUSE" };
    }
    if (ddPercent >= 4) {
      // MNQ only, max 2
      symbol = this.mnqSymbol;
      qty = Math.min(qty, 2);
    }
    if (ddPercent >= 2) {
      // Half size
      qty = Math.max(1, Math.floor(qty / 2));
    }

    // Consecutive red days
    if (status.consecutiveRedDays >= 3) {
      symbol = this.mnqSymbol;
      qty = 1;
    }

    // Calculate final risk
    const contract = symbol.includes("MNQ") ? SETTINGS.contracts.MNQ : SETTINGS.contracts.NQ;
    const stopPoints = signal.stop ? Math.abs(signal.price - signal.stop) : 15;
    const riskDollars = stopPoints * contract.pointValue * qty;

    return {
      ...signal,
      symbol,
      qty,
      riskDollars: riskDollars.toFixed(0),
      stopPoints,
      adjusted: qty !== signal.qty || symbol !== signal.symbol,
    };
  }

  // ═══════════════════════════════════════
  //  Order Execution
  // ═══════════════════════════════════════

  async _execute(signal) {
    if (signal.blocked) {
      return { success: false, error: signal.reason };
    }

    if (!this.tradovate || !this.tradovate.token) {
      // Dry run mode — log but don't execute
      console.log(`  📝 DRY RUN: ${signal.action} ${signal.symbol} x${signal.qty} @ ${signal.price}`);
      this.emit("dryrun", signal);
      return { success: true, orderId: `dry_${Date.now()}`, mode: "DRY_RUN" };
    }

    try {
      const action = signal.action === "BUY" ? "Buy" : "Sell";

      // ─── Bracket Order (with TP + SL) ───
      if (signal.stop && signal.target) {
        const result = await this.tradovate.placeBracketOrder(
          signal.symbol,
          action,
          signal.qty,
          signal.price > 0 ? signal.price : null,   // null = market
          signal.target,
          signal.stop,
        );
        return { success: true, orderId: result.id || result.orderId, type: "bracket", raw: result };
      }

      // ─── Market Order (with separate stop) ───
      const orderResult = await this.tradovate.placeMarketOrder(
        signal.symbol, action, signal.qty,
      );

      // Place protective stop
      if (signal.stop) {
        const stopAction = action === "Buy" ? "Sell" : "Buy";
        await this.tradovate.placeStopOrder(
          signal.symbol, stopAction, signal.qty, signal.stop,
        );
      }

      return { success: true, orderId: orderResult.id, type: "market+stop", raw: orderResult };

    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _executeClose(signal) {
    console.log(`  🔄 Closing position: ${signal.symbol || "ALL"}`);

    if (!this.tradovate || !this.tradovate.token) {
      console.log("  📝 DRY RUN: CLOSE");
      return;
    }

    try {
      const symbol = signal.symbol || this.nqSymbol;
      await this.tradovate.flattenPosition(symbol);
      console.log("  ✅ Position closed");
    } catch (err) {
      console.error(`  ❌ Close failed: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════
  //  Position Monitoring
  // ═══════════════════════════════════════

  _onPositionUpdate(pos) {
    if (pos.netPos !== 0) {
      this.activePositions.set(pos.id, pos);
      this.emit("position:open", pos);
    } else {
      this.activePositions.delete(pos.id);
      this.emit("position:closed", pos);
    }
  }

  _onOrderUpdate(order) {
    this.emit("order:update", order);
  }

  _onFill(fill) {
    console.log(`  💰 Fill: ${fill.action} ${fill.qty}x @ ${fill.price}`);
    this.emit("fill", fill);
  }

  _onChartData(data) {
    // Accumulate candles for ICT analysis
    if (Array.isArray(data)) {
      for (const bar of data) {
        this.candleBuffer.push({
          timestamp: bar.timestamp || bar.t,
          open: bar.open || bar.o,
          high: bar.high || bar.h,
          low: bar.low || bar.l,
          close: bar.close || bar.c,
          volume: bar.volume || bar.v || 0,
        });
      }
      // Keep last 200 candles
      if (this.candleBuffer.length > 200) {
        this.candleBuffer = this.candleBuffer.slice(-200);
      }
    }
  }

  // ═══════════════════════════════════════
  //  Monitoring Loop
  // ═══════════════════════════════════════

  _monitorLoop() {
    const interval = setInterval(() => {
      if (!this.running) { clearInterval(interval); return; }

      const status = this.state.getStatus();

      // ─── Auto-flatten on daily loss limit ───
      if (Math.abs(Math.min(0, status.todayPnL)) >= this.accountProfile.maxDailyLossDollars) {
        if (this.activePositions.size > 0) {
          console.log("🛑 DAILY LOSS LIMIT — auto-flattening all positions");
          this._executeClose({ action: "CLOSE", symbol: this.nqSymbol });
        }
      }

      // ─── Friday 2pm auto-flatten ───
      const est = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
      if (est.getDay() === 5 && est.getHours() >= 14 && this.activePositions.size > 0) {
        console.log("🛑 FRIDAY 2PM — auto-flattening (Raschke rule)");
        this._executeClose({ action: "CLOSE", symbol: this.nqSymbol });
      }

    }, 30000); // Every 30 seconds
  }

  // ═══════════════════════════════════════
  //  Journal / State Recording
  // ═══════════════════════════════════════

  _recordEntry(signal, result, ictScore) {
    // Record in state manager for tracking
    const trade = {
      symbol: signal.symbol,
      direction: signal.action === "BUY" ? "LONG" : "SHORT",
      entryPrice: signal.price,
      exitPrice: 0, // Updated on close
      stopPrice: signal.stop,
      contracts: signal.qty,
      pnl: 0,       // Updated on close
      rMultiple: 0,
      entryReason: `${signal.strategy} | ${signal.comment}`,
      exitReason: "",
      emotionalState: "automated",
      timestamp: new Date().toISOString(),
      orderId: result.orderId,
      ictConfluence: ictScore ? ictScore.factors.join("+") : "",
      source: signal.source || "tradingview",
    };

    // Store as pending trade (will be completed on exit)
    this.activePositions.set(result.orderId, trade);
  }

  // ═══════════════════════════════════════
  //  Manual Signal Input (for CLI/Bridge)
  // ═══════════════════════════════════════

  async manualSignal(action, symbol, qty, price, stop, target) {
    const signal = {
      id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "manual",
      action: action.toUpperCase(),
      symbol: symbol || this.nqSymbol,
      qty: qty || 1,
      price: price || 0,
      stop: stop || 0,
      target: target || 0,
      strategy: "MANUAL",
      comment: "Manual CLI entry",
    };

    await this._onSignal(signal);
  }

  // ═══════════════════════════════════════
  //  ICT Analysis on Demand
  // ═══════════════════════════════════════

  getICTAnalysis() {
    if (this.candleBuffer.length < 10) {
      return { error: "Not enough candle data yet. Wait for market data." };
    }
    return ICTConcepts.analyze(this.candleBuffer);
  }

  getICTSetup(bias = null) {
    if (this.candleBuffer.length < 20) {
      return { error: "Need 20+ candles for setup detection." };
    }
    return ICTConcepts.generateSetup(this.candleBuffer, bias);
  }

  // ═══════════════════════════════════════
  //  Status / Dashboard
  // ═══════════════════════════════════════

  getDashboard() {
    const status = this.state.getStatus();
    return {
      ...status,
      tradovateConnected: !!(this.tradovate && this.tradovate.token),
      webhookActive: !!(this.webhook && this.webhook.server),
      webhookStats: this.webhook ? this.webhook.stats : null,
      activePositions: this.activePositions.size,
      candleBufferSize: this.candleBuffer.length,
      killzone: ICTConcepts.getCurrentKillzone(),
      symbol: this.nqSymbol,
    };
  }

  // ═══════════════════════════════════════
  //  Shutdown
  // ═══════════════════════════════════════

  stop() {
    this.running = false;
    if (this.webhook) this.webhook.stop();
    if (this.tradovate) this.tradovate.disconnect();
    this.state.save();
    console.log("\n🐺 Execution Engine stopped. State saved.\n");
  }
}

module.exports = ExecutionEngine;
