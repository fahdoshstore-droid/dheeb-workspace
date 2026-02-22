/**
 * 🐺 DHEEB TRADING MIND — System Test
 */

const DheebCore = require("./core/dheeb-core");

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || "Assertion failed"); }

console.log("\n═══ 🐺 DHEEB TRADING MIND — Test Suite ═══\n");

// Fresh core (resets state)
const core = new DheebCore();
core.reset();

// ─── 1. Session Start ───
test("Session Start returns steps", () => {
  const r = core.startSession();
  assert(r.steps.length >= 2);
  assert(r.canProceed !== undefined);
});

// ─── 2. Checklist ───
test("Checklist complete", () => {
  const r = core.completeChecklist({
    prevDayHighLow: true, vwapLevel: true, overnightRange: 50,
    keyLevels: true, newsCheck: true, maxLossDefined: true,
  });
  assert(r.completed === true);
});

test("Checklist incomplete catches missing", () => {
  core.state.state.checklistCompleted = false;
  const r = core.completeChecklist({
    prevDayHighLow: true, vwapLevel: false, overnightRange: 50,
    keyLevels: true, newsCheck: true, maxLossDefined: false,
  });
  assert(r.completed === false);
  assert(r.missing.length === 2);
});

// Re-complete
core.completeChecklist({
  prevDayHighLow: true, vwapLevel: true, overnightRange: 50,
  keyLevels: true, newsCheck: true, maxLossDefined: true,
});

// ─── 3. Psychology Module ───
test("Psych: calm → CLEAR", () => {
  const r = core.psychCheck("calm");
  assert(r.cleared === true);
  assert(r.level === "CLEAR");
});

test("Psych: revenge → BLOCKED", () => {
  const r = core.psychCheck("revenge");
  assert(r.cleared === false);
  assert(r.level === "BLOCKED");
});

test("Psych: anxious → CAUTION + half size", () => {
  const r = core.psychCheck("anxious");
  assert(r.level === "CAUTION");
  assert(r.sizeMultiplier === 0.5);
});

// Clear for trading
core.psychCheck("focused");

// ─── 4. Trade Evaluation ───
test("Valid NQ trade → approved", () => {
  const r = core.evaluateTrade({
    symbol: "NQ", direction: "LONG",
    entryPrice: 21500, stopPrice: 21480, targetPrice: 21540,
    contracts: 1, reason: "Breakout",
  });
  assert(r.approved === true, `Expected approved, got: ${JSON.stringify(r.checks.map(c=>c.check+":"+c.passed))}`);
});

test("Bad R:R → rejected", () => {
  const r = core.evaluateTrade({
    symbol: "NQ", direction: "LONG",
    entryPrice: 21500, stopPrice: 21470, targetPrice: 21510,
    contracts: 1, reason: "Bad RR",
  });
  assert(r.approved === false);
});

test("Oversize 5 NQ → rejected", () => {
  const r = core.evaluateTrade({
    symbol: "NQ", direction: "LONG",
    entryPrice: 21500, stopPrice: 21480, targetPrice: 21540,
    contracts: 5, reason: "Too big",
  });
  assert(r.approved === false);
});

// ─── 5. Risk Engine ───
test("Position size NQ 15pt stop", () => {
  const r = core.risk.calculatePositionSize("NQ", 15);
  assert(r.maxContracts >= 1);
  assert(parseFloat(r.totalRisk) <= 500);
});

test("Position size MNQ 15pt stop", () => {
  const r = core.risk.calculatePositionSize("MNQ", 15);
  assert(r.maxContracts >= 1);
});

test("Volatility: normal (50pts)", () => {
  const r = core.risk.assessVolatility(50);
  assert(r.mode === "NORMAL");
});

test("Volatility: high (120pts)", () => {
  const r = core.risk.assessVolatility(120);
  assert(r.mode === "HIGH_VOL");
});

test("Volatility: VIX 35 → DANGER", () => {
  const r = core.risk.assessVolatility(80, 35);
  assert(r.mode === "DANGER");
});

// ─── 6. Record Trades ───
test("Record win → balance increases", () => {
  const before = core.state.state.currentBalance;
  core.recordTrade({
    symbol: "NQ", direction: "LONG", entryPrice: 21500, exitPrice: 21530,
    stopPrice: 21480, contracts: 1, pnl: 600, rMultiple: 1.2,
    entryReason: "Test", exitReason: "Target", emotionalState: "focused",
    timestamp: new Date().toISOString(),
  });
  assert(core.state.state.currentBalance === before + 600);
});

test("Record loss → consecutive losses tracked", () => {
  core.recordTrade({
    symbol: "NQ", direction: "LONG", entryPrice: 21500, exitPrice: 21480,
    stopPrice: 21480, contracts: 1, pnl: -400, rMultiple: -0.8,
    entryReason: "Test", exitReason: "Stop hit", emotionalState: "calm",
    timestamp: new Date().toISOString(),
  });
  core.recordTrade({
    symbol: "NQ", direction: "SHORT", entryPrice: 21500, exitPrice: 21520,
    stopPrice: 21520, contracts: 1, pnl: -400, rMultiple: -0.8,
    entryReason: "Test", exitReason: "Stop hit", emotionalState: "calm",
    timestamp: new Date().toISOString(),
  });
  assert(core.state.state.todayConsecutiveLosses >= 2);
});

test("After 2 losses → canTrade blocked", () => {
  const s = core.state.getStatus();
  assert(s.canTrade.reasons.includes("CONSECUTIVE_LOSSES"));
});

// ─── 7. Coach ───
test("Coach advice: revenge", () => {
  const r = core.getAdvice("revenge");
  assert(r.advice_ar.length > 0);
  assert(r.source === "Hougaard");
});

test("Coach advice: overtrading", () => {
  const r = core.getAdvice("overtrading");
  assert(r.source === "Raschke");
});

// ─── 8. Dashboard ───
test("Dashboard returns all fields", () => {
  const s = core.dashboard();
  assert(s.balance > 0);
  assert(s.todayPnL !== undefined);
  assert(s.canTrade !== undefined);
  assert(s.drawdownPercent !== undefined);
});

// ─── 9. News Blackout ───
test("FOMC blackout: 10 min → blocked", () => {
  const r = core.trading.checkNewsBlackout("FOMC", 10);
  assert(r.blocked === true);
});

test("FOMC blackout: 35 min → allowed", () => {
  const r = core.trading.checkNewsBlackout("FOMC", 35);
  assert(r.blocked === false);
});

test("CPI: 2 min → blocked", () => {
  const r = core.trading.checkNewsBlackout("CPI", 2);
  assert(r.blocked === true);
});

// ─── 10. Story Changed ───
test("Story Changed returns guidance", () => {
  const r = core.trading.storyChangedCheck({ symbol: "NQ", direction: "LONG", entryPrice: 21500 });
  assert(r.guidance_ar.length >= 3);
});

// ─── Summary ───
console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══\n`);
process.exit(failed > 0 ? 1 : 0);
