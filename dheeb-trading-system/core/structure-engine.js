/**
 * StructureEngine - Market Structure Analysis
 * Analyzes: highs, lows, displacement, liquidity pools
 * Part of DHEEB Trading System v3.0
 */

class StructureEngine {
  constructor(dataProvider) {
    this.data = dataProvider;
  }

  // ============================================
  // HIGH/LOW ANALYSIS
  // ============================================

  /**
   * Get all significant highs
   */
  getHighs(timeframe = '15m', count = 10) {
    const candles = this.data.getRecentCandles(timeframe, count * 2);
    const highs = [];
    
    for (let i = 1; i < candles.length - 1; i++) {
      if (candles[i].high > candles[i-1].high && 
          candles[i].high > candles[i+1].high) {
        highs.push({
          price: candles[i].high,
          index: i,
          time: candles[i].time
        });
      }
    }
    
    return highs.sort((a, b) => b.price - a.price);
  }

  /**
   * Get all significant lows
   */
  getLows(timeframe = '15m', count = 10) {
    const candles = this.data.getRecentCandles(timeframe, count * 2);
    const lows = [];
    
    for (let i = 1; i < candles.length - 1; i++) {
      if (candles[i].low < candles[i-1].low && 
          candles[i].low < candles[i+1].low) {
        lows.push({
          price: candles[i].low,
          index: i,
          time: candles[i].time
        });
      }
    }
    
    return lows.sort((a, b) => a.price - b.price);
  }

  /**
   * Get recent swing highs/lows
   */
  getSwings(timeframe = '15m', lookback = 20) {
    const highs = this.getHighs(timeframe, lookback);
    const lows = this.getLows(timeframe, lookback);
    
    return {
      highs: highs.slice(0, 5),
      lows: lows.slice(0, 5)
    };
  }

  /**
   * Get Pivot Highs/Lows (significant)
   */
  getPivotPoints(timeframe = '1h', lookback = 50) {
    const candles = this.data.getRecentCandles(timeframe, lookback);
    
    const pivotHighs = [];
    const pivotLows = [];
    
    for (let i = 5; i < candles.length - 5; i++) {
      // Pivot High: highest of 5 left + 5 right
      let isPivotHigh = true;
      for (let j = i - 5; j <= i + 5; j++) {
        if (j !== i && candles[j].high >= candles[i].high) {
          isPivotHigh = false;
          break;
        }
      }
      if (isPivotHigh) {
        pivotHighs.push({
          price: candles[i].high,
          time: candles[i].time,
          strength: this.calculatePivotStrength(candles, i, 'high')
        });
      }
      
      // Pivot Low
      let isPivotLow = true;
      for (let j = i - 5; j <= i + 5; j++) {
        if (j !== i && candles[j].low <= candles[i].low) {
          isPivotLow = false;
          break;
        }
      }
      if (isPivotLow) {
        pivotLows.push({
          price: candles[i].low,
          time: candles[i].time,
          strength: this.calculatePivotStrength(candles, i, 'low')
        });
      }
    }
    
    return {
      highs: pivotHighs.sort((a, b) => b.price - a.price),
      lows: pivotLows.sort((a, b) => a.price - b.price)
    };
  }

  calculatePivotStrength(candles, index, type) {
    const range = 10;
    let totalVolume = 0;
    let avgVolume = 0;
    
    for (let i = Math.max(0, index - range); i <= Math.min(candles.length - 1, index + range); i++) {
      totalVolume += candles[i].volume || 1;
    }
    avgVolume = totalVolume / (range * 2 + 1);
    
    const currentVolume = candles[index].volume || 1;
    return currentVolume > avgVolume * 1.5 ? 'STRONG' : 'NORMAL';
  }

  // ============================================
  // DISPLACEMENT ANALYSIS
  // ============================================

  /**
   * Analyze displacement (strong momentum moves)
   */
  analyzeDisplacement(timeframe = '15m', lookback = 20) {
    const candles = this.data.getRecentCandles(timeframe, lookback);
    const displacements = [];
    
    for (let i = 3; i < candles.length; i++) {
      const group = candles.slice(i - 3, i);
      const displacement = this.calculateDisplacement(group);
      
      if (displacement.strong) {
        displacements.push({
          ...displacement,
          index: i,
          time: candles[i].time
        });
      }
    }
    
    return displacements;
  }

  calculateDisplacement(candles) {
    if (candles.length < 3) return { strong: false, type: null };
    
    const firstOpen = candles[0].open;
    const lastClose = candles[candles.length - 1].close;
    const totalRange = Math.abs(lastClose - firstOpen);
    
    // Calculate average candle size
    const avgSize = candles.reduce((sum, c) => 
      sum + Math.abs(c.close - c.open), 0) / candles.length;
    
    // Strong displacement: 2x average candle size
    const strong = totalRange > avgSize * 2;
    
    // Direction
    const type = lastClose > firstOpen ? 'BULLISH' : 'BEARISH';
    
    // Check for consecutive closes at extreme
    const closes = candles.map(c => c.close);
    const extreme = type === 'BULLISH' 
      ? Math.max(...closes)
      : Math.min(...closes);
    const atExtreme = closes[closes.length - 1] === extreme;
    
    return {
      strong: strong && atExtreme,
      type,
      range: totalRange,
      avgSize,
      ratio: avgSize > 0 ? totalRange / avgSize : 0
    };
  }

