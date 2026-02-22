/**
 * ═══════════════════════════════════════════════════════════════
 *  MODULE: Coach — التوجيه والنصائح
 *  يستخلص النصائح من سياق الأداء الفعلي، ليس عامة
 *  المصادر: Raschke, Carter, Hougaard, Wieland
 * ═══════════════════════════════════════════════════════════════
 */

const SETTINGS = require("../config/settings");

class Coach {
  constructor(stateManager) {
    this.state = stateManager;
  }

  /**
   * ═══ Situational Advice ═══
   * يعطي نصيحة حسب السيناريو الحالي
   */
  getAdvice(scenario) {
    const scenarios = SETTINGS.coach.scenarios;
    if (scenarios[scenario]) {
      return {
        scenario,
        ...scenarios[scenario],
      };
    }

    return {
      scenario,
      advice_ar: "لا يوجد سيناريو مطابق.",
      available: Object.keys(scenarios),
    };
  }

  /**
   * ═══ Post-Trade Advice ═══
   * نصيحة فورية بعد تسجيل صفقة
   */
  postTradeAdvice(trade, status) {
    const messages = [];

    // ─── Win scenarios ───
    if (trade.pnl > 0) {
      if (status.todayWins >= 2 && status.todayLosses === 0) {
        messages.push({
          type: "PROTECT_GAINS",
          ar: "✅ يومك أخضر بصفقتين+. فكّر في التوقف. حماية الأرباح مهارة. (Raschke)",
          priority: "HIGH",
        });
      }

      if (trade.rMultiple >= 3) {
        messages.push({
          type: "BIG_WIN_CAUTION",
          ar: "⚡ ربح كبير (+3R). احذر النشوة. لا تزد حجمك في الصفقة التالية. (Carter)",
          priority: "MEDIUM",
        });
      }
    }

    // ─── Loss scenarios ───
    if (trade.pnl < 0) {
      if (status.todayConsecutiveLosses >= 2) {
        messages.push({
          type: "CONSECUTIVE_LOSSES",
          ar: "🛑 خسارتان متتاليتان. توقف لبقية اليوم. لا استثناءات. (Wieland rule)",
          priority: "CRITICAL",
          action: "STOP_TRADING",
        });
      }

      if (trade.rMultiple < -1.5) {
        messages.push({
          type: "LARGE_LOSS",
          ar: "⚠️ خسارة أكبر من المخطط (-1.5R+). هل حركت الستوب؟ هل أخّرت الخروج؟ سجّل السبب. (Hougaard)",
          priority: "HIGH",
        });
      }

      // Revenge detection
      if (status.todayLosses >= 2 && status.todayTrades >= 3) {
        messages.push({
          type: "REVENGE_WARNING",
          ar: "⚠️ 3+ صفقات مع خسارتين+. هل تحاول 'التعويض'؟ هذا التداول الانتقامي. توقف. (Hougaard)",
          priority: "CRITICAL",
          action: "STOP_TRADING",
        });
      }
    }

    // ─── Overtrading detection ───
    if (status.todayTrades >= SETTINGS.rules.maxTradesPerDay) {
      messages.push({
        type: "MAX_TRADES",
        ar: `🛑 وصلت الحد الأقصى (${SETTINGS.rules.maxTradesPerDay} صفقات). يكفي اليوم. (Raschke: المحترفون 3-4 أسبوعياً)`,
        priority: "CRITICAL",
        action: "STOP_TRADING",
      });
    }

    // ─── Journal reminder ───
    messages.push({
      type: "JOURNAL",
      ar: `📝 سجّل: سبب الدخول | سبب الخروج | حالتك العاطفية | R = ${trade.rMultiple ? trade.rMultiple.toFixed(2) : "N/A"}`,
      priority: "LOW",
    });

    return {
      trade_pnl: trade.pnl,
      r_multiple: trade.rMultiple,
      messages,
      shouldStop: messages.some(m => m.action === "STOP_TRADING"),
    };
  }

