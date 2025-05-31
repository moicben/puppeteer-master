import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the directory of the current module and load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined in .env file');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour nettoyer un nom pour l'email
function cleanNameForEmail(name) {
  return name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ÿý]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '') // Supprimer tous les caractères spéciaux
    .substring(0, 20); // Limiter la longueur
}

// Fonction pour vérifier si un email est valide
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Fonction pour vérifier si un email existe déjà
async function emailExists(email) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw error;
  }
}

// Fonction pour créer un compte dans Supabase
async function createAccount(accountData) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .insert([{
        email: accountData.email,
        first_name: accountData.first_name,
        last_name: accountData.last_name,
        birth_date: accountData.birth_date,
        birth_place: accountData.birth_place,
        address: accountData.address,
        postal_code: accountData.postal_code,
        city: accountData.city,
        country: accountData.country,
        sex: accountData.sex,
        document_number: accountData.document_number,
        expiry_date: accountData.expiry_date,
        issue_date: accountData.issue_date,
        issuing_state: accountData.issuing_state,
        mrz1: accountData.mrz1,
        mrz2: accountData.mrz2,
        status: accountData.status || 'pending',
        notes: accountData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}
const emailDomains = [
  "@cpav3.com",
  "@nuclene.com",
  "@steveix.com",
  "@mocvn.com",
  "@tenvil.com",
  "@tgvis.com",
  "@amozix.com",
  "@anypsd.com",
  "@maxric.com"
];

// Fonction pour générer un email unique
async function generateUniqueEmail(firstName, lastName) {
  const cleanFirst = cleanNameForEmail(firstName);
  const cleanLast = cleanNameForEmail(lastName);
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    let emailPrefix;
    
    if (attempts === 0) {
      // Première tentative: prenom.nom
      emailPrefix = `${cleanFirst}.${cleanLast}`;
    } else if (attempts === 1) {
      // Deuxième tentative: prenom_nom
      emailPrefix = `${cleanFirst}_${cleanLast}`;
    } else if (attempts === 2) {
      // Troisième tentative: prenomnom
      emailPrefix = `${cleanFirst}${cleanLast}`;
    } else {
      // Tentatives suivantes: ajouter des chiffres
      const randomNum = Math.floor(Math.random() * 9999);
      emailPrefix = `${cleanFirst}${cleanLast}${randomNum}`;
    }

    // Choisir un domaine aléatoire
    const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const email = `${emailPrefix}${domain}`;
    
    // Vérifier que l'email est valide
    if (!isValidEmail(email)) {
      console.log(`⚠️ Email invalide généré: ${email}, tentative suivante...`);
      attempts++;
      continue;
    }    // Vérifier que l'email n'existe pas déjà en base
    const exists = await emailExists(email);
    
    if (!exists) {
      console.log(`✅ Email unique généré: ${email}`);
      return email;
    }
    
    console.log(`⚠️ Email déjà existant: ${email}, tentative ${attempts + 1}/${maxAttempts}`);
    attempts++;
  }
  
  throw new Error(`Impossible de générer un email unique après ${maxAttempts} tentatives pour ${firstName} ${lastName}`);
}

// Fonction principale d'importation
async function importToSupabase(jsonFilePath) {
  try {
    console.log('🚀 Début de l\'importation vers Supabase...');
    
    // Lire le fichier JSON
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    const results = jsonData.results;
    
    console.log(`📋 ${results.length} enregistrements à importer...`);
    
    let importedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const normalizedData = result.normalizedData;
      
      try {
        console.log(`\n📷 [${i + 1}/${results.length}] Traitement de: ${normalizedData.firstName} ${normalizedData.lastName}...`);
        
        // Générer un email unique
        const email = await generateUniqueEmail(normalizedData.firstName, normalizedData.lastName);
          // Préparer les données pour Supabase (retirer nationality qui n'existe pas dans la table)
        const accountData = {
          email: email,
          first_name: normalizedData.firstName,
          last_name: normalizedData.lastName,
          birth_date: normalizedData.birthDate,
          birth_place: normalizedData.birthPlace,
          address: normalizedData.address,
          postal_code: normalizedData.postalCode,
          city: normalizedData.city,
          country: normalizedData.country,
          sex: normalizedData.sex,
          document_number: normalizedData.documentNumber,
          expiry_date: normalizedData.expiryDate,
          issue_date: normalizedData.issueDate,
          issuing_state: normalizedData.issuingState,
          mrz1: normalizedData.mrz1,
          mrz2: normalizedData.mrz2,
          status: 'new',
          notes: `Imported from ${path.basename(jsonFilePath)} on ${new Date().toISOString()}`
        };
        
        // Sauvegarder en base Supabase
        const savedAccount = await createAccount(accountData);
        console.log(`💾 [${i + 1}] Sauvegardé avec ID: ${savedAccount.id} - ${email}`);
        importedCount++;
        
      } catch (error) {
        console.error(`❌ [${i + 1}] Erreur pour ${normalizedData.firstName} ${normalizedData.lastName}:`, error.message);
        errors.push({
          index: i + 1,
          name: `${normalizedData.firstName} ${normalizedData.lastName}`,
          error: error.message
        });
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Importation terminée !`);
    console.log(`📊 Statistiques:`);
    console.log(`  • Importés avec succès: ${importedCount}/${results.length}`);
    console.log(`  • Erreurs: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Détail des erreurs:`);
      errors.forEach(err => {
        console.log(`  • [${err.index}] ${err.name}: ${err.error}`);
      });
    }
    
    return {
      imported: importedCount,
      errors: errorCount,
      details: errors
    };
    
  } catch (error) {
    console.error('❌ Erreur générale lors de l\'importation:', error);
    throw error;
  }
}

// Fonction pour afficher l'aide
function showHelp() {
  console.log(`
📋 Importateur de données vers Supabase
=======================================

Usage: node importToSupabase.js [options]

Options:
  --file <path>    Chemin vers le fichier JSON à importer
  --help          Afficher cette aide
  
Exemples:
  node importToSupabase.js --file extracted_passports_2025-05-29.json
  node importToSupabase.js --file ../extracted_passports_2025-05-29.json

💾 FONCTION:
Ce script importe les données d'un fichier JSON d'extraction de passeports
vers la table 'accounts' de Supabase avec génération d'emails uniques.
`);
}

// Parsing des arguments CLI
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        options.file = args[i + 1];
        i++; // Skip next argument
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (args[i].startsWith('--')) {
          console.error(`❌ Option inconnue: ${args[i]}`);
          showHelp();
          process.exit(1);
        }
    }
  }
  
  return options;
}

// Exécuter le script si appelé directement
const isMainModule = process.argv[1] && process.argv[1].endsWith('importToSupabase.js');

if (isMainModule) {
  (async () => {
    try {
      const options = parseArgs();
      
      if (options.help) {
        showHelp();
        process.exit(0);
      }
      
      if (!options.file) {
        console.error('❌ Fichier requis. Utilisez --file <chemin>');
        showHelp();
        process.exit(1);
      }
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(options.file)) {
        console.error(`❌ Fichier non trouvé: ${options.file}`);
        process.exit(1);
      }
      
      console.log(`🚀 Importation du fichier: ${options.file}`);
      await importToSupabase(options.file);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'importation:', error);
      process.exit(1);
    }
  })();
}

export { importToSupabase };
