/**
 * DHEEB Psychological Analyzer
 * تحليل عميق للسلوك النفسي والأخطاء
 */

class PsychologicalAnalyzer {
  constructor() {
    this.mistakes = {
      'fomo': { name: 'FOMO Entry', severity: 'high', impact: -15 },
      'revenge': { name: 'Revenge Trade', severity: 'critical', impact: -25 },
      'early-exit': { name: 'Early Exit', severity: 'medium', impact: -10 },
      'oversizing': { name: 'Oversizing', severity: 'high', impact: -15 },
      'breaking-sl': { name: 'Breaking SL', severity: 'critical', impact: -25 },
      'skipping-rules': { name: 'Skipping Rules', severity: 'high', impact: -20 },
      'emotional': { name: 'Emotional Trade', severity: 'medium', impact: -10 }
    };
  }

  // ==================== تحليل الأخطاء ====================

  analyzeMistakes(trades) {
    const mistakeAnalysis = {
      byMistake: {},
      byTrade: [],
      correlation: {},
      patterns: []
    };

    // تحليل كل صفقة
    trades.forEach((trade, index) => {
      const tradeMistakes = trade.mistakes || [];
      const isTradeLosing = trade.result === 'loss';

      tradeMistakes.forEach(mistake => {
        if (!mistakeAnalysis.byMistake[mistake]) {
          mistakeAnalysis.byMistake[mistake] = {
            count: 0,
            lossCount: 0,
            impactOnWinRate: 0,
            trades: []
          };
        }

        mistakeAnalysis.byMistake[mistake].count++;
        mistakeAnalysis.byMistake[mistake].trades.push(index);

        if (isTradeLosing) {
          mistakeAnalysis.byMistake[mistake].lossCount++;
        }
      });

      // حفظ الأخطاء لكل صفقة
      mistakeAnalysis.byTrade.push({
        tradeIndex: index,
        mistakes: tradeMistakes,
        isLosing: isTradeLosing,
        impactScore: this.calculateMistakeImpact(tradeMistakes)
      });
    });

    // حساب التأثير النسبي
    for (const [mistake, data] of Object.entries(mistakeAnalysis.byMistake)) {
      data.impactOnWinRate = (data.lossCount / data.count * 100).toFixed(2);
      data.severity = this.mistakes[mistake]?.severity || 'unknown';
    }

    // تحديد الأنماط
    mistakeAnalysis.patterns = this.identifyPatterns(trades);

    return mistakeAnalysis;
  }

  calculateMistakeImpact(mistakes) {
    return mistakes.reduce((total, mistake) => 
      total + (this.mistakes[mistake]?.impact || -10), 0);
  }

  identifyPatterns(trades) {
    const patterns = [];

    // نمط 1: FOMO بعد فوز
    const fomoAfterWin = this.checkPattern(trades, (t, i) => 
      trades[i - 1]?.result === 'win' && t.mistakes?.includes('fomo')
    );
    if (fomoAfterWin > 0.3) {
      patterns.push({
        name: 'FOMO بعد الفوز',
        frequency: (fomoAfterWin * 100).toFixed(0) + '%',
        solution: 'خذ استراحة 30 دقيقة بعد فوز متتالي',
        severity: 'high'
      });
    }

    // نمط 2: Revenge trade بعد خسارة
    const revengeAfterLoss = this.checkPattern(trades, (t, i) => 
      trades[i - 1]?.result === 'loss' && t.mistakes?.includes('revenge')
    );
    if (revengeAfterLoss > 0.2) {
      patterns.push({
        name: 'Revenge Trade بعد الخسارة',
        frequency: (revengeAfterLoss * 100).toFixed(0) + '%',
        solution: 'توقف 1 ساعة كاملة بعد خسارة',
        severity: 'critical'
      });
    }

    // نمط 3: تراكم الأخطاء
    const consecutiveMistakes = this.findConsecutiveMistakes(trades);
    if (consecutiveMistakes.length > 0) {
      patterns.push({
        name: 'تراكم الأخطاء',
        frequency: `${consecutiveMistakes.length} مرات`,
        solution: 'اقرأ PSYCHOLOGY-RULES.md كل ساعة',
        severity: 'high'
      });
    }

    return patterns;
  }

