/**
 * DHEEB Master Coach System
 * النظام الرئيسي الذي يجمع كل شيء (Backtest + Psychology + Notion)
 */

const BacktestEngine = require('./backtest-engine');
const PsychologicalAnalyzer = require('./psychological-analyzer');
const NotionIntegration = require('./notion-integration');

class MasterCoach {
  constructor() {
    this.backtest = new BacktestEngine();
    this.psychology = new PsychologicalAnalyzer();
    this.notion = new NotionIntegration();
    this.trades = [];
  }

  // ==================== تحميل البيانات ====================

  loadTradesFromJournal(journalData) {
    console.log('📖 جاري قراءة الجورنال...');
    
    // تحويل بيانات Word/JSON إلى صيغة موحدة
    this.trades = journalData.map((item, index) => ({
      id: `trade_${index}`,
      date: item.date || new Date().toISOString(),
      strategy: item.strategy || 'unknown',
      symbol: item.symbol || 'UNKNOWN',
      type: item.type || 'BUY',
      entryPrice: parseFloat(item.entryPrice),
      stopLoss: parseFloat(item.stopLoss),
      takeProfit: parseFloat(item.takeProfit),
      exitPrice: parseFloat(item.exitPrice),
      result: item.result || this.calculateResult(item),
      pnl: parseFloat(item.pnl || 0),
      duration: item.duration || 0,
      mistakes: item.mistakes || [],
      psychScore: item.psychScore || 100,
      notes: item.notes || ''
    }));

    console.log(`✅ تم تحميل ${this.trades.length} صفقة`);
    return this.trades;
  }

  calculateResult(trade) {
    if (!trade.exitPrice) return 'open';
    const pnl = trade.exitPrice - trade.entryPrice;
    if (pnl > 0) return 'win';
    if (pnl < 0) return 'loss';
    return 'breakeven';
  }

  // ==================== تشغيل التحليل الشامل ====================

  async runCompleteAnalysis() {
    console.log('🚀 جاري التحليل الشامل...\n');

    if (this.trades.length === 0) {
      console.log('❌ لا توجد بيانات. احمل جورنالك أولاً');
      return null;
    }

    // 1. تشغيل Backtest
    console.log('📊 الخطوة 1: Backtest');
    const backtestResults = this.backtest.generateBacktestReport(this.trades);
    console.log(`✅ ${Object.keys(backtestResults.strategies).length} استراتيجيات محللة\n`);

    // 2. تحليل نفسي
    console.log('🧠 الخطوة 2: التحليل النفسي');
    const psychResults = this.psychology.generatePsychologicalReport(
      this.trades,
      backtestResults
    );
    console.log(`✅ تم تحليل ${psychResults.mistakeAnalysis.byMistake} أنماط سلوكية\n`);

    // 3. حفظ في Notion
    console.log('💾 الخطوة 3: الحفظ في Notion');
    await this.saveToNotion(backtestResults, psychResults);
    console.log('✅ تم الحفظ في Notion\n');

    // 4. إنشاء خطة التطوير
    console.log('📋 الخطوة 4: خطة التطوير');
    const developmentPlan = this.generateDevelopmentPlan(backtestResults, psychResults);
    console.log('✅ تم إنشاء خطة التطوير\n');

    return {
      backtest: backtestResults,
      psychology: psychResults,
      development: developmentPlan,
      timestamp: new Date().toISOString()
    };
  }

  // ==================== حفظ في Notion ====================

  async saveToNotion(backtestResults, psychResults) {
    // حفظ النتائج لكل استراتيجية
    for (const [stratKey, stratData] of Object.entries(backtestResults.strategies)) {
      await this.notion.savePerformanceMetrics(stratData.strategy, stratData);
    }

    // حفظ التحليل النفسي
    await this.notion.savePsychologyAnalysis({
      mood: 7,
      mistakes: Object.keys(psychResults.mistakeAnalysis.byMistake),
      fomoCount: psychResults.mistakeAnalysis.byMistake['fomo']?.count || 0,
      revengeCount: psychResults.mistakeAnalysis.byMistake['revenge']?.count || 0,
      earlyExitCount: psychResults.mistakeAnalysis.byMistake['early-exit']?.count || 0,
      disciplineScore: psychResults.overview.disciplineScore,
      lessons: this.generateLessons(psychResults),
      focusTomorrow: psychResults.recommendations[0]?.title || 'الالتزام بالخطة',
      coachFeedback: psychResults.psychologyMessage
    });

    // حفظ الصفقات
    for (const trade of this.trades) {
      await this.notion.saveTrade({
        date: trade.date,
        strategy: trade.strategy,
        symbol: trade.symbol,
        entryPrice: trade.entryPrice,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        exitPrice: trade.exitPrice,
        result: trade.result,
        pnl: trade.pnl,
        duration: trade.duration,
        psychScore: trade.psychScore,
        mistakes: trade.mistakes,
        notes: trade.notes
      });
    }
  }

  // ==================== خطة التطوير ====================

