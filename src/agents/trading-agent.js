/**
 * ═══════════════════════════════════════════════════════════════
 *  🧠 TRADING AGENT - ICT/SMC Analysis
 *  يستقبل الإشارات من TradingView
 *  يعتمد على ICT Framework (Michael Huddleston)
 * ═══════════════════════════════════════════════════════════════
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const RISK_PORT = process.env.RISK_PORT || 8081;
const NEWS_PORT = process.env.NEWS_PORT || 8082;

// ═══════════════════════════════════════════════════════════════
// ICT/SMC CONCEPTS
// ═══════════════════════════════════════════════════════════════

class ICTAnalyzer {
  constructor() {
    this.name = 'ICT Trading Agent';
  }
  
  // Parse TradingView alert
  parseSignal(data) {
    const text = data.raw || data.text || '';
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
  
  // ICT Analysis
  analyzeICT(price, symbol = 'NQ') {
    // Zones
    const zones = {
      premium: price >= 25000,
      discount: price <= 24800,
      mid: price > 24800 && price < 25000
    };
    
    // Determine bias
    let bias = 'NEUTRAL';
    if (zones.premium) bias = 'BEARISH';
    else if (zones.discount) bias = 'BULLISH';
    
    // Recommendations
    let rec = 'WAIT';
    let reason = '';
    
    if (zones.premium) {
      rec = 'NO_ENTRY';
      reason = 'Price in PREMIUM - Wait for pullback to discount';
    } else if (zones.discount) {
      rec = 'POTENTIAL_LONG';
      reason = 'Price in DISCOUNT zone - Look for OB + FVG + MSS';
    } else {
      rec = 'NEUTRAL';
      reason = 'Price in MID zone - Wait for clear direction';
    }
    
    // Key Levels (NQ/MNQ)
    const levels = {
      premium: [25000, 25050, 25100],
      mid: [24900, 24950, 25000],
      discount: [24800, 24750, 24700, 24600]
    };
    
    return {
      bias,
      zones,
      recommendation: rec,
      reason,
      levels,
      confluences: this.checkConfluences(zones)
    };
  }
  
  // Check for confluences
  checkConfluences(zones) {
    const confluences = [];
    
    if (zones.discount) confluences.push('Price in Discount Zone');
    if (zones.premium) confluences.push('Price in Premium Zone');
    
    return confluences;
  }
  
  // SMC Analysis
  analyzeSMC(price) {
    // Market Maker Model
    const mmm = {
      accumulation: price < 24000,
      distribution: price > 26000,
      consolidation: price >= 24000 && price <= 26000
    };
    
    // Liquidity
    const liquidity = {
      bsl: 25000,
      ssl: 24000
    };
    
    // Order Blocks (estimated)
    const orderBlocks = {
      bullish: [24600, 24700, 24800],
      bearish: [25100, 25200]
    };
    
    // Fair Value Gaps
    const fvgs = [
      { top: 24900, bottom: 24850, filled: false }
    ];
    
    return {
      mmm,
      liquidity,
      orderBlocks,
      fvgs
    };
  }
  
  // Kill Zones
  getKillZone() {
    const now = new Date();
    const hour = now.getUTCHours();
    
    const zones = {
      london: { start: 7, end: 11, name: 'London' },
      nyMorning: { start: 13, end: 17, name: 'NY Morning' },
      nyLunch: { start: 17, end: 21, name: 'NY Lunch' }
    };
    
    let active = null;
    for (const [key, z] of Object.entries(zones)) {
      if (hour >= z.start && hour < z.end) {
        active = z;
        break;
      }
    }
    
    return {
      active: active ? active.name : 'None',
      time: now.toISOString()
    };
  }
  
  // Generate full analysis
  generateAnalysis(data) {
    const signal = this.parseSignal(data);
    const ict = this.analyzeICT(signal.price);
    const smc = this.analyzeSMC(signal.price);
    const killzone = this.getKillZone();
    
    return {
      agent: 'TRADING',
      signal,
      ict,
      smc,
      killzone,
      timestamp: new Date().toISOString()
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════

const analyzer = new ICTAnalyzer();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.end(JSON.stringify({ 
      agent: 'TRADING', 
      status: 'ok',
      concepts: ['ICT', 'SMC', 'Order Blocks', 'FVG', 'Liquidity']
    }));
    return;
  }
  
  // Get analysis
  if (req.method === 'GET' && req.url === '/analysis') {
    res.end(JSON.stringify({ 
      analyzer: 'ICTAnalyzer',
      concepts: ['Order Blocks', 'FVG', 'Liquidity Sweeps', 'Kill Zones', 'MSS', 'OTE']
    }));
    return;
  }
  
  // Webhook
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        let data;
        try { data = JSON.parse(body); }
        catch { data = { raw: body }; }
        
        const analysis = analyzer.generateAnalysis(data);
        
        // Log
        console.log('Signal:', analysis.signal.raw);
        console.log('ICT Bias:', analysis.ict.bias);
        console.log('Recommendation:', analysis.ict.recommendation);
        
        // Send to Risk Agent
        const postData = JSON.stringify(analysis);
        const req = http.request({
          hostname: 'localhost',
          port: RISK_PORT,
          path: '/analyze',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, res => {});
        req.write(postData);
        req.end();
        
        res.end(JSON.stringify({ ok: true, analysis }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  res.end('Trading Agent - ICT/SMC');
});

server.listen(PORT, () => {
  console.log(`🧠 Trading Agent running on port ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🎯 ICT Concepts: Order Blocks, FVG, Liquidity, Kill Zones`);
});

module.exports = server;
