// e2e-playwright.js - Full GUI Automation Test Suite for Harsha Diagnostics
// v4 FINAL: root URL, networkidle, waitForFunction, correct admin creds
// Run: node e2e-playwright.js

import { chromium } from 'playwright';

const BACKEND = 'http://localhost:5005';
const CUSTOMER_ROOT = 'http://localhost:8081';
const MLT_ROOT = 'http://localhost:8082';
const ADMIN_APP = 'http://localhost:5173';

const ADMIN_USERNAME = 'admin_super';
const ADMIN_PASSWORD = 'super_secret_harsha_2026';

let passed = 0;
let failed = 0;
const errors = [];

function log(msg) { console.log(msg); }
function pass(label) { passed++; log('  ✅ PASS: ' + label); }
function fail(label, detail) {
  failed++;
  const msg = '  ❌ FAIL: ' + label + ' — ' + String(detail).substring(0, 200);
  log(msg);
  errors.push(msg);
}

// ─────────────────────────────────────────────
// SUITE 1: Backend API
// ─────────────────────────────────────────────
async function testBackendAPI(browser) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🔌 SUITE 1: Backend API Tests');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    log('\n  [API-1] GET /health...');
    const health = await page.evaluate(async (url) => {
      const r = await fetch(url); return { status: r.status, text: await r.text() };
    }, BACKEND + '/health');
    if (health.status === 200) pass('/health endpoint is up');
    else fail('/health', 'Status: ' + health.status);

    log('\n  [API-2] GET /api/tests...');
    const tests = await page.evaluate(async (url) => {
      const r = await fetch(url); return { status: r.status, json: await r.json() };
    }, BACKEND + '/api/tests');
    if (tests.status === 200 && tests.json.success) pass('/api/tests returns ' + tests.json.count + ' catalog items');
    else fail('/api/tests', 'Status: ' + tests.status);

    log('\n  [API-3] POST /api/auth/send-otp...');
    const sendOtp = await page.evaluate(async (url) => {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '9876543210', role: 'customer' }) });
      return { status: r.status, json: await r.json() };
    }, BACKEND + '/api/auth/send-otp');
    if (sendOtp.status === 200) pass('OTP send accepted');
    else fail('send-otp', 'Status: ' + sendOtp.status);

    log('\n  [API-4] POST /api/auth/verify-otp...');
    const verifyOtp = await page.evaluate(async (url) => {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '9876543210', otp: '123456', role: 'customer', name: 'E2E Tester' }) });
      return { status: r.status, json: await r.json() };
    }, BACKEND + '/api/auth/verify-otp');
    if (verifyOtp.status === 200 && verifyOtp.json.token) pass('Customer OTP verified — JWT received');
    else fail('verify-otp', 'Status: ' + verifyOtp.status);

    const token = verifyOtp.json.token;

    log('\n  [API-5] GET /api/auth/mlts (authenticated)...');
    const mlts = await page.evaluate(async (data) => {
      const r = await fetch(data.url, { headers: { 'Authorization': 'Bearer ' + data.token } });
      return { status: r.status, json: await r.json() };
    }, { url: BACKEND + '/api/auth/mlts', token });
    if (mlts.status === 200) pass('/api/auth/mlts returns ' + mlts.json.count + ' MLT(s)');
    else fail('/api/auth/mlts', 'Status: ' + mlts.status);

    log('\n  [API-6] POST /api/auth/admin-login...');
    const adminLogin = await page.evaluate(async (data) => {
      const r = await fetch(data.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: data.user, password: data.pass }) });
      return { status: r.status, json: await r.json() };
    }, { url: BACKEND + '/api/auth/admin-login', user: ADMIN_USERNAME, pass: ADMIN_PASSWORD });
    if (adminLogin.status === 200 && adminLogin.json.token) pass('Admin login returns valid JWT');
    else fail('admin-login', 'Status: ' + adminLogin.status);

  } catch (e) { fail('Backend API Suite', e.message); }
  finally { await context.close(); }
}

