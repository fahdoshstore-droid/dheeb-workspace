/**
 * 🧠 Dheeb Trading System v2.0
 * Full Feature - Multi-Agent Architecture
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// MODULES
// ═══════════════════════════════════════════════════════════════

class SignalProcessor {
  constructor() {
    this.name = 'Signal Processor';
  }
  
  parse(data) {
    const text = data.raw || data.text || '';
    
    // Extract: "MNQ1! Crossing 24,933.50"
    const match = text.match(/([A-Z]+)\d?!?\s*Crossing\s*([\d,.]+)/);
    
    if (match) {
      return {
        symbol: match[1],
        price: parseFloat(match[2].replace(/,/g, '')),
        raw: text,
        timestamp: new Date().toISOString()
      };
    }
    
    return { symbol: 'UNKNOWN', price: 0, raw: text };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ICT ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  analyzeICT(signal) {
    const price = signal.price;
    
    // Zones (for NQ/MNQ)
    const zones = {
      premium: price >= 25000,
      discount: price <= 24800,
      mid: price > 24800 && price < 25000
    };
    
    // HTF Bias
    const bias = zones.premium ? 'BEARISH' : zones.discount ? 'BULLISH' : 'NEUTRAL';
    
    // Recommendation
    let rec = 'WAIT';
    let reason = 'No clear setup';
    
    if (zones.premium) {
      rec = 'NO_ENTRY';
      reason = 'Price in PREMIUM zone - Wait for pullback to discount';
    } else if (zones.discount) {
      rec = 'POTENTIAL_LONG';
      reason = 'Price in DISCOUNT zone - Look for OB + FVG confirmation';
    } else {
      rec = 'NEUTRAL';
      reason = 'Price in MID zone - Wait for clear direction';
    }
    
    return { bias, zones, recommendation: rec, reason };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // PRO TRADERS INPUT
  // ═══════════════════════════════════════════════════════════════
  
  getProTradersAdvice(signal, ict) {
    const advice = [];
    
    // Raschke
    advice.push({ trader: 'Raschke', text: 'Wait for 3+ confluences before entry' });
    
    // Carter
    advice.push({ trader: 'Carter', text: 'Risk 1% max per trade' });
    
    // Hougaard
    advice.push({ trader: 'Hougaard', text: 'Check psychology - no revenge trading' });
    
    // Wieland
    advice.push({ trader: 'Wieland', text: 'Trade in optimal windows only' });
    
    // ICT
    advice.push({ trader: 'ICT', text: ict.reason });
    
    return advice;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // CHECKLIST
  // ═══════════════════════════════════════════════════════════════
  
  getChecklist() {
    return {
      preTrade: [
        { id: 'htf', text: 'HTF Bias determined (4H/1H)', checked: false },
        { id: 'confluence', text: '3+ Confluences present', checked: false },
        { id: 'risk', text: 'Risk calculated (1% max)', checked: false },
        { id: 'sl_tp', text: 'SL & TP defined', checked: false },
        { id: 'rr', text: 'R:R ≥ 1:1.5', checked: false },
        { id: 'psych', text: 'Psychology clear', checked: false }
      ],
      duringTrade: [
        { id: 'entry', text: 'Entry from correct zone', checked: false },
        { id: 'be', text: 'Breakeven at 1:1', checked: false },
        { id: 'partial', text: 'Partial at 1:2', checked: false },
        { id: 'trail', text: 'Trail with structure', checked: false }
      ],
      postTrade: [
        { id: 'journal', text: 'Journal (screenshot + reason)', checked: false },
        { id: 'review', text: 'Review trade', checked: false },
        { id: 'reset', text: 'Reset psychology', checked: false }
      ]
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // TRADE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  
  getTradeManagement() {
    return {
      entryRules: [
        'Entry from Order Block or FVG',
        'Wait for MSS confirmation',
        'OTE in discount zone'
      ],
      exitRules: [
        'Move to breakeven at 1:1',
        'Take partial at 1:2',
        'Trail SL with structure'
      ],
      riskRules: [
        'Max 1% per trade',
        'Daily loss limit 2%',
        'Stop after 2 consecutive losses'
      ]
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RISK MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  
  getRiskManagement() {
    return {
      account: 50000,
      maxRiskPercent: 1.0,
      maxRiskDollars: 500,
      dailyLossLimit: 2.0,
      dailyLossDollars: 1000,
      maxTradesPerDay: 4,
      maxConsecutiveLosses: 2,
      minRR: 1.5,
      fridayCutoff: '14:00 EST'
    };
  }
}

class RiskManager {
  constructor() {
    this.signal = new SignalProcessor();
  }
  
  getStats() {
    // Load from trading-trades.json
    const fs = require('fs');
    let trades = [];
    try {
      trades = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/trading-trades.json'));
    } catch(e) {}
    
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const total = wins + losses;
    const winRate = total > 0 ? (wins / total * 100).toFixed(1) : 0;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    return {
      total,
      wins,
      losses,
      winRate,
      totalPnL: totalPnL.toFixed(2)
    };
  }
  
  analyze(signal) {
    const ict = this.signal.analyzeICT(signal);
    const risk = this.signal.getRiskManagement();
    const advice = this.signal.getProTradersAdvice(signal, ict);
    const checklist = this.signal.getChecklist();
    const management = this.signal.getTradeManagement();
    
    return {
      signal,
      ict,
      risk,
      advice,
      checklist,
      management
    };
  }
}

class WhatsAppNotifier {
  constructor(target) {
    this.target = target;
    this.exec = require('child_process').exec;
  }
  
  async send(analysis) {
    const msg = this.formatMessage(analysis);
    
    return new Promise((resolve) => {
      const cmd = `openclaw message send --channel whatsapp --target ${this.target} --message "${msg.replace(/"/g, '\\"')}"`;
      this.exec(cmd, (err) => {
        resolve(!err);
      });
    });
  }
  
  formatMessage(a) {
    const stats = this.riskManager.getStats();
    
    let msg = '📊 *DHEEB ANALYSIS*\n\n';
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📈 Signal: ${a.signal.raw}\n`;
    msg += `💰 Price: ${a.signal.price}\n\n`;
    
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📊 STATS\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `Total: ${stats.total} | Wins: ${stats.wins} | Losses: ${stats.losses}\n`;
    msg += `Win Rate: ${stats.winRate}%\n`;
    msg += `P/L: $${stats.totalPnL}\n\n`;
    
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎯 ICT ANALYSIS\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `Bias: ${a.ict.bias}\n`;
    msg += `Zone: ${a.ict.zones.premium ? 'PREMIUM ❌' : a.ict.zones.discount ? 'DISCOUNT ✅' : 'MID ⚠️'}\n`;
    msg += `Rec: ${a.ict.recommendation}\n\n`;
    
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📋 CHECKLIST\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    a.checklist.preTrade.forEach(c => {
      msg += `${c.checked ? '✅' : '⬜'} ${c.text}\n`;
    });
    msg += `\n`;
    
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `💼 RISK\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `Max Risk: ${a.risk.maxRiskPercent}%\n`;
    msg += `Daily Limit: ${a.risk.dailyLossLimit}%\n`;
    msg += `Min R:R: 1:${a.risk.minRR}\n\n`;
    
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏛️ PRO TRADERS\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    a.advice.forEach(t => {
      msg += `• ${t.trader}: ${t.text}\n`;
    });
    
    return msg;
  }
}

class Database {
  constructor() {
    this.file = path.join(__dirname, '..', 'memory', 'signals.json');
  }
  
  save(data) {
    let arr = [];
    try { arr = JSON.parse(fs.readFileSync(this.file)); } catch(e) {}
    arr.unshift(data);
    if (arr.length > 100) arr = arr.slice(0, 100);
    fs.writeFileSync(this.file, JSON.stringify(arr, null, 2));
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN SERVER
// ═══════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 8080;
const WHATSAPP = process.env.WHATSAPP_TARGET || '+966565111696';

const risk = new RiskManager();
const notifier = new WhatsAppNotifier(WHATSAPP);
const db = new Database();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health
  if (req.method === 'GET' && req.url === '/health') {
    res.end(JSON.stringify({ status: 'ok', version: '2.0' }));
    return;
  }
  
  // Checklist
  if (req.method === 'GET' && req.url === '/checklist') {
    const s = new SignalProcessor();
    res.end(JSON.stringify(s.getChecklist()));
    return;
  }
  
  // Risk Info
  if (req.method === 'GET' && req.url === '/risk') {
    const s = new SignalProcessor();
    res.end(JSON.stringify(s.getRiskManagement()));
    return;
  }
  
  // Webhook
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        let data;
        try { data = JSON.parse(body); } 
        catch { data = { raw: body }; }
        
        // Process
        const signal = new SignalProcessor().parse(data);
        const analysis = risk.analyze(signal);
        
        // Save & Notify
        db.save(analysis);
        await notifier.send(analysis);
        
        res.end(JSON.stringify({ ok: true, analysis }));
      } catch(e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  res.end('Dheeb Trading System v2.0');
});

server.listen(PORT, () => {
  console.log(`🚀 Dheeb Trading System v2.0`);
  console.log(`📡 Webhook: http://localhost:${PORT}/webhook`);
});

module.exports = server;
