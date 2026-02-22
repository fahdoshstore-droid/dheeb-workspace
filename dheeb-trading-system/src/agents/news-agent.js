/**
 * ═══════════════════════════════════════════════════════════════
 *  📰 NEWS AGENT - Economic News & Events
 *  يجلب الأخبار الإقتصادية
 * ═══════════════════════════════════════════════════════════════
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 8082;

// ═══════════════════════════════════════════════════════════════
// NEWS SOURCES
// ═══════════════════════════════════════════════════════════════

class NewsAgent {
  constructor() {
    this.name = 'News Agent';
    this.news = [];
  }
  
  // Get current date info
  getDateInfo() {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    
    return {
      day: now.toISOString().split('T')[0],
      time: now.toISOString(),
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      isFriday: day === 5,
      isWeekend: day === 0 || day === 6
    };
  }
  
  // High impact news (manual for now)
  getHighImpactNews() {
    const dateInfo = this.getDateInfo();
    
    // Regular news schedule
    const news = {
      'Monday': [
        { time: '14:30', event: 'NY Empire State Manufacturing Index', impact: 'Medium' }
      ],
      'Tuesday': [
        { time: '13:30', event: 'US CPI', impact: 'High' },
        { time: '14:15', event: 'US Industrial Production', impact: 'Medium' }
      ],
      'Wednesday': [
        { time: '13:30', event: 'US Retail Sales', impact: 'High' },
        { time: '15:00', event: 'US NAHB Housing Market Index', impact: 'Low' }
      ],
      'Thursday': [
        { time: '13:30', event: 'US Building Permits', impact: 'Medium' },
        { time: '15:00', event: 'US Existing Home Sales', impact: 'Medium' }
      ],
      'Friday': [
        { time: '13:30', event: 'US Nonfarm Payrolls (NFP)', impact: 'Very High' },
        { time: '15:00', event: 'US Consumer Sentiment', impact: 'High' }
      ]
    };
    
    return news[dateInfo.dayName] || [];
  }
  
  // Check for high impact news today
  checkNews() {
    const dateInfo = this.getDateInfo();
    const todayNews = this.getHighImpactNews();
    
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    let nextNews = null;
    let newsActive = false;
    
    for (const n of todayNews) {
      const [hour] = n.time.split(':').map(Number);
      const diff = hour - currentHour;
      
      if (diff >= 0 && diff <= 1) {
        newsActive = true;
        break;
      }
      
      if (diff > 0 && (!nextNews || diff < nextNews.diff)) {
        nextNews = { ...n, diff };
      }
    }
    
    return {
      agent: 'NEWS',
      dateInfo,
      todayNews,
      newsActive,
      nextNews,
      recommendation: newsActive 
        ? '⚠️ HIGH IMPACT NEWS - No new trades'
        : nextNews
          ? `Next: ${nextNews.event} in ${nextNews.diff}h`
          : '✅ No high impact news in next 2 hours',
      blackout: newsActive,
      timestamp: new Date().toISOString()
    };
  }
  
  // Generate news report
  getReport() {
    const check = this.checkNews();
    
    let report = '📰 *NEWS AGENT REPORT*\n\n';
    report += `━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📅 ${check.dateInfo.day} - ${check.dateInfo.dayName}\n\n`;
    
    report += `🎯 *Today's News:*\n`;
    if (check.todayNews.length === 0) {
      report += `No scheduled high impact news\n`;
    } else {
      check.todayNews.forEach(n => {
        report += `• ${n.time} UTC - ${n.event} (${n.impact})\n`;
      });
    }
    
    report += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📊 *Status:* ${check.recommendation}\n`;
    
    if (check.blackout) {
      report += `\n⚠️ *RASCHKE RULE:* Wait 30-45 min after news\n`;
    }
    
    return report;
  }
}

// ═══════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════

const agent = new NewsAgent();

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
    res.end(JSON.stringify({ agent: 'NEWS', status: 'ok' }));
    return;
  }
  
  // Check news
  if (req.method === 'GET' && req.url === '/check') {
    const news = agent.checkNews();
    const killzones = agent.getKillZones();
    res.end(JSON.stringify({ news, killzones }));
    return;
  }
  
  // Report
  if (req.method === 'GET' && req.url === '/report') {
    res.end(JSON.stringify({ 
      report: agent.getReport(),
      details: agent.checkNews()
    }));
    return;
  }
  
  // Add news endpoint (for manual add)
  if (req.method === 'POST' && req.url === '/add') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const news = JSON.parse(body);
        agent.news.push(news);
        res.end(JSON.stringify({ ok: true }));
      } catch(e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  res.end('News Agent - Economic Calendar');
});

server.listen(PORT, () => {
  console.log(`📰 News Agent running on port ${PORT}`);
  console.log(`📅 Checks: High Impact News, News Blackout`);
});

module.exports = server;

// ═══════════════════════════════════════════════════════════════
// KILL ZONES - Weighted Trading Windows
// ═══════════════════════════════════════════════════════════════

NewsAgent.prototype.getKillZones = function() {
  const now = new Date();
  const hour = now.getUTCHours();
  const min = now.getUTCMinutes();
  const timeInMin = hour * 60 + min;
  
  const zones = [
    { name: 'NY AM Killzone', start: 570, end: 660, weight: 10 },    // 09:30-11:00
    { name: 'NY PM Killzone', start: 840, end: 960, weight: 8 },     // 14:00-16:00
    { name: 'London Killzone', start: 180, end: 240, weight: 7 },    // 03:00-04:00
    { name: 'Silver Bullet 1', start: 570, end: 580, weight: 10 },    // 09:30-09:40
    { name: 'Silver Bullet 2', start: 590, end: 600, weight: 9 },     // 09:50-10:00
    { name: 'Silver Bullet 3', start: 600, end: 610, weight: 10 },    // 10:00-10:10
    { name: 'Silver Bullet 4', start: 650, end: 660, weight: 9 },     // 10:50-11:00
    { name: 'Silver Bullet 5', start: 840, end: 850, weight: 10 },    // 14:00-14:10
    { name: 'Silver Bullet 6', start: 890, end: 900, weight: 9 },     // 14:50-15:00
    { name: 'Silver Bullet 7', start: 900, end: 910, weight: 10 },    // 15:00-15:10
  ];
  
  let active = null;
  let next = null;
  let maxWeight = 0;
  
  for (const z of zones) {
    if (timeInMin >= z.start && timeInMin < z.end) {
      if (z.weight > maxWeight) {
        active = z;
        maxWeight = z.weight;
      }
    }
    if (!next && timeInMin < z.start) {
      next = z;
    }
  }
  
  return {
    active,
    next,
    timeInMin,
    hour,
    recommendations: {
      1: 'Silver Bullet Open (+20% size)',
      2: 'Silver Bullet Close (+10% size)',
      3: 'Killzone normal (100% size)',
      4: 'Outside windows (50% or reject)'
    }
  };
};
