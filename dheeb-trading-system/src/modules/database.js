/**
 * Database
 * Simple JSON-based storage
 */

const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '..', '..', 'memory');
    this.signalsFile = path.join(this.dataDir, 'signals.json');
  }
  
  saveSignal(signal) {
    let signals = [];
    
    try {
      const existing = fs.readFileSync(this.signalsFile, 'utf8');
      signals = JSON.parse(existing);
    } catch (e) {
      signals = [];
    }
    
    signals.unshift(signal);
    
    // Keep last 100
    if (signals.length > 100) {
      signals = signals.slice(0, 100);
    }
    
    fs.writeFileSync(this.signalsFile, JSON.stringify(signals, null, 2));
    console.log('Signal saved to database');
  }
  
  getSignals(limit = 10) {
    try {
      const data = fs.readFileSync(this.signalsFile, 'utf8');
      const signals = JSON.parse(data);
      return signals.slice(0, limit);
    } catch (e) {
      return [];
    }
  }
}

module.exports = Database;
