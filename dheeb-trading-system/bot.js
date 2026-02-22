#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  🐺 DHEEB TRADING BOT — Main Entry Point
 *
 *  Usage:
 *    node bot.js                    → Full bot (Tradovate + Webhook)
 *    node bot.js --webhook-only     → Webhook server only (dry run)
 *    node bot.js --pine             → Generate Pine Script
 *    node bot.js --status           → Dashboard
 *    node bot.js --test-signal      → Send test signal
 * ═══════════════════════════════════════════════════════════════
 */

// Load .env
try {
  const fs = require("fs");
  const envPath = require("path").join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
} catch (e) { /* .env optional */ }

const ExecutionEngine = require("./execution/engine");
const { generatePineScript } = require("./webhook/server");
const http = require("http");

// ─── Parse CLI args ───
const args = process.argv.slice(2);
const flags = new Set(args.map(a => a.toLowerCase()));

// ═══════════════════════════════════════
//  Mode: Generate Pine Script
// ═══════════════════════════════════════
if (flags.has("--pine") || flags.has("--pinescript")) {
  const port = process.env.WEBHOOK_PORT || 3000;
  const secret = process.env.WEBHOOK_SECRET || "change_me";
  const symbol = process.env.NQ_SYMBOL || "NQH6";

  console.log("\n═══ 🐺 Dheeb ICT Pine Script ═══\n");
  console.log("Copy this to TradingView > Pine Editor > Add to Chart\n");
  console.log("Then create an Alert:");
  console.log(`  Webhook URL: http://YOUR_SERVER_IP:${port}/webhook`);
  console.log(`  Message: {{strategy.order.alert_message}}\n`);
  console.log("─".repeat(60));
  console.log(generatePineScript({
    webhookUrl: `http://YOUR_SERVER_IP:${port}/webhook`,
    secret,
    symbol,
  }));
  console.log("─".repeat(60));
  process.exit(0);
}

// ═══════════════════════════════════════
//  Mode: Test Signal
// ═══════════════════════════════════════
if (flags.has("--test-signal") || flags.has("--test")) {
  const port = process.env.WEBHOOK_PORT || 3000;
  const secret = process.env.WEBHOOK_SECRET || "";
  const symbol = process.env.NQ_SYMBOL || "NQH6";

  const testSignal = JSON.stringify({
    secret: secret,
    action: "buy",
    symbol: symbol,
    qty: 1,
    price: 21500,
    stop: 21480,
    target: 21540,
    strategy: "ICT_FVG",
    timeframe: "5m",
    comment: "TEST SIGNAL — Bullish FVG + OB",
  });

  const req = http.request({
    hostname: "localhost",
    port: port,
    path: "/webhook",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, (res) => {
    let body = "";
    res.on("data", (c) => body += c);
    res.on("end", () => {
      console.log(`\n📨 Test signal sent → ${res.statusCode}`);
      console.log(body);
      process.exit(0);
    });
  });

  req.on("error", (err) => {
    console.error(`\n❌ Server not running? ${err.message}`);
    console.log("Start the bot first: node bot.js\n");
    process.exit(1);
  });

  req.write(testSignal);
  req.end();
  process.exit(0); // exit handled above
}

// ═══════════════════════════════════════
//  Mode: Status Dashboard
// ═══════════════════════════════════════
if (flags.has("--status") || flags.has("--dashboard")) {
  const StateManager = require("./core/state-manager");
  const ICT = require("./ict/ict-concepts");
  const state = new StateManager();
  const s = state.getStatus();
  const kz = ICT.getCurrentKillzone();

  console.log(`
═══════════════════════════════════════════
  🐺 DHEEB TRADING BOT — Dashboard
═══════════════════════════════════════════
  💰 Balance:       $${s.balance.toFixed(0)}
  ${s.todayPnL >= 0 ? "🟢" : "🔴"} Today P&L:    $${s.todayPnL.toFixed(0)}
  📊 Week P&L:      $${s.weekPnL.toFixed(0)}
  📉 Drawdown:      ${s.drawdownPercent}% ${s.drawdownLevel ? `(${s.drawdownLevel})` : ""}
  ─────────────────────────────────────────
  📈 Trades today:  ${s.todayTrades}/4
  💵 Daily risk:    $${s.remainingDailyRisk} remaining
  💵 Weekly risk:   $${s.remainingWeeklyRisk} remaining
  📋 Checklist:     ${s.checklistDone ? "✅" : "❌"}
  🧠 Psych:         ${s.psychCleared ? "✅" : "❌"}
  ${s.canTrade.allowed ? "✅" : "🛑"} Can trade:     ${s.canTrade.allowed ? "YES" : s.canTrade.reasons.join(", ")}
  ─────────────────────────────────────────
  🕐 Killzone:      ${kz.label_ar} ${kz.active ? "✅" : "❌"}
═══════════════════════════════════════════
  `);
  process.exit(0);
}

// ═══════════════════════════════════════
//  Mode: Full Bot / Webhook Only
// ═══════════════════════════════════════
const webhookOnly = flags.has("--webhook-only") || flags.has("--dry");

const config = {
  webhookPort: parseInt(process.env.WEBHOOK_PORT) || 3000,
  webhookSecret: process.env.WEBHOOK_SECRET || "",
  accountProfile: process.env.ACCOUNT_PROFILE || "small",
  nqSymbol: process.env.NQ_SYMBOL || "NQH6",
  mnqSymbol: process.env.MNQ_SYMBOL || "MNQH6",
};

// Add Tradovate config only if not webhook-only
if (!webhookOnly && process.env.TRADOVATE_USER) {
  config.tradovate = {
    username: process.env.TRADOVATE_USER,
    password: process.env.TRADOVATE_PASS,
    cid: process.env.TRADOVATE_CID,
    sec: process.env.TRADOVATE_SEC,
    deviceId: process.env.TRADOVATE_DEVICE_ID || "dheeb-001",
    isDemo: process.env.TRADOVATE_DEMO !== "false",
  };
}

const engine = new ExecutionEngine(config);

// ─── Event Logging ───
engine.on("signal:executed", ({ signal, result }) => {
  console.log(`  ✅ EXECUTED: ${signal.action} ${signal.symbol} x${signal.qty} → Order: ${result.orderId}`);
});

engine.on("signal:rejected", ({ signal, reason }) => {
  console.log(`  🛑 REJECTED: ${signal.action} ${signal.symbol} → ${reason}`);
});

engine.on("signal:failed", ({ signal, error }) => {
  console.log(`  ❌ FAILED: ${signal.action} ${signal.symbol} → ${error}`);
});

engine.on("dryrun", (signal) => {
  console.log(`  📝 DRY RUN: Would execute ${signal.action} ${signal.symbol} x${signal.qty}`);
});

engine.on("position:open", (pos) => {
  console.log(`  📊 Position opened: ${pos.netPos > 0 ? "LONG" : "SHORT"} x${Math.abs(pos.netPos)}`);
});

engine.on("position:closed", (pos) => {
  console.log(`  📊 Position closed`);
});

// ─── Start ───
engine.start().then(() => {
  if (webhookOnly) {
    console.log("\n⚠️  WEBHOOK-ONLY MODE (no Tradovate execution)");
    console.log("   Signals will be logged but not executed.\n");
  }
}).catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});

// ─── Graceful Shutdown ───
process.on("SIGINT", () => {
  console.log("\n⏹️  Shutting down...");
  engine.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  engine.stop();
  process.exit(0);
});