  /**
   * ═══ Daily Review ═══
   * مراجعة نهاية اليوم (Carter annual review adapted weekly)
   */
  dailyReview(status) {
    const review = {
      date: new Date().toISOString().slice(0, 10),
      pnl: status.todayPnL,
      trades: status.todayTrades,
      winRate: status.todayTrades > 0
        ? ((status.todayWins / status.todayTrades) * 100).toFixed(0)
        : "N/A",
      sections: [],
    };

    // ─── Performance Summary ───
    const pnlEmoji = status.todayPnL >= 0 ? "🟢" : "🔴";
    review.sections.push({
      title_ar: "📊 ملخص الأداء",
      content_ar: [
        `${pnlEmoji} P&L اليوم: $${status.todayPnL.toFixed(0)}`,
        `📈 الصفقات: ${status.todayTrades} (نجاح ${review.winRate}%)`,
        `💰 الرصيد: $${status.balance.toFixed(0)}`,
        `📉 السحب: ${status.drawdownPercent}%`,
      ],
    });

    // ─── Behavioral Analysis ───
    const behaviors = [];
    if (status.todayTrades > SETTINGS.rules.maxTradesPerDay) {
      behaviors.push("⚠️ تجاوز الحد الأقصى للصفقات → مشكلة overtrading");
    }
    if (status.todayConsecutiveLosses >= 2 && status.todayTrades > status.todayConsecutiveLosses + 1) {
      behaviors.push("⚠️ تداولت بعد خسارتين متتاليتين → مشكلة انضباط");
    }
    if (status.todayPnL < -status.maxDailyLoss) {
      behaviors.push("🛑 تجاوز الحد اليومي للخسارة → خرق قاعدة أساسية");
    }
    if (behaviors.length === 0) {
      behaviors.push("✅ التزام جيد بالقواعد اليوم.");
    }

    review.sections.push({
      title_ar: "🧠 تحليل سلوكي",
      content_ar: behaviors,
    });

    // ─── Tomorrow Plan ───
    const tomorrow = [];
    if (status.todayPnL < 0) {
      tomorrow.push("غداً: ابدأ بنصف الحجم. لا تحاول التعويض. (Carter)");
    }
    if (status.consecutiveRedDays >= 2) {
      tomorrow.push(`⚠️ ${status.consecutiveRedDays} أيام خسارة. غداً: MNQ فقط، صفقة واحدة بحد أقصى. (Wieland)`);
    }
    if (status.todayPnL > 0) {
      tomorrow.push("غداً: نفس الخطة. لا تزد. الاستمرارية أهم من النمو. (Raschke)");
    }

    review.sections.push({
      title_ar: "📋 خطة الغد",
      content_ar: tomorrow,
    });

    // ─── Carter's Key Question ───
    review.sections.push({
      title_ar: "🔑 سؤال Carter للمراجعة",
      content_ar: [
        "ما أفضل صفقة اليوم؟ لماذا نجحت؟",
        "ما أسوأ صفقة اليوم؟ هل خرقت قاعدة؟",
        "ماذا سأعدّل غداً؟",
      ],
    });

    return review;
  }

