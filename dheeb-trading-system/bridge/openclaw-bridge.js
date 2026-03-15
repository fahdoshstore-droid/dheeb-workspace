/**
 * 🐺 DHEEB BRIDGE - OpenClaw ↔ Dheeb Trading System
 * 
 * يربط بين ذيب (OpenClaw) ونظام التداول
 */

const fs = require('fs');
const path = require('path');

// Load trading system from workspace
const TradingSystem = require('../../trading-system');
const trading = new TradingSystem();

// ==================== Commands ====================

const commands = {
  // تحليل شارت
  'analyze': (args) => {
    // يستخدم نظام التداول للحكم على الصفقة
    const result = trading.evaluateSignal(args);
    return result;
  },
  
  // فحص الـ checklist
  'check': () => {
    const warnings = trading.checkPsychologicalWarnings();
    return {
      warnings: warnings,
      canTrade: warnings.length === 0,
      message: warnings.length === 0 ? '✅ CLEAR' : '⚠️ CHECK'
    };
  },
  
  // إحصائيات
  'stats': () => {
    return trading.getPerformanceStats();
  },
  
  // تسجيل صفقة
  'record': (tradeData) => {
    return trading.recordTrade(tradeData);
  },
  
  // إغلاق صفقة
  'close': (tradeId, exitPrice, reason) => {
    return trading.closeTrade(tradeId, exitPrice, reason);
  },
  
  // فحص的风险
  'risk': (symbol, entry, stop, target) => {
    return trading.calculatePositionSize(symbol, entry, stop, target);
  },
  
  // تقرير يومي
  'daily': () => {
    return trading.generateDailyReport();
  }
};

// ==================== Bridge Functions ====================

function analyzeChart(userDescription) {
  // يستخدم نظام التداول للحكم
  const psychCheck = trading.checkPsychologicalWarnings();
  
  return {
    system: 'dheeb-trading-system v2',
    warnings: psychCheck,
    canTrade: psychCheck.length === 0,
    message: psychCheck.length === 0 
      ? '✅ All checks passed - ready to trade'
      : '❌ Blocked - check warnings'
  };
}

function evaluateSetup(setup) {
  // تقييم الـ setup باستخدام ICT concepts
  const evaluation = trading.evaluateSignal({
    symbol: setup.symbol || 'NQ',
    action: setup.action,
    price: setup.price,
    stop: setup.stop,
    target: setup.target
  });
  
  return evaluation;
}

// ==================== Export ====================

module.exports = {
  commands,
  analyzeChart,
  evaluateSetup,
  trading
};
