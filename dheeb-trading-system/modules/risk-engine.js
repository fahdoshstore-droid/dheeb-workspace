/**
 * ═══════════════════════════════════════════════════════════════
 *  MODULE: Risk Engine — إدارة المخاطر ورأس المال
 *  مصادر: Raschke (fixed fractional), Carter (drawdown tiers),
 *          Wieland (prop firm sizing), Hougaard (conviction adj.)
 * ═══════════════════════════════════════════════════════════════
 */

const SETTINGS = require("../config/settings");

class RiskEngine {
  constructor(stateManager) {
    this.state = stateManager;
  }

  /**
   * ═══ Position Size Calculator ═══
   * Raschke model: Fixed Fractional
   * Input: symbol, stopPoints, account context
   * Output: recommended contracts
   */
  calculatePositionSize(symbol, stopPoints) {
    const status = this.state.getStatus();
    const acc = SETTINGS.accounts[this.state.state.accountProfile];
    const contract = SETTINGS.contracts[symbol];

    if (!contract) return { error: `عقد غير معروف: ${symbol}` };

    const maxRiskDollars = acc.maxRiskDollars;
    const riskPerContract = stopPoints * contract.pointValue;

    if (riskPerContract === 0) return { error: "الستوب = 0 نقاط" };

    let maxContracts = Math.floor(maxRiskDollars / riskPerContract);
    let totalRisk = maxContracts * riskPerContract;

    // Apply drawdown reduction
    const dd = this.assessDrawdown();
    if (dd.action === "REDUCE_HALF") {
      maxContracts = Math.max(1, Math.floor(maxContracts / 2));
    } else if (dd.action === "MINIMAL_MODE") {
      maxContracts = symbol === "MNQ" ? Math.min(maxContracts, 2) : (symbol === "NQ" ? 0 : 1);
    } else if (dd.action === "PAUSE_TRADING" || dd.action === "FULL_STOP") {
      maxContracts = 0;
    }

    // Apply volatility reduction
    const volCheck = this._getCurrentVolMode();
    if (volCheck === "HIGH_VOL" && symbol === "NQ") {
      // In high vol, suggest MNQ instead
      const mnqContracts = Math.floor(maxRiskDollars / (stopPoints * SETTINGS.contracts.MNQ.pointValue));
      return {
        symbol: "MNQ",
        recommended: true,
        maxContracts: Math.min(mnqContracts, acc.highVolContracts.MNQ || 5),
        riskPerContract: stopPoints * SETTINGS.contracts.MNQ.pointValue,
        totalRisk: Math.min(mnqContracts, acc.highVolContracts.MNQ || 5) * stopPoints * SETTINGS.contracts.MNQ.pointValue,
        stopPoints,
        message_ar: `⚠️ تذبذب عالي → MNQ بدلاً من NQ. الحد: ${acc.highVolContracts.MNQ} عقود.`,
        source: "Volatility filter + Wieland",
      };
    }

    totalRisk = maxContracts * riskPerContract;

    return {
      symbol,
      maxContracts,
      riskPerContract: riskPerContract.toFixed(0),
      totalRisk: totalRisk.toFixed(0),
      stopPoints,
      maxRiskAllowed: maxRiskDollars,
      drawdownMode: dd.action || "NORMAL",
      message_ar: `${symbol} × ${maxContracts} | ستوب ${stopPoints} نقطة | مخاطرة $${totalRisk.toFixed(0)} من حد $${maxRiskDollars}`,
    };
  }

  /**
   * ═══ Validate Position Size Against Limits ═══
   */
  validatePositionSize(setup) {
    const { symbol, contracts, entryPrice, stopPrice } = setup;
    const contract = SETTINGS.contracts[symbol];
    if (!contract) return { passed: false, message_ar: `عقد غير معروف: ${symbol}` };

    const stopPoints = Math.abs(entryPrice - stopPrice);
    const recommended = this.calculatePositionSize(symbol, stopPoints);

    if (recommended.error) return { passed: false, message_ar: recommended.error };

    if (recommended.maxContracts === 0) {
      return {
        passed: false,
        message_ar: `❌ لا يُسمح بالتداول. وضع الحماية: ${recommended.drawdownMode}`,
      };
    }

    if (contracts > recommended.maxContracts) {
      return {
        passed: false,
        recommended: recommended.maxContracts,
        requested: contracts,
        message_ar: `❌ طلبت ${contracts} عقد. الحد الأقصى: ${recommended.maxContracts} (${recommended.drawdownMode})`,
      };
    }

    return {
      passed: true,
      recommended: recommended.maxContracts,
      requested: contracts,
      message_ar: `✅ حجم مقبول: ${contracts}/${recommended.maxContracts} ${symbol}`,
    };
  }

