/**
 * ═══════════════════════════════════════════════════════════════
 *  MODULE: ICT Concepts — مفاهيم Inner Circle Trader
 *  FVG, Order Blocks, Liquidity Sweeps, Killzones, Market Structure
 *  يُستخدم لتحليل بيانات الشموع من Tradovate أو TradingView
 * ═══════════════════════════════════════════════════════════════
 */

class ICTConcepts {

  // ─── Fair Value Gaps (FVG) ───
  // 3 شموع: فجوة بين high الشمعة 1 و low الشمعة 3
  static findFVGs(candles, type = "both") {
    const fvgs = [];
    for (let i = 2; i < candles.length; i++) {
      const c1 = candles[i - 2];
      const c2 = candles[i - 1];
      const c3 = candles[i];

      // Bullish FVG: gap up — c1.high < c3.low
      if ((type === "both" || type === "bullish") && c1.high < c3.low) {
        fvgs.push({
          type: "BULLISH_FVG",
          top: c3.low,
          bottom: c1.high,
          midpoint: (c3.low + c1.high) / 2,
          index: i,
          timestamp: c3.timestamp,
          filled: false,
        });
      }

      // Bearish FVG: gap down — c1.low > c3.high
      if ((type === "both" || type === "bearish") && c1.low > c3.high) {
        fvgs.push({
          type: "BEARISH_FVG",
          top: c1.low,
          bottom: c3.high,
          midpoint: (c1.low + c3.high) / 2,
          index: i,
          timestamp: c3.timestamp,
          filled: false,
        });
      }
    }
    return fvgs;
  }

  // ─── Check if FVG has been filled ───
  static checkFVGFill(fvg, candles) {
    for (const c of candles) {
      if (fvg.type === "BULLISH_FVG" && c.low <= fvg.bottom) {
        return { ...fvg, filled: true, fillCandle: c };
      }
      if (fvg.type === "BEARISH_FVG" && c.high >= fvg.top) {
        return { ...fvg, filled: true, fillCandle: c };
      }
    }
    return fvg;
  }

  // ─── Order Blocks (OB) ───
  // آخر شمعة معاكسة قبل الحركة الاندفاعية
  static findOrderBlocks(candles, minImpulsePoints = 10) {
    const obs = [];
    for (let i = 2; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      const bodyPrev = Math.abs(prev.close - prev.open);
      const bodyCurr = Math.abs(curr.close - curr.open);
      const move = Math.abs(curr.close - prev.open);

      // Bullish OB: شمعة هابطة تليها شمعة صاعدة قوية
      if (prev.close < prev.open && curr.close > curr.open && move >= minImpulsePoints) {
        obs.push({
          type: "BULLISH_OB",
          high: prev.high,
          low: prev.low,
          midpoint: (prev.high + prev.low) / 2,
          index: i - 1,
          timestamp: prev.timestamp,
          impulseSize: move,
          mitigated: false,
        });
      }

      // Bearish OB: شمعة صاعدة تليها شمعة هابطة قوية
      if (prev.close > prev.open && curr.close < curr.open && move >= minImpulsePoints) {
        obs.push({
          type: "BEARISH_OB",
          high: prev.high,
          low: prev.low,
          midpoint: (prev.high + prev.low) / 2,
          index: i - 1,
          timestamp: prev.timestamp,
          impulseSize: move,
          mitigated: false,
        });
      }
    }
    return obs;
  }

