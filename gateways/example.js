/**
 * Exemple d'utilisation du système de Gateway centralisé
 * 
 * Ce fichier montre comment utiliser le nouveau système pour traiter
 * des comptes de différents services.
 */

import { processAccountsByService } from './gatewayRegister.js';
import { bricksWorkflow } from './workflows/bricksWorkflow.js';
import { rentoWorkflow } from './workflows/rentoWorkflow.js';

async function processBricksExample() {
  console.log('🔧 Exemple : Traitement des comptes Bricks...');
  
  try {
    const result = await processAccountsByService('bricks', bricksWorkflow);
    console.log('✅ Bricks terminé:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur Bricks:', error);
    throw error;
  }
}

async function processRentoExample() {
  console.log('🔧 Exemple : Traitement des comptes Rento...');
  
  try {
    const result = await processAccountsByService('rento', rentoWorkflow);
    console.log('✅ Rento terminé:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur Rento:', error);
    throw error;
  }
}

async function processAllServicesExample() {
  console.log('🚀 Exemple : Traitement de tous les services...');
  
  const results = {
    bricks: null,
    rento: null,
    errors: []
  };
  
  // Traiter Bricks
  try {
    results.bricks = await processBricksExample();
  } catch (error) {
    results.errors.push({ service: 'bricks', error: error.message });
  }
  
  // Pause entre les services
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Traiter Rento
  try {
    results.rento = await processRentoExample();
  } catch (error) {
    results.errors.push({ service: 'rento', error: error.message });
  }
  
  console.log('📊 Résultats finaux:', results);
  return results;
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      // Choisir l'exemple à exécuter
      const mode = process.argv[2] || 'all';
      
      switch (mode) {
        case 'bricks':
          await processBricksExample();
          break;
        case 'rento':
          await processRentoExample();
          break;
        case 'all':
        default:
          await processAllServicesExample();
          break;
      }
      
      console.log('🎉 Exemple terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans l\'exemple:', error);
      process.exit(1);
    }
  })();
}

export { processBricksExample, processRentoExample, processAllServicesExample }; 