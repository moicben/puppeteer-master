import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

console.log('Puppeteer path:', process.env.PUPPETEER_EXECUTABLE_PATH)

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sessionsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sessions.json'), 'utf8'));
const randomSession = sessionsData[Math.floor(Math.random() * sessionsData.length)].session;

// Proxy Configuration 
const proxyAddress = 'proxy.oculus-proxy.com';
const proxyPort = '31112';
const proxyPassword = 'sxjozu794g50';
const proxyUsername = 'oc-0b3b58f5de2c1506ce227d596c3517f6586af56e3fc513b2c187e07ba94b765e-country-FR-session-8e1a1'


export async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour voir le processus
    ignoreHTTPSErrors: true, // Pour ignorer les erreurs HTTPS via le proxy
    defaultViewport: null,
    startMaximized: true, // Démarrer le navigateur maximisé
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', 
      '--disable-infobars',
      '--disable-web-security', 
      '--disable-features=IsolateOrigins,site-per-process', 
      '--ignore-certificate-errors',
      '--disable-software-rasterizer',
      '--disable-dev-shm-usage',  
      '--disable-breakpad',
      '--disable-extensions',
      '--disable-gpu',
      // `--proxy-server=${proxyAddress}:${proxyPort}`,
      `--user-data-dir=${process.env.PUPPETEER_USER_DATA_DIR || '/root/chrome-profile/Default'}`, // Chemin vers le profil Chrome
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable', // Chemin vers l'exécutable Chrome
  });

  // Utiliser l'onglet pa défaut créé lors du launch
  const pages = await browser.pages();
  const page = pages.length ? pages[0] : await browser.newPage();
   
  // Authentification par proxy (si besoin)
  // await page.authenticate({
  //   username: proxyUsername,
  //   password: proxyPassword,
  // });

  // Injecter des scripts pour tromper certaines détections
  // await page.evaluateOnNewDocument(() => {
  //   Object.defineProperty(navigator, 'webdriver', { get: () => false });
  //   window.chrome = { runtime: {} };
  //   const originalQuery = window.navigator.permissions.query;
  //   window.navigator.permissions.query = (parameters) =>
  //     parameters.name === 'notifications'
  //       ? Promise.resolve({ state: Notification.permission })
  //       : originalQuery(parameters);
  //   Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  //   Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr'] });
  //   const getParameter = WebGLRenderingContext.prototype.getParameter;
  //   WebGLRenderingContext.prototype.getParameter = function(parameter) {
  //     if (parameter === 37445) return 'Intel Inc.';
  //     if (parameter === 37446) return 'Intel Iris OpenGL Engine';
  //     return getParameter(parameter);
  //   };
  //   Object.defineProperty(navigator, 'mediaDevices', {
  //     get: () => ({
  //       enumerateDevices: () =>
  //         Promise.resolve([
  //           { kind: 'videoinput' },
  //           { kind: 'audioinput' },
  //           { kind: 'audiooutput' }
  //         ])
  //     })
  //   });
  // });

  return { browser, page };
}
