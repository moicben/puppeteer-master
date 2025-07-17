import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

import { pressKey } from '../../utils/puppeteer/pressKey.js';
import { launchBrowser } from '../../utils/puppeteer/launchBrowser.js';
import { AccountsService } from '../config/supabase.js';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Script de vérification des comptes Bricks démarré...');
console.log('📁 Répertoire de travail:', __dirname);

const START_URL = 'https://app.bricks.co/';

// Initialiser le service Supabase
const accountsService = new AccountsService();

// Fonction pour se connecter à un compte Bricks et vérifier le statut
async function checkBricksAccount(accountData) {
  console.log(`\n🔍 Vérification du compte: ${accountData.first_name} ${accountData.last_name} - ${accountData.email}`);
  
  // Lancer le navigateur Puppeteer optimisé
  const { browser, page } = await launchBrowser();
  
  let status = 'pending';
  let comment = 'Checking account status';
  
  try {
    console.log(`Navigating to ${START_URL}...`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Rechercher les champs de connexion
    const emailInput = await page.$('input[type="email"]');
    await new Promise(resolve => setTimeout(resolve, 1500));
    const passwordInput = await page.$('input[type="password"]');
    
    if (!emailInput || !passwordInput) {
      throw new Error('Champs de connexion non trouvés sur la page');
    }

    console.log('Saisie des identifiants de connexion...');
    await page.type('input[type="email"]', accountData.email, { delay: 100 });
    await page.type('input[type="password"]', 'Cadeau2014!', { delay: 100 });    // Cliquer sur le bouton de connexion ou appuyer sur Entrée
    await new Promise(resolve => setTimeout(resolve, 2000));
    await pressKey(page, 'Enter', 1);

    // Attendre d'être redirigé vers le dashboard
    await new Promise(resolve => setTimeout(resolve, 9000));

    // S'assurer que l'URL actuelle ne contient pas "login"
    const currentUrl = page.url();
    console.log('URL actuelle:', currentUrl);
    if (currentUrl.includes('login')) {
      console.log('🔒 Error login');
      status = 'error';
      comment = "Couldn't login browser maybe blocked or not working";

      // Afficher les erreurs de la console du navigateur pour debug
      console.log('--------------------------------');
      const consoleLogs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('console.log')).map(el => el.textContent);
      });
      console.log('📝 Console logs:', consoleLogs);
      console.log('--------------------------------');s

    } else {
      // Vérifier la présence de la bannière "waitBanner"
      const waitBanner = await page.$('.css-dxjesb');
      
      if (waitBanner) {
        console.log('⏳ Bannière "waitBanner" trouvée - Compte en cours de traitement');
        status = 'soon';
        comment = 'Account in progress: waitBanner element found';
      } else {
        // Vérifier la présence de la bannière "errorBanner"
        const errorBanner = await page.$('.css-1s9durk');
        
        if (errorBanner) {
        console.log('❌ Bannière "errorBanner" trouvée - Compte rejeté');
        status = 'rejected';
        comment = 'Account rejected: errorBanner element found';
        } else {
        console.log('✅ Aucune bannière trouvée - Compte vérifié');
        status = 'verified';
        comment = 'Account verified: no banner elements found on dashboard';
        }
      }
    } 

    // Prendre une capture d'écran pour documentation
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    
    // Créer le dossier screenshots s'il n'existe pas
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const screenshotPath = path.join(screenshotsDir, `${accountData.email.replace(/[@.]/g, '_')}_${status}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('📸 Capture d\'écran sauvegardée:', screenshotPath);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du compte:', error.message);
    status = 'error';
    comment = `Error during verification: ${error.message}`;
  } finally {
    // Fermer le navigateur
    await browser.close();
  }

  return {
    accountId: accountData.id,
    email: accountData.email,
    status: status,
    comment: comment,
    checkedAt: new Date().toISOString()
  };
}

// Fonction pour vérifier un compte spécifique par email
async function checkSpecificAccount(email) {
  try {
    console.log(`🔍 Recherche du compte avec l'email: ${email}`);
    
    // Récupérer le compte par email
    const account = await accountsService.getAccountByEmail(email);
    
    if (!account) {
      console.log(`❌ Aucun compte trouvé avec l'email: ${email}`);
      return;
    }

    console.log(`✅ Compte trouvé: ${account.first_name} ${account.last_name}`);
    console.log(`📊 Statut actuel: ${account.status}`);
    
    // Vérifier le compte
    const result = await checkBricksAccount(account);
    
    // Mettre à jour le statut du compte dans Supabase
    await accountsService.updateAccountStatus(
      result.accountId,
      result.status,
      {
        comment: result.comment,
        checked_at: result.checkedAt
      }
    );

    console.log(`✅ Statut mis à jour en base: ${result.status}`);
    
    return result;

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du compte spécifique:', error);
    throw error;
  }
}

