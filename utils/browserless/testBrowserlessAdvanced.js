import { 
  launchBrowserless, 
  launchBrowserlessWithProxy, 
  launchBrowserlessMaxStealth, 
  waitForTimeout,
  closeBrowserless 
} from './launchBrowserless.js';

async function testConfiguration() {
  console.log('🧪 Test de configuration anti-détection avancée...\n');

  // Test 1: Configuration maximale stealth
  console.log('1️⃣ Test stealth maximal...');
  const { browser: browser1, page: page1 } = await launchBrowserlessMaxStealth();
  await page1.goto('https://bot.sannysoft.com/');
  await waitForTimeout(3000);
  await page1.screenshot({ path: 'test-stealth.png', fullPage: true });
  await closeBrowserless(browser1);

  // Test 2: Avec proxy résidentiel
  console.log('2️⃣ Test avec proxy résidentiel...');
  const { browser: browser2, page: page2 } = await launchBrowserlessWithProxy('fr');
  await page2.goto('https://httpbin.org/ip');
  await waitForTimeout(3000);
  await page2.screenshot({ path: 'test-proxy.png' });
  await closeBrowserless(browser2);

  // Test 3: Configuration personnalisée
  console.log('3️⃣ Test configuration personnalisée...');
  const { browser: browser3, page: page3 } = await launchBrowserless({
    stealth: true,
    useProxy: true,
    proxyCountry: 'fr',
    blockAds: true,
    viewport: { width: 1366, height: 768 }
  });
  await page3.goto('https://whatismyipaddress.com/');
  await waitForTimeout(3000);
  await page3.screenshot({ path: 'test-custom.png', fullPage: true });
  await closeBrowserless(browser3);

  console.log('✅ Tous les tests terminés !');
}

testConfiguration().catch(console.error); 