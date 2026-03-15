/**
 * ═══════════════════════════════════════════════════════════════
 *  DHEEB TRADING MIND — Core Orchestrator
 *  الجسر المركزي بين جميع الوحدات
 * ═══════════════════════════════════════════════════════════════
 */

const StateManager = require("./state-manager");
const TradingCore = require("../modules/trading-core");
const Psychology = require("../modules/psychology");
const RiskEngine = require("../modules/risk-engine");
const Coach = require("../modules/coach");
const SETTINGS = require("../config/settings");

class DheebCore {
  constructor() {
    this.state = new StateManager();
    this.trading = new TradingCore(this.state);
    this.psych = new Psychology(this.state);
    this.risk = new RiskEngine(this.state);
    this.coach = new Coach(this.state);
  }

  /**
   * ═══ WORKFLOW 1: Pre-Session Startup ═══
   * يجب تشغيله قبل أي تداول
   */
  startSession() {
    const results = {
      timestamp: new Date().toISOString(),
      steps: [],
    };

    // Step 1: Session time check
    const timeCheck = this.trading.checkSessionTime();
    results.steps.push({ module: "trading-core", check: "session_time", ...timeCheck });

    // Step 2: Drawdown assessment
    const drawdownCheck = this.risk.assessDrawdown();
    results.steps.push({ module: "risk-engine", check: "drawdown", ...drawdownCheck });

    // Step 3: If drawdown requires pause, stop here
    if (drawdownCheck.action === "PAUSE_TRADING" || drawdownCheck.action === "FULL_STOP") {
      results.canProceed = false;
      results.blockReason = drawdownCheck.description_ar;
      results.coachAdvice = this.coach.getAdvice("drawdownRecovery");
      return results;
    }

    // Step 4: Return checklist for completion
    results.checklist = this.trading.getPreSessionChecklist();
    results.canProceed = true;
    results.nextStep = "أكمل الـ checklist ثم شغّل: completeChecklist()";

    return results;
  }

  /**
   * ═══ WORKFLOW 2: Complete Pre-Session Checklist ═══
   */
  completeChecklist(answers) {
    /**
     * answers = {
     *   prevDayHighLow: true,      // هل حددت هاي/لو أمس؟
     *   vwapLevel: true,            // هل حددت VWAP؟
     *   overnightRange: 65,         // النطاق الليلي بالنقاط
     *   keyLevels: true,            // هل حددت مستويات الدعم/المقاومة؟
     *   newsCheck: true,            // هل فحصت الأخبار؟
     *   maxLossDefined: true,       // هل حددت أقصى خسارة اليوم كتابياً؟
     * }
     */
    const missing = [];
    if (!answers.prevDayHighLow) missing.push("تحديد High/Low أمس");
    if (!answers.vwapLevel) missing.push("تحديد مستوى VWAP");
    if (!answers.keyLevels) missing.push("تحديد مستويات S/R");
    if (!answers.newsCheck) missing.push("فحص الأخبار");
    if (!answers.maxLossDefined) missing.push("تحديد أقصى خسارة كتابياً (Carter)");

    if (missing.length > 0) {
      return {
        completed: false,
        missing,
        message_ar: `لا يمكن بدء التداول. أكمل: ${missing.join("، ")}`,
      };
    }

    this.state.setChecklistComplete();

    // Volatility assessment from overnight range
    const volCheck = this.risk.assessVolatility(answers.overnightRange);

    return {
      completed: true,
      volatility: volCheck,
      nextStep: "شغّل: psychCheck() للتحقق النفسي",
    };
  }

  /**
   * ═══ WORKFLOW 3: Psychology Check ═══
   */
  psychCheck(mood) {
    /**
     * mood = "calm" | "focused" | "anxious" | "revenge" | "fomo" |
     *        "euphoria" | "anger" | "fatigue" | "sleep_deprived" |
     *        "overconfident" | "bored" | "distracted"
     */
    const result = this.psych.evaluate(mood);
    return result;
  }