// Fonction pour analyser les arguments de ligne de commande
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    return { mode: 'all' };
  }
  
  const firstArg = args[0];
  
  // Vérifier si c'est une commande pour un statut spécifique
  if (firstArg === 'soon' || firstArg === 'pending') {
    return { mode: 'status', status: firstArg };
  }
  
  // Validation basique de l'email
  if (firstArg && firstArg.includes('@')) {
    return { mode: 'specific', email: firstArg };
  } else {
    console.log('❌ Format d\'argument invalide');
    console.log('Usage: node bricksCheck.js [options]');
    console.log('Options:');
    console.log('  [email@exemple.com]  Vérifier un compte spécifique par email');
    console.log('  pending              Vérifier tous les comptes avec le statut "pending"');
    console.log('  soon                 Vérifier tous les comptes avec le statut "soon"');
    console.log('  (aucun argument)     Vérifier tous les comptes "pending" par défaut');
    process.exit(1);
  }
}

// Fonction pour traiter tous les comptes avec un statut spécifique
async function checkAccountsByStatus(status) {
  try {
    console.log(`📊 Récupération des comptes avec le statut "${status}"...`);
    
    // Récupérer tous les comptes avec le statut spécifié
    const accounts = await accountsService.getAccounts(status, 100, 0);
    
    if (!accounts || accounts.length === 0) {
      console.log(`ℹ️ Aucun compte avec le statut "${status}" trouvé`);
      return;
    }

    console.log(`📋 ${accounts.length} compte(s) à vérifier...`);

    const results = [];
    let processedCount = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;
    let soonCount = 0;
    let errorCount = 0;

    // Traiter chaque compte un par un
    for (const account of accounts) {
      try {
        console.log(`\n⏳ [${processedCount + 1}/${accounts.length}] Traitement en cours...`);
        
        const result = await checkBricksAccount(account);
        
        // Mettre à jour le statut du compte dans Supabase
        await accountsService.updateAccountStatus(
          result.accountId,
          result.status,
          {
            comment: result.comment,
            checked_at: result.checkedAt
          }
        );

        console.log(`✅ Statut mis à jour en base: ${result.status}`);
        
        results.push(result);
        processedCount++;

        // Compter les résultats
        if (result.status === 'verified') verifiedCount++;
        else if (result.status === 'rejected') rejectedCount++;
        else if (result.status === 'soon') soonCount++;
        else if (result.status === 'error') errorCount++;

        // Attendre un peu entre chaque vérification pour éviter la détection
        if (processedCount < accounts.length) {
          console.log('⏱️ Attente de 3 secondes avant le prochain compte...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Erreur lors du traitement du compte ${account.email}:`, error.message);
        errorCount++;
        processedCount++;
      }
    }

    // Afficher le résumé
    console.log('\n🎉 Vérification terminée !');
    console.log('📊 Résumé des résultats:');
    console.log(`  • Comptes traités: ${processedCount}/${accounts.length}`);
    console.log(`  • Comptes vérifiés: ${verifiedCount}`);
    console.log(`  • Comptes en vérification (soon): ${soonCount}`);
    console.log(`  • Comptes rejetés: ${rejectedCount}`);
    console.log(`  • Erreurs: ${errorCount}`);

    return {
      processed: processedCount,
      verified: verifiedCount,
      soon: soonCount,
      rejected: rejectedCount,
      errors: errorCount,
      details: results
    };

  } catch (error) {
    console.error('❌ Erreur générale lors de la vérification:', error);
    throw error;
  }
}

// Fonction principale pour traiter tous les comptes avec le statut "pending" (pour compatibilité)
async function checkAllPendingAccounts() {
  return await checkAccountsByStatus('pending');
}

// Exporter les fonctions
export { checkBricksAccount, checkAllPendingAccounts, checkSpecificAccount };

// Exécuter le script si appelé directement
const isMainModule = process.argv[1] && process.argv[1].includes('bricksCheck.js');

if (isMainModule) {
  (async () => {
    try {
      const args = parseCommandLineArgs();
      
      if (args.mode === 'specific') {
        console.log(`🎯 Mode spécifique: vérification du compte ${args.email}`);
        await checkSpecificAccount(args.email);
      } else if (args.mode === 'status') {
        console.log(`📊 Mode statut: vérification de tous les comptes "${args.status}"`);
        await checkAccountsByStatus(args.status);
      } else {
        console.log('📊 Mode par défaut: vérification de tous les comptes pending');
        await checkAllPendingAccounts();
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution:', error);
      process.exit(1);
    }
  })();
}