  /**
   * ═══ Validate Dollar Risk ═══
   */
  validateDollarRisk(setup) {
    const { symbol, contracts, entryPrice, stopPrice } = setup;
    const contract = SETTINGS.contracts[symbol];
    const status = this.state.getStatus();
    const acc = SETTINGS.accounts[this.state.state.accountProfile];

    const stopPoints = Math.abs(entryPrice - stopPrice);
    const totalRisk = stopPoints * contract.pointValue * contracts;

    // Check per-trade limit
    if (totalRisk > acc.maxRiskDollars) {
      return {
        passed: false,
        risk: totalRisk.toFixed(0),
        limit: acc.maxRiskDollars,
        message_ar: `❌ المخاطرة $${totalRisk.toFixed(0)} تتجاوز الحد ($${acc.maxRiskDollars}/صفقة)`,
      };
    }

    // Check remaining daily risk
    if (totalRisk > status.remainingDailyRisk) {
      return {
        passed: false,
        risk: totalRisk.toFixed(0),
        remaining: status.remainingDailyRisk,
        message_ar: `❌ المخاطرة $${totalRisk.toFixed(0)} تتجاوز المتبقي اليوم ($${status.remainingDailyRisk})`,
      };
    }

    // Check remaining weekly risk
    if (totalRisk > status.remainingWeeklyRisk) {
      return {
        passed: false,
        risk: totalRisk.toFixed(0),
        remaining: status.remainingWeeklyRisk,
        message_ar: `❌ المخاطرة $${totalRisk.toFixed(0)} تتجاوز المتبقي هذا الأسبوع ($${status.remainingWeeklyRisk})`,
      };
    }

    return {
      passed: true,
      risk: totalRisk.toFixed(0),
      dailyRemaining: (status.remainingDailyRisk - totalRisk).toFixed(0),
      weeklyRemaining: (status.remainingWeeklyRisk - totalRisk).toFixed(0),
      message_ar: `✅ مخاطرة $${totalRisk.toFixed(0)} | متبقي يومي $${(status.remainingDailyRisk - totalRisk).toFixed(0)} | أسبوعي $${(status.remainingWeeklyRisk - totalRisk).toFixed(0)}`,
    };
  }

  /**
   * ═══ Drawdown Assessment ═══
   * Carter tiered drawdown protocol + Raschke + Hougaard
   */
  assessDrawdown() {
    const s = this.state.state;
    const profile = s.accountProfile;
    const drawdownDollars = s.peakBalance - s.currentBalance;
    const drawdownPercent = s.peakBalance > 0 ? (drawdownDollars / s.peakBalance) * 100 : 0;

    for (const level of SETTINGS.drawdown.levels) {
      const [minPct, maxPct] = level.rangePercent;
      if (drawdownPercent >= minPct && drawdownPercent < maxPct) {
        // Update state
        s.drawdownLevel = level.action;
        this.state.save();

        return {
          drawdownDollars: drawdownDollars.toFixed(0),
          drawdownPercent: drawdownPercent.toFixed(2),
          action: level.action,
          description_ar: level.description_ar,
          description_en: level.description_en,
          source: level.source,
        };
      }
    }

    // No drawdown
    s.drawdownLevel = null;
    this.state.save();

    return {
      drawdownDollars: drawdownDollars.toFixed(0),
      drawdownPercent: drawdownPercent.toFixed(2),
      action: null,
      description_ar: "✅ لا سحب يُذكر. تداول بالحجم الطبيعي.",
    };
  }

