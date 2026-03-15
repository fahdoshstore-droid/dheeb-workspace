#!/usr/bin/env node
/**
 * 📊 SETUP ALERT GENERATOR
 * High probability trade signals
 */

function generateSetupAlert(setup) {
  const {
    direction = 'BUY',
    confidence = 0,
    price = 0,
    entry = 0,
    sl = 0,
    tp = 0,
    rrr = 0,
    confluences = []
  } = setup;

  const directionEmoji = direction === 'BUY' ? '🟢' : '🔴';
  const directionAr = direction === 'BUY' ? 'شراء' : 'بيع';

  const confTotal = confluences.reduce((sum, c) => sum + (c.points || 0), 0);
  const confidencePct = Math.round(confidence * 100);

  let confidenceLevel = 'LOW';
  if (confidencePct >= 90) confidenceLevel = 'STRONG';
  else if (confidencePct >= 70) confidenceLevel = 'MEDIUM';

  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);

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
   └─ ${c.description}`).join('\n')}

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

  return message;
}

// Example usage
const exampleSetup = {
  direction: 'BUY',
  confidence: 0.95,
  price: 24950,
  entry: 24945,
  sl: 24920,
  tp: 25000,
  rrr: 2.2,
  confluences: [
    { name: 'Discount Zone', points: 25, description: 'منطقة شراء ممتازة' },
    { name: 'HTF Bullish', points: 15, description: 'اتجاه رئيسي صاعد' },
    { name: 'FVG', points: 15, description: 'Imbalance موجود' },
    { name: 'Bullish OB', points: 15, description: 'Order Block صاعد' },
    { name: 'Liquidity', points: 10, description: 'سيولة قريبة' },
    { name: '4+ Confluences', points: 20, description: 'Setup قوي جداً' }
  ]
};

console.log(generateSetupAlert(exampleSetup));