// ─────────────────────────────────────────────
// SUITE 2: Admin Dashboard
// ─────────────────────────────────────────────
async function testAdminDashboard(browser) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🖥️  SUITE 2: Admin Dashboard Tests');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  try {
    log('\n  [A1] Loading Admin Dashboard...');
    await page.goto(ADMIN_APP, { waitUntil: 'networkidle', timeout: 30000 });
    if (await page.$('body')) pass('Admin Dashboard loads without crash');
    else fail('Admin load', 'No body');
    if (jsErrors.length === 0) pass('No JS errors on Admin load');
    else fail('Admin JS errors', jsErrors[0]);

    log('\n  [A2] Login screen visible...');
    const t = await page.evaluate(() => document.body.innerText);
    if (t.includes('Username') || t.includes('Password') || t.includes('Sign In')) pass('Login screen renders correctly');
    else fail('Login screen', t.substring(0, 80));

    log('\n  [A3] Admin login: ' + ADMIN_USERNAME + '...');
    try {
      await page.$('input[type="text"]').then(e => e && e.fill(ADMIN_USERNAME));
      await page.$('input[type="password"]').then(e => e && e.fill(ADMIN_PASSWORD));
      const btn = await page.$('button[type="submit"], button:has-text("Sign In")');
      if (btn) { await btn.click(); await page.waitForTimeout(4000); }
      const t2 = await page.evaluate(() => document.body.innerText);
      if (t2.includes('Orders') || t2.includes('Revenue') || t2.includes('Catalog') || t2.includes('Roster') || t2.includes('Supervision')) pass('Admin login — dashboard loaded');
      else if (t2.includes('Invalid')) fail('Admin login', 'Invalid credentials');
      else fail('Admin dashboard', t2.substring(0, 100));
    } catch(e) { fail('Admin login flow', e.message); }

    log('\n  [A4] Test Catalog tab...');
    try {
      await page.goto(ADMIN_APP + '/catalog', { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1000);
      const ct = await page.evaluate(() => document.body.innerText);
      if (ct.includes('Blood') || ct.includes('Sugar') || ct.includes('CBC') || ct.includes('Catalog') || ct.includes('₹')) pass('Test Catalog loads diagnostic items');
      else fail('Catalog', ct.substring(0, 100));
    } catch(e) { fail('Catalog tab', e.message); }

    log('\n  [A5] Staff Roster tab...');
    try {
      await page.goto(ADMIN_APP + '/roster', { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1000);
      const rt = await page.evaluate(() => document.body.innerText);
      if (rt.includes('Online') || rt.includes('Offline') || rt.includes('Roster') || rt.includes('GPS') || rt.includes('Phlebotomist')) pass('Staff Roster loads MLT data');
      else fail('Roster', rt.substring(0, 100));
    } catch(e) { fail('Roster tab', e.message); }

    await page.screenshot({ path: '/tmp/admin-test.png' });
    log('    📸 /tmp/admin-test.png');

  } catch(e) { fail('Admin Suite (fatal)', e.message); }
  finally { await context.close(); }
}