  checkPattern(trades, condition) {
    let matches = 0;
    let total = 0;

    trades.forEach((trade, i) => {
      if (i > 0) {
        total++;
        if (condition(trade, i)) matches++;
      }
    });

    return total > 0 ? matches / total : 0;
  }

  findConsecutiveMistakes(trades) {
    const consecutive = [];
    let current = [];

    trades.forEach((trade, i) => {
      if ((trade.mistakes || []).length > 0) {
        current.push(i);
        if (current.length >= 3) {
          consecutive.push(current.slice());
        }
      } else {
        current = [];
      }
    });

    return consecutive;
  }

  // ==================== درجة الانضباط ====================

  calculateDisciplineScore(trades) {
    if (trades.length === 0) return 100;

    let score = 100;

    // خصم لكل خطأ
    trades.forEach(trade => {
      const mistakes = trade.mistakes || [];
      mistakes.forEach(mistake => {
        score -= this.mistakes[mistake]?.impact || 10;
      });
    });

    // خصم إضافي لعدم الالتزام بـ SL
    const breakingSLTrades = trades.filter(t => t.mistakes?.includes('breaking-sl'));
    if (breakingSLTrades.length > 0) {
      score -= breakingSLTrades.length * 10;
    }

    // خصم إضافي لسلسلة خسائر
    const consecutiveLosses = this.findConsecutiveLosses(trades);
    if (consecutiveLosses.maxStreak >= 3) {
      score -= Math.min(20, consecutiveLosses.maxStreak * 5);
    }

    return Math.max(0, score);
  }

  findConsecutiveLosses(trades) {
    let currentStreak = 0;
    let maxStreak = 0;
    let streaks = [];

    trades.forEach(trade => {
      if (trade.result === 'loss') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        if (currentStreak >= 2) {
          streaks.push(currentStreak);
        }
        currentStreak = 0;
      }
    });

