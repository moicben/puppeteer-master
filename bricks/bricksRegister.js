import path from 'path';
import fs, { stat } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

import { pressKey } from '../utils/puppeteer/pressKey.js';
import { launchBrowser } from '../utils/puppeteer/launchBrowser.js';
import { getRandomDomain } from '../utils/getRandomDomain.js';
import { getEmailOtp } from '../utils/getEmailOtp.js';
import { AccountsService } from './config/supabase.js';

// Configuration Supabase
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Script démarré...');
console.log('📁 Répertoire de travail:', __dirname);

const START_URL = 'https://app.bricks.co/register';

// Fonction pour vérifier si le profil contient toutes les données obligatoires
function validateAccountData(accountData) {
  const requiredFields = {
    'first_name': 'Prénom',
    'last_name': 'Nom de famille',
    'email': 'Email',
    'birth_date': 'Date de naissance',
    'birth_place': 'Lieu de naissance',
    'sex': 'Sexe',
    'address': 'Adresse',
    'city': 'Ville',
    'postal_code': 'Code postal'
  };

  const missingFields = [];
  
  for (const [field, label] of Object.entries(requiredFields)) {
    if (!accountData[field] || accountData[field].toString().trim() === '') {
      missingFields.push(label);
    }
  }  // Vérifier que le fichier d'image existe
  const cleanFirstName = accountData.first_name ? accountData.first_name.toLowerCase().split(' ')[0] : '';
  const cleanLastName = accountData.last_name ? accountData.last_name.toLowerCase().replace(/\s+/g, '-').replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[ùûü]/g, 'u').replace(/[ôö]/g, 'o').replace(/[îï]/g, 'i').replace(/ç/g, 'c') : '';
  const idPath = path.join(__dirname, '..', 'assets', 'passports', 'proceed', `${cleanFirstName}-${cleanLastName}.jpg`);
  
  if (!fs.existsSync(idPath)) {
    // Chercher un fichier qui commence par le prénom et nom
    const passportDir = path.join(__dirname, '..', 'assets', 'passports');
    if (fs.existsSync(passportDir)) {
      const files = fs.readdirSync(passportDir);
      const possibleFile = files.find(file => 
        file.toLowerCase().startsWith(`${cleanFirstName}-${cleanLastName.split(' ')[0]}`) ||
        file.toLowerCase().startsWith(`${cleanFirstName}-${cleanLastName}`)
      );
      
      if (!possibleFile) {
        missingFields.push(`Fichier d'image (recherché: ${idPath}, aucun fichier trouvé commençant par ${cleanFirstName}-${cleanLastName.split(' ')[0]})`);
      }
    } else {
      missingFields.push(`Répertoire d'images manquant (${passportDir})`);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields,
    imagePath: idPath
  };
}

