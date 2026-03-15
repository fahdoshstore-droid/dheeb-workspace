/**
 * ═══════════════════════════════════════════════════════════════
 *  MODULE: Trading Core — فحص الصفقات
 *  مصادر القواعد: Raschke (timing), Carter (R:R + stops),
 *                 Wieland (2hr window), Hougaard (story changed)
 * ═══════════════════════════════════════════════════════════════
 */

const SETTINGS = require("../config/settings");

class TradingCore {
  constructor(stateManager) {
    this.state = stateManager;
  }

  /**
   * فحص وقت الجلسة
   * Raschke: لا تفتح صفقات في آخر ساعة
   * Wieland: نافذة 9:30-11:30 EST
   * Raschke: الجمعة بعد 2 ظهراً لا حافة
   */
  checkSessionTime() {
    const now = new Date();
    // Convert to EST (UTC-5)
    const est = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const hours = est.getHours();
    const minutes = est.getMinutes();
    const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    const dayOfWeek = est.getDay(); // 0=Sun, 5=Fri

    const result = {
      currentTimeEST: timeStr,
      dayOfWeek,
      inOptimalWindow: false,
      warning: null,
      warning_ar: null,
    };

    // Pre-market
    if (hours < 9 || (hours === 9 && minutes < 30)) {
      result.warning = "PRE_MARKET";
      result.warning_ar = "⏰ السوق لم يفتح بعد. انتظر 9:30 EST.";
      return result;
    }

    // Optimal window: 9:30 - 11:30 EST (Wieland)
    if ((hours === 9 && minutes >= 30) || hours === 10 || (hours === 11 && minutes <= 30)) {
      result.inOptimalWindow = true;
    }

    // Post optimal window warning
    if (hours >= 12 && hours < 14) {
      result.warning = "PAST_OPTIMAL";
      result.warning_ar = "⚠️ خارج النافذة المثالية (9:30-11:30). فرص أقل جودة.";
    }

    // Friday afternoon (Raschke: 2pm cutoff)
    if (dayOfWeek === 5 && hours >= 14) {
      result.warning = "FRIDAY_CUTOFF";
      result.warning_ar = "🛑 الجمعة بعد 2 ظهراً. لا حافة. (Raschke)";
    }

    // Last hour (Raschke: don't fade into close)
    if (hours >= 15) {
      result.warning = "LAST_HOUR";
      result.warning_ar = "🛑 الساعة الأخيرة. لا تفتح صفقات جديدة. (Raschke)";
    }

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      result.warning = "WEEKEND";
      result.warning_ar = "🛑 عطلة نهاية الأسبوع.";
    }