  /**
   * ═══ Drawdown-Adjusted Sizing ═══
   */
  getDrawdownAdjustedSize(setup) {
    const dd = this.assessDrawdown();
    const { symbol, contracts } = setup;

    if (!dd.action) {
      return { adjusted: false, maxContracts: contracts };
    }

    let maxContracts = contracts;
    let message_ar = "";

    switch (dd.action) {
      case "REDUCE_HALF":
        maxContracts = Math.max(1, Math.floor(contracts / 2));
        message_ar = `⚠️ وضع السحب: تقليص إلى ${maxContracts} عقد (50%). ${dd.source}`;
        break;
      case "MINIMAL_MODE":
        maxContracts = symbol === "MNQ" ? Math.min(2, contracts) : 0;
        message_ar = `⚠️ وضع الحد الأدنى: ${symbol === "MNQ" ? "1-2 MNQ فقط" : "NQ ممنوع → استخدم MNQ"}. ${dd.source}`;
        break;
      case "PAUSE_TRADING":
        maxContracts = 0;
        message_ar = `🛑 توقف إجباري 3-5 أيام. ${dd.source}`;
        break;
      case "FULL_STOP":
        maxContracts = 0;
        message_ar = `🛑 توقف كامل. فكّر في إعادة التعيين. ${dd.source}`;
        break;
    }

    return {
      adjusted: maxContracts !== contracts,
      maxContracts,
      originalContracts: contracts,
      drawdownAction: dd.action,
      message_ar,
    };
  }

  /**
   * ═══ Volatility Assessment ═══
   * Raschke: shift products in low vol
   * Wieland: reduce size in high vol
   */
  assessVolatility(overnightRange, vix = null) {
    const vol = SETTINGS.volatility;
    const result = {
      overnightRange,
      vix,
      mode: "NORMAL",
      messages: [],
    };

    // Overnight range check
    if (overnightRange > vol.overnightRangeMax) {
      result.mode = "HIGH_VOL";
      result.messages.push({
        ar: `⚠️ النطاق الليلي ${overnightRange} نقطة > ${vol.overnightRangeMax}. تداول MNQ فقط بوقف أوسع (25-30 نقطة).`,
        action: "MNQ_ONLY_WIDE_STOPS",
      });
    }

    // VIX check
    if (vix) {
      if (vix >= vol.vixDanger) {
        result.mode = "DANGER";
        result.messages.push({
          ar: `🛑 VIX = ${vix} (> ${vol.vixDanger}). نصف الحجم أو انتظر 30 دقيقة بعد الافتتاح.`,
          action: "HALF_SIZE_OR_WAIT",
        });
      } else if (vix >= vol.vixCaution) {
        result.mode = "HIGH_VOL";
        result.messages.push({
          ar: `⚠️ VIX = ${vix} (> ${vol.vixCaution}). MNQ فقط. وسّع الوقف.`,
          action: "MNQ_ONLY",
        });
      }
    }

    if (result.messages.length === 0) {
      result.messages.push({
        ar: `✅ تذبذب طبيعي. نطاق ليلي: ${overnightRange} نقطة. تداول بالحجم الاعتيادي.`,
      });
    }

    return result;
  }

  /**
   * ═══ Quick Size Recommendation ═══
   * "كم عقد أتداول الآن؟"
   */
  quickSizeRecommendation(symbol = "NQ", stopPoints = 15) {
    const sizing = this.calculatePositionSize(symbol, stopPoints);
    const dd = this.assessDrawdown();
    const status = this.state.getStatus();

    return {
      recommendation: sizing,
      drawdown: dd,
      tradesRemaining: status.tradesRemaining,
      remainingDailyRisk: status.remainingDailyRisk,
      summary_ar: [
        `📊 ${sizing.symbol} × ${sizing.maxContracts} عقد`,
        `🎯 ستوب: ${stopPoints} نقطة | مخاطرة: $${sizing.totalRisk}`,
        `📉 سحب: ${dd.drawdownPercent}% (${dd.action || "طبيعي"})`,
        `🔢 صفقات متبقية: ${status.tradesRemaining}`,
        `💰 مخاطرة يومية متبقية: $${status.remainingDailyRisk}`,
      ],
    };
  }

  // ─── Internal ───
  _getCurrentVolMode() {
    // Simplified — in production would check real VIX/overnight range
    return "NORMAL";
  }
}

module.exports = RiskEngine;