    return { maxStreak, streaks };
  }

  // ==================== نقاط الضعف والقوة ====================

  identifyStrengthsAndWeaknesses(trades, mistakeAnalysis) {
    const strengths = [];
    const weaknesses = [];

    // نقاط القوة
    const winRate = (trades.filter(t => t.result === 'win').length / trades.length * 100).toFixed(0);
    if (winRate >= 55) {
      strengths.push({
        area: 'Win Rate',
        value: `${winRate}%`,
        message: 'نسبة فوزك عالية. استمر بنفس النمط'
      });
    }

    // التزام بـ Stop Loss
    const stoppedOutTrades = trades.filter(t => t.result === 'loss' && !t.mistakes?.includes('breaking-sl')).length;
    if (stoppedOutTrades / trades.filter(t => t.result === 'loss').length > 0.8) {
      strengths.push({
        area: 'Discipline',
        value: 'عالي',
        message: 'التزامك بـ SL قوي. هذا أساس النجاح'
      });
    }

    // نقاط الضعف
    const topMistake = Object.entries(mistakeAnalysis.byMistake)
      .reduce((max, [k, v]) => v.count > max.count ? { k, ...v } : max, { count: 0 });

    if (topMistake.count > 0) {
      weaknesses.push({
        area: topMistake.k,
        frequency: topMistake.count,
        impact: `${topMistake.impactOnWinRate}% من الخسائر`,
        solution: `اقرأ علاج ${topMistake.k} في PSYCHOLOGY-RULES.md`
      });
    }

    // الأخطاء المتكررة
    if (mistakeAnalysis.patterns.length > 0) {
      mistakeAnalysis.patterns.forEach(pattern => {
        if (pattern.severity === 'critical') {
          weaknesses.push({
            area: 'Pattern Risk',
            pattern: pattern.name,
            solution: pattern.solution
          });
        }
      });
    }

    return { strengths, weaknesses };
  }

  // ==================== توصيات التحسن ====================

  generateDevelopmentRecommendations(trades, mistakeAnalysis, backTestResults) {
    const recommendations = [];

    // 1. التركيز على أفضل استراتيجية
    const bestStrat = backTestResults.bestStrategy;
    if (bestStrat) {
      recommendations.push({
        priority: 1,
        title: `التركيز على ${bestStrat.name}`,
        detail: `هذه استراتيجيتك الأفضل (${bestStrat.winRate}% WR)`,
        action: 'تجاهل باقي الاستراتيجيات الأسبوع القادم',
        timeline: 'فوري'
      });
    }

    // 2. معالجة أكبر خطأ
    const topMistake = Object.entries(mistakeAnalysis.byMistake)
      .reduce((max, [k, v]) => v.lossCount > max.lossCount ? { k, ...v } : max, { lossCount: 0 });

    if (topMistake.lossCount > 0) {
      recommendations.push({
        priority: 2,
        title: `معالجة: ${topMistake.k}`,
        detail: `هذا الخطأ يسبب ${topMistake.impactOnWinRate}% من خسائرك`,
        action: `استخدم التنبيهات والقواعس من PSYCHOLOGY-RULES.md`,
        timeline: 'فوري'
      });
    }

    // 3. بناء الانضباط
    const disciplineScore = this.calculateDisciplineScore(trades);
    recommendations.push({
      priority: 3,
      title: 'تحسين الانضباط',
      detail: `درجة الانضباط الحالية: ${disciplineScore}/100`,
      action: 'قراءة إلزامية قبل كل جلسة: 5 دقائق فقط',
      timeline: 'يومي'
    });

    return recommendations;
  }

  // ==================== تقرير نفسي شامل ====================

  generatePsychologicalReport(trades, backTestResults) {
    const mistakeAnalysis = this.analyzeMistakes(trades);
    const { strengths, weaknesses } = this.identifyStrengthsAndWeaknesses(trades, mistakeAnalysis);
    const disciplineScore = this.calculateDisciplineScore(trades);
    const recommendations = this.generateDevelopmentRecommendations(trades, mistakeAnalysis, backTestResults);

    return {
      timestamp: new Date().toISOString(),
      
      overview: {
        totalTrades: trades.length,
        disciplineScore: disciplineScore,
        psychologyStatus: this.getPsychologyStatus(disciplineScore),
        mainChallenge: weaknesses[0]?.area || 'لا توجد',
        mainStrength: strengths[0]?.area || 'قيد البناء'
      },

      mistakeAnalysis: mistakeAnalysis,

      patterns: mistakeAnalysis.patterns,

      strengths: strengths,

      weaknesses: weaknesses,

      recommendations: recommendations,

      developmentPlan: {
        week1: {
          focus: `تطبيق ${backTestResults.bestStrategy?.strategy}`,
          target: `${backTestResults.bestStrategy?.winRate}% Win Rate`,
          actions: [
            'تطبيق الاستراتيجية بدقة 100%',
            'قراءة PSYCHOLOGY-RULES.md يومياً',
            'تسجيل كل صفقة مع الأخطاء',
            'توقف فوري عند ${recommendations[1]?.title}'
          ]
        },
        week2: {
          focus: 'تعميق الانضباط',
          target: 'الوصول إلى 95% انضباط',
          actions: [
            'تقليل الأخطاء بـ 50%',
            'بناء ثقة في النظام',
            'إضافة مؤشر إضافي إذا لزم'
          ]
        },
        week3_4: {
          focus: 'الاستقرار والنمو',
          target: '60%+ Win Rate',
          actions: [
            'تطبيق ثابت للاستراتيجية',
            'نمو تدريجي في الحجم',
            'تقييم النتائج والتعديلات'
          ]
        }
      },

      psychologyMessage: this.getPersonalizedMessage(disciplineScore, weaknesses, strengths)
    };
  }

  getPsychologyStatus(score) {
    if (score >= 90) return '🟢 ممتاز - استمر بنفس الالتزام';
    if (score >= 80) return '🟡 جيد - صغر الأخطاء أكثر';
    if (score >= 70) return '🟠 متوسط - احذر من الأخطاء';
    return '🔴 ضعيف - احتج توقف وإعادة تنظيم';
  }

  getPersonalizedMessage(score, weaknesses, strengths) {
    if (score >= 90) {
      return `✅ أنت على الطريق الصحيح. الانضباط يبني الثقة. استمر.`;
    }
    
    if (weaknesses.length > 0) {
      return `⚠️ أكبر تحديك: ${weaknesses[0].area}. اقرأ الحل في PSYCHOLOGY-RULES.md الآن.`;
    }

    return `💪 بدايتك جيدة. ركز على الانضباط، والنتائج ستأتي.`;
  }
}

module.exports = PsychologicalAnalyzer;
