import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pressKey } from '../../utils/puppeteer/pressKey.js';
import { launchBrowser } from '../../utils/puppeteer/launchBrowser.js';
import { getEmailOtp } from '../../utils/getEmailOtp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BricksNavigationService {
  
  static START_URL = 'https://app.bricks.co/register';

  // Créer une nouvelle session navigateur
  static async createBrowserSession() {
    const { browser, page } = await launchBrowser();
    return { browser, page };
  }

  // Page d'inscription
  static async fillRegistrationForm(page, email, password = 'Cadeau2014!') {
    console.log(`Navigating to ${this.START_URL}...`);
    await page.goto(this.START_URL, { waitUntil: 'networkidle2', timeout: 120000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Filling Registration Form...');
    await page.type('input[type="email"]', email, { delay: 100 });
    await page.type('input[type="password"]', password, { delay: 100 });

    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'Tab', 3);
    await pressKey(page, 'Space', 1);

    await new Promise(resolve => setTimeout(resolve, 2000));
    await pressKey(page, 'Enter', 1);
  }

  // Gestion OTP
  static async handleOTPVerification(page, email) {
    console.log('Getting OTP Code...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const otp = await getEmailOtp(email);
    if (!otp) {
      throw new Error('Failed to retrieve OTP code from email');
    }

    console.log('OTP Code Received:', otp);

    // Fill OTP Code
    await pressKey(page, 'Tab', 5);
    await page.keyboard.type(`${otp}`, { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await pressKey(page, 'Enter', 1);

    return otp;
  }

  // Page Onboarding - Étape 1
  static async handleOnboardingStart(page) {
    await new Promise(resolve => setTimeout(resolve, 6000));
    await page.click(".css-1mwxp4n");
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Page Onboarding - Informations personnelles
  static async fillPersonalInformation(page, accountData) {
    const isWoman = accountData.gender === 'F';
    
    if (isWoman) {
      // Pour une femme: 2 tabs au début, puis 1 tab après
      await pressKey(page, 'Tab', 2);
      await pressKey(page, 'Space', 1);
      await pressKey(page, 'Tab', 1);
    } else {
      // Pour un homme: 1 tab au début, puis 2 tabs après
      await pressKey(page, 'Tab', 1);
      await pressKey(page, 'Space', 1);
      await pressKey(page, 'Tab', 2);
    }
    
    await page.keyboard.type(`${accountData.firstName}`, { delay: 100 });
    await page.keyboard.press('Tab');
    await page.keyboard.type(`${accountData.lastName}`, { delay: 100 });
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Enter', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  // Page Onboarding - Numéro de téléphone
  static async fillPhoneNumber(page, phone) {
    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(`${phone}`, { delay: 100 });
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Enter', 1);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Page Onboarding - Adresse
  static async fillAddress(page, addressData) {
    await pressKey(page, 'Tab', 2);
    await page.keyboard.type(`${addressData.postal}`, { delay: 100 });
    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(`${addressData.city}`, { delay: 100 });

    // Click sur le pixel 200 x 200 de la page pour désélectionner
    await page.mouse.click(200, 200);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(addressData.address, { delay: 50 });

    await pressKey(page, 'Tab', 4);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  // Page Onboarding - Date et lieu de naissance
  static async fillBirthInformation(page, birthData) {
    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(`${birthData.date}`, { delay: 100 });
    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(`${birthData.place}`, { delay: 100 });

    await pressKey(page, 'Tab', 3);
    await pressKey(page, 'Enter', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  // Page Onboarding - Upload du passeport
  static async uploadPassport(page, passportPath) {
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'ArrowDown', 1);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await pressKey(page, 'Tab', 1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Vérifier que le fichier existe
    if (!fs.existsSync(passportPath)) {
      throw new Error(`Passport file not found: ${passportPath}`);
    }

    // Upload du fichier passeport
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile(passportPath);
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (fileInputs.length > 1) {
        await fileInputs[1].uploadFile(passportPath);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 6000));
    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 11000));
  }

  // Finaliser l'onboarding
  static async finishOnboarding(page) {
    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Enter', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  // Page Goals/Funds
  static async handleGoalsSection(page) {
    // Step 1
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'Tab', 4);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Steps 2-6 - Navigation through goals
    for (let i = 2; i <= 6; i++) {
      await page.click(".css-1mwxp4n");
      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    // Step 7 (Confirmation)
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
  }

  // Page Experience
  static async handleExperienceSection(page) {
    // Step 1
    await page.click(".css-1mwxp4n");
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Step 2
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'Tab', 6);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Steps 3-5
    for (let i = 3; i <= 5; i++) {
      await page.click(".css-1mwxp4n");
      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    // Step 6
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'Tab', 3);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Step 7 (Validation) - Avec correction du bug des checkboxes
    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Space', 1);

    await new Promise(resolve => setTimeout(resolve, 4000));
    // Correction du bug: click pour désélectionner les checkboxes
    await page.mouse.click(200, 200);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Space', 1);

    await new Promise(resolve => setTimeout(resolve, 6000));
  }

  // Prendre une capture d'écran
  static async takeScreenshot(page, filename, type = 'success') {
    try {
      const screenshotDir = path.join(__dirname, '..', '..', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const screenshotPath = path.join(screenshotDir, `bricks-${filename}-${type}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Capture d'écran: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      console.error('Erreur lors de la capture d\'écran:', error);
      return null;
    }
  }

  // Processus complet de création de compte
  static async createAccount(accountData, email) {
    let browser, page;
    
    try {
      // Initialiser le navigateur
      ({ browser, page } = await this.createBrowserSession());

      // Chemin vers le fichier passeport
      const passportPath = path.join(__dirname, '..', 'passports', accountData.passportFilename);

      console.log('🔥 Étape 1: Inscription...');
      await this.fillRegistrationForm(page, email);

      console.log('🔥 Étape 2: Vérification OTP...');
      await this.handleOTPVerification(page, email);

      console.log('🔥 Étape 3: Onboarding - Début...');
      await this.handleOnboardingStart(page);

      console.log('🔥 Étape 4: Informations personnelles...');
      await this.fillPersonalInformation(page, accountData);

      console.log('🔥 Étape 5: Numéro de téléphone...');
      await this.fillPhoneNumber(page, accountData.phone);

      console.log('🔥 Étape 6: Adresse...');
      await this.fillAddress(page, accountData.address);

      console.log('🔥 Étape 7: Naissance...');
      await this.fillBirthInformation(page, {
        date: accountData.birthDate,
        place: accountData.birthPlace
      });

      console.log('🔥 Étape 8: Upload passeport...');
      await this.uploadPassport(page, passportPath);

      console.log('🔥 Étape 9: Finalisation onboarding...');
      await this.finishOnboarding(page);

      console.log('🔥 Étape 10: Objectifs...');
      await this.handleGoalsSection(page);

      console.log('🔥 Étape 11: Expérience...');
      await this.handleExperienceSection(page);

      // Capture d'écran de succès
      const baseFilename = path.basename(accountData.passportFilename, path.extname(accountData.passportFilename));
      await this.takeScreenshot(page, baseFilename, 'success');

      console.log(`✅ Compte Bricks créé avec succès pour ${accountData.firstName} ${accountData.lastName}`);
      return { success: true };

    } catch (error) {
      // Capture d'écran d'erreur
      if (page && accountData.passportFilename) {
        const baseFilename = path.basename(accountData.passportFilename, path.extname(accountData.passportFilename));
        await this.takeScreenshot(page, baseFilename, 'error');
      }
      
      throw error;
    } finally {
      // Fermer le navigateur
      if (browser) {
        await browser.close();
      }
    }
  }
}
