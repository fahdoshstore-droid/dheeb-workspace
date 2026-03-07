#!/usr/bin/env node
/**
 * RiskAgent - Independent Risk Management Agent
 * Runs as separate process with own state
 */

const EventBus = require('./event-bus');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    maxRiskPercent: 1.0,
    maxDailyLoss: 600,
    maxTradesPerDay: 2,
    minRRR: 2.0,
    accountBalance: 50000
};

// Agent state
const state = {
    tradesToday: 0,
    dailyLoss: 0,
    consecutiveLosses: 0,
    lastTradeTime: null,
    isPaused: false,
    pauseUntil: null
};

// Load state from file
function loadState() {
    const stateFile = path.join(__dirname, 'risk-agent-state.json');
    if (fs.existsSync(stateFile)) {
        try {
            const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            // Reset if new day
            const today = new Date().toDateString();
            if (saved.date !== today) {
                state.tradesToday = 0;
                state.dailyLoss = 0;
                state.consecutiveLosses = 0;
            } else {
                Object.assign(state, saved);
            }
        } catch (e) {
            console.log('Could not load state:', e.message);
        }
    }
}

// Save state to file
function saveState() {
    const stateFile = path.join(__dirname, 'risk-agent-state.json');
    fs.writeFileSync(stateFile, JSON.stringify({
        ...state,
        date: new Date().toDateString()
    }, null, 2));
}

// Validate trade against risk rules
function validateTrade(signal) {
    // Check pause
    if (state.isPaused && state.pauseUntil && new Date() < state.pauseUntil) {
        return {
            approved: false,
            reason: `Agent paused until ${state.pauseUntil.toISOString()}`
        };
    }

    // Check daily loss limit
    if (state.dailyLoss >= CONFIG.maxDailyLoss) {
        return {
            approved: false,
            reason: `Daily loss limit reached: $${state.dailyLoss}`
        };
    }

    // Check max trades
    if (state.tradesToday >= CONFIG.maxTradesPerDay) {
        return {
            approved: false,
            reason: `Max trades today: ${state.tradesToday}`
        };
    }

    // Check RRR
    const rrr = signal.rr || 0;
    if (rrr < CONFIG.minRRR) {
        return {
            approved: false,
            reason: `RRR ${rrr} < ${CONFIG.minRRR}`
        };
    }

    // Check risk amount
    const riskAmount = signal.riskAmount || 500;
    const riskPercent = (riskAmount / CONFIG.accountBalance) * 100;
    if (riskPercent > CONFIG.maxRiskPercent) {
        return {
            approved: false,
            reason: `Risk ${riskPercent.toFixed(2)}% > ${CONFIG.maxRiskPercent}%`
        };
    }

    // All checks passed
    return {
        approved: true,
        reason: 'All risk rules passed',
        state: {
            tradesToday: state.tradesToday + 1,
            newDailyLoss: state.dailyLoss
        }
    };
}

// Record trade result
function recordTrade(result) {
    if (result === 'win') {
        state.consecutiveLosses = 0;
    } else if (result === 'loss') {
        state.consecutiveLosses++;
        state.dailyLoss += Math.abs(result.pnl || 0);
        
        // Pause after 3 consecutive losses
        if (state.consecutiveLosses >= 3) {
            state.isPaused = true;
            state.pauseUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
            console.log(`🛑 Paused for 30 minutes due to 3 consecutive losses`);
        }
    }
    
    state.tradesToday++;
    state.lastTradeTime = new Date();
    saveState();
}

// Event handlers
EventBus.subscribe('RiskAgent', [
    'signal:new',
    'trade:result',
    'risk:check',
    'risk:reset'
]);

// Handle new signal
EventBus.on('signal:new', async (signal) => {
    console.log(`\n📥 [RiskAgent] Received signal: ${signal.direction} @ ${signal.entry}`);
    
    const validation = validateTrade(signal);
    
    if (validation.approved) {
        console.log(`✅ [RiskAgent] APPROVED: ${validation.reason}`);
        
        EventBus.publish('risk:approved', {
            signal,
            validation,
            timestamp: new Date().toISOString()
        });
    } else {
        console.log(`❌ [RiskAgent] REJECTED: ${validation.reason}`);
        
        EventBus.publish('risk:rejected', {
            signal,
            validation,
            timestamp: new Date().toISOString()
        });
    }
});

// Handle trade result
EventBus.on('trade:result', (result) => {
    console.log(`📊 [RiskAgent] Trade result: ${result.result}`);
    recordTrade(result);
});

// Handle reset request
EventBus.on('risk:reset', () => {
    console.log(`🔄 [RiskAgent] Reset requested`);
    state.tradesToday = 0;
    state.dailyLoss = 0;
    state.consecutiveLosses = 0;
    state.isPaused = false;
    state.pauseUntil = null;
    saveState();
});

// Status command
function getStatus() {
    return {
        agent: 'RiskAgent',
        status: 'running',
        state: {
            tradesToday: state.tradesToday,
            dailyLoss: state.dailyLoss,
            consecutiveLosses: state.consecutiveLosses,
            isPaused: state.isPaused,
            pauseUntil: state.pauseUntil
        },
        rules: CONFIG,
        uptime: process.uptime()
    };
}

// HTTP server for health checks
const http = require('http');
const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getStatus()));
    } else if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ state, logs: EventBus.getLogs('RiskAgent', 10) }));
    } else if (req.url === '/logs') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(EventBus.getLogs()));
    } else {
        res.writeHead(404);
        res.end();
    }
});

// Initialize
loadState();
saveState();

server.listen(PORT, () => {
    console.log(`🛡️ RiskAgent running on port ${PORT}`);
    console.log(`📋 Rules: max risk ${CONFIG.maxRiskPercent}%, max daily loss $${CONFIG.maxDailyLoss}`);
    console.log(`📊 Current state: ${state.tradesToday} trades, $${state.dailyLoss} loss`);
});

// Handle shutdown
process.on('SIGTERM', () => {
    saveState();
    process.exit();
});

process.on('SIGINT', () => {
    saveState();
    process.exit();
});
