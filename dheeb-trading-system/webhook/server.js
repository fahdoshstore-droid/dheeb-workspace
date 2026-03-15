/**
 * ═══════════════════════════════════════════════════════════════
 *  🐺 WEBHOOK SERVER — TradingView → Dheeb Execution
 *  يستقبل alerts من TradingView ويحولها لأوامر تنفيذ
 *
 *  TradingView Alert Message Format (JSON):
 *  {
 *    "secret": "your_webhook_secret",
 *    "action": "buy" | "sell" | "close",
 *    "symbol": "NQH6",
 *    "qty": 1,
 *    "price": {{close}},
 *    "stop": 21480,
 *    "target": 21540,
 *    "strategy": "ICT_FVG",
 *    "timeframe": "5m",
 *    "comment": "Bullish FVG + OB confluence"
 *  }
 * ═══════════════════════════════════════════════════════════════
 */

const http = require("http");
const EventEmitter = require("events");

class WebhookServer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.port = config.port || parseInt(process.env.WEBHOOK_PORT) || 3003;
    this.secret = config.secret || process.env.WEBHOOK_SECRET || "";
    this.server = null;
    this.stats = {
      received: 0,
      accepted: 0,
      rejected: 0,
      lastSignal: null,
    };
  }

  start() {
    this.server = http.createServer((req, res) => {
      // ─── Health Check ───
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "ok",
          uptime: process.uptime(),
          stats: this.stats,
        }));
        return;
      }

      // ─── Stats ───
      if (req.method === "GET" && req.url === "/stats") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(this.stats, null, 2));
        return;
      }

      // ─── Webhook Endpoint ───
      if (req.method === "POST" && (req.url === "/webhook" || req.url === "/tv" || req.url === "/")) {
        let body = "";
        req.on("data", (chunk) => body += chunk);
        req.on("end", () => {
          this.stats.received++;
          try {
            const signal = this._parseSignal(body);

            // Validate secret
            if (this.secret && signal.secret !== this.secret) {
              this.stats.rejected++;
              console.log(`🛑 Webhook rejected: bad secret from ${req.socket.remoteAddress}`);
              res.writeHead(403);
              res.end("Forbidden");
              return;
            }

            // Validate required fields
            const validation = this._validateSignal(signal);
            if (!validation.valid) {
              this.stats.rejected++;
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: validation.errors }));
              return;
            }

            // Normalize and emit
            const normalized = this._normalizeSignal(signal);
            this.stats.accepted++;
            this.stats.lastSignal = normalized;

            console.log(`✅ Signal: ${normalized.action} ${normalized.symbol} x${normalized.qty} @ ${normalized.price}`);
            this.emit("signal", normalized);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "received", id: normalized.id }));

          } catch (err) {
            this.stats.rejected++;
            console.error("❌ Parse error:", err.message);
            res.writeHead(400);
            res.end("Invalid payload");
          }
        });
        return;
      }

      // 404
      res.writeHead(404);
      res.end("Not found");
    });

    this.server.listen(this.port, () => {
      console.log(`\n🌐 Webhook server listening on port ${this.port}`);
      console.log(`   POST /webhook  — TradingView alerts`);
      console.log(`   GET  /health   — Health check`);
      console.log(`   GET  /stats    — Signal stats\n`);
    });

    return this;
  }

  stop() {
    if (this.server) this.server.close();
  }

  // ─── Parse incoming body ───
  _parseSignal(raw) {
    const trimmed = raw.trim();

    // Try JSON first
    if (trimmed.startsWith("{")) {
      return JSON.parse(trimmed);
    }

    // Plain text format: "action symbol qty price stop target"
    // e.g., "buy NQH6 1 21500 21480 21540"
    const parts = trimmed.split(/[\s,|]+/);
    return {
      action: parts[0],
      symbol: parts[1],
      qty: parseInt(parts[2]) || 1,
      price: parseFloat(parts[3]) || 0,
      stop: parseFloat(parts[4]) || 0,
      target: parseFloat(parts[5]) || 0,
    };
  }

  // ─── Validate required fields ───
  _validateSignal(signal) {
    const errors = [];

    if (!signal.action) errors.push("missing: action");
    if (!["buy", "sell", "close", "flatten", "long", "short"].includes(
      (signal.action || "").toLowerCase()
    )) {
      errors.push(`invalid action: ${signal.action}`);
    }

    if (signal.action?.toLowerCase() !== "close" && signal.action?.toLowerCase() !== "flatten") {
      if (!signal.symbol) errors.push("missing: symbol");
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── Normalize to standard format ───
  _normalizeSignal(signal) {
    const actionMap = {
      buy: "BUY", long: "BUY",
      sell: "SELL", short: "SELL",
      close: "CLOSE", flatten: "CLOSE",
    };

    return {
      id: `tv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      source: "tradingview",
      action: actionMap[(signal.action || "").toLowerCase()] || signal.action,
      symbol: (signal.symbol || "").toUpperCase(),
      qty: parseInt(signal.qty) || 1,
      price: parseFloat(signal.price) || 0,
      stop: parseFloat(signal.stop) || 0,
      target: parseFloat(signal.target) || 0,
      strategy: signal.strategy || "MANUAL",
      timeframe: signal.timeframe || "",
      comment: signal.comment || "",
      raw: signal,
    };
  }
}

// ─── Pine Script Template Generator ───
// يولّد كود Pine Script جاهز للصق في TradingView
function generatePineScript(config = {}) {
  const {
    webhookUrl = "http://YOUR_SERVER:3000/webhook",
    secret = "your_secret",
    symbol = "NQH6",
  } = config;

  return `
//@version=6
strategy("🐺 Dheeb ICT Strategy", overlay=true, default_qty_type=strategy.fixed, default_qty_value=1)

// ═══ ICT Killzone Times (EST) ═══
nyAM_start = timestamp("America/New_York", year, month, dayofmonth, 9, 30)
nyAM_end   = timestamp("America/New_York", year, month, dayofmonth, 11, 0)
inKillzone = (time >= nyAM_start and time <= nyAM_end)

// ═══ Fair Value Gap Detection ═══
bullFVG = low[0] > high[2]
bearFVG = high[0] < low[2]

// ═══ Structure Shift ═══
swingHigh = ta.pivothigh(high, 3, 3)
swingLow  = ta.pivotlow(low, 3, 3)

// ═══ VWAP ═══
vwapVal = ta.vwap(close)
aboveVWAP = close > vwapVal
belowVWAP = close < vwapVal

// ═══ Order Block (simplified) ═══
bullOB = close[1] < open[1] and close > open and (close - open[1]) > 10
bearOB = close[1] > open[1] and close < open and (open[1] - close) > 10

// ═══ Entry Conditions ═══
longCondition  = inKillzone and bullFVG and aboveVWAP
shortCondition = inKillzone and bearFVG and belowVWAP

// ═══ Entry with Alert Messages ═══
if longCondition
    strategy.entry("Long", strategy.long,
      alert_message='{"secret":"${secret}","action":"buy","symbol":"${symbol}","qty":1,"price":' + str.tostring(close) + ',"stop":' + str.tostring(low - 5) + ',"target":' + str.tostring(close + 30) + ',"strategy":"ICT_FVG","timeframe":"5m","comment":"Bullish FVG + VWAP"}')

if shortCondition
    strategy.entry("Short", strategy.short,
      alert_message='{"secret":"${secret}","action":"sell","symbol":"${symbol}","qty":1,"price":' + str.tostring(close) + ',"stop":' + str.tostring(high + 5) + ',"target":' + str.tostring(close - 30) + ',"strategy":"ICT_FVG","timeframe":"5m","comment":"Bearish FVG + VWAP"}')

// ═══ Exit ═══
if strategy.position_size > 0 and (close < vwapVal or not inKillzone)
    strategy.close("Long",
      alert_message='{"secret":"${secret}","action":"close","symbol":"${symbol}","comment":"Exit Long"}')

if strategy.position_size < 0 and (close > vwapVal or not inKillzone)
    strategy.close("Short",
      alert_message='{"secret":"${secret}","action":"close","symbol":"${symbol}","comment":"Exit Short"}')

// ═══ Visuals ═══
plot(vwapVal, "VWAP", color=color.orange, linewidth=2)
bgcolor(inKillzone ? color.new(color.green, 90) : na)
plotshape(bullFVG, "Bull FVG", shape.triangleup, location.belowbar, color.green, size=size.tiny)
plotshape(bearFVG, "Bear FVG", shape.triangledown, location.abovebar, color.red, size=size.tiny)
`;
}

module.exports = { WebhookServer, generatePineScript };
