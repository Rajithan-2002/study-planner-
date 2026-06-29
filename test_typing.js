const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/assistant');
  
  // Try typing
  try {
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    await page.type('input[type="text"]', 'Hello, World!', { delay: 100 });
    const value = await page.$eval('input[type="text"]', el => el.value);
    console.log('Input value after typing:', value);
  } catch (err) {
    console.error('Error typing:', err);
  }
  
  await browser.close();
})();