  /**
   * Detect Break of Structure (BoS)
   */
  detectBoS(timeframe = '15m') {
    const swings = this.getSwings(timeframe, 20);
    const currentPrice = this.data.getCurrentPrice();
    
    // Recent high broken = Bullish BoS
    const recentHigh = swings.highs[0];
    const bullishBoS = recentHigh && currentPrice > recentHigh.price;
    
    // Recent low broken = Bearish BoS
    const recentLow = swings.lows[0];
    const bearishBoS = recentLow && currentPrice < recentLow.price;
    
    return {
      bullish: bullishBoS ? { broken: recentHigh.price, current: currentPrice } : null,
      bearish: bearishBoS ? { broken: recentLow.price, current: currentPrice } : null
    };
  }

  /**
   * Detect Market Structure Shift (MSS)
   */
  detectMSS(timeframe = '1h') {
    const bos = this.detectBoS(timeframe);
    const lowerTfBos = this.detectBoS('15m');
    
    return {
      bullish: bos.bullish || lowerTfBos.bullish,
      bearish: bos.bearish || lowerTfBos.bearish,
      timeframe: `${timeframe}/15m`
    };
  }

  // ============================================
  // LIQUIDITY POOLS
  // ============================================

  /**
   * Find all liquidity pools ( highs, lows, equal levels )
   */
  findLiquidityPools(timeframe = '1h', lookback = 100) {
    const currentPrice = this.data.getCurrentPrice();
    const pivots = this.getPivotPoints(timeframe, lookback);
    
    // Previous Day High/Low
    const pdh = this.data.getPDH();
    const pdl = this.data.getPDL();
    
    // Session ranges
    const asianRange = this.data.getAsianRange();
    const londonRange = this.data.getSessionRange('London');
    const nyRange = this.data.getSessionRange('NY');
    
    const pools = [];
    
    // Add Pivot Highs (Sell Side Liquidity - SSL)
    for (const high of pivots.highs.slice(0, 5)) {
      pools.push({
        type: 'SSL',
        price: high.price,
        distance: Math.abs(currentPrice - high.price),
        distancePercent: (Math.abs(currentPrice - high.price) / currentPrice) * 100,
        source: `pivot_high_${high.strength.toLowerCase()}`,
        proximity: this.getProximity(currentPrice, high.price)
      });
    }
    
    // Add Pivot Lows (Buy Side Liquidity - BSL)
    for (const low of pivots.lows.slice(0, 5)) {
      pools.push({
        type: 'BSL',
        price: low.price,
        distance: Math.abs(currentPrice - low.price),
        distancePercent: (Math.abs(currentPrice - low.price) / currentPrice) * 100,
        source: `pivot_low_${low.strength.toLowerCase()}`,
        proximity: this.getProximity(currentPrice, low.price)
      });
    }
    
    // Previous Day High/Low
    if (pdh) {
      pools.push({
        type: 'SSL',
        price: pdh,
        distance: Math.abs(currentPrice - pdh),
        distancePercent: (Math.abs(currentPrice - pdh) / currentPrice) * 100,
        source: 'PDH',
        proximity: this.getProximity(currentPrice, pdh)
      });
    }
    
    if (pdl) {
      pools.push({
        type: 'BSL',
        price: pdl,
        distance: Math.abs(currentPrice - pdl),
        distancePercent: (Math.abs(currentPrice - pdl) / currentPrice) * 100,
        source: 'PDL',
        proximity: this.getProximity(currentPrice, pdl)
      });
    }
    
    // Asian Range High/Low
    if (asianRange) {
      pools.push({
        type: 'SSL',
        price: asianRange.high,
        distance: Math.abs(currentPrice - asianRange.high),
        distancePercent: (Math.abs(currentPrice - asianRange.high) / currentPrice) * 100,
        source: 'ASIAN_HIGH',
        proximity: this.getProximity(currentPrice, asianRange.high)
      });
      
      pools.push({
        type: 'BSL',
        price: asianRange.low,
        distance: Math.abs(currentPrice - asianRange.low),
        distancePercent: (Math.abs(currentPrice - asianRange.low) / currentPrice) * 100,
        source: 'ASIAN_LOW',
        proximity: this.getProximity(currentPrice, asianRange.low)
      });
    }
    
    // Equal Highs/Lows
    const equalHighs = this.data.getEqualHighs();
    const equalLows = this.data.getEqualLows();
    
    for (const level of equalHighs || []) {
      pools.push({
        type: 'SSL',
        price: level,
        distance: Math.abs(currentPrice - level),
        distancePercent: (Math.abs(currentPrice - level) / currentPrice) * 100,
        source: 'EQUAL_HIGH',
        proximity: this.getProximity(currentPrice, level)
      });
    }
    
    for (const level of equalLows || []) {
      pools.push({
        type: 'BSL',
        price: level,
        distance: Math.abs(currentPrice - level),
        distancePercent: (Math.abs(currentPrice - level) / currentPrice) * 100,
        source: 'EQUAL_LOW',
        proximity: this.getProximity(currentPrice, level)
      });
    }
    
    // Sort by proximity (closest first)
    return pools.sort((a, b) => a.distancePercent - b.distancePercent);
  }