  // ─── Liquidity Levels ───
  // Equal Highs/Lows (مناطق تجمع السيولة)
  static findLiquidityLevels(candles, tolerance = 2) {
    const levels = { buyStops: [], sellStops: [] };
    const highs = candles.map((c, i) => ({ price: c.high, index: i, ts: c.timestamp }));
    const lows = candles.map((c, i) => ({ price: c.low, index: i, ts: c.timestamp }));

    // Equal Highs → Buy-side liquidity (stops above)
    for (let i = 1; i < highs.length; i++) {
      for (let j = 0; j < i; j++) {
        if (Math.abs(highs[i].price - highs[j].price) <= tolerance && i - j >= 3) {
          levels.buyStops.push({
            price: Math.max(highs[i].price, highs[j].price),
            type: "EQUAL_HIGHS",
            indices: [j, i],
          });
        }
      }
    }

    // Equal Lows → Sell-side liquidity (stops below)
    for (let i = 1; i < lows.length; i++) {
      for (let j = 0; j < i; j++) {
        if (Math.abs(lows[i].price - lows[j].price) <= tolerance && i - j >= 3) {
          levels.sellStops.push({
            price: Math.min(lows[i].price, lows[j].price),
            type: "EQUAL_LOWS",
            indices: [j, i],
          });
        }
      }
    }

    // Deduplicate (keep unique price levels)
    levels.buyStops = this._dedupLevels(levels.buyStops);
    levels.sellStops = this._dedupLevels(levels.sellStops);

    return levels;
  }

  // ─── Liquidity Sweep Detection ───
  static detectLiquiditySweep(candles, level, sweepType = "BUY_STOPS") {
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    if (sweepType === "BUY_STOPS") {
      // Price swept above level then closed below
      if (last.high > level.price && last.close < level.price) {
        return {
          swept: true,
          type: "BUYSIDE_SWEEP",
          level: level.price,
          sweepHigh: last.high,
          close: last.close,
          timestamp: last.timestamp,
          signal: "SHORT", // بعد سحب السيولة الشرائية → ابحث عن بيع
        };
      }
    }

    if (sweepType === "SELL_STOPS") {
      // Price swept below level then closed above
      if (last.low < level.price && last.close > level.price) {
        return {
          swept: true,
          type: "SELLSIDE_SWEEP",
          level: level.price,
          sweepLow: last.low,
          close: last.close,
          timestamp: last.timestamp,
          signal: "LONG", // بعد سحب السيولة البيعية → ابحث عن شراء
        };
      }
    }

    return { swept: false };
  }

  // ─── Market Structure Shift (MSS) / Break of Structure (BOS) ───
  static detectStructureShift(candles, lookback = 20) {
    const recent = candles.slice(-lookback);
    const swings = this._findSwingPoints(recent);

    if (swings.highs.length < 2 || swings.lows.length < 2) return { shift: false };

    const lastHH = swings.highs[swings.highs.length - 1];
    const prevHH = swings.highs[swings.highs.length - 2];
    const lastLL = swings.lows[swings.lows.length - 1];
    const prevLL = swings.lows[swings.lows.length - 2];
    const currentPrice = candles[candles.length - 1].close;

    // Bullish MSS: كسر آخر Higher High بعد تشكيل Higher Low
    if (lastLL.price > prevLL.price && currentPrice > lastHH.price) {
      return {
        shift: true,
        direction: "BULLISH",
        type: "MSS",
        breakLevel: lastHH.price,
        currentPrice,
        message_ar: "تحول هيكلي صاعد — كسر آخر High بعد Low أعلى",
      };
    }

    // Bearish MSS: كسر آخر Lower Low بعد تشكيل Lower High
    if (lastHH.price < prevHH.price && currentPrice < lastLL.price) {
      return {
        shift: true,
        direction: "BEARISH",
        type: "MSS",
        breakLevel: lastLL.price,
        currentPrice,
        message_ar: "تحول هيكلي هابط — كسر آخر Low بعد High أدنى",
      };
    }

    return { shift: false, structure: { lastHH, prevHH, lastLL, prevLL } };
  }

  // ─── ICT Killzones (EST) ───
  static getKillzones() {
    return {
      asian: { start: "20:00", end: "00:00", label: "Asian Session", label_ar: "الجلسة الآسيوية" },
      london: { start: "02:00", end: "05:00", label: "London Killzone", label_ar: "كيلزون لندن" },
      nyAM: { start: "09:30", end: "11:00", label: "NY AM Killzone", label_ar: "كيلزون نيويورك صباحاً" },
      nyLunch: { start: "12:00", end: "13:30", label: "NY Lunch (avoid)", label_ar: "غداء نيويورك (تجنب)" },
      nyPM: { start: "13:30", end: "16:00", label: "NY PM Session", label_ar: "جلسة نيويورك مساءً" },
    };
  }

