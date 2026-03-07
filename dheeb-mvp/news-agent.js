#!/usr/bin/env node
/**
 * NewsAgent - Independent News & Sentiment Agent
 * Monitors market news, generates sentiment, sends to Event Bus
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = {
    sources: [
        { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/' },
        { name: 'MarketWatch', url: 'https://www.marketwatch.com/latest-news' }
    ],
    checkInterval: 300000, // 5 min
    keywords: ['NASDAQ', 'NDX', 'Fed', 'earnings', 'AI', 'tech']
};

// Agent state
const state = {
    lastHeadlines: [],
    sentiment: 'NEUTRAL', // BULLISH, BEARISH, NEUTRAL
    impact: 'LOW', // HIGH, MEDIUM, LOW
    newsCount: 0,
    lastUpdate: null
};

function loadState() {
    const stateFile = path.join(__dirname, 'news-agent-state.json');
    if (fs.existsSync(stateFile)) {
        try {
            Object.assign(state, JSON.parse(fs.readFileSync(stateFile, 'utf8')));
        } catch (e) {}
    }
}

function saveState() {
    const stateFile = path.join(__dirname, 'news-agent-state.json');
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// Simple event bus
function publishEvent(event, data) {
    const logFile = path.join(__dirname, 'event-log.json');
    let logs = [];
    if (fs.existsSync(logFile)) {
        try { logs = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch(e) {}
    }
    logs.push({ agent: 'NewsAgent', event, data, timestamp: new Date().toISOString() });
    if (logs.length > 100) logs = logs.slice(-100);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    console.log(`📰 [NewsAgent] Published: ${event}`);
}

// Fetch news (simplified - in production use proper API)
async function fetchNews() {
    // For demo, generate mock news sentiment
    // In production: connect to news APIs
    
    const headlines = [
        'Tech stocks rally on AI optimism',
        'Fed signals potential rate cut',
        'NASDAQ hits new all-time high',
        'Earnings season beats expectations',
        'Market volatility increases'
    ];
    
    // Random sentiment based on "headlines"
    const rand = Math.random();
    let sentiment = 'NEUTRAL';
    let impact = 'LOW';
    
    if (rand < 0.3) {
        sentiment = 'BEARISH';
        impact = 'HIGH';
    } else if (rand > 0.7) {
        sentiment = 'BULLISH';
        impact = 'MEDIUM';
    }
    
    return {
        headlines: headlines.slice(0, 3),
        sentiment,
        impact,
        timestamp: new Date().toISOString()
    };
}

// Analyze news impact on trading
function analyzeImpact(news) {
    let score = 0;
    
    // Sentiment scoring
    if (news.sentiment === 'BULLISH') score += 1;
    if (news.sentiment === 'BEARISH') score -= 1;
    
    // Impact scoring
    if (news.impact === 'HIGH') score *= 2;
    if (news.impact === 'MEDIUM') score *= 1.5;
    
    // Generate trading recommendation
    let recommendation = 'NEUTRAL';
    let riskLevel = 'LOW';
    
    if (score > 1) {
        recommendation = 'BULLISH';
        riskLevel = 'MEDIUM';
    } else if (score < -1) {
        recommendation = 'BEARISH';
        riskLevel = 'HIGH';
    } else {
        recommendation = 'NEUTRAL';
        riskLevel = 'LOW';
    }
    
    return {
        sentiment: news.sentiment,
        impact: news.impact,
        score: score.toFixed(1),
        recommendation,
        riskLevel
    };
}

// Send news update to other agents via Event Bus
function broadcastNews(analysis, news) {
    const eventData = {
        sentiment: analysis.sentiment,
        impact: analysis.impact,
        recommendation: analysis.recommendation,
        riskLevel: analysis.riskLevel,
        headlines: news.headlines,
        timestamp: news.timestamp
    };
    
    // Publish to event bus
    publishEvent('news:update', eventData);
    
    // Also publish for decision engine to consume
    const deLogFile = path.join(__dirname, 'event-log.json');
    let logs = [];
    if (fs.existsSync(deLogFile)) {
        try { logs = JSON.parse(fs.readFileSync(deLogFile, 'utf8')); } catch(e) {}
    }
    logs.push({ 
        agent: 'NewsAgent', 
        event: 'news:analysis', 
        data: eventData, 
        timestamp: new Date().toISOString() 
    });
    fs.writeFileSync(deLogFile, JSON.stringify(logs.slice(-100), null, 2));
    
    return eventData;
}

// Main news cycle
async function runNewsCycle() {
    console.log(`\n📰 [NewsAgent] Fetching market news...`);
    
    try {
        const news = await fetchNews();
        
        state.lastHeadlines = news.headlines;
        state.sentiment = news.sentiment;
        state.impact = news.impact;
        state.newsCount++;
        state.lastUpdate = news.timestamp;
        
        const analysis = analyzeImpact(news);
        
        console.log(`   Sentiment: ${analysis.sentiment} | Impact: ${analysis.impact}`);
        console.log(`   Recommendation: ${analysis.recommendation} | Risk: ${analysis.riskLevel}`);
        
        // Broadcast to Event Bus
        broadcastNews(analysis, news);
        
        saveState();
        
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
}

// Status
function getStatus() {
    return {
        agent: 'NewsAgent',
        status: 'running',
        state: {
            sentiment: state.sentiment,
            impact: state.impact,
            newsCount: state.newsCount,
            lastUpdate: state.lastUpdate,
            lastHeadlines: state.lastHeadlines
        },
        config: CONFIG,
        uptime: process.uptime()
    };
}

// HTTP Server
const http = require('http');
const PORT = process.env.PORT || 3003;

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getStatus()));
    } else if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
    } else if (req.url === '/analyze' && req.method === 'POST') {
        runNewsCycle().then(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(state));
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

// Initialize
loadState();

server.listen(PORT, () => {
    console.log(`\n📰 NewsAgent running on port ${PORT}`);
    console.log(`   Sources: ${CONFIG.sources.length}`);
    console.log(`   Check interval: ${CONFIG.checkInterval / 1000}s`);
});

// Run initial news fetch
setTimeout(runNewsCycle, 2000);

// Run news cycle periodically
setInterval(runNewsCycle, CONFIG.checkInterval);

// Handle shutdown
process.on('SIGTERM', () => { saveState(); process.exit(); });
process.on('SIGINT', () => { saveState(); process.exit(); });
