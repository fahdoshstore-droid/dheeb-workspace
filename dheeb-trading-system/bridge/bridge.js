/**
 * ═══════════════════════════════════════════════════════════════
 *  BRIDGE — جسر التكامل مع القنوات الخارجية
 *  يربط النظام مع: Telegram, WhatsApp, REST API, الإيكوسيستم
 * ═══════════════════════════════════════════════════════════════
 */

const DheebCore = require("../core/dheeb-core");

class Bridge {
  constructor() {
    this.core = new DheebCore();
  }

  /**
   * ═══ Message Router ═══
   * يحوّل الأوامر النصية إلى استدعاءات النظام
   * مصمم للربط مع WhatsApp bot أو Telegram
   */
  async handleMessage(text, userId = "default") {
    const cmd = text.trim().toLowerCase();

    // ─── Dashboard / Status ───
    if (this._match(cmd, ["حالة", "status", "لوحة", "dashboard"])) {
      return this._formatDashboard(this.core.dashboard());
    }

    // ─── Start Session ───
    if (this._match(cmd, ["بدء", "start", "جلسة", "session"])) {
      return this._formatResult(this.core.startSession());
    }

    // ─── Checklist ───
    if (this._match(cmd, ["checklist", "قائمة", "فحص"])) {
      return this._formatChecklist(this.core.completeChecklist({
        prevDayHighLow: true, vwapLevel: true,
        overnightRange: 50, keyLevels: true,
        newsCheck: true, maxLossDefined: true,
      }));
    }

    // ─── Psych Check ───
    if (this._match(cmd, ["نفسي", "psych", "مزاج", "mood"])) {
      const mood = this._extractMood(cmd);
      return this._formatResult(this.core.psychCheck(mood));
    }

    // ─── Evaluate Trade ───
    if (this._match(cmd, ["صفقة", "trade", "فحص صفقة", "evaluate"])) {
      // Parse: "صفقة NQ LONG 21500 stop 21480 target 21540 x2"
      const setup = this._parseTradeCommand(cmd);
      if (setup.error) return setup.error;
      return this._formatResult(this.core.evaluateTrade(setup));
    }

    // ─── Size Calculator ───
    if (this._match(cmd, ["حجم", "size", "كم عقد", "sizing"])) {
      const result = this.core.risk.quickSizeRecommendation();
      return result.summary_ar.join("\n");
    }

    // ─── Advice ───
    if (this._match(cmd, ["نصيحة", "advice", "coach"])) {
      const scenario = this._extractScenario(cmd);
      return this._formatResult(this.core.getAdvice(scenario));
    }

    // ─── End of Day ───
    if (this._match(cmd, ["نهاية", "end", "مراجعة يومية"])) {
      return this._formatReview(this.core.endOfDay());
    }

    // ─── Weekly Review ───
    if (this._match(cmd, ["أسبوع", "weekly", "مراجعة أسبوعية"])) {
      return this._formatReview(this.core.weeklyReview());
    }

    // ─── Story Changed ───
    if (this._match(cmd, ["قصة", "story", "تغيرت"])) {
      return this._formatResult(this.core.trading.storyChangedCheck({
        symbol: "NQ", direction: "LONG", entryPrice: 0,
      }));
    }

    // ─── Help ───
    return this._helpMessage();
  }

  // ─── Formatters ───

  _formatDashboard(status) {
    const pnlEmoji = status.todayPnL >= 0 ? "🟢" : "🔴";
    const canTradeEmoji = status.canTrade.allowed ? "✅" : "🛑";

    return [
      `═══ 🐺 DHEEB TRADING MIND ═══`,
      ``,
      `💰 الرصيد: $${status.balance.toFixed(0)}`,
      `${pnlEmoji} P&L اليوم: $${status.todayPnL.toFixed(0)}`,
      `📊 P&L الأسبوع: $${status.weekPnL.toFixed(0)}`,
      `📉 السحب: ${status.drawdownPercent}%`,
      ``,
      `📈 صفقات اليوم: ${status.todayTrades}/${SETTINGS_REF.rules.maxTradesPerDay}`,
      `💵 مخاطرة يومية متبقية: $${status.remainingDailyRisk}`,
      `📋 Checklist: ${status.checklistDone ? "✅" : "❌"}`,
      `🧠 فحص نفسي: ${status.psychCleared ? "✅" : "❌"}`,
      `${canTradeEmoji} يمكن التداول: ${status.canTrade.allowed ? "نعم" : "لا ← " + status.canTrade.reasons.join(", ")}`,
    ].join("\n");
  }

