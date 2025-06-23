// Puppeteer Autobuilder Agent - version légère, tout-en-un (ES module)
// Usage: node agents/puppeteer-autobuilder.js "objectif en langage naturel"
// Nécessite "type": "module" dans package.json ou extension .mjs

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

// TODO: Remplacer par ta clé OpenAI ou Anthropic
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-...';

// Fonction utilitaire pour appeler l'API OpenAI (GPT-4o, etc.)
async function askLLM(prompt) {
    // TODO: Adapter le prompt et le modèle selon ton API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
            temperature: 0.3
        })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// Fonction pour nettoyer la réponse IA (supprimer les balises ``` et ```javascript)
function cleanAIResponse(action) {
    if (!action) return '';
    // Supprimer les balises markdown
    return action
        .replace(/```javascript[\r\n]?/gi, '')
        .replace(/```/g, '')
        .trim();
}

// Fonction utilitaire pour exécuter dynamiquement une action Puppeteer avec await
// On encapsule l'action dans une fonction async pour supporter 'await' dans le code généré
async function runAction(action) {
    const wrapped = `(async () => { ${action} })()`;
    return await eval(wrapped);
}

// Fonction principale
(async () => {
    const objectif = process.argv.slice(2).join(' ');
    if (!objectif) {
        console.log('Usage: node agents/puppeteer-autobuilder.js "objectif en langage naturel"');
        process.exit(1);
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const actions = [];

    // TODO: Définir la page de départ selon l'objectif
    // Ex: await page.goto('https://rento.com');

    let objectifAtteint = false;
    let step = 0;
    while (!objectifAtteint && step < 20) { // Limite de 20 étapes pour éviter les boucles infinies
        // 1. Observer l'état actuel de la page
        const pageState = await page.content(); // TODO: Résumer le DOM pour le prompt

        // 2. Demander à l'IA la prochaine action à faire
        const prompt = `Objectif: ${objectif}\nVoici le DOM actuel:\n${pageState.slice(0, 2000)}\nQuelle est la prochaine action Puppeteer à exécuter (clic, saisie, navigation, etc.) ? Réponds uniquement par une commande JS Puppeteer, ou "FINI" si l'objectif est atteint. N'utilise pas browser.createIncognitoBrowserContext.`;
        let action = await askLLM(prompt);
        action = cleanAIResponse(action);

        if (!action || action.toUpperCase().includes('FINI')) {
            objectifAtteint = true;
            break;
        }

        // 3. Exécuter l'action proposée (en JS, dans une fonction async)
        try {
            await runAction(action);
            actions.push(action);
            console.log(`✅ Action exécutée: ${action}`);
        } catch (e) {
            console.log(`❌ Erreur à l'étape ${step}: ${e.message}`);
            break;
        }
        step++;
    }

    await browser.close();

    // Générer le script Puppeteer final
    console.log('\n=== SCRIPT PUPPETEER GÉNÉRÉ ===\n');
    console.log('import puppeteer from \'puppeteer\';\n');
    console.log('(async () => {');
    console.log('  const browser = await puppeteer.launch({ headless: false });');
    console.log('  const page = await browser.newPage();');
    // TODO: Ajouter la page de départ
    actions.forEach(a => console.log('  ' + a));
    console.log('  await browser.close();');
    console.log('})();');
})(); 