#!/usr/bin/env node
/**
 * DHEEB TradingView Webhook Handler
 * Receives alerts from TradingView and processes based on Unified System
 */

const express = require('express');
const app = express();
app.use(express.json());

// Configuration
const config = {
    telegramToken: '8307993465:AAHAH8rU4mZf9cJXoHSdgY2IIUXnmwF3oQ8',
    chatId: '688493754'
};

// Rules from Unified System
const RULES = {
    minConfidence: 85,
    minRRR: 2.5,
    killZones: {
        london: { start: 8, end: 11 },
        ny: { start: 13.5, end: 16 }
    }
};

// Telegram sender
async function sendTelegram(message) {
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(config.telegramToken, { polling: false });
    try {
        await bot.sendMessage(config.chatId, message, { parse_mode: 'Markdown' });
        return true;
    } catch (e) {
        console.log('Telegram error:', e.message);
        return false;
    }
}

// Get current session
function getSession() {
    const now = new Date();
    const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
    
    const london = hour >= RULES.killZones.london.start && hour < RULES.killZones.london.end;
    const ny = hour >= RULES.killZones.ny.start && hour < RULES.killZones.ny.end;
    
    return { london, ny, hour };
}

// Process TradingView alert
function processAlert(data) {
    // No time restrictions - accept all alerts
    // User decides based on their own rules
    
    // Calculate confidence (simplified)
    let confidence = 50;
    if (data.sd2) confidence += 20;
    if (data.ob) confidence += 15;
    if (data.fvg) confidence += 15;
    if (data.liquidity) confidence += 10;
    
    return {
        valid: true,
        confidence,
        message: formatAlertMessage(data, confidence)
    };
}

function formatAlertMessage(data, confidence) {
    const direction = data.direction || 'BUY/SELL';
    const directionText = direction === 'BUY' ? 'bullish' : 'bearish';
    const entry = data.entry || 'TBD';
    const sl = data.sl || 'TBD';
    const tp = data.tp || 'TBD';
    const rrr = data.rrr || 'TBD';
    const price = data.price || data.close || 'TBD';
    const bsl = data.bsl || '---';
    const ssl = data.ssl || '---';
    const ob = data.ob || '---';
    const fvg = data.fvg || '---';
    
    // Calculate distances
    const entryNum = parseFloat(entry);
    const slNum = parseFloat(sl);
    const tpNum = parseFloat(tp);
    const priceNum = parseFloat(price);
    
    let slDist = 'TBD';
    let tpDist = 'TBD';
    
    if (!isNaN(entryNum) && !isNaN(slNum)) {
        const diff = Math.abs(entryNum - slNum);
        slDist = direction === 'BUY' ? `-${diff} pts` : `+${diff} pts`;
    }
    
    if (!isNaN(entryNum) && !isNaN(tpNum)) {
        const diff = Math.abs(tpNum - entryNum);
        tpDist = direction === 'BUY' ? `+${diff} pts` : `-${diff} pts`;
    }
    
    // TRIL Format exact
    return `📍 DHEEB TRIL ANALYZER

Status: price = ${price} | trend = ${directionText}

┌─────────────────────────────────────────────────┐
│  ${bsl} ─── BSL                              │
│          │                                       │
│          │  SL = ${slDist}                      │
│  ${sl} ─── ● SL ────────────────── ${!isNaN(entryNum) && !isNaN(slNum) ? Math.abs(entryNum - slNum) : '?'} pts │
│          │                                       │
│  ${ob} ─── ┌─────────────────────┐          │
│              │    ORDER BLOCK      │          │
│              │    ${entry} │          │
│              └─────────────────────┘          │
│                             │                   │
│  ${entry} ─── Entry 📍 (${direction})               │
│                             │                   │
│  ${price} ─── ● PRICE NOW                    │
│                             │                   │
│  ${tp} ─── ○ TP ────────────────── ${!isNaN(entryNum) && !isNaN(tpNum) ? Math.abs(tpNum - entryNum) : '?'} pts│
│                             │                   │
│  ${ssl} ─── ○ SSL                           │
└─────────────────────────────────────────────────┘

---
| Item | Value |
| --------- | ------------------------ |
| Direction | ${direction} |
| Entry | ${entry} |
| SL | ${sl} ${!isNaN(priceNum) && !isNaN(slNum) ? `(${(slNum - priceNum).toFixed(0)} from price)` : ''} |
| TP | ${tp} ${!isNaN(priceNum) && !isNaN(tpNum) ? `(${(tpNum - priceNum).toFixed(0)} from price)` : ''} |
| R:R | ${rrr} |

---
🐺
`;
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
    const data = req.body;
    console.log('Received alert:', JSON.stringify(data));
    
    // Process the alert
    const result = processAlert(data);
    
    if (result.valid) {
        // Send to Telegram
        await sendTelegram(result.message);
        res.json({ success: true, ...result });
    } else {
        console.log('Alert rejected:', result.reason);
        res.json({ success: false, ...result });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        session: getSession(),
        rules: RULES 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🟢 DHEEB Webhook listening on port ${PORT}`);
});

module.exports = app;
