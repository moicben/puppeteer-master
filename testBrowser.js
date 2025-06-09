import { newLaunchBrowser } from './utils/puppeteer/newLaunchBrowser.js';

const URL = 'https://www.christopeit-sport.fr';

async function browserTest() {
  const { browser, page } = await newLaunchBrowser();
  
  try {
    await page.goto(URL);
    await page.waitForTimeout(200000);
   
  } catch (error) {
    return { error: error.message };
  }
}

browserTest();