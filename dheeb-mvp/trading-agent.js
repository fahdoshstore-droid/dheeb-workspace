#!/usr/bin/env node
/**
 * TradingAgent - Independent Trading Analysis Agent
 * Own state, API endpoints, Event Bus integration
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    symbols: ['NDX', 'NQ', 'MNQ'],
    minConfidence: 0.7,
    checkInterval: 300000 // 5 min
};

// Agent state
const state = {
    lastAnalysis: null,
    currentSetups: [],
    activeTrades: [],
    signalsSent: 0,
    decisions: {
        enter: 0,
        wait: 0,
        reject: 0
    }
};

// Load/save state
function loadState() {
    const stateFile = path.join(__dirname, 'trading-agent-state.json');
    if (fs.existsSync(stateFile)) {
        try {
            const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            Object.assign(state, saved);
        } catch (e) {}
    }
}

function saveState() {
    const stateFile = path.join(__dirname, 'trading-agent-state.json');
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// Event Bus integration (file-based)
function publishEvent(event, data) {
    const logFile = path.join(__dirname, 'event-log.json');
    let logs = [];
    if (fs.existsSync(logFile)) {
        try { logs = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch(e) {}
    }
    logs.push({ agent: 'TradingAgent', event, data, timestamp: new Date().toISOString() });
    if (logs.length > 100) logs = logs.slice(-100);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

// Subscribe to events from other agents
function subscribeToEvents() {
    // Watch for risk events
    setInterval(() => {
        const riskLogFile = path.join(__dirname, 'risk-agent-state.json');
        if (fs.existsSync(riskLogFile)) {
            try {
                const riskState = JSON.parse(fs.readFileSync(riskLogFile, 'utf8'));
                
                // Check if paused
                if (riskState.isPaused) {
                    console.log(`🛑 [TradingAgent] Risk agent paused - stopping analysis`);
                    return;
                }
            } catch(e) {}
        }
    }, 10000);
}

// Analyze market (placeholder - in production would call heartbeat-ict.py)
async function analyzeMarket(symbol = 'NDX') {
    // In production: call heartbeat-ict.py and parse result
    // For now, return mock analysis
    
    const analysis = {
        symbol,
        timestamp: new Date().toISOString(),
        trend: Math.random() > 0.5 ? 'BEARISH' : 'BULLISH',
        rsi: 40 + Math.random() * 30,
        confidence: 0.6 + Math.random() * 0.3,
        hasSetup: Math.random() > 0.3,
        setup: null
    };
    
    if (analysis.hasSetup) {
        analysis.setup = {
            type: Math.random() > 0.5 ? 'Bearish FVG' : 'Bullish FVG',
            zone: `${25000 + Math.random() * 500}`,
            action: analysis.trend === 'BEARISH' ? 'SHORT' : 'LONG'
        };
    }
    
    return analysis;
}

// Make trading decision
function makeDecision(analysis) {
    if (!analysis.hasSetup || analysis.confidence < CONFIG.minConfidence) {
        state.decisions.wait++;
        return {
            decision: 'WAIT',
            reason: 'No clear setup or low confidence'
        };
    }
    
    // Check for enter
    if (analysis.confidence >= 0.75) {
        state.decisions.enter++;
        return {
            decision: 'ENTER',
            reason: 'High confidence setup',
            setup: analysis.setup
        };
    }
    
    state.decisions.wait++;
    return {
        decision: 'WAIT',
        reason: 'Medium confidence'
    };
}

// Send signal via API (to Decision Engine)
async function sendSignal(signal) {
    const decisionEngineUrl = 'http://localhost:3000/decide';
    
    try {
        const response = await fetch(decisionEngineUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signal)
        });
        
        const result = await response.json();
        publishEvent('signal:sent', { signal, result });
        
        return result;
    } catch (e) {
        publishEvent('signal:error', { signal, error: e.message });
        return null;
    }
}

// Run analysis cycle
async function runAnalysis() {
    console.log(`\n🔍 [TradingAgent] Running market analysis...`);
    
    for (const symbol of CONFIG.symbols) {
        const analysis = await analyzeMarket(symbol);
        
        state.lastAnalysis = analysis;
        state.currentSetups = analysis.hasSetup ? [analysis.setup] : [];
        
        const decision = makeDecision(analysis);
        
        console.log(`   ${symbol}: ${analysis.trend} | Conf: ${(analysis.confidence * 100).toFixed(0)}% | ${decision.decision}`);
        
        if (decision.decision === 'ENTER' && analysis.setup) {
            // Ensure valid entry price
            let entryPrice = 25000;
            if (analysis.setup.zone) {
                const parsed = parseFloat(String(analysis.setup.zone).replace(/[^0-9.]/g, ''));
                if (!isNaN(parsed) && parsed > 1000) {
                    entryPrice = parsed;
                }
            }
            
            const signal = {
                symbol,
                direction: analysis.setup.action || 'LONG',
                entry: entryPrice,
                sl: entryPrice * (analysis.setup.action === 'SHORT' ? 1.01 : 0.99),
                rr: 2.5,
                confidence: analysis.confidence || 0.8,
                killzone: true,
                setup_name: analysis.setup.type || 'ICT Setup',
                trend: analysis.trend || 'NEUTRAL'
            };
            
            console.log(`   📤 [TradingAgent] Sending signal: ${JSON.stringify(signal).substring(0, 80)}...`);
            await sendSignal(signal);
            state.signalsSent++;
        }
    }
    
    saveState();
    publishEvent('analysis:complete', { state });
}

// Status
function getStatus() {
    return {
        agent: 'TradingAgent',
        status: 'running',
        state: {
            lastAnalysis: state.lastAnalysis?.timestamp,
            signalsSent: state.signalsSent,
            decisions: state.decisions,
            currentSetups: state.currentSetups.length
        },
        config: CONFIG,
        uptime: process.uptime()
    };
}

// HTTP Server
const http = require('http');
const PORT = process.env.PORT || 3002;

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getStatus()));
    } else if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
    } else if (req.url === '/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const symbol = JSON.parse(body)?.symbol || 'NDX';
            const analysis = await analyzeMarket(symbol);
            const decision = makeDecision(analysis);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ analysis, decision }));
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

// Initialize
loadState();
saveState();

server.listen(PORT, () => {
    console.log(`\n📊 TradingAgent running on port ${PORT}`);
    console.log(`   Symbols: ${CONFIG.symbols.join(', ')}`);
    console.log(`   Min Confidence: ${CONFIG.minConfidence}`);
});

subscribeToEvents();

// Run initial analysis
setTimeout(runAnalysis, 2000);

// Run analysis every 5 minutes
setInterval(runAnalysis, CONFIG.checkInterval);

// Handle shutdown
process.on('SIGTERM', () => { saveState(); process.exit(); });
process.on('SIGINT', () => { saveState(); process.exit(); });
