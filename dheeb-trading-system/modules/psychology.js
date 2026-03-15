/**
 * ═══════════════════════════════════════════════════════════════
 *  MODULE: Psychology — التحقق النفسي
 *  المصدر الأساسي: Tom Hougaard (Best Loser Wins)
 *  مصادر إضافية: Carter (golden rules), Raschke (accountability)
 * ═══════════════════════════════════════════════════════════════
 */

const SETTINGS = require("../config/settings");

class Psychology {
  constructor(stateManager) {
    this.state = stateManager;
  }

  /**
   * تقييم الحالة النفسية قبل التداول
   * Hougaard: لا تتداول وأنت في حالة عاطفية غير محايدة
   * Carter: لا تتداول على أساس الغضب أو الخوف أو الطمع
   */
  evaluate(mood) {
    const psych = SETTINGS.psychology;
    const status = this.state.getStatus();

    const result = {
      mood,
      timestamp: new Date().toISOString(),
      cleared: false,
      level: null,      // "BLOCKED" | "CAUTION" | "CLEAR"
      messages: [],
      contextWarnings: [],
    };

    // ─── Level 1: Blocked States ───
    if (psych.blockedStates.includes(mood)) {
      result.level = "BLOCKED";
      result.cleared = false;

      const blockMessages = {
        revenge: {
          ar: "🛑 حالة انتقام. توقف فوراً. رغبتك في 'التعويض' هي أوضح إشارة للتوقف.",
          source: "Hougaard",
          action: "توقف عن التداول لبقية اليوم. اخرج وتحرك جسدياً.",
        },
        fomo: {
          ar: "🛑 خوف من الفوات (FOMO). السوق مفتوح غداً. لا توجد صفقة 'يجب' أخذها.",
          source: "Carter + Raschke",
          action: "أغلق الشاشة 15 دقيقة. عُد بعقل صافٍ.",
        },
        euphoria: {
          ar: "🛑 نشوة بعد ربح. أخطر من الخسارة. ستزيد حجمك بدون وعي.",
          source: "Carter",
          action: "ابقَ على نفس الحجم. لا تزد. النشوة عدو الانضباط.",
        },
        anger: {
          ar: "🛑 غضب. لا تتداول على أساس الغضب. القرارات الغاضبة = خسائر مضاعفة.",
          source: "Carter Golden Rules",
          action: "توقف. تمرن. عُد بعد ساعة على الأقل.",
        },
        fatigue: {
          ar: "🛑 إرهاق. الجسم المتعب = عقل ضعيف = قرارات سيئة.",
          source: "Hougaard",
          action: "لا تداول اليوم. الراحة أفضل استثمار.",
        },
        sleep_deprived: {
          ar: "🛑 نوم أقل من 6 ساعات. الحالة الجسدية تحدد الحالة العقلية.",
          source: "Hougaard",
          action: "لا تداول. النوم الكافي شرط أساسي.",
        },
      };

      const msg = blockMessages[mood];
      result.messages.push(msg);
      this.state.setPsychState(mood, false);
      return result;
    }

    // ─── Level 2: Caution States ───
    if (psych.cautionStates.includes(mood)) {
      result.level = "CAUTION";
      result.cleared = true; // Allowed but with warnings

      const cautionMessages = {
        anxious: {
          ar: "⚠️ قلق. يمكنك التداول لكن بنصف الحجم. إذا زاد القلق → توقف.",
          source: "Hougaard",
          action: "قلّص الحجم 50%. حدد صفقتين بحد أقصى.",
          sizeMultiplier: 0.5,
        },
        overconfident: {
          ar: "⚠️ ثقة زائدة. الأخطر من الخوف. ستتجاوز قواعدك بدون وعي.",
          source: "Carter",
          action: "الحجم المعتاد فقط. لا زيادة. راجع قواعدك قبل كل صفقة.",
          sizeMultiplier: 1.0,
        },
        bored: {
          ar: "⚠️ ملل. أخطر مسبب للتداول الزائد. صفقة واحدة بحد أقصى.",
          source: "Raschke: overtrading suckers you",
          action: "إذا لم تجد Setup واضح خلال 30 دقيقة → أغلق المنصة.",
          sizeMultiplier: 1.0,
          maxTrades: 1,
        },
        distracted: {
          ar: "⚠️ مشتت. التداول يحتاج تركيز كامل. أزل المشتتات أو لا تتداول.",
          source: "Raschke",
          action: "أغلق كل شيء عدا المنصة. هاتف على صامت.",
          sizeMultiplier: 0.5,
        },
      };

      const msg = cautionMessages[mood];
      result.messages.push(msg);
      result.sizeMultiplier = msg.sizeMultiplier;
      if (msg.maxTrades) result.maxTradesOverride = msg.maxTrades;
      this.state.setPsychState(mood, true);
      return result;
    }

    // ─── Level 3: Clear ───
    result.level = "CLEAR";
    result.cleared = true;
    result.messages.push({
      ar: "✅ الحالة النفسية جيدة. يمكنك التداول.",
      source: "System",
      action: "التزم بالخطة. صفقة واحدة جيدة تكفي.",
    });

    // ─── Contextual Warnings (from state) ───
    if (status.consecutiveRedDays >= 2) {
      result.contextWarnings.push({
        ar: `⚠️ ${status.consecutiveRedDays} أيام خسارة متتالية. قلّص الحجم حتى تعود الثقة. (Wieland)`,
        sizeMultiplier: 0.5,
      });
    }

    if (status.todayPnL > 0 && status.todayPnL > status.maxRisk * 3) {
      result.contextWarnings.push({
        ar: "⚠️ ربحت جيداً اليوم. فكّر في التوقف. الحفاظ على الأرباح مهارة. (Raschke)",
      });
    }

    if (status.drawdownPercent > 3) {
      result.contextWarnings.push({
        ar: `⚠️ أنت في سحب ${status.drawdownPercent}%. اتبع بروتوكول التعافي.`,
      });
    }

    this.state.setPsychState(mood, true);
    return result;
  }

