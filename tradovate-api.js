/**
 * Tradovate API Integration
 * Real-time market data for NQ
 */

const https = require('https');

const TRADOVATE_CREDENTIALS = {
    username: 'fodiiis116229',
    password: 'p$QcR4mJ9v'
};

let accessToken = null;
let tokenExpiry = null;

/**
 * Get Tradovate access token
 */
async function getAccessToken() {
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    const postData = JSON.stringify({
        username: TRADOVATE_CREDENTIALS.username,
        password: TRADOVATE_CREDENTIALS.password
    });

    const options = {
        hostname: 'api.tradovate.com',
        path: '/v1/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.accessToken) {
                        accessToken = json.accessToken;
                        // Token expires in 20 minutes
                        tokenExpiry = Date.now() + (19 * 60 * 1000);
                        resolve(accessToken);
                    } else {
                        reject(new Error('No access token received'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Get current price for symbol
 */
async function getQuote(symbol = 'MNQ') {
    const token = await getAccessToken();

    const options = {
        hostname: 'api.tradovate.com',
        path: `/v1/quote/${symbol}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Get historical candles
 */
async function getCandles(symbol = 'MNQ', timeframe = '1h', count = 100) {
    const token = await getAccessToken();

    const options = {
        hostname: 'api.tradovate.com',
        path: `/v1/candle/history/${symbol}?timeframe=${timeframe}&count=${count}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Get account info
 */
async function getAccount() {
    const token = await getAccessToken();

    const options = {
        hostname: 'api.tradovate.com',
        path: '/v1/account',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Get open positions
 */
async function getPositions() {
    const token = await getAccessToken();

    const options = {
        hostname: 'api.tradovate.com',
        path: '/v1/position',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    try {
        switch (command) {
            case 'quote':
                const quote = await getQuote(args[1] || 'MNQ');
                console.log(JSON.stringify(quote, null, 2));
                break;
            case 'candles':
                const candles = await getCandles(args[1] || 'MNQ', args[2] || '1h', args[3] || 100);
                console.log(JSON.stringify(candles, null, 2));
                break;
            case 'account':
                const account = await getAccount();
                console.log(JSON.stringify(account, null, 2));
                break;
            case 'positions':
                const positions = await getPositions();
                console.log(JSON.stringify(positions, null, 2));
                break;
            default:
                console.log('Usage: node tradovate-api.js [quote|candles|account|positions] [symbol] [timeframe] [count]');
                console.log('Example: node tradovate-api.js quote MNQ');
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
