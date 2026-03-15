#!/usr/bin/env node
/**
 * 📊 SETUP ANALYZER
 * Analyzes charts and generates trade alerts
 */

const CONFLUENCES = [
  { name: 'Discount Zone', points: 25, desc: 'منطقة شراء ممتازة' },
  { name: 'HTF Trend', points: 15, desc: 'اتجاه رئيسي' },
  { name: 'FVG', points: 15, desc: 'Imbalance موجود' },
  { name: 'Bullish OB', points: 15, desc: 'Order Block صاعد' },
  { name: 'Liquidity', points: 10, desc: 'سيولة قريبة' },
  { name: '4+ Confluences', points: 20, desc: 'Setup قوي جداً' }
];

function calculateConfidence(confluenceCount) {
  if (confluenceCount >= 5) return 0.95;
  if (confluenceCount >= 4) return 0.85;
  if (confluenceCount >= 3) return 0.75;
  if (confluenceCount >= 2) return 0.60;
  return 0.40;
}

function getConfidenceLevel(confidence) {
  if (confidence >= 0.90) return 'STRONG';
  if (confidence >= 0.70) return 'MEDIUM';
  return 'LOW';
}

function calculateRRR(entry, sl, tp, direction) {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  return risk > 0 ? (reward / risk).toFixed(2) : 0;
}

function generateAlert(analysis) {
  const {
    direction = 'BUY',
    price = 0,
    entry = 0,
    sl = 0,
    tp = 0,
    confluences = []
  } = analysis;

  const directionEmoji = direction === 'BUY' ? '🟢' : '🔴';
  const directionAr = direction === 'BUY' ? 'شراء' : 'بيع';
  
  const confidence = calculateConfidence(confluences.length);
  const confidencePct = Math.round(confidence * 100);
  const confidenceLevel = getConfidenceLevel(confidence);
  
  const rrr = calculateRRR(entry, sl, tp, direction);

  const message = `
━━━━━━━━━━━━━━━━━━━━

🎯 *الاتجاه:* ${directionAr} ${directionEmoji}
📊 *نسبة النجاح:* ${confidencePct}%
📈 *مستوى الثقة:* ${confidenceLevel}
💰 *السعر الحالي:* ${price}

━━━━━━━━━━━━━━━━━━━━
🎯 *الكونفلونس (${confluences.length}):*
━━━━━━━━━━━━━━━━━━━━
${confluences.map((c, i) => `${i+1}. ${c.name} ${c.points > 0 ? '+' + c.points : ''}
   └─ ${c.desc}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
📋 *المستويات:*
━━━━━━━━━━━━━━━━━━━━
🎯 الدخول: ${entry}
🛡️ الستوب: ${sl}
🎯 الهدف: ${tp}
📈 R:R: 1:${rrr}

━━━━━━━━━━━━━━━━━━━━
💡 *التوصية:* ${confidencePct >= 70 ? 'دخول قوي' : 'انتظار'}
⏰ ${new Date().toLocaleTimeString('en-US', { hour12: false })}
🐺 Dheeb
`;

  return {
    message,
    confidence: confidencePct,
    rrr,
    valid: confidencePct >= 70 && rrr >= 2.5
  };
}

// Export for use
module.exports = { generateAlert, CONFLUENCES, calculateConfidence, calculateRRR };

// CLI test
if (require.main === module) {
  const testAnalysis = {
    direction: 'BUY',
    price: 24950,
    entry: 24945,
    sl: 24920,
    tp: 25000,
    confluences: [
      { name: 'Discount Zone', points: 25, desc: 'منطقة شراء' },
      { name: 'HTF Trend', points: 15, desc: 'اتجاه صاعد' },
      { name: 'FVG', points: 15, desc: 'Imbalance' },
      { name: 'Bullish OB', points: 15, desc: 'Order Block' }
    ]
  };
  
  console.log(generateAlert(testAnalysis).message);
}
