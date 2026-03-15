/**
 * Signal Processor
 * Processes TradingView alerts
 */

class SignalProcessor {
  constructor(riskManager, database) {
    this.riskManager = riskManager;
    this.database = database;
  }
  
  async process(data) {
    const signal = {
      raw: data.raw || data.text || JSON.stringify(data),
      timestamp: new Date().toISOString(),
      parsed: this.parseSignal(data)
    };
    
    // Risk analysis
    signal.risk = this.riskManager.analyze(signal.parsed);
    
    // Generate recommendation
    signal.recommendation = this.generateRecommendation(signal);
    
    return signal;
  }
  
  parseSignal(data) {
    // Parse TradingView alert format
    const text = data.raw || data.text || '';
    
    // Extract symbol and price
    const symbolMatch = text.match(/([A-Z]+)\d?!?\s*Crossing\s*([\d,.]+)/);
    
    if (symbolMatch) {
      return {
        symbol: symbolMatch[1],
        price: parseFloat(symbolMatch[2].replace(/,/g, '')),
        type: text.toLowerCase().includes('crossing') ? 'cross' : 'other'
      };
    }
    
    return {
      symbol: data.symbol || 'UNKNOWN',
      price: data.price || 0,
      type: 'other'
    };
  }
  
  generateRecommendation(signal) {
    const price = signal.parsed.price;
    
    // Basic ICT analysis
    let zone = 'neutral';
    let recommendation = 'wait';
    
    if (price > 25000) {
      zone = 'premium';
      recommendation = 'no_entry_wait_pullback';
    } else if (price < 24800) {
      zone = 'discount';
      recommendation = 'potential_long';
    } else {
      zone = 'mid';
      recommendation = 'neutral';
    }
    
    return {
      zone,
      recommendation,
      message: this.getMessage(recommendation, zone)
    };
  }
  
  getMessage(rec, zone) {
    const messages = {
      no_entry_wait_pullback: `Price in PREMIUM zone (${zone}). Wait for pullback to discount.`,
      potential_long: `Price in DISCOUNT zone. Potential LONG. Wait for confirmation.`,
      neutral: `Price in NEUTRAL zone. Wait for clear setup.`
    };
    return messages[rec] || 'Analyze chart.';
  }
}

module.exports = SignalProcessor;