  _formatResult(result) {
    return JSON.stringify(result, null, 2);
  }

  _formatChecklist(result) {
    if (result.completed) return "✅ Checklist مكتمل. الخطوة التالية: فحص نفسي (psych)";
    return `❌ غير مكتمل:\n${result.missing.map(m => `  • ${m}`).join("\n")}`;
  }

  _formatReview(review) {
    let output = "";
    for (const section of review.sections || []) {
      output += `\n${section.title_ar}\n`;
      for (const line of section.content_ar || []) {
        output += `  ${line}\n`;
      }
    }
    return output;
  }

  _helpMessage() {
    return [
      `═══ 🐺 أوامر Trading Mind ═══`,
      ``,
      `حالة     → لوحة التحكم`,
      `بدء      → بدء الجلسة`,
      `checklist → إكمال القائمة`,
      `نفسي [مزاج] → فحص نفسي`,
      `  (calm, focused, anxious, revenge, fomo, euphoria, anger, fatigue)`,
      `صفقة NQ LONG 21500 stop 21480 target 21540 x1`,
      `  → فحص صفقة`,
      `حجم      → حساب الحجم`,
      `قصة      → هل تغيرت القصة؟ (Hougaard)`,
      `نصيحة    → نصيحة حسب الموقف`,
      `نهاية    → مراجعة نهاية اليوم`,
      `أسبوع    → مراجعة أسبوعية`,
    ].join("\n");
  }

  // ─── Parsers ───

  _match(text, keywords) {
    return keywords.some(k => text.includes(k));
  }

  _extractMood(text) {
    const moods = ["calm", "focused", "anxious", "revenge", "fomo", "euphoria",
      "anger", "fatigue", "sleep_deprived", "overconfident", "bored", "distracted"];
    for (const m of moods) {
      if (text.includes(m)) return m;
    }
    return "calm";
  }

  _extractScenario(text) {
    const scenarios = Object.keys(SETTINGS_REF.coach.scenarios);
    for (const s of scenarios) {
      if (text.includes(s.toLowerCase())) return s;
    }
    return "noSetup";
  }

  _parseTradeCommand(text) {
    try {
      // "صفقة NQ LONG 21500 stop 21480 target 21540 x2"
      const parts = text.toUpperCase().split(/\s+/);
      const symbolIdx = parts.findIndex(p => ["NQ", "MNQ", "ES", "MES"].includes(p));
      const dirIdx = parts.findIndex(p => ["LONG", "SHORT"].includes(p));
      const stopIdx = parts.findIndex(p => p === "STOP");
      const targetIdx = parts.findIndex(p => p === "TARGET");
      const contractsIdx = parts.findIndex(p => p.startsWith("X"));

      if (symbolIdx < 0 || dirIdx < 0) {
        return { error: "صيغة غير صحيحة. مثال: صفقة NQ LONG 21500 stop 21480 target 21540 x1" };
      }

      return {
        symbol: parts[symbolIdx],
        direction: parts[dirIdx],
        entryPrice: parseFloat(parts[dirIdx + 1]) || 0,
        stopPrice: stopIdx >= 0 ? parseFloat(parts[stopIdx + 1]) || 0 : 0,
        targetPrice: targetIdx >= 0 ? parseFloat(parts[targetIdx + 1]) || 0 : 0,
        contracts: contractsIdx >= 0 ? parseInt(parts[contractsIdx].slice(1)) || 1 : 1,
        reason: "CLI entry",
      };
    } catch {
      return { error: "خطأ في تحليل الأمر." };
    }
  }
}

// Reference for formatting (avoid circular)
const SETTINGS_REF = require("../config/settings");

module.exports = Bridge;