  /**
   * فحص سريع أثناء الجلسة
   * Hougaard: حالتك تتغير خلال اليوم
   */
  midSessionCheck() {
    const status = this.state.getStatus();
    const warnings = [];

    if (status.todayConsecutiveLosses >= 2) {
      warnings.push({
        severity: "HIGH",
        ar: "🛑 خسارتان متتاليتان. توقف لبقية اليوم. (Wieland rule)",
        action: "STOP_TRADING",
      });
    }

    if (Math.abs(Math.min(0, status.todayPnL)) >= status.maxDailyLoss * 0.7) {
      warnings.push({
        severity: "HIGH",
        ar: `⚠️ اقتربت من حد الخسارة اليومي (${Math.abs(status.todayPnL)}$ من ${status.maxDailyLoss}$). صفقة واحدة أخيرة بنصف الحجم.`,
        action: "REDUCE_AND_LAST_TRADE",
      });
    }

    if (status.todayTrades >= SETTINGS.rules.maxTradesPerDay - 1) {
      warnings.push({
        severity: "MEDIUM",
        ar: `⚠️ بقيت صفقة واحدة. اجعلها أفضل Setup متاح. (Raschke: المحترفون 3-4 أسبوعياً)`,
        action: "LAST_TRADE_QUALITY",
      });
    }

    return {
      timestamp: new Date().toISOString(),
      warnings,
      shouldContinue: !warnings.some(w => w.action === "STOP_TRADING"),
    };
  }

  /**
   * فحص Disposition Effect (Hougaard)
   * هل تمسك بخاسر أو تقطع رابح؟
   */
  dispositionCheck(position) {
    const { pnl, holdTimeMinutes, rMultiple } = position;

    const result = { warnings: [] };

    // Holding a loser too long
    if (pnl < 0 && holdTimeMinutes > 30) {
      result.warnings.push({
        ar: "⚠️ Disposition Effect: أنت تمسك بصفقة خاسرة منذ 30+ دقيقة. هل تتجنب ألم الإغلاق؟ (Hougaard)",
        question: "هل تغيرت القصة؟ إذا نعم → اخرج فوراً.",
      });
    }

    // Cutting winner too early
    if (rMultiple > 0 && rMultiple < 1.5) {
      result.warnings.push({
        ar: "⚠️ هل تفكر في إغلاق الربح مبكراً؟ Hougaard: 'اسأل نفسك — كيف ستشعر لو أغلقت الآن وواصل السوق في صالحك؟'",
        question: "هل الربح الحالي يستحق التضحية بالإمكانية الأكبر؟",
      });
    }

    return result;
  }
}

module.exports = Psychology;
