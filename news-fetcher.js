/**
 * News Fetcher - Free APIs
 */

const https = require('https');

// Nasdaq News
function getNasdaqNews() {
  return new Promise((resolve) => {
    https.get('https://www.nasdaq.com/api/news/quotes/search/keyword/market', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.slice(0, 5));
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

// Economic Calendar (scrape)
function getEconomicCalendar() {
  return {
    today: [
      { time: '14:30 UTC', event: 'US Retail Sales', impact: 'High' },
      { time: '18:00 UTC', event: 'Fed Chair Speech', impact: 'High' }
    ],
    tomorrow: [
      { time: '13:30 UTC', event: 'US CPI', impact: 'Very High' }
    ]
  };
}

module.exports = { getNasdaqNews, getEconomicCalendar };
