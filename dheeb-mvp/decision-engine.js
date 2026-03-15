/**
 * Dheeb MVP - Decision Engine v2
 * Integrated with Event Bus + RiskAgent
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:3002';
const RISK_AGENT_URL = process.env.RISK_AGENT_URL || 'http://localhost:3001';
const PORT = process.env.PORT || 3000;

const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

// Simple event bus client (shared state via files for MVP)
const eventBus = {
    publish(event, data) {
        const logFile = path.join(__dirname, 'event-log.json');
        let logs = [];
        if (fs.existsSync(logFile)) {
            try { logs = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch(e) {}
        }
        logs.push({ event, data, timestamp: new Date().toISOString() });
        if (logs.length > 100) logs = logs.slice(-100);
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
        console.log(`📡 [EventBus] Published: ${event}`);
    }
};

function isInKillZone() {
    const now = new Date();
    const hour = now.getUTCHours();
    
    // London: 8-11, NY: 14-21
    const inLondon = hour >= 8 && hour < 11;
    const inNY = hour >= 14 && hour < 21;
    
    return inLondon || inNY;
}

function makeDecision(signal) {
    const config = loadConfig();
    
    // Rule 1: Kill Zone
    if (!signal.killzone) {
        return {
            decision: 'WAIT',
            reason: 'Outside Kill Zone'
        };
    }
    
    // Rule 2: RRR
    const minRRR = config.risk.min_rrr;
    if ((signal.rr || 0) < minRRR) {
        return {
            decision: 'REJECT',
            reason: `RRR ${signal.rr} < ${minRRR}`
        };
    }
    
    // Rule 3: Setup quality
    if (signal.direction === 'NONE' || (signal.confidence || 0) < 0.7) {
        return {
            decision: 'WAIT',
            reason: 'Low confidence or no setup'
        };
    }
    
    // Calculate position (MNQ)
    const balance = config.risk.account_balance;
    const riskPercent = config.risk.max_risk_percent;
    const entry = signal.entry || 25000;
    const sl = signal.sl || entry * 0.99;
    const slDistNDX = Math.abs(entry - sl);
    const slDistMNQ = slDistNDX / 50;
    const riskAmount = balance * (riskPercent / 100);
    const contracts = Math.max(1, Math.min(5, Math.floor(riskAmount / (slDistMNQ * 2))));
    
    return {
        decision: 'ENTER',
        reason: 'All rules passed',
        setup: signal.setup_name,
        confidence: signal.confidence,
        position: {
            symbol: 'MNQ',
            contracts,
            riskAmount: contracts * slDistMNQ * 2,
            slDistanceNDX: slDistNDX.toFixed(0)
        }
    };
}

function sendToRiskAgent(signal, decision) {
    // For now, validate locally and emit event
    // In production, would call RiskAgent API
    
    const riskData = {
        signal,
        decision,
        timestamp: new Date().toISOString()
    };
    
    // Emit to event bus
    eventBus.publish('signal:new', riskData);
    
    // Local validation (simplified)
    const config = loadConfig();
    const minRRR = config.risk.min_rrr;
    const rrr = signal.rr || 0;
    
    if (rrr >= minRRR && decision.decision === 'ENTER') {
        eventBus.publish('risk:approved', { signal, decision });
        return { approved: true };
    } else {
        eventBus.publish('risk:rejected', { signal, decision, reason: 'RRR check' });
        return { approved: false };
    }
}

async function sendTelegram(message) {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8307993465:AAHAH8rU4mZf9cJXoHSdgY2IIUXnmwF3oQ8';
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '688493754';
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        console.log('📨 Telegram sent');
    } catch (e) {
        console.log('📨 Telegram error:', e.message);
    }
}

function formatMessage(signal, decision) {
    const emoji = decision.decision === 'ENTER' ? '✅' : decision.decision === 'WAIT' ? '⏸️' : '❌';
    
    let msg = `${emoji} ${signal.symbol || 'NDX'} ${signal.direction} @ ${signal.entry}\n`;
    
    if (decision.position) {
        msg += `📊 Contracts: ${decision.position.contracts} | Risk: $${decision.position.riskAmount}\n`;
    }
    
    msg += `RR: 1:${signal.rr || 'N/A'} | Conf: ${Math.round((signal.confidence || 0) * 100)}%\n`;
    msg += `⏰ Kill Zone: ${signal.killzone ? 'YES' : 'NO'}\n`;
    msg += `📋 ${decision.reason}`;
    
    return msg;
}

async function handleRequest(req, res) {
    if (req.method === 'POST' && req.url === '/decide') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const signal = JSON.parse(body);
                console.log(`\n📥 Received: ${JSON.stringify(signal).substring(0, 100)}`);
                
                // Make decision
                const decision = makeDecision(signal);
                console.log(`📤 Decision: ${decision.decision} - ${decision.reason}`);
                
                // Send to RiskAgent via EventBus
                const riskResult = sendToRiskAgent(signal, decision);
                
                // Override if risk rejected
                if (!riskResult.approved) {
                    decision.decision = 'REJECTED';
                    decision.reason = 'Risk check failed';
                }
                
                // Send telegram
                const message = formatMessage(signal, decision);
                await sendTelegram(message);
                
                // Publish final decision
                eventBus.publish('decision:final', { signal, decision });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(decision));
                
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'OK', 
            time: new Date().toISOString(),
            eventBus: 'active'
        }));
    } else if (req.method === 'GET' && req.url === '/logs') {
        const logFile = path.join(__dirname, 'event-log.json');
        let logs = [];
        if (fs.existsSync(logFile)) {
            try { logs = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch(e) {}
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(logs.slice(-20)));
    } else {
        res.writeHead(404);
        res.end();
    }
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
    console.log(`\n🚀 Decision Engine v2 running on port ${PORT}`);
    console.log(`📡 Event Bus: ${EVENT_BUS_URL}`);
    console.log(`🛡️ Risk Agent: ${RISK_AGENT_URL}`);
});

module.exports = { server, makeDecision, eventBus };
