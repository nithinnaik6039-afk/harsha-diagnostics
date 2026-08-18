import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log(`[PAGE CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.log('[PAGE CRASH ERROR]:', error.message, error.stack);
    });
    
    console.log('Navigating to http://localhost:8082...');
    await page.goto('http://localhost:8082', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    console.log('Page title:', await page.title());
    
    // Check if there is redbox or error text
    const bodyText = await page.innerText('body');
    console.log('Body Text Snippet (first 1000 chars):', bodyText.slice(0, 1000));
    
    await page.screenshot({ path: 'mlt_screenshot.png' });
    console.log('Screenshot saved to mlt_screenshot.png');
    
    await browser.close();
  } catch (err) {
    console.error('Playwright execution error:', err);
  }
})();