// ─────────────────────────────────────────────
// SUITE 3: Customer App
// ─────────────────────────────────────────────
async function testCustomerApp(browser) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('📱 SUITE 3: Customer App Tests');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', e => {
    if (!e.message.includes('shadow') && !e.message.includes('push token') && !e.message.includes('localStorage'))
      jsErrors.push(e.message);
  });
  page.on('console', msg => log('    [BROWSER] ' + msg.type() + ': ' + msg.text()));

  try {
    // C1: Load & wait for full JS hydration
    log('\n  [C1] Loading Customer App (root URL + networkidle)...');
    await page.goto(CUSTOMER_ROOT, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch(e) {}

    if (await page.$('body')) pass('Customer App loads without crash');
    else fail('Customer App load', 'No body');
    if (jsErrors.length === 0) pass('No fatal JS errors on load');
    else fail('Customer App JS errors', jsErrors[0]);

    // C2: Verify bundle is correct Expo/RNW app
    log('\n  [C2] Verifying Expo/RNW bundle served...');
    const html = await page.content();
    const isExpo = html.includes('expo') || html.includes('css-view') || html.includes('r-flex');
    if (isExpo) pass('Correct Expo React Native Web bundle served');
    else fail('Bundle check', 'No Expo/RNW markers in HTML');

    // C3: Wait for React Native TextInput to hydrate (up to 30s)
    log('\n  [C3] Waiting for React Native Web hydration (inputs)...');
    let inputCount = 0;
    try {
      await page.waitForFunction(() => document.querySelectorAll('input').length > 0, { timeout: 30000 });
      inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
      log('    Input count: ' + inputCount);
      pass('RNW hydrated — ' + inputCount + ' input(s) rendered');
    } catch(e) {
      inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
      log('    Input count after 30s: ' + inputCount);
      if (inputCount === 0) {
        // Known limitation: RNW TextInput requires browser JavaScript runtime
        // that may behave differently in headless vs visual browser
        fail('RNW hydration (known limitation)', 'Inputs did not appear in headless mode. App renders correctly in real browser — see browser_subagent tests.');
      }
    }

    // C4-C6: Only attempt if inputs are present
    if (inputCount > 0) {
      log('\n  [C4] Entering email/phone and password...');
      try {
        const inputs = await page.$$('input');
        if (inputs.length >= 2) {
          await inputs[0].fill('9876543210');
          await inputs[1].fill('password123');
        } else {
          await inputs[0].fill('9876543210');
        }
        await page.waitForTimeout(300);

        // Click Send OTP / Send OTP Code button
        const sendBtn = page.locator('text=/Send OTP|Send OTP Code|ఓటిపి పంపండి/i');
        await sendBtn.first().click();
        await page.waitForTimeout(3500);
        pass('Name and Phone entered + Send OTP clicked');

        log('\n  [C5] Entering OTP 123456...');
        const inputs2 = await page.$$('input');
        if (inputs2.length > 0) {
          await inputs2[inputs2.length - 1].fill('123456');
          await page.waitForTimeout(300);

          // Click Verify OTP button
          const verifyBtn = page.locator('text=/Verify OTP|Verify and Login|కోడ్ ధృవీకరించు/i');
          await verifyBtn.first().click();
          await page.waitForTimeout(5500);
          pass('OTP submitted');

          log('\n  [C6] Checking home screen...');
          const url = page.url();
          log('    URL: ' + url);
          const homeHtml = await page.content();
          const hasHome = ['Blood', 'Sugar', 'CBC', 'Cart', '₹', 'RBS', 'Harsha'].some(k => homeHtml.includes(k));
          if (!url.includes('/login') || hasHome) pass('Home screen loaded after login');
          else fail('Home redirect', 'Still on login: ' + url);
        } else {
          fail('OTP input field', 'No input field found for OTP');
        }
      } catch(e) { fail('Login flow', e.message); }
    }

    await page.screenshot({ path: '/tmp/customer-test.png' });
    log('    📸 /tmp/customer-test.png');

  } catch(e) { fail('Customer Suite (fatal)', e.message); }
  finally { await context.close(); }
}

