/**
 * 📱 NOTIFIER AGENT - Enhanced Setup Analysis
 */

const http = require('http');

const PORT = process.env.PORT || 8084;
const WHATSAPP_TARGET = process.env.WHATSAPP_TARGET || '+966565111696';

class NotifierAgent {
  constructor() {
    this.target = WHATSAPP_TARGET;
  }
  
  sendWhatsApp(message) {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      const cmd = `openclaw message send --channel whatsapp --target ${this.target} --message "${message.replace(/"/g, '\\"')}"`;
      exec(cmd, () => resolve(true));
    });
  }
  
  // تحليل_setup قوي
  analyzeSetup(trading) {
    const signals = [];
    let score = 0;
    
    // 1. Zone Analysis
    if (trading.ict.zones.discount) {
      score += 25;
      signals.push({ name: '📍 Discount Zone', points: 25, desc: 'منطقة شراء ممتازة' });
    } else if (trading.ict.zones.mid) {
      score += 10;
      signals.push({ name: '📍 Mid Zone', points: 10, desc: 'منطقة محايدة' });
    } else {
      score -= 15;
      signals.push({ name: '📍 Premium Zone', points: -15, desc: 'منطقة بيع - تجنب' });
    }
    
    // 2. Market Structure
    if (trading.ict.bias === 'BULLISH') {
      score += 15;
      signals.push({ name: '📈 HTF Bullish', points: 15, desc: 'اتجاه رئيسي صاعد' });
    } else if (trading.ict.bias === 'BEARISH') {
      score += 15;
      signals.push({ name: '📉 HTF Bearish', points: 15, desc: 'اتجاه رئيسي هابط' });
    }
    
    // 3. Kill Zone
    if (trading.killzone.active !== 'None') {
      score += 20;
      signals.push({ name: '⏰ Kill Zone', points: 20, desc: trading.killzone.active });
    }
    
    // 4. FVG
    if (trading.smc.fvgs && trading.smc.fvgs.length > 0) {
      score += 15;
      signals.push({ name: '⚡ FVG', points: 15, desc: 'Imbalance موجود' });
    }
    
    // 5. Order Blocks
    if (trading.smc.orderBlocks && trading.smc.orderBlocks.bullish.length > 0) {
      score += 15;
      signals.push({ name: '📦 Bullish OB', points: 15, desc: 'Order Block صاعد' });
    }
    
    // 6. Liquidity
    if (trading.smc.liquidity) {
      score += 10;
      signals.push({ name: '💧 Liquidity', points: 10, desc: 'سيولة قريبة' });
    }
    
    // 7. confluence Count
    const confluenceCount = signals.filter(s => s.points >= 15).length;
    if (confluenceCount >= 4) {
      score += 20;
      signals.push({ name: '✅ 4+ Confluences', points: 20, desc: 'Setup قوي جداً' });
    } else if (confluenceCount >= 3) {
      score += 15;
      signals.push({ name: '✅ 3 Confluences', points: 15, desc: 'Setup جيد' });
    } else if (confluenceCount >= 2) {
      score += 10;
      signals.push({ name: '⚠️ 2 Confluences', points: 10, desc: 'Setup متوسط' });
    }
    
    // Calculate success rate
    const successRate = Math.min(Math.max(score, 10), 95);
    
    // Determine level
    let level, emoji, recommendation;
    if (score >= 80) {
      level = 'STRONG';
      emoji = '🔥';
      recommendation = 'دخول قوي - أعلى حجم';
    } else if (score >= 60) {
      level = 'GOOD';
      emoji = '⚡';
      recommendation = 'دخول جيد - حجم عادي';
    } else if (score >= 40) {
      level = 'WEAK';
      emoji = '⚠️';
      recommendation = 'Setup ضعيف - حجم صغير';
    } else {
      level = 'AVOID';
      emoji = '⛔';
      recommendation = 'تجنب - ضعيف';
    }
    
    return {
      score,
      successRate,
      level,
      emoji,
      recommendation,
      signals,
      confluenceCount
    };
  }
  
  // تنسيق رسالة الـ Setup
  formatSetupAlert(trading, analysis) {
    const direction = trading.ict.zones.discount ? 'LONG' : 'SHORT';
    const emojiDir = direction === 'LONG' ? '🟢' : '🔴';
    const action = direction === 'LONG' ? 'شراء' : 'بيع';
    
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    
    // Calculate levels
    const price = trading.signal.price;
    const entry = direction === 'LONG' ? price - 5 : price + 5;
    const stop = direction === 'LONG' ? price - 25 : price + 25;
    const target = direction === 'LONG' ? price + 50 : price - 50;
    
    let msg = `${analysis.emoji} *SMC SETUP*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    msg += `🎯 *الاتجاه:* ${action} ${emojiDir}\n`;
    msg += `📊 *نسبة النجاح:* ${analysis.successRate}%\n`;
    msg += `📈 *مستوى الثقة:* ${analysis.level}\n`;
    msg += `💰 *السعر الحالي:* ${price}\n\n`;
    
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎯 *الكونفلونس (${analysis.confluenceCount}):*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    analysis.signals.forEach((s, i) => {
      const sign = s.points > 0 ? '+' : '';
      msg += `${i + 1}. ${s.name} ${sign}${s.points}\n`;
      msg += `   └─ ${s.desc}\n`;
    });
    
    msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📋 *المستويات:*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎯 الدخول: ${entry}\n`;
    msg += `🛡️ الستوب: ${stop}\n`;
    msg += `🎯 الهدف: ${target}\n`;
    msg += `📈 R:R: 1:2\n\n`;
    
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 *التوصية:* ${analysis.recommendation}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    msg += `⏰ ${time}\n`;
    msg += `🐺 Dheeb SMC`;
    
    return msg;
  }
  
  async sendAnalysis(trading, risk, news) {
    const analysis = this.analyzeSetup(trading);
    
    // Send if score >= 40
    if (analysis.score < 40) {
      console.log(`Score: ${analysis.score} - AVOID`);
      return false;
    }
    
    console.log(`Score: ${analysis.score} - SENDING`);
    const message = this.formatSetupAlert(trading, analysis);
    return await this.sendWhatsApp(message);
  }
}

const agent = new NotifierAgent();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  if (req.method === 'GET' && req.url === '/health') {
    res.end(JSON.stringify({ agent: 'NOTIFIER', status: 'ok' }));
    return;
  }
  
  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (data.type === 'analysis') {
          const result = await agent.sendAnalysis(data.trading, data.risk, data.news);
          res.end(JSON.stringify({ sent: result }));
        }
      } catch(e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  res.end('Notifier Agent');
});

server.listen(PORT, () => {
  console.log(`📱 Notifier running on ${PORT}`);
});

module.exports = server;