// Fonction pour créer un compte Bricks avec les données d'un passeport depuis Supabase
async function createBricksAccount(accountData) {
  console.log(`\n🚀 Création du compte Bricks pour: ${accountData.first_name} ${accountData.last_name}`);
  
  // Lancer le navigateur Puppeteer optimisé
  const { browser, page } = await launchBrowser();
  
  // Utiliser les données du compte Supabase
  const address = accountData.address;
  const city = accountData.city;
  const postal = accountData.postal_code;
  const phone = accountData.phone || '0612345678';
  const birth = accountData.birth_date;
    // Chemin vers l'image d'identité - logique de recherche améliorée
  const cleanFirstName = accountData.first_name.toLowerCase().split(' ')[0];
  const cleanLastName = accountData.last_name.toLowerCase().replace(/\s+/g, '-').replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[ùûü]/g, 'u').replace(/[ôö]/g, 'o').replace(/[îï]/g, 'i').replace(/ç/g, 'c');
  let idPath = path.join(__dirname, '..', 'assets', 'passports', 'proceed', `${cleanFirstName}-${cleanLastName}.jpg`);
  
  // Si le fichier n'existe pas, chercher un fichier similaire
  if (!fs.existsSync(idPath)) {
    const passportDir = path.join(__dirname, '..', 'assets', 'passports');
    const files = fs.readdirSync(passportDir);
    const possibleFile = files.find(file => 
      file.toLowerCase().startsWith(`${cleanFirstName}-${cleanLastName.split(' ')[0]}`) ||
      file.toLowerCase().startsWith(`${cleanFirstName}-${cleanLastName}`)
    );
    
    if (possibleFile) {
      idPath = path.join(__dirname, '..', 'assets', 'passports', possibleFile);
    }
  }
 
  const domain = await getRandomDomain();
  const email = accountData.email;
  
  let status = 'success';
  let comment = 'Account created successfully';
  
  console.log('--> Email:', email);
  console.log('--> Address:', address, city, postal);
  console.log('--> Phone:', phone);
  console.log('--> Birth Date:', birth);

  try {
    // PAGE "Register"
    console.log(`Navigating to ${START_URL}...`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Filling Registration Form...');

    await page.type('input[type="email"]', email, { delay: 100 });
    await page.type('input[type="password"]', 'Cadeau2014!', { delay: 100 });

    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'Tab', 3);
    await pressKey(page, 'Space', 1);

    await new Promise(resolve => setTimeout(resolve, 2000));
    await pressKey(page, 'Enter', 1);

    // Get Email OTP Code
    console.log('Getting OTP Code...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const otp = await getEmailOtp(email);

    if (!otp) {
      throw new Error('Failed to retrieve OTP code from email');
    }

    console.log('OTP Code Received:', otp);

    // Fill OTP Code
    await pressKey(page, 'Tab', 5);
    await page.keyboard.type(`${otp}`, {delay: 200});
    await new Promise(resolve => setTimeout(resolve, 1000));
    await pressKey(page, 'Enter', 1);

    // PAGE "Onboarding"

    // Step 1
    await new Promise(resolve => setTimeout(resolve, 7500));
    await page.click(".css-1mwxp4n");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2 - Personal Information
    // Adapter la navigation selon le sexe (F = Femme, M = Homme)
    const isWoman = accountData.sex === 'F';
    
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
    
    await page.keyboard.type(`${accountData.first_name}`, {delay: 100});
    await page.keyboard.press('Tab');
    await page.keyboard.type(`${accountData.last_name}`, {delay: 100});
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Enter', 1);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3 - Phone Number
    await pressKey(page, 'Tab', 2);
    await page.keyboard.type(`${phone}`, {delay: 100});
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Enter', 1);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4 - Address
    await pressKey(page, 'Tab', 2);
    await page.keyboard.type(`${postal}`, {delay: 100});
    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(`${city}`, {delay: 100});

    // Click sur le pixel 200 x 200 de la page
    await page.mouse.click(200, 200);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(address, { delay: 50 });

    await pressKey(page, 'Tab', 4);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Step 5 - Birth Date and Place
    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(`${birth}`, {delay: 100});
    await pressKey(page, 'Tab', 1);
    
    // Utiliser le lieu de naissance du compte ou une ville par défaut
    const birthPlace = accountData.birth_place;
    await page.keyboard.type(`${birthPlace}`, {delay: 100});

    await pressKey(page, 'Tab', 3);
    await pressKey(page, 'Enter', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Step 6 (Passport Upload)
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'ArrowDown', 1);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await pressKey(page, 'Tab', 1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Vérifier que les fichiers existent
    if (!fs.existsSync(idPath)) {
      throw new Error(`ID file not found: ${idPath}`);
    }

    // Upload des fichiers d'identité avec la méthode correcte
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile(idPath);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 11000));

    // Step 7 (Success)
    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Enter', 1);
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Page "Goals / Funds"

    // Step 1
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'Tab', 4);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 4500));

    // Steps 2-6 - Navigation through goals
    for (let i = 2; i <= 6; i++) {
      await page.click(".css-1mwxp4n");
      await new Promise(resolve => setTimeout(resolve, 4500));
    }

    // Step 7 (Confirmation)
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);

    // PAGE "Experience"

    // Step 1
    await page.click(".css-1mwxp4n");
    await new Promise(resolve => setTimeout(resolve, 4500));

    // Step 2
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'Tab', 6);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 4500));

    // Steps 3-5
    for (let i = 3; i <= 5; i++) {
      await page.click(".css-1mwxp4n");
      await new Promise(resolve => setTimeout(resolve, 4500));
    }

    // Step 6
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'Space', 1);

    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Space', 1);
    await new Promise(resolve => setTimeout(resolve, 4500));

    // Step 7 (Validation)

    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Space', 1);

    await new Promise(resolve => setTimeout(resolve, 4500));
    await page.mouse.click(200, 200);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await pressKey(page, 'Tab', 2);
    await pressKey(page, 'Space', 1);

    await new Promise(resolve => setTimeout(resolve, 6000));

    // Prendre des captures d'écran
    const screenshotDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    await page.screenshot({ path: path.join(screenshotDir, `bricks-${accountData.first_name}-${accountData.last_name}-success.png`) });

    console.log(`✅ created: ${accountData.first_name} ${accountData.last_name}`);

  } catch (error) {
    console.error(`❌ Erreur lors de la création du compte pour ${accountData.first_name} ${accountData.last_name}:`, error);
    
    // Prendre une capture d'écran de l'erreur
    try {
      const screenshotDir = path.join(__dirname, '..', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      await page.screenshot({ path: path.join(screenshotDir, `bricks-${accountData.first_name}-${accountData.last_name}-error.png`) });
    } catch (screenshotError) {
      console.error('Erreur lors de la capture d\'écran:', screenshotError);
    }

    comment = error.message || 'Unknown error';
    status = 'error';
  }
  finally {
    // Close the browser
    await browser.close();
  }

  return {
    accountData: accountData,
    email: email,
    phone: phone,
    address: { address, city, postal },
    birthFormatted: birth,
    status: status,
    comment: comment,
    processedAt: new Date().toISOString()
  };
}