    return result;
  }

  /**
   * فحص R:R
   * Carter: 2:1 minimum swing, Wieland: 1:1 minimum scalp
   * Raschke: 1.5:1 sweet spot
   */
  validateRiskReward(setup) {
    const { entryPrice, stopPrice, targetPrice, symbol } = setup;
    const contract = SETTINGS.contracts[symbol];
    if (!contract) return { passed: false, message_ar: `عقد غير معروف: ${symbol}` };

    const riskPoints = Math.abs(entryPrice - stopPrice);
    const rewardPoints = Math.abs(targetPrice - entryPrice);

    if (riskPoints === 0) {
      return { passed: false, rr: 0, message_ar: "❌ الستوب على نفس سعر الدخول" };
    }

    const rr = (rewardPoints / riskPoints).toFixed(2);
    const riskDollars = riskPoints * contract.pointValue * (setup.contracts || 1);
    const rewardDollars = rewardPoints * contract.pointValue * (setup.contracts || 1);

    const minRR = SETTINGS.rules.minRiskReward;

    if (parseFloat(rr) < minRR) {
      return {
        passed: false,
        rr: parseFloat(rr),
        riskPoints,
        rewardPoints,
        riskDollars,
        rewardDollars,
        message_ar: `❌ R:R = ${rr} أقل من الحد الأدنى ${minRR}:1`,
        message_en: `R:R ${rr} below minimum ${minRR}:1`,
      };
    }

    let quality = "⚠️ مقبول";
    if (parseFloat(rr) >= 2.0) quality = "✅ ممتاز";
    else if (parseFloat(rr) >= 1.5) quality = "✅ جيد";

    return {
      passed: true,
      rr: parseFloat(rr),
      quality,
      riskPoints,
      rewardPoints,
      riskDollars: riskDollars.toFixed(0),
      rewardDollars: rewardDollars.toFixed(0),
      message_ar: `${quality} | R:R = ${rr} | مخاطرة $${riskDollars.toFixed(0)} → هدف $${rewardDollars.toFixed(0)}`,
    };
  }

  /**
   * Checklist ما قبل الجلسة
   * مبني على: Wieland morning checklist + Raschke pre-market roadmap
   */
  getPreSessionChecklist() {
    return {
      title_ar: "📋 قائمة فحص ما قبل الجلسة",
      title_en: "Pre-Session Checklist",
      source: "Wieland + Raschke",
      items: [
        {
          id: "prevDayHighLow",
          label_ar: "هل حددت High و Low أمس؟",
          label_en: "Previous day High/Low marked?",
          required: true,
        },
        {
          id: "vwapLevel",
          label_ar: "هل حددت مستوى VWAP اليومي؟",
          label_en: "Daily VWAP level identified?",
          required: true,
        },
        {
          id: "overnightRange",
          label_ar: "كم النطاق الليلي (Globex)؟ (بالنقاط)",
          label_en: "Overnight range in points?",
          type: "number",
          required: true,
        },
        {
          id: "keyLevels",
          label_ar: "هل حددت مستويات الدعم والمقاومة الرئيسية؟",
          label_en: "Key S/R levels marked?",
          required: true,
        },
        {
          id: "newsCheck",
          label_ar: "هل فحصت التقويم الاقتصادي (أحداث Red فقط)؟",
          label_en: "Economic calendar checked (Red events only)?",
          required: true,
          note_ar: "Hougaard: ForexFactory أحداث حمراء فقط",
        },
        {
          id: "maxLossDefined",
          label_ar: "هل كتبت أقصى خسارة اليوم على ورقة؟",
          label_en: "Max daily loss written on paper?",
          required: true,
          note_ar: "Carter: حدد خسارتك بالدولار قبل أي صفقة",
        },
      ]
    };
  }

  /**
   * فحص ما إذا كان الخبر يمنع التداول
   */
  checkNewsBlackout(eventType, minutesSinceRelease) {
    const isHighImpact = SETTINGS.highImpactEvents.includes(eventType);
    if (!isHighImpact) return { blocked: false };

    if (eventType === "FOMC") {
      if (minutesSinceRelease < 30) {
        return {
          blocked: true,
          message_ar: "🛑 FOMC: انتظر 30-45 دقيقة بعد القرار. (Raschke)",
          waitMinutes: 30 - minutesSinceRelease,
        };
      }
    }

    if (["CPI", "NFP", "PPI", "GDP", "PCE"].includes(eventType)) {
      if (minutesSinceRelease < 5) {
        return {
          blocked: true,
          message_ar: `🛑 ${eventType}: انتظر 5 دقائق للارتداد الأولي. (Wieland)`,
          waitMinutes: 5 - minutesSinceRelease,
        };
      }
      if (minutesSinceRelease < 15) {
        return {
          blocked: false,
          warning_ar: `⚠️ ${eventType}: مضى ${minutesSinceRelease} دقيقة فقط. تداول بنصف الحجم.`,
          reducedSize: true,
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Hougaard Question: هل تغيرت القصة؟
   * يُستخدم أثناء الصفقة المفتوحة
   */
  storyChangedCheck(position) {
    return {
      question_ar: "🔍 هل تغيرت القصة؟",
      question_en: "Has the story changed?",
      context_ar: `صفقتك: ${position.symbol} ${position.direction} @ ${position.entryPrice}`,
      guidance_ar: [
        "إذا تغيرت القصة → اخرج فوراً. لا تنتظر الستوب. (Hougaard)",
        "إذا لم تتغير → ابقَ في الصفقة. لا تحرك الستوب ضد الاتجاه.",
        "السؤال ليس: هل أنا رابح أم خاسر؟",
        "السؤال هو: هل السبب الذي دخلت من أجله لا يزال صالحاً؟",
      ],
      source: "Hougaard — Best Loser Wins",
    };
  }
}

module.exports = TradingCore;
