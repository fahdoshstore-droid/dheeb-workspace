const yahooFinance = require('yahoo-finance2').default;

const SYMBOL = '^NDX';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function getPrice() {
  const quote = await yahooFinance.quote(SYMBOL);
  return quote.regularMarketPrice;
}

function detectFVG(prices) {
  // Simplified FVG detection
  for (let i = 0; i < prices.length - 2; i++) {
  const prevHigh = prices[i].high;
  const currLow = prices[i+2].low;
  if (prevHigh < currLow) return { type: 'bullish', gap: currLow - prevHigh };
  }
  return null;
}

async function check() {
  console.log(`[${new Date().toISOString()}] Checking ${SYMBOL}...`);
  const price = await getPrice();
  console.log(`Price: ${price}`);
  // Add your logic here
}

setInterval(check, CHECK_INTERVAL);
check();
