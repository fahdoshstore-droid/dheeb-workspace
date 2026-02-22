/**
 * ═══════════════════════════════════════════════════════════════
 *  ⚙️ SYSTEM AGENT - Monitoring & Health
 *  يراقب العمليات والأداء
 * ═══════════════════════════════════════════════════════════════
 */

const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const PORT = process.env.PORT || 8083;

// ═══════════════════════════════════════════════════════════════
// SYSTEM MONITORING
// ═══════════════════════════════════════════════════════════════

class SystemAgent {
  constructor() {
    this.name = 'System Agent';
    this.startTime = Date.now();
  }
  
  // Get system info
  getSystemInfo() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    
    return {
      uptime: `${hours}h ${mins}m`,
      startTime: new Date(this.startTime).toISOString(),
      platform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage()
    };
  }
  
  // Get running processes
  getProcesses() {
    return new Promise((resolve) => {
      exec('ps aux | grep node | grep -v grep', (err, stdout) => {
        if (err) {
          resolve({ error: err.message });
          return;
        }
        
        const processes = stdout.trim().split('\n').filter(l => l);
        resolve({
          count: processes.length,
          processes: processes.map(p => {
            const parts = p.split(/\s+/);
            return {
              pid: parts[1],
              cpu: parts[2],
              mem: parts[3],
              cmd: parts.slice(10).join(' ')
            };
          })
        });
      });
    });
  }
  
  // Get disk usage
  getDisk() {
    return new Promise((resolve) => {
      exec('df -h /home/ubuntu', (err, stdout) => {
        if (err) {
          resolve({ error: err.message });
          return;
        }
        
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) {
          resolve({});
          return;
        }
        
        const parts = lines[1].split(/\s+/);
        resolve({
          total: parts[1],
          used: parts[2],
          available: parts[3],
          percent: parts[4]
        });
      });
    });
  }
  
  // Get memory usage
  getMemory() {
    const mem = process.memoryUsage();
    return {
      rss: Math.round(mem.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(mem.external / 1024 / 1024) + ' MB'
    };
  }
  
  // Check all agents
  async checkAgents() {
    const agents = [
      { name: 'Trading', port: 8080, endpoint: '/health' },
      { name: 'Risk', port: 8081, endpoint: '/health' },
      { name: 'News', port: 8082, endpoint: '/health' }
    ];
    
    const results = [];
    
    for (const agent of agents) {
      try {
        const status = await this.checkPort(agent.port, agent.endpoint);
        results.push({
          name: agent.name,
          port: agent.port,
          status: status ? '✅ UP' : '❌ DOWN'
        });
      } catch(e) {
        results.push({
          name: agent.name,
          port: agent.port,
          status: '❌ DOWN'
        });
      }
    }
    
    return results;
  }
  
  // Check port
  checkPort(port, endpoint = '/health') {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: endpoint,
        method: 'GET'
      }, res => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  }
  
  // Get full status
  async getStatus() {
    const [system, processes, disk, memory, agents] = await Promise.all([
      this.getSystemInfo(),
      this.getProcesses(),
      this.getDisk(),
      this.getMemory(),
      this.checkAgents()
    ]);
    
    return {
      agent: 'SYSTEM',
      system,
      processes,
      disk,
      memory,
      agents,
      timestamp: new Date().toISOString()
    };
  }
  
  // Generate report
  async generateReport() {
    const status = await this.getStatus();
    
    let report = '⚙️ *SYSTEM AGENT REPORT*\n\n';
    report += `━━━━━━━━━━━━━━━━━━━━\n`;
    report += `🖥️ *System:* ${status.system.uptime}\n`;
    report += `📊 *Memory:* ${status.memory.heapUsed} / ${status.memory.heapTotal}\n`;
    report += `💾 *Disk:* ${status.disk.used} / ${status.disk.total} (${status.disk.percent})\n\n`;
    
    report += `━━━━━━━━━━━━━━━━━━━━\n`;
    report += `🤖 *Agents:*\n`;
    status.agents.forEach(a => {
      report += `${a.status} ${a.name} (:${a.port})\n`;
    });
    
    report += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📦 *Processes:* ${status.processes.count} Node processes\n`;
    
    return { report, status };
  }
}

// ═══════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════

const agent = new SystemAgent();

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
    res.end(JSON.stringify({ agent: 'SYSTEM', status: 'ok' }));
    return;
  }
  
  // Status
  if (req.method === 'GET' && req.url === '/status') {
    const status = await agent.getStatus();
    res.end(JSON.stringify(status));
    return;
  }
  
  // Report
  if (req.method === 'GET' && req.url === '/report') {
    const result = await agent.generateReport();
    res.end(JSON.stringify(result));
    return;
  }
  
  // Check specific agent
  if (req.method === 'GET' && req.url.startsWith('/check/')) {
    const port = parseInt(req.url.split('/')[2]);
    const status = await agent.checkPort(port);
    res.end(JSON.stringify({ port, status: status ? 'UP' : 'DOWN' }));
    return;
  }
  
  res.end('System Agent - Monitoring');
});

server.listen(PORT, () => {
  console.log(`⚙️ System Agent running on port ${PORT}`);
  console.log(`📊 Monitors: Trading, Risk, News Agents`);
});

module.exports = server;
