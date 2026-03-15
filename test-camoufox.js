const { Camoufox } = require('camoufox');

async function fetchPage(url) {
  const browser = await Camoufox({
    headless: true,
    geoip: false
  });
  
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  
  const content = await page.content();
  const title = await page.title();
  
  console.log('Title:', title);
  console.log('Content length:', content.length);
  console.log('Content:', content.substring(0, 2000));
  
  await browser.close();
}

fetchPage(process.argv[2] || 'https://example.com').catch(console.error);