  /**
   * ═══ WORKFLOW 4: Evaluate a Trade Setup (Pre-Entry) ═══
   * الفحص الأساسي قبل الدخول
   */
  evaluateTrade(setup) {
    /**
     * setup = {
     *   symbol: "NQ" | "MNQ",
     *   direction: "LONG" | "SHORT",
     *   entryPrice: number,
     *   stopPrice: number,
     *   targetPrice: number,
     *   contracts: number,
     *   reason: string,           // سبب الدخول
     * }
     */
    const results = {
      timestamp: new Date().toISOString(),
      setup,
      checks: [],
      approved: true,
      warnings: [],
    };

    // Check 1: Can we trade at all?
    const status = this.state.getStatus();
    if (!status.canTrade.allowed) {
      results.approved = false;
      results.blockReasons = status.canTrade.reasons;
      results.checks.push({ check: "canTrade", passed: false, reasons: status.canTrade.reasons });
      return results;
    }

    // Check 2: Risk/Reward validation
    const rrCheck = this.trading.validateRiskReward(setup);
    results.checks.push({ check: "riskReward", ...rrCheck });
    if (!rrCheck.passed) {
      results.approved = false;
      results.warnings.push(rrCheck.message_ar);
    }

    // Check 3: Position size risk
    const sizeCheck = this.risk.validatePositionSize(setup);
    results.checks.push({ check: "positionSize", ...sizeCheck });
    if (!sizeCheck.passed) {
      results.approved = false;
      results.warnings.push(sizeCheck.message_ar);
    }

    // Check 4: Dollar risk within limits
    const dollarCheck = this.risk.validateDollarRisk(setup);
    results.checks.push({ check: "dollarRisk", ...dollarCheck });
    if (!dollarCheck.passed) {
      results.approved = false;
      results.warnings.push(dollarCheck.message_ar);
    }

    // Check 5: Session timing
    const timeCheck = this.trading.checkSessionTime();
    results.checks.push({ check: "timing", ...timeCheck });
    if (timeCheck.warning) {
      results.warnings.push(timeCheck.warning_ar);
    }

    // Check 6: Drawdown-adjusted sizing
    const ddSizing = this.risk.getDrawdownAdjustedSize(setup);
    if (ddSizing.adjusted) {
      results.warnings.push(ddSizing.message_ar);
      results.adjustedContracts = ddSizing.maxContracts;
    }

    // Final verdict
    if (results.approved) {
      results.message_ar = `✅ الصفقة مقبولة | ${setup.symbol} ${setup.direction} × ${setup.contracts} | R:R = ${rrCheck.rr}`;
    } else {
      results.message_ar = `❌ الصفقة مرفوضة | ${results.warnings.join(" | ")}`;
    }

    return results;
  }

  /**
   * ═══ WORKFLOW 5: Record Completed Trade ═══
   */
  recordTrade(trade) {
    const status = this.state.recordTrade(trade);

    // Post-trade coaching
    const coaching = this.coach.postTradeAdvice(trade, status);

    return {
      status,
      coaching,
      journal: {
        message_ar: "✅ تم تسجيل الصفقة في اليومية",
        fields: ["entryReason", "exitReason", "emotionalState", "rMultiple"],
      }
    };
  }

  /**
   * ═══ WORKFLOW 6: End of Day Review ═══
   */
  endOfDay() {
    const status = this.state.getStatus();
    const review = this.coach.dailyReview(status);
    this.state.setSessionActive(false);
    this.state.save();

    return {
      ...review,
      status,
    };
  }

  /**
   * ═══ WORKFLOW 7: Weekly Review ═══
   */
  weeklyReview() {
    const history = this.state.getDailyHistory(7);
    const status = this.state.getStatus();
    return this.coach.weeklyReview(history, status);
  }

  /**
   * ═══ Quick Status ═══
   */
  dashboard() {
    return this.state.getStatus();
  }

  /**
   * ═══ Get Coaching for Specific Situation ═══
   */
  getAdvice(scenario) {
    return this.coach.getAdvice(scenario);
  }

  /**
   * ═══ Reset ═══
   */
  reset() {
    this.state.resetAccount();
    return { message_ar: "تم إعادة تعيين الحساب بالكامل" };
  }
}

module.exports = DheebCore;
