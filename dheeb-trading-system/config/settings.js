/**
 * ═══════════════════════════════════════════════════════════════
 *  DHEEB TRADING MIND — Configuration
 *  مستخلص من تحليل: Raschke, Carter, Hougaard, Wieland
 * ═══════════════════════════════════════════════════════════════
 */

const SETTINGS = {

  // ─── Account Profiles ───
  accounts: {
    small: {
      label: "حساب ممول $50K",
      balance: 50000,
      maxRiskPercent: 1.0,       // Raschke: 1-2% → نأخذ الأحوط
      maxRiskDollars: 500,
      maxDailyLossPercent: 2.0,  // $1,000
      maxDailyLossDollars: 1000,
      maxWeeklyLossPercent: 4.0, // $2,000
      maxWeeklyLossDollars: 2000,
      maxOvernightExposure: 0,   // Wieland: flat by close
      defaultContracts: { NQ: 1, MNQ: 5 },
      highVolContracts: { NQ: 0, MNQ: 3 },
    },
    medium: {
      label: "حساب ممول $150K",
      balance: 150000,
      maxRiskPercent: 1.0,
      maxRiskDollars: 1500,
      maxDailyLossPercent: 2.0,
      maxDailyLossDollars: 3000,
      maxWeeklyLossPercent: 4.0,
      maxWeeklyLossDollars: 6000,
      maxOvernightExposure: 0,
      defaultContracts: { NQ: 3, MNQ: 15 },
      highVolContracts: { NQ: 1, MNQ: 5 },
    }
  },

  // ─── NQ Contract Specs ───
  contracts: {
    NQ:  { tickSize: 0.25, tickValue: 5.00, pointValue: 20.00, label: "E-mini Nasdaq" },
    MNQ: { tickSize: 0.25, tickValue: 0.50, pointValue: 2.00,  label: "Micro E-mini Nasdaq" },
    ES:  { tickSize: 0.25, tickValue: 12.50, pointValue: 50.00, label: "E-mini S&P" },
    MES: { tickSize: 0.25, tickValue: 1.25, pointValue: 5.00,   label: "Micro E-mini S&P" },
  },

  // ─── Session Windows (EST) ───
  sessions: {
    premarketStart: "04:00",
    optimalWindowStart: "09:30",   // Wieland: 2-hour window
    optimalWindowEnd: "11:30",
    afternoonCutoff: "14:00",      // Raschke: Friday 2pm cutoff
    sessionEnd: "16:00",
    newsBlackoutMinutes: 30,       // Raschke: wait 30-45 min post-Fed
    postNewsWait: 5,               // Wieland: wait 5 min post-CPI/NFP initial spike
  },

  // ─── Volatility Thresholds ───
  volatility: {
    overnightRangeMax: 100,        // NQ points → if exceeded, reduce size
    vixCaution: 25,                // VIX > 25 → MNQ only
    vixDanger: 30,                 // VIX > 30 → half size or sit out 30 min
    narrowRangeByTenThirty: 30,    // If <30pts by 10:30 → reduce targets
    normalStopRange: [10, 20],     // NQ points
    highVolStopRange: [25, 30],    // Wider stops in high vol
  },

  // ─── Drawdown Recovery Protocol (Carter + Raschke + Hougaard) ───
  drawdown: {
    levels: [
      {
        rangePercent: [2, 4],
        rangeDollars: { small: [1000, 2000], medium: [3000, 6000] },
        action: "REDUCE_HALF",
        description_ar: "تقليص الحجم إلى 50%. تداول MNQ فقط.",
        description_en: "Reduce to 50% size. MNQ only.",
        source: "Carter drawdown rules"
      },
      {
        rangePercent: [4, 8],
        rangeDollars: { small: [2000, 4000], medium: [6000, 12000] },
        action: "MINIMAL_MODE",
        description_ar: "1-2 MNQ فقط. صفقة واحدة يومياً بحد أقصى.",
        description_en: "1-2 MNQ max. One trade per day.",
        source: "Raschke conservative mode"
      },
      {
        rangePercent: [8, 12],
        rangeDollars: { small: [4000, 6000], medium: [12000, 18000] },
        action: "PAUSE_TRADING",
        description_ar: "توقف 3-5 أيام. مراجعة اليوميات. عودة بأصغر حجم.",
        description_en: "Stop 3-5 days. Review journal. Return at minimum size.",
        source: "Hougaard slump protocol"
      },
      {
        rangePercent: [12, 100],
        rangeDollars: { small: [6000, 50000], medium: [18000, 150000] },
        action: "FULL_STOP",
        description_ar: "توقف أسبوعين+. فكّر في إعادة تعيين الحساب.",
        description_en: "Stop 2+ weeks. Consider account reset.",
        source: "Carter 30% rule adapted"
      }
    ]
  },

  // ─── Trading Rules ───
  rules: {
    maxTradesPerDay: 4,             // Wieland: 2-6, Raschke: 2-4 → conservative
    maxConsecutiveLosses: 2,        // Wieland: 2 losses = stop for day
    maxConsecutiveRedDays: 3,       // Wieland: 3 red days → minimum size
    minRiskReward: 1.0,             // Wieland: 1:1 minimum
    targetRiskReward: 1.5,          // Raschke sweet spot
    idealWeeklyReturn: [500, 1000], // 1-2% of $50K
    fridayShutdownEST: "14:00",     // Raschke: no trading after 2pm Friday
  },

  // ─── Psychology Check Parameters ───
  psychology: {
    // Pre-trade emotional states (Hougaard model)
    blockedStates: [
      "revenge",          // حالة انتقام
      "fomo",             // خوف من الفوات
      "euphoria",         // نشوة بعد ربح كبير
      "anger",            // غضب
      "fatigue",          // إرهاق
      "sleep_deprived",   // نوم أقل من 6 ساعات
    ],
    // Warning states (trade with caution)
    cautionStates: [
      "anxious",          // قلق
      "overconfident",    // ثقة زائدة
      "bored",            // ملل
      "distracted",       // مشتت
    ],
    // Hougaard's key question
    storyChangedQuestion: "هل تغيرت القصة؟ إذا نعم → اخرج فوراً",
    // Carter's golden rules
    goldenRules: [
      "لا تتداول على أساس الغضب أو الخوف أو الطمع",
      "التفكير الإيجابي يعمل في كل شيء ما عدا التداول",
      "هدفك ليس ضرب هوم ران — هدفك الاستمرارية",
    ],
    // Raschke accountability
    journalRequired: true,
    journalFields: ["entryReason", "exitReason", "emotionalState", "rMultiple"],
  },

  // ─── Coach Response Templates ───
  coach: {
    // Situation-based advice sourced from actual trader quotes
    scenarios: {
      winningStreak: {
        advice_ar: "ابقَ على نفس الحجم. لا تزد. النشوة أخطر من الخسارة. (Carter: الحجم يُحدد بالخطة لا بالمزاج)",
        advice_en: "Keep same size. Don't increase. Euphoria is more dangerous than loss.",
        source: "Carter"
      },
      losingStreak: {
        advice_ar: "قلّص الحجم. الخسارة ليست العدو — رد الفعل عليها هو العدو. (Hougaard: Best Loser Wins)",
        advice_en: "Reduce size. Loss isn't the enemy — your reaction to it is.",
        source: "Hougaard"
      },
      revenge: {
        advice_ar: "توقف فوراً. رغبتك في 'تعويض' الخسارة هي الإشارة الأوضح للتوقف. (Hougaard)",
        advice_en: "Stop immediately. The urge to 'make it back' is the clearest signal to stop.",
        source: "Hougaard"
      },
      overtrading: {
        advice_ar: "المحترفون يلتقطون 3-4 صفقات ممتازة في الأسبوع فقط. صفقة جيدة واحدة اليوم كافية. (Raschke)",
        advice_en: "Pros catch only 3-4 great trades per week. One good trade today is enough.",
        source: "Raschke"
      },
      newsDay: {
        advice_ar: "لا تدخل أثناء الخبر. انتظر 30-45 دقيقة. دع الفوضى تستقر. (Raschke + Wieland)",
        advice_en: "Don't enter during news. Wait 30-45 minutes. Let chaos settle.",
        source: "Raschke"
      },
      fridayAfternoon: {
        advice_ar: "الجمعة بعد 2 ظهراً: السوق يتسطح. لا حافة. أغلق وانصرف. (Raschke)",
        advice_en: "Friday after 2pm: market flattens. No edge. Close and leave.",
        source: "Raschke"
      },
      drawdownRecovery: {
        advice_ar: "البقاء أولاً، الأرباح ثانياً. قلّص إلى أصغر حجم ممكن حتى تعود الثقة. (Wieland)",
        advice_en: "Survival first, profits second. Reduce to minimum size until confidence returns.",
        source: "Wieland"
      },
      noSetup: {
        advice_ar: "السوق سيكون مفتوحاً غداً. لا توجد صفقة 'يجب' أخذها اليوم. الصبر أربح مركز. (Carter + Raschke)",
        advice_en: "Market will be open tomorrow. No trade you 'must' take today.",
        source: "Carter + Raschke"
      }
    }
  },

  // ─── No-Trade Calendar Events ───
  highImpactEvents: [
    "FOMC",
    "CPI",
    "NFP",
    "PPI",
    "GDP",
    "PCE",
    "EARNINGS_MEGA_CAP",
  ],
};

module.exports = SETTINGS;
