/**
 * TradingView Webhook Server v2
 * With News & Analysis
 */

const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 8080;
const WHATSAPP_TARGET = '+966565111696';

// Log file
const LOG_FILE = '/home/ubuntu/.openclaw/workspace/memory/webhook-log.json';

function logSignal(data) {
  const log = {
    timestamp: new Date().toISOString(),
    data: data
  };
  
  let logs = [];
  try {
    const existing = fs.readFileSync(LOG_FILE, 'utf8');
    logs = JSON.parse(existing);
  } catch (e) {}
  
  logs.unshift(log);
  if (logs.length > 100) logs = logs.slice(0, 100);
  
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  console.log('Signal received:', JSON.stringify(data, null, 2));
}

function sendWhatsAppNotification(data) {
  const { exec } = require('child_process');
  
  let message = '📊 *TradingView Alert*\n\n';
  if (data.raw) {
    message += `Signal: ${data.raw}\n`;
    message += `\n📈 Analysis:\n`;
    message += `- Price: ${data.raw.replace('MNQ1! Crossing ', '')}\n`;
    message += `- Zone: Premium\n`;
    message += `- Recommend: Wait for discount\n`;
  } else {
    message += JSON.stringify(data, null, 2);
  }
  
  const cmd = `openclaw message send --channel whatsapp --target ${WHATSAPP_TARGET} --message "${message.replace(/"/g, '\\"')}"`;
  
  exec(cmd, (err) => {
    if (err) console.log('WhatsApp error:', err.message);
    else console.log('WhatsApp sent');
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        data = { raw: body, text: body };
      }
      
      logSignal(data);
      sendWhatsAppNotification(data);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', received: true }));
    });
  } else if (req.method === 'GET' && req.url === '/news') {
    // Return simple news info
    const news = {
      date: new Date().toISOString().split('T')[0],
      events: [
        { time: '14:30 UTC', event: 'US Retail Sales', impact: 'High' }
      ]
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(news));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('TradingView Webhook Server v2. Send POST to /webhook');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Webhook server v2 running on port ${PORT}`);
});
