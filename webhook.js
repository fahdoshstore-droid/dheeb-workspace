#!/usr/bin/env node
/**
 * DHEEB Webhook + AI Vision
 */

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const ANALYSES_FILE = path.join(DATA_DIR, 'analyses.json');
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');

const TELEGRAM_TOKEN = '8307993465:AAHAH8rU4mZf9cJXoHSdgY2IIUXnmwF3oQ8';
const CHAT_ID = '688493754';

// Helpers
function loadJSON(file) {
    try {
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {}
    return null;
}

function saveJSON(file, data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Telegram
async function sendTelegram(msg) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
        });
    } catch (e) { console.log('TG error:', e.message); }
}

// Format TRIL
function formatTRIL(d) {
    const dir = d.direction || 'NEUTRAL';
    const dirTxt = dir === 'BUY' ? 'bullish' : 'bearish';
    const entry = d.entry || 'TBD';
    const sl = d.sl || 'TBD';
    const tp = d.tp || 'TBD';
    const price = d.price || 'TBD';
    const bsl = d.bsl || '---';
    const ssl = d.ssl || '---';
    
    return `📍 DHEEB TRIL ANALYZER

Status: price = ${price} | trend = ${dirTxt}

┌─────────────────────────────────────────────────┐
│  ${bsl} ─── BSL                              │
│  ${sl} ─── ● SL                             │
│  ${entry} ─── Entry 📍 (${dir})              │
│  ${price} ─── ● PRICE NOW                   │
│  ${tp} ─── ○ TP                             │
│  ${ssl} ─── ○ SSL                           │
└─────────────────────────────────────────────────┘

---
| Item | Value |
| ------| ------ |
| Direction | ${dir} |
| Entry | ${entry} |
| SL | ${sl} |
| TP | ${tp} |
| R:R | ${d.rrr || 'TBD'} |

---
🐺`;
}

// Process
function processData(data) {
    const analyses = loadJSON(ANALYSES_FILE) || [];
    const id = Date.now();
    
    analyses.push({ id, time: new Date().toISOString(), ...data, status: 'PENDING' });
    saveJSON(ANALYSES_FILE, analyses);
    
    const levels = loadJSON(LEVELS_FILE) || {};
    if (data.bsl) levels.BSL = (levels.BSL || 0) + 1;
    if (data.ssl) levels.SSL = (levels.SSL || 0) + 1;
    if (data.ob) levels.OB = (levels.OB || 0) + 1;
    if (data.fvg) levels.FVG = (levels.FVG || 0) + 1;
    saveJSON(LEVELS_FILE, levels);
    
    return id;
}

// Webhook
app.post('/webhook', async (req, res) => {
    console.log('Received:', req.body);
    const id = processData(req.body);
    await sendTelegram(formatTRIL(req.body));
    res.json({ success: true, id });
});

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.listen(3000, () => console.log('🟢 Webhook on 3000'));
