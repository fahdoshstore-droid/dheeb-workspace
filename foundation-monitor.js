#!/usr/bin/env node
/**
 * 🏗️ FOUNDATION: Price API + Health Monitor
 * Stable, resilient, auto-reconnecting
 */

const CONFIG = {
    endpoints: [
        { name: 'Binance', url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', fallback: null },
        { name: 'Binance Futures', url: 'https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT', fallback: null },
        { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', fallback: null }
    ],
    checkInterval: 5000, // 5 seconds
    maxFailures: 3,
    reconnectDelay: 10000
};

let currentEndpoint = 0;
let failures = 0;
let lastPrice = null;
let connected = false;

function log(msg, type = 'INFO') {
    const time = new Date().toISOString();
    console.log(`[${time}] ${type} ${msg}`);
}

async function fetchPrice(endpoint) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(endpoint.url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        // Parse price based on endpoint
        if (endpoint.name === 'Binance') {
            return parseFloat(data.price);
        } else if (endpoint.name === 'Binance Futures') {
            return parseFloat(data.price);
        } else if (endpoint.name === 'CoinGecko') {
            return data.bitcoin.usd;
        }
        
        return null;
    } catch (e) {
        log(`Fetch error: ${e.message}`, 'ERROR');
        return null;
    }
}

async function healthCheck() {
    const endpoint = CONFIG.endpoints[currentEndpoint];
    log(`Checking ${endpoint.name}...`);
    
    const price = await fetchPrice(endpoint);
    
    if (price !== null) {
        if (!connected) {
            log(`✅ Connected to ${endpoint.name}`, 'SUCCESS');
            connected = true;
        }
        
        failures = 0;
        lastPrice = price;
        
        return { 
            status: 'HEALTHY', 
            price, 
            endpoint: endpoint.name,
            latency: 'OK'
        };
    } else {
        failures++;
        log(`Failure ${failures}/${CONFIG.maxFailures} from ${endpoint.name}`, 'WARN');
        
        if (failures >= CONFIG.maxFailures) {
            log(`⚠️ Switching endpoint...`, 'ERROR');
            currentEndpoint = (currentEndpoint + 1) % CONFIG.endpoints.length;
            failures = 0;
            connected = false;
        }
        
        return { 
            status: 'DEGRADED', 
            price: lastPrice,
            endpoint: endpoint.name,
            failures
        };
    }
}

async function monitor() {
    log('🏗️ Foundation Monitor Started');
    
    setInterval(async () => {
        const health = await healthCheck();
        
        if (health.status === 'DEGRADED' && failures >= CONFIG.maxFailures) {
            log(`🚨 ALERT: Price API degraded`, 'CRITICAL');
            // TODO: Send alert
        }
        
        // Log status
        const status = health.status === 'HEALTHY' ? '✅' : '⚠️';
        log(`${status} ${health.endpoint}: $${health.price || 'N/A'}`);
        
    }, CONFIG.checkInterval);
}

monitor();
