/**
 * 🐺 DHEEB TRADING BOT v2 — Full System Test
 */

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++; }
}
function assert(c, m) { if (!c) throw new Error(m || "Assert failed"); }

console.log("\n═══ 🐺 DHEEB TRADING BOT v2 — Full Test Suite ═══\n");

// ═══════════════════════════════════════
//  1. Core System (from v1)
// ═══════════════════════════════════════
console.log("─── Core System ───");
const DheebCore = require("./core/dheeb-core");
const core = new DheebCore();
core.reset();

test("Session start", () => {
  const r = core.startSession();
  assert(r.steps.length >= 2);
});

test("Checklist complete", () => {
  const r = core.completeChecklist({
    prevDayHighLow: true, vwapLevel: true, overnightRange: 50,
    keyLevels: true, newsCheck: true, maxLossDefined: true,
  });
  assert(r.completed);
});

core.psychCheck("focused");

test("Trade evaluation passes", () => {
  const r = core.evaluateTrade({
    symbol: "NQ", direction: "LONG",
    entryPrice: 21500, stopPrice: 21480, targetPrice: 21540,
    contracts: 1, reason: "Test",
  });
  assert(r.approved);
});

test("Bad R:R rejected", () => {
  const r = core.evaluateTrade({
    symbol: "NQ", direction: "LONG",
    entryPrice: 21500, stopPrice: 21470, targetPrice: 21510,
    contracts: 1, reason: "Bad RR",
  });
  assert(!r.approved);
});

// ═══════════════════════════════════════
//  2. ICT Concepts
// ═══════════════════════════════════════
console.log("\n─── ICT Concepts ───");
const ICT = require("./ict/ict-concepts");

// Generate test candles
function makeCandles(count = 50) {
  const candles = [];
  let price = 21500;
  for (let i = 0; i < count; i++) {
    const move = (Math.random() - 0.48) * 20;
    const open = price;
    const close = price + move;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    candles.push({
      timestamp: new Date(Date.now() - (count - i) * 300000).toISOString(),
      open, high, low, close,
      volume: Math.floor(Math.random() * 5000),
    });
    price = close;
  }
  return candles;
}

// Create candles with guaranteed FVG
function makeFVGCandles() {
  return [
    { timestamp: "t1", open: 100, high: 105, low: 98, close: 103, volume: 100 },
    { timestamp: "t2", open: 103, high: 115, low: 102, close: 114, volume: 200 },
    { timestamp: "t3", open: 114, high: 120, low: 108, close: 118, volume: 150 },
    // Bullish FVG: c1.high(105) < c3.low(108) → gap between 105 and 108
  ];
}

test("FVG detection (bullish)", () => {
  const candles = makeFVGCandles();
  const fvgs = ICT.findFVGs(candles, "bullish");
  assert(fvgs.length >= 1, `Found ${fvgs.length} FVGs`);
  assert(fvgs[0].type === "BULLISH_FVG");
  assert(fvgs[0].bottom === 105);
  assert(fvgs[0].top === 108);
});

test("FVG detection (bearish)", () => {
  const candles = [
    { timestamp: "t1", open: 120, high: 122, low: 115, close: 116, volume: 100 },
    { timestamp: "t2", open: 116, high: 117, low: 105, close: 106, volume: 200 },
    { timestamp: "t3", open: 106, high: 112, low: 100, close: 102, volume: 150 },
    // Bearish FVG: c1.low(115) > c3.high(112) → gap between 112 and 115
  ];
  const fvgs = ICT.findFVGs(candles, "bearish");
  assert(fvgs.length >= 1);
  assert(fvgs[0].type === "BEARISH_FVG");
});

test("Order Block detection", () => {
  const candles = [
    { timestamp: "t0", open: 105, high: 106, low: 100, close: 101, volume: 50 },  // padding
    { timestamp: "t1", open: 101, high: 102, low: 98, close: 99, volume: 100 },   // bearish (OB candle)
    { timestamp: "t2", open: 99, high: 115, low: 98, close: 114, volume: 300 },    // big bullish impulse
  ];
  const obs = ICT.findOrderBlocks(candles, 10);
  assert(obs.length >= 1, `Found ${obs.length} OBs`);
  assert(obs[0].type === "BULLISH_OB");
});

test("Killzones defined", () => {
  const kz = ICT.getKillzones();
  assert(kz.asian);
  assert(kz.london);
  assert(kz.nyAM);
  assert(kz.nyLunch);
  assert(kz.nyPM);
});

test("Current killzone returns value", () => {
  const kz = ICT.getCurrentKillzone();
  assert(kz.zone);
  assert(kz.label_ar);
});

test("OTE calculation", () => {
  const ote = ICT.calculateOTE(21600, 21400, "LONG");
  assert(ote.oteZoneTop < 21600);
  assert(ote.oteZoneBottom < ote.oteZoneTop);
  assert(ote.equilibrium === 21500);
});

test("Full ICT analysis runs", () => {
  const candles = makeCandles(60);
  const analysis = ICT.analyze(candles);
  assert(analysis.killzone);
  assert(Array.isArray(analysis.fvgs));
  assert(Array.isArray(analysis.orderBlocks));
  assert(analysis.liquidity);
  assert(analysis.structure !== undefined);
});

test("ICT setup generation", () => {
  const candles = makeCandles(60);
  const setup = ICT.generateSetup(candles);
  assert(setup.signal); // Will be NO_TRADE, WAIT, LONG, or SHORT
});

// ═══════════════════════════════════════
//  3. Webhook Server
// ═══════════════════════════════════════
console.log("\n─── Webhook Server ───");
const { WebhookServer, generatePineScript } = require("./webhook/server");

