/**
 * ═══════════════════════════════════════════════════════════════
 *  CONNECTOR: Tradovate API
 *  REST + WebSocket: Auth, Orders, Positions, Market Data
 *  Demo: demo.tradovateapi.com | Live: live.tradovateapi.com
 *  ⚠️ isAutomated: true مطلوب لكل أوامر CME
 * ═══════════════════════════════════════════════════════════════
 */

const https = require("https");
const WebSocket = require("ws");
const EventEmitter = require("events");

class TradovateConnector extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      name: config.name || "dheeb-tradovate",
      username: config.username,
      password: config.password,
      appId: config.appId || "Dheeb Trading Mind",
      appVersion: config.appVersion || "1.0",
      cid: config.cid,                     // Client ID
      sec: config.sec,                     // Secret
      deviceId: config.deviceId || "dheeb-device-001",
      isDemo: config.isDemo !== false,     // Default demo
    };

    this.baseUrl = this.config.isDemo
      ? "demo.tradovateapi.com"
      : "live.tradovateapi.com";
    this.mdUrl = this.config.isDemo
      ? "md-demo.tradovateapi.com"
      : "md.tradovateapi.com";

    this.token = null;
    this.tokenExpiry = null;
    this.accountId = null;
    this.accountSpec = null;
    this.ws = null;
    this.mdWs = null;
    this.connected = false;
    this.positions = new Map();
    this.orders = new Map();
  }

  // ═══════════════════════════════════════
  //  Authentication
  // ═══════════════════════════════════════

  async authenticate() {
    const body = {
      name: this.config.username,
      password: this.config.password,
      appId: this.config.appId,
      appVersion: this.config.appVersion,
      cid: this.config.cid,
      sec: this.config.sec,
      deviceId: this.config.deviceId,
    };

    const result = await this._post("/v1/auth/accesstokenrequest", body);

    if (result.accessToken) {
      this.token = result.accessToken;
      this.tokenExpiry = Date.now() + (result.expirationTime || 3600) * 1000;
      this.emit("authenticated", { demo: this.config.isDemo });
      console.log(`✅ Tradovate ${this.config.isDemo ? "DEMO" : "LIVE"} authenticated`);

      // Auto-renew before expiry
      this._scheduleRenewal();
      return true;
    }

    throw new Error(`Auth failed: ${JSON.stringify(result)}`);
  }

  async _renewToken() {
    try {
      const result = await this._post("/v1/auth/renewaccesstoken", {});
      if (result.accessToken) {
        this.token = result.accessToken;
        this.tokenExpiry = Date.now() + 3600000;
        this._scheduleRenewal();
      }
    } catch (e) {
      console.error("Token renewal failed, re-authenticating...");
      await this.authenticate();
    }
  }

  _scheduleRenewal() {
    if (this._renewTimer) clearTimeout(this._renewTimer);
    // Renew 5 minutes before expiry
    const delay = Math.max(0, (this.tokenExpiry - Date.now()) - 300000);
    this._renewTimer = setTimeout(() => this._renewToken(), delay);
  }

  // ═══════════════════════════════════════
  //  Account
  // ═══════════════════════════════════════

  async getAccounts() {
    const accounts = await this._get("/v1/account/list");
    if (accounts.length > 0) {
      this.accountId = accounts[0].id;
      this.accountSpec = accounts[0].name;
    }
    return accounts;
  }

  async getAccountBalance() {
    const balances = await this._get(`/v1/cashBalance/getCashBalanceSnapshot?accountId=${this.accountId}`);
    return balances;
  }

  // ═══════════════════════════════════════
  //  Contracts
  // ═══════════════════════════════════════

  async findContract(symbol) {
    // e.g., "NQH6" for NQ March 2026
    const result = await this._get(`/v1/contract/find?name=${symbol}`);
    return result;
  }

  async getContractSpec(contractId) {
    return await this._get(`/v1/contract/item?id=${contractId}`);
  }

  // ═══════════════════════════════════════
  //  Orders — Core Execution
  // ═══════════════════════════════════════

  /**
   * Market Order
   */
  async placeMarketOrder(symbol, action, qty) {
    const contract = await this.findContract(symbol);
    return await this._post("/v1/order/placeorder", {
      accountSpec: this.accountSpec,
      accountId: this.accountId,
      action: action,            // "Buy" | "Sell"
      symbol: symbol,
      orderQty: qty,
      orderType: "Market",
      timeInForce: "Day",
      isAutomated: true,         // CME requirement
    });
  }

  /**
   * Limit Order
   */
  async placeLimitOrder(symbol, action, qty, price) {
    return await this._post("/v1/order/placeorder", {
      accountSpec: this.accountSpec,
      accountId: this.accountId,
      action: action,
      symbol: symbol,
      orderQty: qty,
      orderType: "Limit",
      price: price,
      timeInForce: "Day",
      isAutomated: true,
    });
  }

  /**
   * Stop Order
   */
  async placeStopOrder(symbol, action, qty, stopPrice) {
    return await this._post("/v1/order/placeorder", {
      accountSpec: this.accountSpec,
      accountId: this.accountId,
      action: action,
      symbol: symbol,
      orderQty: qty,
      orderType: "Stop",
      stopPrice: stopPrice,
      timeInForce: "Day",
      isAutomated: true,
    });
  }

  /**
   * Bracket Order (Entry + TP + SL)
   * Uses startOrderStrategy for OCO bracket
   */
  async placeBracketOrder(symbol, action, qty, entryPrice, takeProfitPrice, stopLossPrice) {
    const exitAction = action === "Buy" ? "Sell" : "Buy";

    const params = {
      entryVersion: {
        orderQty: qty,
        orderType: entryPrice ? "Limit" : "Market",
        ...(entryPrice && { price: entryPrice }),
      },
      brackets: [{
        qty: qty,
        profitTarget: Math.abs(takeProfitPrice - (entryPrice || 0)),
        stopLoss: Math.abs((entryPrice || 0) - stopLossPrice),
        trailingStop: false,
      }],
    };

    return await this._post("/v1/orderStrategy/startorderstrategy", {
      accountSpec: this.accountSpec,
      accountId: this.accountId,
      action: action,
      symbol: symbol,
      orderStrategyTypeId: 2,   // Bracket
      params: JSON.stringify(params),
    });
  }

  /**
   * Cancel Order
   */
  async cancelOrder(orderId) {
    return await this._post("/v1/order/cancelorder", {
      orderId: orderId,
      isAutomated: true,
    });
  }

  /**
   * Modify Order
   */
  async modifyOrder(orderId, changes) {
    return await this._post("/v1/order/modifyorder", {
      orderId: orderId,
      ...changes,
      isAutomated: true,
    });
  }

  /**
   * Flatten/Close All (emergency)
   */
  async flattenPosition(symbol) {
    const positions = await this.getPositions();
    const pos = positions.find(p => p.contractId && p.netPos !== 0);
    if (!pos) return { message: "No open position" };

    const action = pos.netPos > 0 ? "Sell" : "Buy";
    const qty = Math.abs(pos.netPos);

    return await this.placeMarketOrder(symbol, action, qty);
  }

  // ═══════════════════════════════════════
  //  Positions
  // ═══════════════════════════════════════

  async getPositions() {
    return await this._get("/v1/position/list");
  }

  async getOrders() {
    return await this._get("/v1/order/list");
  }

  // ═══════════════════════════════════════
  //  WebSocket — Real-time Data
  // ═══════════════════════════════════════

  connectWebSocket() {
    const wsUrl = `wss://${this.baseUrl}/v1/websocket`;
    this.ws = new WebSocket(wsUrl);

    this.ws.on("open", () => {
      // Authorize the WebSocket
      this.ws.send(`authorize\n0\n\n${this.token}`);
      this.connected = true;
      this.emit("ws:connected");
      console.log("✅ Tradovate WebSocket connected");
    });

    this.ws.on("message", (data) => {
      this._handleWsMessage(data.toString());
    });

    this.ws.on("close", () => {
      this.connected = false;
      this.emit("ws:disconnected");
      console.log("⚠️ Tradovate WebSocket disconnected");
      // Auto-reconnect after 5s
      setTimeout(() => this.connectWebSocket(), 5000);
    });

    this.ws.on("error", (err) => {
      console.error("WS Error:", err.message);
    });
  }

  /**
   * Subscribe to user sync (positions, orders, fills)
   */
  subscribeUserSync() {
    if (!this.ws || !this.connected) return;
    const id = this._nextId();
    this.ws.send(`user/syncrequest\n${id}\n\n{"users":[${this.accountId}]}`);
  }

  /**
   * Connect Market Data WebSocket
   */
  connectMarketData() {
    const mdWsUrl = `wss://${this.mdUrl}/v1/websocket`;
    this.mdWs = new WebSocket(mdWsUrl);

    this.mdWs.on("open", () => {
      this.mdWs.send(`authorize\n0\n\n${this.token}`);
      this.emit("md:connected");
      console.log("✅ Market Data WebSocket connected");
    });

    this.mdWs.on("message", (data) => {
      this._handleMdMessage(data.toString());
    });

    this.mdWs.on("close", () => {
      this.emit("md:disconnected");
      setTimeout(() => this.connectMarketData(), 5000);
    });
  }

  /**
   * Subscribe to real-time quotes
   */
  subscribeQuote(symbol) {
    if (!this.mdWs) return;
    const id = this._nextId();
    this.mdWs.send(`md/subscribequote\n${id}\n\n{"symbol":"${symbol}"}`);
  }

  /**
   * Subscribe to chart data (candles)
   */
  subscribeChart(symbol, timeframe = { value: 5, unit: "MinuteBar" }) {
    if (!this.mdWs) return;
    const id = this._nextId();
    this.mdWs.send(`md/getchart\n${id}\n\n${JSON.stringify({
      symbol,
      chartDescription: {
        underlyingType: "MinuteBar",
        elementSize: timeframe.value,
        elementSizeUnit: timeframe.unit,
        withHistogram: false,
      },
      timeRange: {
        asFarAsTimestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        closestTimestamp: new Date().toISOString(),
      },
    })}`);
  }

  // ═══════════════════════════════════════
  //  Internal WS Message Handlers
  // ═══════════════════════════════════════

  _handleWsMessage(raw) {
    try {
      // Tradovate frames: "o\n" for heartbeat, "a[...]" for data
      if (raw.startsWith("o")) return;
      if (raw === "h") { this.ws.send("[]"); return; } // heartbeat

      const parsed = JSON.parse(raw.replace(/^a/, ""));
      if (Array.isArray(parsed)) {
        for (const msg of parsed) {
          const inner = typeof msg === "string" ? JSON.parse(msg) : msg;
          if (inner.e === "props") this._handleProps(inner.d);
        }
      }
    } catch (e) { /* non-JSON frame */ }
  }

  _handleMdMessage(raw) {
    try {
      if (raw.startsWith("o") || raw === "h") return;

      // Parse chart/quote data
      const lines = raw.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.charts || parsed.d?.charts) {
            this.emit("chart:data", parsed.charts || parsed.d.charts);
          }
          if (parsed.quotes || parsed.d?.quotes) {
            this.emit("quote:data", parsed.quotes || parsed.d.quotes);
          }
        } catch { /* partial */ }
      }
    } catch (e) { /* ignore */ }
  }

  _handleProps(data) {
    if (!data) return;

    // Position updates
    if (data.positions) {
      for (const pos of data.positions) {
        this.positions.set(pos.id, pos);
        this.emit("position:update", pos);
      }
    }

    // Order updates
    if (data.orders) {
      for (const order of data.orders) {
        this.orders.set(order.id, order);
        this.emit("order:update", order);
      }
    }

    // Fill events
    if (data.fills) {
      for (const fill of data.fills) {
        this.emit("fill", fill);
      }
    }
  }

  // ═══════════════════════════════════════
  //  HTTP Helpers
  // ═══════════════════════════════════════

  _post(path, body) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...(this.token && { "Authorization": `Bearer ${this.token}` }),
        },
      };

      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { resolve(body); }
        });
      });

      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }

  _get(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: path,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(this.token && { "Authorization": `Bearer ${this.token}` }),
        },
      };

      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { resolve(body); }
        });
      });

      req.on("error", reject);
      req.end();
    });
  }

  _nextId() {
    if (!this._idCounter) this._idCounter = 0;
    return ++this._idCounter;
  }

  // ═══════════════════════════════════════
  //  Cleanup
  // ═══════════════════════════════════════

  disconnect() {
    if (this._renewTimer) clearTimeout(this._renewTimer);
    if (this.ws) this.ws.close();
    if (this.mdWs) this.mdWs.close();
    this.connected = false;
    console.log("🔌 Tradovate disconnected");
  }
}

module.exports = TradovateConnector;
