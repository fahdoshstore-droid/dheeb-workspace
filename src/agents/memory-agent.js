/**
 * MemoryAgent - DHEEB's Long-term Memory
 * Remembers everything, searches instantly, auto-documents
 */

const fs = require('fs');
const path = require('path');

class MemoryAgent {
  constructor(workspacePath = '/home/ubuntu/.openclaw/workspace') {
    this.workspace = workspacePath;
    this.cache = {};
    this.lastUpdate = null;
  }

  // ============================================
  // CORE FUNCTIONS
  // ============================================

  /**
   * Remember - save important info
   */
  remember(key, value, category = 'general') {
    const memFile = path.join(this.workspace, 'memory', 'agent-memory.json');
    
    let memory = this.loadMemory(memFile);
    
    memory[category] = memory[category] || {};
    memory[category][key] = {
      value: value,
      timestamp: new Date().toISOString()
    };
    
    this.saveMemory(memFile, memory);
    this.loadToCache();
    
    return `✅ Remembered: ${key}`;
  }

  /**
   * Recall - get info instantly
   */
  recall(key, category = 'general') {
    if (this.cache[category] && this.cache[category][key]) {
      return this.cache[category][key].value;
    }
    
    const memFile = path.join(this.workspace, 'memory', 'agent-memory.json');
    const memory = this.loadMemory(memFile);
    
    return memory[category]?.[key]?.value || null;
  }

  /**
   * Knows - check if exists
   */
  knows(key, category = 'general') {
    return this.recall(key, category) !== null;
  }

  // ============================================
  // FILE OPERATIONS
  // ============================================

  /**
   * Find file instantly
   */
  findFile(filename) {
    const results = [];
    
    const search = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          search(fullPath);
        } else if (item.isFile() && item.name.includes(filename)) {
          results.push(fullPath);
        }
      }
    };
    
    search(this.workspace);
    return results;
  }

  /**
   * Get file content
   */
  getFile(filePath) {
    const fullPath = path.join(this.workspace, filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return null;
  }

  /**
   * Find in content
   */
  findInFiles(searchTerm, extensions = ['.js', '.md', '.json']) {
    const results = [];
    
    const search = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          search(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name);
          if (extensions.includes(ext)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(searchTerm)) {
              results.push({
                file: fullPath,
                path: fullPath.replace(this.workspace + '/', '')
              });
            }
          }
        }
      }
    };
    
    search(this.workspace);
    return results;
  }

  // ============================================
  // PROJECT KNOWLEDGE
  // ============================================

  /**
   * Get project status
   */
  getProjectStatus(projectName) {
    const status = this.recall('project_status', 'projects');
    return status?.[projectName] || null;
  }

  /**
   * Update project status
   */
  updateProjectStatus(projectName, status) {
    return this.remember('project_status', {
      ...this.recall('project_status', 'projects'),
      [projectName]: status
    }, 'projects');
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return this.recall('project_status', 'projects') || {};
  }

  // ============================================
  // SYSTEM KNOWLEDGE
  // ============================================

  /**
   * Get system config
   */
  getConfig(key) {
    return this.recall(key, 'config');
  }

  /**
   * Set system config
   */
  setConfig(key, value) {
    return this.remember(key, value, 'config');
  }

  /**
   * Get trading rules
   */
  getTradingRules() {
    return this.recall('trading_rules', 'system') || {
      maxTrades: 2,
      maxRisk: 600,
      minRRR: 2.5,
      forbiddenDays: [3, 5] // Wed, Fri
    };
  }

  /**
   * Update trading rules
   */
  updateTradingRules(rules) {
    return this.remember('trading_rules', rules, 'system');
  }

  // ============================================
  // AUTO-DOCUMENTATION
  // ============================================

  /**
   * Document action automatically
   */
  document(action, details) {
    const logFile = path.join(this.workspace, 'memory', 'agent-actions.md');
    
    const entry = `
### ${new Date().toISOString()}
- **Action:** ${action}
- **Details:** ${JSON.stringify(details)}
`;
    
    fs.appendFileSync(logFile, entry);
    
    return `📝 Documented: ${action}`;
  }

  // ============================================
  // INTERNAL
  // ============================================

  loadMemory(filePath) {
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  saveMemory(filePath, memory) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
  }

  loadToCache() {
    const memFile = path.join(this.workspace, 'memory', 'agent-memory.json');
    this.cache = this.loadMemory(memFile);
    this.lastUpdate = new Date();
  }

  // Initialize
  init() {
    this.loadToCache();
    console.log('🧠 MemoryAgent initialized');
  }
}

// Export
module.exports = MemoryAgent;

// CLI
if (require.main === module) {
  const agent = new MemoryAgent();
  agent.init();
  
  // Test
  console.log('\n🧪 Testing MemoryAgent...\n');
  
  // Remember something
  agent.remember('test_key', 'test_value', 'test');
  console.log('✅ Remember test_key:', agent.recall('test_key', 'test'));
  
  // Find file
  console.log('\n🔍 Finding v2-bot.js:');
  console.log(agent.findFile('v2-bot.js'));
  
  // Get trading rules
  console.log('\n📋 Trading Rules:');
  console.log(agent.getTradingRules());
  
  // Get all projects
  console.log('\n📁 Projects:');
  console.log(agent.getAllProjects());
}