  generateDevelopmentPlan(backtestResults, psychResults) {
    const bestStrategy = backtestResults.bestStrategy;
    const mainWeakness = psychResults.weaknesses[0];
    const recommendations = psychResults.recommendations;

    return {
      overview: {
        startDate: new Date().toISOString(),
        focus: bestStrategy?.strategy,
        goal: `${Math.max(60, bestStrategy?.winRate + 5)}% Win Rate`,
        duration: '30 days',
        successCriteria: [
          `Win Rate >= ${Math.max(60, bestStrategy?.winRate + 5)}%`,
          'Discipline Score >= 90',
          'Zero critical mistakes',
          'Profit >= 5% of account'
        ]
      },

      week1: {
        title: '🎯 التركيز والأساسيات',
        focus: bestStrategy?.strategy,
        goals: [
          `5-10 صفقات من ${bestStrategy?.strategy}`,
          '100% التزام بـ SL/TP',
          'قراءة PSYCHOLOGY-RULES.md يومياً (5 دقائق)',
          'الانضباط النفسي >= 90'
        ],
        dailyRoutine: [
          '📖 قراءة PSYCHOLOGY-RULES.md (5 دق)',
          '🎯 مراجعة شروط الاستراتيجية (3 دق)',
          '💼 جلسة التداول',
          '📝 تسجيل الصفقات والأخطاء',
          '🔍 مراجعة الأخطاء (5 دق)',
          '💭 تحضير غد'
        ],
        criticalRules: [
          '❌ لا FOMO entries',
          '❌ لا Revenge trades',
          '✅ كل صفقة = شروط كاملة',
          '✅ Stop Loss دائماً'
        ]
      },

      week2: {
        title: '🔧 التحسن والتطبيق',
        focus: 'تعميق الانضباط',
        goals: [
          '10-15 صفقة',
          'تقليل الأخطاء بـ 50%',
          'Win Rate >= 55%',
          'Discipline >= 95%'
        ],
        improvements: [
          'إذا كان يحصل FOMO: اقرأ الحل من PSYCHOLOGY',
          'إذا كان يحصل Revenge: توقف 1 ساعة فوراً',
          'إذا كان يحصل خسائر متتالية: استراحة واضحة'
        ]
      },

      week3_4: {
        title: '📈 الاستقرار والنمو',
        focus: 'بناء الثقة والاستقرار',
        goals: [
          '20-30 صفقة',
          'Win Rate >= 60%',
          'Profit >= 5% of capital',
          'Psychology stable'
        ],
        nextPhase: [
          'إذا نجحت: أضف استراتيجية ثانية الأسبوع التالي',
          'إذا تعثرت: ركز على الأساسيات أسبوع إضافي',
          'المهم: الانضباط قبل النتائج'
        ]
      },

      dailyCheckup: {
        morning: [
          '✅ قراءة PSYCHOLOGY-RULES.md',
          '✅ مراجعة شروط الاستراتيجية',
          '✅ تحضير Mind Setup'
        ],
        evening: [
          '✅ تسجيل الصفقات',
          '✅ تحليل الأخطاء',
          '✅ تحضير الغد'
        ]
      },

      emergencyRules: {
        'خسائر متتالية >= 3': 'توقف فوري 1 ساعة',
        'FOMO entry': 'أغلق فوراً بـ Breakeven',
        'Revenge trade': 'ألغِ الطلب قبل ما يُنفذ',
        'Breaking SL': 'توقف كل شيء اليوم'
      }
    };
  }

  generateLessons(psychResults) {
    const lessons = [];

    psychResults.patterns.forEach(pattern => {
      lessons.push(`• ${pattern.name}: ${pattern.solution}`);
    });

    psychResults.weaknesses.forEach(weakness => {
      lessons.push(`• ${weakness.area}: ${weakness.solution}`);
    });

    return lessons.join('\n');
  }

  // ==================== تقارير ====================

  generateSummaryReport(analysis) {
    const { backtest, psychology, development } = analysis;

    return `
╔════════════════════════════════════════════════════════════╗
║           🐺 DHEEB COACHING SYSTEM - التقرير الشامل        ║
╚════════════════════════════════════════════════════════════╝

📊 ملخص الأداء
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• إجمالي الصفقات: ${backtest.totalTrades}
• الفترة: ${backtest.period}
• Win Rate الإجمالي: ${backtest.summary.overallWinRate}%
• الربح الإجمالي: ${backtest.summary.totalProfit}

🏆 أفضل استراتيجية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${backtest.bestStrategy ? `
• الاسم: ${backtest.bestStrategy.name}
• Win Rate: ${backtest.bestStrategy.winRate}%
• Profit Factor: ${backtest.bestStrategy.profitFactor}
• الربح: ${backtest.bestStrategy.totalPnL}
• التوصية: ${backtest.bestStrategy.recommendation}
` : 'بيانات غير كافية'}

🧠 الحالة النفسية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• درجة الانضباط: ${psychology.overview.disciplineScore}/100
• الحالة: ${psychology.overview.psychologyStatus}
• أكبر تحدي: ${psychology.overview.mainChallenge}
• أقوى نقطة: ${psychology.overview.mainStrength}

💡 أهم الأخطاء
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(psychology.mistakeAnalysis.byMistake)
  .slice(0, 3)
  .map(([mistake, data]) => `• ${mistake}: ${data.count} مرات (${data.impactOnWinRate}% من الخسائر)`)
  .join('\n')}

📋 الأنماط المكتشفة
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${psychology.patterns.map(p => `• ${p.name}: ${p.frequency} - الحل: ${p.solution}`).join('\n')}

🎯 الخطوات التالية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${psychology.recommendations.map(r => 
  `${r.priority}. [${r.timeline}] ${r.title}\n   ${r.detail}\n   → ${r.action}`
).join('\n\n')}

✅ رسالة المدرب النفسي
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${psychology.psychologyMessage}

📅 خطة الـ 30 يوم
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 الهدف الرئيسي: ${development.overview.goal}
📍 المسار: ${development.overview.focus}
⏱️ المدة: ${development.overview.duration}

✨ معايير النجاح:
${development.overview.successCriteria.map(c => `  ✓ ${c}`).join('\n')}

═════════════════════════════════════════════════════════════
    🔗 تم الحفظ في Notion - يمكنك الرجوع للتفاصيل هناك
═════════════════════════════════════════════════════════════
    `;
  }
}

module.exports = MasterCoach;
