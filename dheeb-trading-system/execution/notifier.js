/**
 * ═══════════════════════════════════════════════════════════════
 *  🐺 NOTIFIER — إشعارات Telegram + Console Log
 * ═══════════════════════════════════════════════════════════════
 */

const https = require("https");

class Notifier {
  constructor(config = {}) {
    this.telegramToken = config.telegramToken || process.env.TELEGRAM_BOT_TOKEN || "";
    this.telegramChatId = config.telegramChatId || process.env.TELEGRAM_CHAT_ID || "";
    this.enabled = !!(this.telegramToken && this.telegramChatId);
  }

  async send(message, level = "info") {
    const prefix = {
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
      trade: "💰",
      risk: "🛑",
      success: "✅",
    }[level] || "📨";

    const fullMsg = `${prefix} 🐺 Dheeb\n${message}`;
    console.log(`[${level.toUpperCase()}] ${message}`);

    if (this.enabled) {
      try {
        await this._sendTelegram(fullMsg);
      } catch (err) {
        console.error("Telegram send failed:", err.message);
      }
    }
  }

  async tradeAlert(signal, result) {
    const msg = [
      `📊 ${result.success ? "EXECUTED" : "FAILED"}`,
      `${signal.action} ${signal.symbol} x${signal.qty}`,
      `Price: ${signal.price} | Stop: ${signal.stop} | Target: ${signal.target}`,
      `Risk: $${signal.riskDollars || "N/A"}`,
      result.orderId ? `Order: ${result.orderId}` : "",
      result.error ? `Error: ${result.error}` : "",
    ].filter(Boolean).join("\n");

    await this.send(msg, result.success ? "trade" : "error");
  }

  async riskAlert(message) {
    await this.send(message, "risk");
  }

  async dailySummary(status) {
    const emoji = status.todayPnL >= 0 ? "🟢" : "🔴";
    const msg = [
      `📋 Daily Summary`,
      `${emoji} P&L: $${status.todayPnL.toFixed(0)}`,
      `Trades: ${status.todayTrades}`,
      `Balance: $${status.balance.toFixed(0)}`,
      `Drawdown: ${status.drawdownPercent}%`,
    ].join("\n");

    await this.send(msg, "info");
  }

  _sendTelegram(text) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        chat_id: this.telegramChatId,
        text: text,
        parse_mode: "HTML",
      });

      const req = https.request({
        hostname: "api.telegram.org",
        path: `/bot${this.telegramToken}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }, (res) => {
        let body = "";
        res.on("data", (c) => body += c);
        res.on("end", () => resolve(body));
      });

      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }
}

module.exports = Notifier;