  static getCurrentKillzone() {
    const now = new Date();
    const est = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const h = est.getHours();
    const m = est.getMinutes();
    const t = h * 60 + m;

    const zones = this.getKillzones();
    if (t >= 1200 || t < 0) return { zone: "asian", ...zones.asian, active: true };
    if (t >= 120 && t < 300) return { zone: "london", ...zones.london, active: true };
    if (t >= 570 && t < 660) return { zone: "nyAM", ...zones.nyAM, active: true };
    if (t >= 720 && t < 810) return { zone: "nyLunch", ...zones.nyLunch, active: false, avoid: true };
    if (t >= 810 && t < 960) return { zone: "nyPM", ...zones.nyPM, active: true };

    return { zone: "off", label: "Outside Killzones", label_ar: "خارج الكيلزون", active: false };
  }

  // ─── Optimal Trade Entry (OTE) ───
  // Fibonacci 62-79% retracement zone
  static calculateOTE(swingHigh, swingLow, direction = "LONG") {
    const range = swingHigh - swingLow;
    if (direction === "LONG") {
      return {
        direction: "LONG",
        oteZoneTop: swingHigh - range * 0.62,
        oteZoneBottom: swingHigh - range * 0.79,
        equilibrium: swingHigh - range * 0.5,
        swingHigh,
        swingLow,
        message_ar: `OTE شرائي: منطقة ${(swingHigh - range * 0.79).toFixed(2)} — ${(swingHigh - range * 0.62).toFixed(2)}`,
      };
    } else {
      return {
        direction: "SHORT",
        oteZoneTop: swingLow + range * 0.79,
        oteZoneBottom: swingLow + range * 0.62,
        equilibrium: swingLow + range * 0.5,
        swingHigh,
        swingLow,
        message_ar: `OTE بيعي: منطقة ${(swingLow + range * 0.62).toFixed(2)} — ${(swingLow + range * 0.79).toFixed(2)}`,
      };
    }
  }

  // ─── Full ICT Analysis ───
  static analyze(candles, config = {}) {
    const {
      fvgType = "both",
      obMinImpulse = 10,
      liqTolerance = 2,
      structureLookback = 20,
    } = config;

    return {
      timestamp: new Date().toISOString(),
      killzone: this.getCurrentKillzone(),
      fvgs: this.findFVGs(candles, fvgType),
      orderBlocks: this.findOrderBlocks(candles, obMinImpulse),
      liquidity: this.findLiquidityLevels(candles, liqTolerance),
      structure: this.detectStructureShift(candles, structureLookback),
      candleCount: candles.length,
    };
  }

