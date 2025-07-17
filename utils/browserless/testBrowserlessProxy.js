import { launchBrowserless, waitForTimeout } from './launchBrowserless.js';

// Test avec proxy
const { browser, page } = await launchBrowserless({
  useProxy: true,
  proxyCountry: 'us',     // ou 'fr', 'uk', 'de', etc.
  proxySticky: true
});

await page.goto('https://httpbin.org/ip');
await waitForTimeout(3000);

// Voir l'IP actuelle
const content = await page.content();
console.log('IP détectée:', content);

await browser.disconnect();