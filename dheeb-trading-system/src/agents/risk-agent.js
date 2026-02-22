/**
 * ═══════════════════════════════════════════════════════════════
 *  💼 RISK AGENT - Risk & Money Management
 *  يعتمد على: Raschke, Carter, Hougaard, Wieland
 * ═══════════════════════════════════════════════════════════════
 */

const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 8081;

// ═══════════════════════════════════════════════════════════════
// PRO TRADERS RULES
// ═══════════════════════════════════════════════════════════════

class RiskAgent {
  constructor() {
    this.name = 'Risk Agent';
    this.config = {
      // Raschke Rules
      maxRiskPercent: 1.0,
      newsBlackout: 45, // minutes
      
      // Carter Rules
      drawdownReduce: 2,    // % - reduce size
      drawdownMin: 4,       // % - minimal mode
      drawdownStop: 8,       // % - stop trading
      
      // Wieland Rules
      maxTradesPerDay: 4,
      maxConsecutiveLosses: 2,
      fridayCutoff: '14:00', // EST
      
      // Account
      accountBalance: 50000,
      minRR: 1.5
    };
  }
  
  // Get current stats
  getStats() {
    let trades = [];
    try {
      trades = JSON.parse(fs.readFileSync('/home/ubuntu/.openclaw/workspace/trading-trades.json'));
    } catch(e) {}
    
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const total = wins + losses;
    const winRate = total > 0 ? (wins / total * 100).toFixed(1) : 0;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    // Last 3 trades
    const last3 = trades.slice(0, 3).map(t => t.result);
    
    // Consecutive losses
    let consecLosses = 0;
    for (let t of trades) {
      if (t.result === 'loss') consecLosses++;
      else break;
    }
    
    return {
      total,
      wins,
      losses,
      winRate,
      totalPnL: totalPnL.toFixed(2),
      last3,
      consecutiveLosses: consecLosses,
      tradesToday: trades.filter(t => t.timestamp && t.timestamp.startsWith('2026-02-18')).length
    };
  }
  
  // Calculate position size
  calculatePositionSize(entry, stop, balance = 50000) {
    const riskAmount = balance * (this.config.maxRiskPercent / 100);
    const pipsRisk = Math.abs(entry - stop);
    const positionSize = riskAmount / pipsRisk;
    
    return {
      riskDollars: riskAmount,
      riskPercent: this.config.maxRiskPercent,
      recommendedSize: Math.floor(positionSize)
    };
  }
  
  // Check if can trade
  canTrade(stats) {
    const checks = [];
    let canTrade = true;
    let reason = '';
    
    // Check daily loss
    if (stats.totalPnL < -this.config.accountBalance * (this.config.drawdownStop / 100)) {
      canTrade = false;
      reason = 'Daily loss limit exceeded (8%)';
    } else {
      checks.push({ check: 'Daily Loss', status: '✅ PASS' });
    }
    
    // Check consecutive losses
    if (stats.consecutiveLosses >= this.config.maxConsecutiveLosses) {
      canTrade = false;
      reason = `${stats.consecutiveLosses} consecutive losses`;
    } else {
      checks.push({ check: 'Consecutive Losses', status: '✅ PASS' });
    }
    
    // Check trades today
    if (stats.tradesToday >= this.config.maxTradesPerDay) {
      canTrade = false;
      reason = 'Max trades per day reached';
    } else {
      checks.push({ check: 'Daily Trades', status: '✅ PASS' });
    }
    
    // Check Friday
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    if (day === 5 && hour >= 19) { // Friday after 2PM EST = 7PM UTC
      canTrade = false;
      reason = 'Friday cutoff passed';
    } else {
      checks.push({ check: 'Friday', status: '✅ PASS' });
    }
    
    return { canTrade, reason, checks };
  }
  
  // Analyze trade from Trading Agent
  analyzeTrade(analysis) {
    const stats = this.getStats();
    const canTrade = this.canTrade(stats);
    
    // Risk assessment
    const risk = {
      accountBalance: this.config.accountBalance,
      maxRisk: this.config.maxRiskPercent,
      dailyLossLimit: this.config.drawdownStop,
      position: this.calculatePositionSize(analysis.signal.price, analysis.signal.price * 0.99)
    };
    
    return {
      agent: 'RISK',
      canTrade: canTrade.canTrade,
      reason: canTrade.reason,
      checks: canTrade.checks,
      stats,
      risk,
      rules: {
        raschke: 'Risk 1%, News blackout 45min',
        carter: `Drawdown ${this.config.drawdownReduce}% = reduce, ${this.config.drawdownMin}% = minimal, ${this.config.drawdownStop}% = stop`,
        hougaard: 'No revenge trading',
        wieland: `${this.config.maxTradesPerDay} trades/day max, ${this.config.maxConsecutiveLosses} losses = stop`
      },
      timestamp: new Date().toISOString()
    };
  }
  
  // Get risk info
  getRiskInfo() {
    return {
      config: this.config,
      rules: {
        raschke: '1% max risk, 45min news blackout',
        carter: '2% = reduce, 4% = minimal, 8% = stop',
        wieland: '4 trades/day, 2 losses = stop'
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════

const agent = new RiskAgent();

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
    res.end(JSON.stringify({ agent: 'RISK', status: 'ok' }));
    return;
  }
  
  // Risk info
  if (req.method === 'GET' && req.url === '/risk') {
    res.end(JSON.stringify(agent.getRiskInfo()));
    return;
  }
  
  // Stats
  if (req.method === 'GET' && req.url === '/stats') {
    res.end(JSON.stringify(agent.getStats()));
    return;
  }
  
  // Analyze from Trading Agent
  if (req.method === 'POST' && req.url === '/analyze') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const analysis = JSON.parse(body);
        const result = agent.analyzeTrade(analysis);
        
        console.log('Risk Analysis:', result.canTrade ? '✅ CAN TRADE' : '❌ CANNOT TRADE');
        if (result.reason) console.log('Reason:', result.reason);
        
        // Forward to Notifier
        const notifyData = {
          type: 'analysis',
          trading: analysis,
          risk: result,
          news: {}
        };
        
        console.log('Forwarding to Notifier...');
        
        const notifyReq = http.request({
          hostname: 'localhost',
          port: 8084,
          path: '/notify',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, res => {
          console.log('Notifier response:', res.statusCode);
        });
        
        notifyReq.on('error', e => console.log('Notifier error:', e.message));
        notifyReq.write(JSON.stringify(notifyData));
        notifyReq.end();
        
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  res.end('Risk Agent - Pro Traders Rules');
});

server.listen(PORT, () => {
  console.log(`💼 Risk Agent running on port ${PORT}`);
  console.log(`📊 Rules: Raschke, Carter, Hougaard, Wieland`);
});

module.exports = server;