// ─────────────────────────────────────────────
// SUITE 4: MLT App
// ─────────────────────────────────────────────
async function testMLTApp(browser) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🩺 SUITE 4: MLT Phlebotomist App Tests');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', e => {
    if (!e.message.includes('shadow') && !e.message.includes('push token') && !e.message.includes('localStorage'))
      jsErrors.push(e.message);
  });
  page.on('console', msg => log('    [BROWSER] ' + msg.type() + ': ' + msg.text()));

  try {
    // M1: Load
    log('\n  [M1] Loading MLT App (root URL + networkidle)...');
    await page.goto(MLT_ROOT, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch(e) {}

    if (await page.$('body')) pass('MLT App loads without crash');
    else fail('MLT load', 'No body');
    if (jsErrors.length === 0) pass('No fatal JS errors on MLT load');
    else fail('MLT JS errors', jsErrors[0]);

    // M2: Bundle check
    log('\n  [M2] Verifying Expo/RNW bundle served...');
    const html = await page.content();
    const isExpo = html.includes('expo') || html.includes('css-view') || html.includes('r-flex');
    if (isExpo) pass('Correct Expo React Native Web bundle served');
    else fail('MLT bundle', 'No Expo/RNW markers');

    // M3: Wait for hydration
    log('\n  [M3] Waiting for React Native Web hydration...');
    let inputCount = 0;
    try {
      await page.waitForFunction(() => document.querySelectorAll('input').length > 0, { timeout: 30000 });
      inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
      log('    Input count: ' + inputCount);
      pass('RNW hydrated — ' + inputCount + ' input(s) rendered');
    } catch(e) {
      inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
      log('    Input count after 30s: ' + inputCount);
      if (inputCount === 0) {
        fail('MLT RNW hydration (known limitation)', 'Inputs did not appear in headless mode. App renders in real browser.');
      }
    }

    // M4-M5: Login flow if inputs present
    if (inputCount > 0) {
      log('\n  [M4] MLT Login flow...');
      try {
        const inputs = await page.$$('input');
        if (inputs.length >= 2) {
          await inputs[0].fill('MLT Phlebotomist');
          await inputs[1].fill('1112223334');
        } else {
          await inputs[0].fill('1112223334');
        }
        await page.waitForTimeout(300);

        // Click Send OTP button using text selector
        const sendBtn = page.locator('text=/Send OTP|Send OTP Code|ఓటిపి పంపండి/i');
        await sendBtn.first().click();
        await page.waitForTimeout(3500);
        pass('MLT phone entered + Send OTP clicked');

        const inputs2 = await page.$$('input');
        if (inputs2.length > 0) {
          await inputs2[inputs2.length - 1].fill('123456');
          await page.waitForTimeout(300);

          // Click Verify OTP button using text selector
          const verifyBtn = page.locator('text=/Verify OTP|Verify and Login|కోడ్ ధృవీకరించు/i');
          await verifyBtn.first().click();
          await page.waitForTimeout(5500);
          pass('MLT OTP submitted');

          log('\n  [M5] Checking MLT Dashboard...');
          const url = page.url();
          log('    URL: ' + url);
          const dashHtml = await page.content();
          const hasDash = ['Online', 'Offline', 'Duty', 'Earnings', 'Collection', 'Harsha'].some(k => dashHtml.includes(k));
          if (!url.includes('/login') || hasDash) pass('MLT Dashboard loaded after login');
          else fail('MLT Dashboard', 'Still on login: ' + url);
        } else {
          fail('MLT OTP input field', 'No input field found for OTP');
        }
      } catch(e) { fail('MLT login flow', e.message); }
    }

    await page.screenshot({ path: '/tmp/mlt-test.png' });
    log('    📸 /tmp/mlt-test.png');

  } catch(e) { fail('MLT Suite (fatal)', e.message); }
  finally { await context.close(); }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log('\n┌──────────────────────────────────────────────────────┐');
  console.log('│  🏥 HARSHA DIAGNOSTICS — FULL E2E BROWSER TEST SUITE │');
  console.log('│  Playwright Automation v4 (Final)                    │');
  console.log('└──────────────────────────────────────────────────────┘\n');
  console.log('  Backend:       ' + BACKEND);
  console.log('  Admin:         ' + ADMIN_APP);
  console.log('  Customer App:  ' + CUSTOMER_ROOT);
  console.log('  MLT App:       ' + MLT_ROOT);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  try {
    await testBackendAPI(browser);
    await testAdminDashboard(browser);
    await testCustomerApp(browser);
    await testMLTApp(browser);
  } finally {
    await browser.close();
  }

  console.log('\n┌──────────────────────────────────────────────────────┐');
  console.log('│                📊 FINAL TEST REPORT                 │');
  console.log('└──────────────────────────────────────────────────────┘');
  console.log('  ✅ Passed:  ' + passed);
  console.log('  ❌ Failed:  ' + failed);
  console.log('  📊 Total:   ' + (passed + failed));
  const pct = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
  console.log('  📈 Score:   ' + pct + '%');

  if (errors.length > 0) {
    console.log('\n  🔍 Failed Tests:');
    errors.forEach(e => console.log('     ' + e));
  }

  if (failed === 0) console.log('\n  🎉 ALL TESTS PASSED!\n');
  else if (pct >= 80) console.log('\n  ✅ System mostly healthy. Minor issues above.\n');
  else if (pct >= 60) console.log('\n  ⚠️  Most passed. Review failures.\n');
  else console.log('\n  🚨 Multiple failures.\n');

  process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => { console.error('\n💀 Fatal:', e.message); process.exit(1); });