test("Webhook server creates", () => {
  const ws = new WebhookServer({ port: 0, secret: "test" });
  assert(ws);
  assert(ws.stats.received === 0);
});

test("Pine Script generates", () => {
  const pine = generatePineScript({ secret: "test123", symbol: "NQH6" });
  assert(pine.includes("strategy"));
  assert(pine.includes("test123"));
  assert(pine.includes("NQH6"));
  assert(pine.includes("ICT"));
  assert(pine.includes("FVG"));
  assert(pine.includes("VWAP"));
});

// ═══════════════════════════════════════
//  4. Portfolio Manager
// ═══════════════════════════════════════
console.log("\n─── Portfolio Manager ───");
const PortfolioManager = require("./execution/portfolio");
const pm = new PortfolioManager();

// Clear previous test data
for (const id of Object.keys(pm.accounts)) pm.removeAccount(id);

test("Add accounts", () => {
  pm.addAccount({
    id: "apex_1", name: "Apex 50K #1", broker: "tradovate",
    type: "funded", balance: 50000, maxDrawdown: 2500,
    maxDailyLoss: 1000, trailingDrawdown: true,
    active: true, copyTrade: true, sizeMultiplier: 1.0,
  });
  pm.addAccount({
    id: "apex_2", name: "Apex 50K #2", broker: "tradovate",
    type: "funded", balance: 50000, maxDrawdown: 2500,
    maxDailyLoss: 1000, trailingDrawdown: true,
    active: true, copyTrade: true, sizeMultiplier: 0.5,
  });
  assert(pm.listAccounts().length === 2);
});

test("Record winning trade", () => {
  const r = pm.recordTrade("apex_1", { pnl: 600 });
  assert(r.balance === 50600);
  assert(r.status === "ACTIVE");
});

test("Record losing trade + drawdown calc", () => {
  pm.recordTrade("apex_1", { pnl: -400 });
  const acc = pm.getAccount("apex_1");
  assert(acc.currentBalance === 50200);
  // Peak was 50600, trailing DD = 400
  assert(acc.currentDrawdown === 400);
});

test("Blow account on max drawdown", () => {
  pm.recordTrade("apex_2", { pnl: -2600 }); // > maxDrawdown of 2500
  const acc = pm.getAccount("apex_2");
  assert(acc.status === "BLOWN", `Status is ${acc.status}`);
  assert(acc.active === false);
});

test("Copy trade distribution", () => {
  const dists = pm.distributeTrade({
    action: "BUY", symbol: "NQH6", qty: 2,
    price: 21500, stop: 21480,
  });
  // Only apex_1 should be active (apex_2 is blown)
  const active = dists.filter(d => !d.skipped && d.qty);
  assert(active.length >= 1);
});

test("Portfolio dashboard", () => {
  const dash = pm.getPortfolioDashboard();
  assert(dash.summary.totalAccounts === 2);
  assert(dash.summary.activeAccounts === 1);
  assert(dash.summary.blownAccounts === 1);
  assert(dash.accounts.length === 2);
});

// ═══════════════════════════════════════
//  5. Execution Engine (unit-level)
// ═══════════════════════════════════════
console.log("\n─── Execution Engine ───");
const ExecutionEngine = require("./execution/engine");

test("Engine creates without Tradovate", () => {
  const engine = new ExecutionEngine({ webhook: false });
  assert(engine);
  assert(engine.tradovate === null);
});

test("Engine dashboard works", () => {
  const engine = new ExecutionEngine({ webhook: false });
  const dash = engine.getDashboard();
  assert(dash.balance > 0);
  assert(dash.tradovateConnected === false);
  assert(dash.killzone);
});

test("Engine ICT analysis (empty buffer returns error)", () => {
  const engine = new ExecutionEngine({ webhook: false });
  const result = engine.getICTAnalysis();
  assert(result.error); // Not enough data
});

test("Engine ICT analysis (with buffer)", () => {
  const engine = new ExecutionEngine({ webhook: false });
  engine.candleBuffer = makeCandles(60);
  const result = engine.getICTAnalysis();
  assert(result.killzone);
  assert(Array.isArray(result.fvgs));
});

// ═══════════════════════════════════════
//  6. Tradovate Connector (structure)
// ═══════════════════════════════════════
console.log("\n─── Tradovate Connector ───");
const TradovateConnector = require("./connectors/tradovate");

test("Connector creates with demo config", () => {
  const tv = new TradovateConnector({
    username: "test", password: "test",
    cid: "test", sec: "test", isDemo: true,
  });
  assert(tv.baseUrl === "demo.tradovateapi.com");
  assert(tv.mdUrl === "md-demo.tradovateapi.com");
});

test("Connector creates with live config", () => {
  const tv = new TradovateConnector({
    username: "test", password: "test",
    cid: "test", sec: "test", isDemo: false,
  });
  assert(tv.baseUrl === "live.tradovateapi.com");
});

// ═══════════════════════════════════════
//  7. Notifier
// ═══════════════════════════════════════
console.log("\n─── Notifier ───");
const Notifier = require("./execution/notifier");

test("Notifier creates (disabled without tokens)", () => {
  const n = new Notifier();
  assert(n.enabled === false);
});

test("Notifier send works without Telegram", () => {
  const n = new Notifier();
  n.send("Test message", "info"); // Should just console.log
});

// ═══════════════════════════════════════
//  Summary
// ═══════════════════════════════════════
console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══\n`);

// Cleanup test portfolio data
for (const id of Object.keys(pm.accounts)) pm.removeAccount(id);

process.exit(failed > 0 ? 1 : 0);