  /**
   * ═══ Weekly Review ═══
   * Carter: annual review مصغّر أسبوعياً
   */
  weeklyReview(dailyHistory, status) {
    const review = {
      weekStart: status.weekStartDate || "N/A",
      weekPnL: status.weekPnL,
      weekTrades: status.weekTrades,
      sections: [],
    };

    // ─── Week Summary ───
    const totalDays = dailyHistory.length;
    const greenDays = dailyHistory.filter(d => d.pnl >= 0).length;
    const redDays = dailyHistory.filter(d => d.pnl < 0).length;
    const totalPnL = dailyHistory.reduce((sum, d) => sum + d.pnl, 0);
    const avgDailyPnL = totalDays > 0 ? totalPnL / totalDays : 0;

    review.sections.push({
      title_ar: "📊 ملخص الأسبوع",
      content_ar: [
        `💰 P&L الأسبوعي: $${totalPnL.toFixed(0)}`,
        `📈 أيام خضراء: ${greenDays} | 🔴 أيام حمراء: ${redDays}`,
        `📊 متوسط يومي: $${avgDailyPnL.toFixed(0)}`,
        `🏦 الرصيد: $${status.balance.toFixed(0)}`,
        `📉 السحب الكلي: ${status.drawdownPercent}%`,
      ],
    });

    // ─── Target Check ───
    const [targetMin, targetMax] = SETTINGS.rules.idealWeeklyReturn;
    let targetStatus;
    if (totalPnL >= targetMax) {
      targetStatus = `✅ فوق الهدف ($${targetMax}). أداء ممتاز. لا تزد المخاطرة.`;
    } else if (totalPnL >= targetMin) {
      targetStatus = `✅ ضمن الهدف ($${targetMin}-$${targetMax}). استمر.`;
    } else if (totalPnL >= 0) {
      targetStatus = `⚠️ ربح لكن تحت الهدف. راجع جودة الـ setups.`;
    } else {
      targetStatus = `🔴 أسبوع خاسر. قلّص الحجم الأسبوع القادم. (Carter)`;
    }

    review.sections.push({
      title_ar: "🎯 تقييم الهدف الأسبوعي",
      content_ar: [targetStatus],
    });

    // ─── Worst Trade Analysis ───
    if (dailyHistory.length > 0) {
      const worstDay = dailyHistory.reduce((w, d) => d.pnl < w.pnl ? d : w, { pnl: 0 });
      if (worstDay.pnl < 0) {
        review.sections.push({
          title_ar: "💀 أسوأ يوم",
          content_ar: [
            `التاريخ: ${worstDay.date} | الخسارة: $${worstDay.pnl.toFixed(0)}`,
            "السؤال: هل خرقت قاعدة؟ إذا نعم → المشكلة في الانضباط لا في الاستراتيجية. (Carter)",
          ],
        });
      }
    }

    // ─── Next Week Adjustments ───
    const adj = [];
    if (totalPnL < 0) {
      adj.push("الأسبوع القادم: MNQ فقط الأيام الثلاثة الأولى. نصف الحجم.");
      adj.push("هدف الأسبوع: عدم الخسارة، ليس الربح. (Wieland: السنة الأولى = لا تخسر)");
    }
    if (redDays > greenDays) {
      adj.push("أيام الخسارة > أيام الربح. هل المشكلة في الـ setup أم في الخروج المبكر؟");
    }
    if (status.drawdownPercent > 4) {
      adj.push(`⚠️ السحب ${status.drawdownPercent}%. اتبع بروتوكول التعافي من التقرير.`);
    }
    if (adj.length === 0) {
      adj.push("✅ أداء مستقر. نفس الخطة الأسبوع القادم. لا تغيير.");
    }

    review.sections.push({
      title_ar: "📋 تعديلات الأسبوع القادم",
      content_ar: adj,
    });

    return review;
  }

  /**
   * ═══ Contextual Micro-Coaching ═══
   * نصائح مصغّرة بناءً على الحالة الفورية
   */
  quickCoach() {
    const status = this.state.getStatus();
    const tips = [];

    // Good day — protect it
    if (status.todayPnL > status.maxRisk * 2) {
      tips.push({
        ar: "🟢 ربحت 2R+ اليوم. المحترفون يحمون هذا. توقف أو تداول بنصف الحجم.",
        source: "Raschke + Hougaard",
      });
    }

    // Approaching daily limit
    if (status.remainingDailyRisk < status.maxRisk) {
      tips.push({
        ar: `⚠️ المتبقي من حد الخسارة اليومي: $${status.remainingDailyRisk}. أقل من صفقة كاملة.`,
        source: "Risk Engine",
      });
    }

    // No trades yet
    if (status.todayTrades === 0 && status.checklistDone) {
      tips.push({
        ar: "انتظار Setup واضح. الصبر مركز رابح. (Carter + Raschke)",
        source: "Carter",
      });
    }

    // Many trades
    if (status.todayTrades >= 3) {
      tips.push({
        ar: `${status.todayTrades} صفقات اليوم. هل كلها A-grade setups؟ الأقل = الأفضل. (Raschke)`,
        source: "Raschke",
      });
    }

    return tips;
  }
}

module.exports = Coach;