// Fonction principale pour traiter tous les comptes depuis Supabase
async function processAllPassports() {
  try {
    // Initialiser le service Supabase
    const accountsService = new AccountsService();
    
    console.log('🔍 Récupération des comptes avec status "new" depuis Supabase...');
    
    // Récupérer tous les comptes avec status "new"
    const accounts = await accountsService.getAccounts('new', 1000, 0);

    if (!accounts || accounts.length === 0) {
      throw new Error('Aucun compte avec status "new" trouvé dans Supabase');
    }

    console.log(`🚀 Début de la création de ${accounts.length} comptes Bricks...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;    // Traiter chaque compte séquentiellement
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      
      console.log(`\n📋 Traitement ${i + 1}/${accounts.length}: ${account.first_name} ${account.last_name}`);

      // Vérifier d'abord si le profil contient toutes les données nécessaires
      const validation = validateAccountData(account);
      
      if (!validation.isValid) {
        console.log(`❌ Profil incomplet pour ${account.first_name} ${account.last_name}:`);
        console.log(`   Champs manquants: ${validation.missingFields.join(', ')}`);
          // Mettre à jour le status à "incomplete" dans Supabase
        try {
          await accountsService.updateAccountStatus(account.id, 'incomplete', {
            comment: `Profil incomplet - Champs manquants: ${validation.missingFields.join(', ')} - ${new Date().toISOString()}`,
            service: 'bricks'
          });
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour du status:', updateError);
        }
        
        results.push({
          accountData: account,
          status: 'incomplete',
          comment: `Champs manquants: ${validation.missingFields.join(', ')}`,
          processedAt: new Date().toISOString()
        });
        errorCount++;
        
        console.log(`⏩ Passage au profil suivant...`);
        continue; // Passer au profil suivant
      }
      
      console.log(`✅ Profil valide, démarrage de l'inscription...`);      try {
        // Mettre à jour le status à "processing" avant de commencer
        await accountsService.updateAccountStatus(account.id, 'processing', {
          comment: `Début de l'inscription Bricks - ${new Date().toISOString()}`
        });
        
        const result = await createBricksAccount(account);
        results.push(result);
          if (result.status === 'success') {
          successCount++;
          console.log(`✅ Succès pour ${account.first_name} ${account.last_name}`);
            // Mettre à jour le status à "pending"
            await accountsService.updateAccountStatus(account.id, 'pending', {
            comment: `created: ${result.email} - ${new Date().toISOString()}`
            });
        } else {
          errorCount++;
          console.log(`❌ Échec pour ${account.first_name} ${account.last_name}: ${result.comment}`);
          // Mettre à jour le status à "error"
          await accountsService.updateAccountStatus(account.id, 'error', {
            comment: `Erreur lors de la création: ${result.comment} - ${new Date().toISOString()}`
          });
        }

        // Pause entre les créations de compte pour éviter la détection
        if (i < accounts.length - 1) {
          console.log('⏳ Pause de 10 secondes avant le prochain compte...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }      } catch (error) {
        console.error(`❌ Erreur fatale pour ${account.first_name} ${account.last_name}:`, error);
        
        // Mettre à jour le status à "fatal_error"
        await accountsService.updateAccountStatus(account.id, 'fatal_error', {
          comment: `Erreur fatale: ${error.message} - ${new Date().toISOString()}`
        });
        
        results.push({
          accountData: account,
          status: 'fatal_error',
          comment: error.message,
          processedAt: new Date().toISOString()
        });
        errorCount++;
      }
    }

    // Sauvegarder les résultats localement aussi
    const outputFile = path.join(__dirname, `bricks_accounts_${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      metadata: {
        processedAt: new Date().toISOString(),
        totalAccounts: accounts.length,
        successfulAccounts: successCount,
        errors: errorCount
      },
      accounts: results
    }, null, 2));

    console.log(`\n🎉 Traitement terminé !`);
    console.log(`✅ Comptes créés avec succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`💾 Résultats sauvegardés dans: ${outputFile}`);
    console.log(`📊 Status mis à jour dans Supabase`);

    return {
      success: successCount,
      errors: errorCount,
      outputFile: outputFile,
      results: results
    };

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    throw error;
  }
}

// Exporter les fonctions
export { createBricksAccount, processAllPassports };

// Exécuter le script si appelé directement (version Windows compatible)
const isMainModule = process.argv[1] && process.argv[1].includes('bricksRegister.js');

if (isMainModule) {
  (async () => {
    try {
      console.log('🔧 Démarrage du processus...');
      const result = await processAllPassports();
      console.log('🎉 Processus terminé avec succès:', result);
    } catch (error) {
      console.error('❌ Erreur lors du traitement:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  })();
}