  // ─── Generate ICT Trade Setup ───
  // يجمع المفاهيم في إشارة واحدة متكاملة
  static generateSetup(candles, bias = null) {
    const analysis = this.analyze(candles);
    const kz = analysis.killzone;
    const structure = analysis.structure;
    const fvgs = analysis.fvgs;
    const obs = analysis.orderBlocks;
    const lastPrice = candles[candles.length - 1].close;

    // لا تتداول خارج الكيلزون أو أثناء الغداء
    if (!kz.active || kz.avoid) {
      return {
        signal: "NO_TRADE",
        reason_ar: `خارج الكيلزون النشط (${kz.label_ar}). انتظر.`,
        analysis,
      };
    }

    // Determine bias from structure if not provided
    const tradeBias = bias || (structure.shift ? structure.direction : null);
    if (!tradeBias) {
      return {
        signal: "NO_TRADE",
        reason_ar: "لا يوجد تحول هيكلي واضح. لا تتداول بدون bias.",
        analysis,
      };
    }

    // Find matching FVG + OB confluence
    let entry = null;

    if (tradeBias === "BULLISH") {
      // Find unfilled bullish FVG below current price
      const activeFVG = fvgs
        .filter(f => f.type === "BULLISH_FVG" && !f.filled && f.top < lastPrice)
        .sort((a, b) => b.top - a.top)[0]; // Nearest to price

      const activeOB = obs
        .filter(o => o.type === "BULLISH_OB" && !o.mitigated && o.high < lastPrice)
        .sort((a, b) => b.high - a.high)[0];

      if (activeFVG) {
        entry = {
          signal: "LONG",
          entryZone: { top: activeFVG.top, bottom: activeFVG.bottom },
          entryPrice: activeFVG.midpoint,
          confluence: [],
        };
        entry.confluence.push("FVG");
        if (activeOB && Math.abs(activeOB.midpoint - activeFVG.midpoint) < 20) {
          entry.confluence.push("OB");
        }
      }
    }

    if (tradeBias === "BEARISH") {
      const activeFVG = fvgs
        .filter(f => f.type === "BEARISH_FVG" && !f.filled && f.bottom > lastPrice)
        .sort((a, b) => a.bottom - b.bottom)[0];

      const activeOB = obs
        .filter(o => o.type === "BEARISH_OB" && !o.mitigated && o.low > lastPrice)
        .sort((a, b) => a.low - b.low)[0];

      if (activeFVG) {
        entry = {
          signal: "SHORT",
          entryZone: { top: activeFVG.top, bottom: activeFVG.bottom },
          entryPrice: activeFVG.midpoint,
          confluence: [],
        };
        entry.confluence.push("FVG");
        if (activeOB && Math.abs(activeOB.midpoint - activeFVG.midpoint) < 20) {
          entry.confluence.push("OB");
        }
      }
    }

    if (!entry) {
      return {
        signal: "WAIT",
        bias: tradeBias,
        reason_ar: `الاتجاه ${tradeBias === "BULLISH" ? "صاعد" : "هابط"} لكن لا يوجد FVG/OB قريب. انتظر السعر.`,
        analysis,
      };
    }

    return {
      ...entry,
      bias: tradeBias,
      killzone: kz,
      confluenceCount: entry.confluence.length,
      quality: entry.confluence.length >= 2 ? "A+" : "B",
      message_ar: `${entry.signal} عند ${entry.entryPrice.toFixed(2)} | Confluence: ${entry.confluence.join(" + ")} | Killzone: ${kz.label_ar} | Quality: ${entry.confluence.length >= 2 ? "A+" : "B"}`,
      analysis,
    };
  }

  // ─── Helpers ───
  static _findSwingPoints(candles, leftBars = 3, rightBars = 3) {
    const highs = [];
    const lows = [];

    for (let i = leftBars; i < candles.length - rightBars; i++) {
      let isSwingHigh = true;
      let isSwingLow = true;

      for (let j = 1; j <= leftBars; j++) {
        if (candles[i].high <= candles[i - j].high) isSwingHigh = false;
        if (candles[i].low >= candles[i - j].low) isSwingLow = false;
      }
      for (let j = 1; j <= rightBars; j++) {
        if (candles[i].high <= candles[i + j].high) isSwingHigh = false;
        if (candles[i].low >= candles[i + j].low) isSwingLow = false;
      }

      if (isSwingHigh) highs.push({ price: candles[i].high, index: i, ts: candles[i].timestamp });
      if (isSwingLow) lows.push({ price: candles[i].low, index: i, ts: candles[i].timestamp });
    }

    return { highs, lows };
  }

  static _dedupLevels(levels, tolerance = 3) {
    const unique = [];
    for (const l of levels) {
      if (!unique.some(u => Math.abs(u.price - l.price) < tolerance)) {
        unique.push(l);
      }
    }
    return unique;
  }
}

module.exports = ICTConcepts;
