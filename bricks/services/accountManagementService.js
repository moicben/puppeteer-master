import { AccountsService } from '../config/supabase.js';
import { EmailService } from './emailService.js';
import { PassportDataService } from './passportDataService.js';
import { BricksNavigationService } from './bricksNavigationService.js';

export class AccountManagementService {
  
  // Créer un compte complet (avec toutes les vérifications)
  static async createCompleteAccount(passportData) {
    let accountRecord = null;
    
    try {
      console.log(`\n🚀 Préparation du compte pour: ${passportData.analysis.firstGivenName} ${passportData.analysis.surname}`);
      
      // 1. Valider et normaliser les données du passeport
      PassportDataService.validatePassportData(passportData);
      const normalizedPassport = PassportDataService.normalizePassportData(passportData);
      
      // 2. Préparer les données du compte
      const accountData = await PassportDataService.prepareAccountData(normalizedPassport);
      
      // 3. Générer un email unique
      const email = await EmailService.generateUniqueEmail(normalizedPassport);
      
      // 4. Valider l'email
      await EmailService.validateEmailForUse(email);
      
      console.log(`📧 Email généré et validé: ${email}`);
      console.log(`🏠 Adresse: ${accountData.address.address}, ${accountData.address.city} ${accountData.address.postal}`);
      console.log(`📱 Téléphone: ${accountData.phone}`);
      console.log(`🎂 Naissance: ${accountData.birthDate} à ${accountData.birthPlace}`);
      
      // 5. Enregistrer le compte en base (statut: pending)
      accountRecord = await AccountsService.createAccount({
        email: email,
        firstName: accountData.firstName,
        lastName: accountData.lastName,
        phone: accountData.phone,
        address: accountData.address,
        birthFormatted: accountData.birthDate,
        birthPlace: accountData.birthPlace,
        gender: accountData.gender,
        passportFilename: accountData.passportFilename,
        status: 'pending',
        comment: 'Account creation started'
      });
      
      console.log(`💾 Compte enregistré en base avec l'ID: ${accountRecord.id}`);
      
      // 6. Créer le compte sur Bricks
      console.log(`🎯 Début de la création automatique...`);
      
      await BricksNavigationService.createAccount(accountData, email);
      
      // 7. Mettre à jour le statut en succès
      await AccountsService.updateAccountStatus(email, 'success', 'Account created successfully');
      
      console.log(`✅ Compte Bricks créé avec succès pour ${accountData.firstName} ${accountData.lastName}`);
      
      return {
        success: true,
        accountId: accountRecord.id,
        email: email,
        accountData: accountData,
        comment: 'Account created successfully'
      };
      
    } catch (error) {
      console.error(`❌ Erreur lors de la création du compte pour ${passportData.analysis.firstGivenName} ${passportData.analysis.surname}:`, error);
      
      // Mettre à jour le statut en erreur si le compte existe en base
      if (accountRecord && accountRecord.email) {
        try {
          await AccountsService.updateAccountStatus(accountRecord.email, 'error', error.message);
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour du statut:', updateError);
        }
      }
      
      return {
        success: false,
        error: error.message,
        passportData: passportData,
        comment: error.message
      };
    }
  }

  // Traiter une liste de passeports
  static async processPassportsBatch(passports, options = {}) {
    const {
      maxConcurrent = 1, // Traitement séquentiel par défaut
      delayBetween = 30000, // 30 secondes entre chaque compte
      startIndex = 0,
      maxAccounts = null
    } = options;

    console.log(`\n🚀 Début du traitement de ${passports.length} passeports...`);
    console.log(`⚙️ Configuration: ${maxConcurrent} concurrent, ${delayBetween}ms délai`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Filtrer les passeports à traiter
    const passportsToProcess = passports.slice(startIndex, maxAccounts ? startIndex + maxAccounts : undefined);
    
    console.log(`📋 Traitement de ${passportsToProcess.length} passeports (index ${startIndex} à ${startIndex + passportsToProcess.length - 1})`);

    // Traitement séquentiel
    for (let i = 0; i < passportsToProcess.length; i++) {
      const passport = passportsToProcess[i];
      const globalIndex = startIndex + i;
      
      console.log(`\n📋 Traitement ${globalIndex + 1}/${passports.length}: ${passport.analysis.firstGivenName} ${passport.analysis.surname}`);

      try {
        const result = await this.createCompleteAccount(passport);
        results.push(result);
        
        if (result.success) {
          successCount++;
          console.log(`✅ Succès pour ${passport.analysis.firstGivenName} ${passport.analysis.surname}`);
        } else {
          errorCount++;
          console.log(`❌ Échec pour ${passport.analysis.firstGivenName} ${passport.analysis.surname}: ${result.comment}`);
        }

        // Pause entre les créations de compte (sauf pour le dernier)
        if (i < passportsToProcess.length - 1) {
          const delaySec = Math.floor(delayBetween / 1000);
          console.log(`⏳ Pause de ${delaySec} secondes avant le prochain compte...`);
          await new Promise(resolve => setTimeout(resolve, delayBetween));
        }

      } catch (error) {
        console.error(`❌ Erreur fatale pour ${passport.analysis.firstGivenName} ${passport.analysis.surname}:`, error);
        results.push({
          success: false,
          passportData: passport,
          error: error.message,
          comment: 'Fatal error during processing'
        });
        errorCount++;
      }
    }

    // Statistiques finales
    console.log(`\n🎉 Traitement terminé !`);
    console.log(`✅ Comptes créés avec succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Taux de réussite: ${Math.round((successCount / passportsToProcess.length) * 100)}%`);

    return {
      success: successCount,
      errors: errorCount,
      total: passportsToProcess.length,
      results: results,
      stats: {
        successRate: Math.round((successCount / passportsToProcess.length) * 100),
        processedAt: new Date().toISOString()
      }
    };
  }

  // Récupérer les statistiques globales
  static async getGlobalStats() {
    try {
      const stats = await AccountsService.getStats();
      const accounts = await AccountsService.getAllAccounts();
      
      return {
        database: stats,
        recent: accounts.slice(0, 10), // 10 derniers comptes
        summary: {
          total: stats.total,
          success: stats.success || 0,
          error: stats.error || 0,
          pending: stats.pending || 0
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Relancer les comptes en erreur
  static async retryFailedAccounts(maxRetries = 3) {
    try {
      const accounts = await AccountsService.getAllAccounts();
      const failedAccounts = accounts.filter(acc => acc.status === 'error');
      
      console.log(`🔄 Relance de ${failedAccounts.length} comptes en erreur...`);
      
      const results = [];
      
      for (const account of failedAccounts) {
        try {
          // Reconstituer les données du passeport à partir de la base
          const passportData = {
            analysis: {
              firstGivenName: account.first_name,
              surname: account.last_name,
              sex: account.gender,
              birthDate: account.birth_date,
              birthPlace: account.birth_place,
              ville: account.city,
              rue: account.address,
              codePostal: account.postal_code
            },
            newFilename: account.passport_filename
          };
          
          console.log(`🔄 Relance: ${account.first_name} ${account.last_name}`);
          
          // Mettre à jour le statut en pending
          await AccountsService.updateAccountStatus(account.email, 'pending', 'Retry attempt');
          
          // Tenter la création
          const result = await this.createCompleteAccount(passportData);
          results.push(result);
          
        } catch (error) {
          console.error(`❌ Échec de la relance pour ${account.email}:`, error);
          await AccountsService.updateAccountStatus(account.email, 'error', `Retry failed: ${error.message}`);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la relance des comptes:', error);
      throw error;
    }
  }
}