  getProximity(current, target) {
    const distance = Math.abs(current - target) / current * 100;
    if (distance < 0.1) return 'WITHIN_ASK';
    if (distance < 0.5) return 'NEAR';
    if (distance < 1.0) return 'FAIR';
    return 'FAR';
  }

  /**
   * Detect liquidity sweep (when price hunts liquidity)
   */
  detectLiquiditySweep(timeframe = '15m') {
    const pools = this.findLiquidityPools(timeframe, 50);
    const currentPrice = this.data.getCurrentPrice();
    const candles = this.data.getRecentCandles(timeframe, 5);
    const lastCandle = candles[candles.length - 1];
    
    // Check for sweeps in last 5 candles
    const sweeps = [];
    
    for (const pool of pools.slice(0, 5)) {
      const threshold = 5; // 5 points tolerance
      
      // Check if price swept the liquidity
      const sweptUp = pool.type === 'SSL' && 
        lastCandle.high >= pool.price && 
        lastCandle.low < pool.price;
      
      const sweptDown = pool.type === 'BSL' && 
        lastCandle.low <= pool.price && 
        lastCandle.high > pool.price;
      
      if (sweptUp || sweptDown) {
        sweeps.push({
          type: pool.type,
          price: pool.price,
          source: pool.source,
          direction: sweptUp ? 'UP' : 'DOWN',
          time: lastCandle.time
        });
      }
    }
    
    return sweeps;
  }

  // ============================================
  // COMPREHENSIVE STRUCTURE ANALYSIS
  // ============================================

  /**
   * Full structure analysis
   */
  analyze(timeframe = '1h') {
    const currentPrice = this.data.getCurrentPrice();
    const swings = this.getSwings(timeframe, 20);
    const pivots = this.getPivotPoints(timeframe, 50);
    const displacements = this.analyzeDisplacement(timeframe, 20);
    const pools = this.findLiquidityPools(timeframe, 100);
    const sweeps = this.detectLiquiditySweep(timeframe);
    const bos = this.detectBoS(timeframe);
    const mss = this.detectMSS(timeframe);
    
    return {
      timestamp: new Date().toISOString(),
      currentPrice,
      timeframe,
      swings,
      pivots,
      displacements,
      liquidityPools: pools.slice(0, 10), // Top 10 closest
      sweeps,
      structure: { bos, mss },
      summary: {
        totalLiquidityPools: pools.length,
        nearestSSL: pools.find(p => p.type === 'SSL') || null,
        nearestBSL: pools.find(p => p.type === 'BSL') || null,
        lastDisplacement: displacements[0] || null,
        recentSweeps: sweeps.length
      }
    };
  }
}

// Export
module.exports = StructureEngine;

/**
 * Mock Data Provider for testing
 */
class MockStructureData {
  constructor() {
    this.price = 17500;
  }
  
  getCurrentPrice() { return this.price; }
  getPDH() { return 17520; }
  getPDL() { return 17480; }
  getAsianRange() { return { high: 17510, low: 17485 }; }
  getSessionRange(s) { return s === 'London' ? 25 : 15; }
  getEqualHighs() { return [17515, 17505]; }
  getEqualLows() { return [17482, 17490]; }
  
  getRecentCandles(timeframe, count) {
    const candles = [];
    let basePrice = 17480;
    
    for (let i = 0; i < count; i++) {
      const volatility = Math.random() * 10;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const open = basePrice;
      const close = basePrice + (direction * volatility);
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;
      
      candles.push({
        time: new Date(Date.now() - (count - i) * 60000).toISOString(),
        open, high, low, close,
        volume: 1000 + Math.random() * 500
      });
      
      basePrice = close;
    }
    
    this.price = basePrice;
    return candles;
  }
}

// Test
if (require.main === module) {
  console.log('🧪 Testing StructureEngine...\n');
  
  const mock = new MockStructureData();
  const engine = new StructureEngine(mock);
  
  const result = engine.analyze('1h');
  
  console.log('📊 Structure Analysis:');
  console.log(`Price: ${result.currentPrice}`);
  console.log(`Liquidity Pools: ${result.summary.totalLiquidityPools}`);
  console.log(`Recent Sweeps: ${result.summary.recentSweeps}`);
  console.log(`Last Displacement: ${result.summary.lastDisplacement?.type || 'None'}`);
  
  console.log('\n🔍 Nearest Liquidity:');
  console.log('SSL:', result.summary.nearestSSL?.price);
  console.log('BSL:', result.summary.nearestBSL?.price);
}
