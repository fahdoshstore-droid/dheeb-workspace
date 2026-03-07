/**
 * Tradovate Webhook Automation
 * Receives TradingView alerts → Validates → Executes trades
 */

const http = require('http');
const { getAccessToken, placeOrder, getAccountInfo } = require('./tradovate-api.js');

const PORT = process.env.PORT || 3000;

// Risk Management
const MAX_RISK_PERCENT = 1; // 1% per trade
const MAX_DAILY_LOSS = 600;
let dailyLoss = 0;
let tradesToday = 0;

/**
 * Validate trade setup
 */
function validateSetup(signal) {
    const { entry, sl, tp, rrr } = signal;
    
    // Check RRR
    const rrrValue = parseFloat(rrr.replace('1:', '')) || 0;
    if (rrrValue < 2.0) {
        return { valid: false, reason: 'RRR < 2.0' };
    }
    
    // Check required fields
    if (!entry || !sl || !tp) {
        return { valid: false, reason: 'Missing entry/sl/tp' };
    }
    
    return { valid: true };
}

/**
 * Calculate position size
 */
function calculatePositionSize(accountBalance, entry, sl) {
    const riskAmount = accountBalance * (MAX_RISK_PERCENT / 100);
    const riskPerPoint = Math.abs(entry - sl);
    const contracts = Math.floor(riskAmount / riskPerPoint);
    return Math.min(contracts, 2); // Max 2 contracts
}

/**
 * Handle webhook request
 */
async function handleWebhook(req, res) {
    let body = '';
    
    req.on('data', chunk => body += chunk);
    req.on('async () => {
        try {
            const signal = JSON.parse(body);
            console.log('📥 Received signal:', signal);
            
            // Validate setup
            const validation = validateSetup(signal);
            if (!validation.valid) {
                console.log('❌ Validation failed:', validation.reason);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'rejected', reason: validation.reason }));
                return;
            }
            
            // Check daily loss limit
            if (dailyLoss >= MAX_DAILY_LOSS) {
                console.log('❌ Daily loss limit reached');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'rejected', reason: 'Daily loss limit' }));
                return;
            }
            
            // Get account info
            const account = await getAccountInfo();
            const balance = account.accountBalance || 50000;
            
            // Calculate position size
            const contracts = calculatePositionSize(balance, signal.entry, signal.sl);
            
            if (contracts < 1) {
                console.log('❌ Position size too small');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'rejected', reason: 'Position size too small' }));
                return;
            }
            
            // Execute trade
            const order = await placeOrder(signal.symbol || 'NQ', signal.direction, signal.entry, signal.sl, signal.tp, contracts);
            
            console.log('✅ Trade executed:', order);
            tradesToday++;
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success', order }));
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: error.message }));
        }
    });
}

// Start server
const server = http.createServer(handleWebhook);

server.listen(PORT, () => {
    console.log(`🚀 Tradovate Webhook Server running on port ${PORT}`);
    console.log(`📊 Max Risk: ${MAX_RISK_PERCENT}% | Daily Limit: $${MAX_DAILY_LOSS}`);
});

module.exports = { server, validateSetup, calculatePositionSize };
