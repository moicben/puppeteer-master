import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import 'dotenv/config';

// Charger la session depuis le fichier JSON
const sessionData = JSON.parse(fs.readFileSync('./cookies/pinterest.json', 'utf8'));

export async function scrapPinterest() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
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
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();

    // Charger la session/cookies
    if (sessionData && sessionData.length > 0) {
      await page.setCookie(...sessionData);
    }

    // Injecter des scripts pour éviter la détection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr'] });
    });    console.log('🚀 Navigation vers Pinterest...');
    await page.goto('https://fr.pinterest.com/search/my_pins/?q=carte%20d%27identit%C3%A9%20francaise&rs=typed'
    );    console.log('📍 Page chargée, URL actuelle:', page.url());
    
    // Attendre que la page se charge
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Prendre une capture d'écran pour debug
    await page.screenshot({ path: './identities/pinterest_debug.png' });
    console.log('📸 Capture d\'écran sauvegardée pour debug');

    console.log('📜 Scroll progressif de 3000 pixels...');
    await autoScroll(page, 3000);    console.log('🔍 Extraction des images...');
    const imageUrls = await page.evaluate(() => {
      const images = [];
      const imgElements = document.querySelectorAll('img');
      
      console.log('Total images trouvées:', imgElements.length);
      
      imgElements.forEach(img => {
        if (img.src) {
          console.log('Image URL:', img.src);
          if (img.src.includes('236x')) {
            images.push(img.src);
            console.log('Image avec 236x ajoutée:', img.src);
          }
        }
      });
      
      return [...new Set(images)]; // Supprimer les doublons
    });

    console.log(`✅ ${imageUrls.length} images trouvées avec "236x"`);
    
    if (imageUrls.length === 0) {
      console.log('⚠️ Aucune image trouvée avec "236x". Vérifiez que vous êtes connecté à Pinterest.');
      return { totalImages: 0, fileName: null, filePath: null };
    }

    // Remplacer "236x" par "936x"
    const highResImages = imageUrls.map(url => url.replace('236x', '936x'));

    // Créer le fichier Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pinterest Images');

    // Ajouter les en-têtes
    worksheet.columns = [
      { header: 'Index', key: 'index', width: 10 },
      { header: 'URL Originale (236x)', key: 'original', width: 80 },
      { header: 'URL Haute Résolution (936x)', key: 'highres', width: 80 }
    ];

    // Ajouter les données
    imageUrls.forEach((originalUrl, index) => {
      worksheet.addRow({
        index: index + 1,
        original: originalUrl,
        highres: originalUrl.replace('236x', '936x')
      });
    });

    // Sauvegarder le fichier Excel
    const fileName = `pinterest_images.xlsx`;
    const filePath = path.join('./identities', fileName);
    
    await workbook.xlsx.writeFile(filePath);
    
    console.log(`💾 Fichier Excel sauvegardé: ${fileName}`);
    console.log(`📊 ${imageUrls.length} images exportées`);

    return {
      totalImages: imageUrls.length,
      fileName: fileName,
      filePath: filePath
    };

  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Fonction pour le scroll progressif
async function autoScroll(page, targetPixels) {
  await page.evaluate(async (targetPixels) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100; // Pixels par scroll
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= targetPixels || totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100); // Attendre 100ms entre chaque scroll
    });
  }, targetPixels);
}

// Exécuter la fonction de scraping
(async () => {
  try {
    const result = await scrapPinterest();
    console.log(`Scraping terminé avec succès. Total images: ${result.totalImages}`);
  } catch (error) {
    console.error('Erreur lors du scraping Pinterest:', error);
  }
})();
