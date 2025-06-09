import readline from 'readline'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import fs from 'fs/promises'
import path from 'path'
dotenv.config()

class BrainstormingAI {
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        
        this.conversationHistory = [];
        this.sessionData = {
            startTime: new Date(),
            questionsCount: 0,
            topics: []
        };
        
        this.systemPrompt = `Tu es un assistant IA de brainstorming avancé avec accès à internet.
        
        Tes capacités :
        - Recherche d'informations en temps réel sur internet
        - Analyse de tendances et actualités
        - Brainstorming créatif et stratégique
        - Propositions concrètes et actionnables
        - Vision prospective et innovation
        
        Ton style : Expert, curieux, créatif et data-driven. Tu combines créativité et données factuelles.
        
        IMPORTANT : Quand tu as besoin d'informations récentes, demande explicitement une recherche web avec [SEARCH: terme de recherche].`;
        
        this.setupInterface();
    }

    setupInterface() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '\n🧠 Vous: '
        });

        console.log('\n=== 🚀 BRAINSTORMING AI AVANCÉ avec Claude Sonnet + Internet ===');
        console.log('🌐 Accès Internet • 💡 Brainstorming Expert • 📊 Analyse de Données');
        console.log('📝 Tapez "aide" pour voir les commandes ou "quit" pour quitter\n');
        
        this.rl.prompt();
        this.rl.on('line', (input) => this.handleInput(input.trim()));
        this.rl.on('close', () => this.goodbye());
    }

    async handleInput(input) {
        if (!input) {
            this.rl.prompt();
            return;
        }

        // Commandes spéciales
        switch(input.toLowerCase()) {
            case 'quit':
            case 'exit':
                await this.saveSession();
                this.rl.close();
                return;
            case 'aide':
            case 'help':
                this.showHelp();
                this.rl.prompt();
                return;
            case 'clear':
            case 'reset':
                this.resetConversation();
                this.rl.prompt();
                return;
            case 'historique':
            case 'history':
                this.showHistory();
                this.rl.prompt();
                return;
            case 'stats':
                this.showStats();
                this.rl.prompt();
                return;
            case 'save':
                await this.saveSession();
                this.rl.prompt();
                return;
        }

        // Traitement de la question normale
        await this.processQuestion(input);
        this.rl.prompt();
    }

    async processQuestion(question) {
        try {
            console.log('\n🤔 Analyse et recherche en cours...\n');
            
            this.sessionData.questionsCount++;
            
            // Ajouter la question à l'historique
            this.conversationHistory.push({
                role: 'user',
                content: question,
                timestamp: new Date().toISOString()
            });

            // Vérifier si une recherche web est nécessaire
            const needsWebSearch = await this.analyzeSearchNeed(question);
            let webData = '';
            
            if (needsWebSearch) {
                console.log('🌐 Recherche d\'informations sur internet...');
                webData = await this.performWebSearch(needsWebSearch);
            }

            // Préparer le contexte enrichi
            const enrichedPrompt = this.buildEnrichedPrompt(question, webData);

            // Préparer les messages pour Claude (SANS timestamp ni champs extra)
            const messages = [
                { role: 'user', content: this.systemPrompt },
                // Nettoyer l'historique pour Claude - garder seulement role et content
                ...this.conversationHistory.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                { role: 'user', content: enrichedPrompt }
            ];

            // Appel à Claude Sonnet
            const response = await this.anthropic.messages.create({
                model: process.env.ANTHROPIC_MODEL_SONNET,
                max_tokens: 2000,
                temperature: 0.8,
                messages: messages
            });

            const aiResponse = response.content[0].text;
            
            // Analyser les topics mentionnés
            this.extractTopics(question + ' ' + aiResponse);
            
            // Ajouter la réponse à l'historique
            this.conversationHistory.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString(),
                hasWebData: !!webData
            });

            // Afficher la réponse avec formatage avancé
            console.log('🤖 Claude:', this.formatResponse(aiResponse));
            
            if (webData) {
                console.log('\n📊 Données web utilisées pour enrichir la réponse');
            }
            
        } catch (error) {
            console.log('❌ Erreur:', this.handleError(error));
        }
    }

    async analyzeSearchNeed(question) {
        // Mots-clés qui indiquent un besoin de recherche
        const searchKeywords = [
            'actualité', 'tendance', 'récent', 'nouveau', 'derniers', 'maintenant',
            'aujourd\'hui', '2024', '2025', 'marché', 'concurrent', 'prix',
            'statistique', 'étude', 'rapport', 'news', 'événement'
        ];

        const needsSearch = searchKeywords.some(keyword => 
            question.toLowerCase().includes(keyword.toLowerCase())
        );

        if (needsSearch) {
            // Extraire les termes de recherche
            const words = question.split(' ').filter(word => word.length > 3);
            return words.slice(0, 5).join(' ');
        }

        return false;
    }

    async performWebSearch(searchTerms) {
        try {
            // Recherche via DuckDuckGo (pas besoin d'API)
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchTerms)}`;
            
            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();
            const $ = cheerio.load(html);
            
            let results = [];
            $('.result').slice(0, 5).each((i, elem) => {
                const title = $(elem).find('.result__title a').text().trim();
                const snippet = $(elem).find('.result__snippet').text().trim();
                const url = $(elem).find('.result__title a').attr('href');
                
                if (title && snippet) {
                    results.push({ title, snippet, url });
                }
            });

            return results.length > 0 ? 
                `Informations récentes trouvées :\n${results.map(r => `• ${r.title}: ${r.snippet}`).join('\n')}` 
                : '';
                
        } catch (error) {
            console.log('⚠️  Recherche web temporairement indisponible');
            return '';
        }
    }

    buildEnrichedPrompt(question, webData) {
        let prompt = question;
        
        if (webData) {
            prompt = `Question: ${question}\n\nInformations contextuelles récentes:\n${webData}\n\nUtilise ces informations pour enrichir ta réponse avec des données actuelles.`;
        }
        
        return prompt;
    }

    extractTopics(text) {
        const commonTopics = [
            'IA', 'intelligence artificielle', 'startup', 'innovation', 'technologie',
            'marketing', 'business', 'stratégie', 'digital', 'data', 'automation',
            'SaaS', 'crypto', 'blockchain', 'cloud', 'mobile', 'web3', 'metaverse'
        ];

        commonTopics.forEach(topic => {
            if (text.toLowerCase().includes(topic.toLowerCase()) && 
                !this.sessionData.topics.includes(topic)) {
                this.sessionData.topics.push(topic);
            }
        });
    }

    formatResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '\x1b[1m$1\x1b[0m') // Gras
            .replace(/\*(.*?)\*/g, '\x1b[3m$1\x1b[0m')     // Italique
            .replace(/```(.*?)```/gs, '\x1b[36m$1\x1b[0m') // Code
            .split('\n')
            .map(line => line.trim() ? `  ${line}` : '')
            .join('\n');
    }

    handleError(error) {
        if (error.message.includes('API key')) {
            return 'Clé API Claude manquante ou invalide.';
        } else if (error.message.includes('rate limit')) {
            return 'Limite de taux atteinte. Patientez quelques instants.';
        } else if (error.message.includes('model')) {
            return 'Modèle Claude indisponible. Vérifiez votre configuration.';
        } else {
            return `Erreur technique: ${error.message}`;
        }
    }

    showHelp() {
        console.log(`
📚 === COMMANDES AVANCÉES ===
💬 Question libre         - Brainstorming avec recherche web automatique
🔧 aide/help             - Afficher cette aide
🧹 clear/reset           - Réinitialiser la conversation
📋 historique           - Historique détaillé
📊 stats                - Statistiques de session
💾 save                 - Sauvegarder la session
🚪 quit/exit            - Quitter et sauvegarder

🌐 === FONCTIONNALITÉS INTERNET ===
• Recherche automatique d'actualités et tendances
• Analyse de données récentes du marché
• Veille concurrentielle en temps réel
• Statistiques et études actualisées

💡 === TYPES DE BRAINSTORMING ===
• Innovation produit/service
• Stratégies marketing créatives  
• Analyse de tendances marché
• Résolution de problèmes business
• Exploration d'opportunités
• Scénarios prospectifs

🎯 === EXEMPLES OPTIMISÉS ===
• "Quelles sont les dernières tendances IA en 2025?"
• "Analyse le marché des startups EdTech récemment"
• "Innovations disruptives dans mon secteur actuellement"
• "Stratégies marketing qui fonctionnent maintenant"
        `);
    }

    showHistory() {
        console.log('\n📋 === HISTORIQUE DÉTAILLÉ ===');
        if (this.conversationHistory.length === 0) {
            console.log('Aucune conversation enregistrée.');
            return;
        }

        this.conversationHistory.forEach((msg, index) => {
            const speaker = msg.role === 'user' ? '🧠 Vous' : '🤖 Claude';
            const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
            const webIcon = msg.hasWebData ? '🌐' : '';
            const preview = msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : '');
            
            console.log(`${index + 1}. ${speaker} ${webIcon} [${time}]`);
            console.log(`   ${preview}\n`);
        });
    }

    showStats() {
        const duration = Math.round((new Date() - this.sessionData.startTime) / 1000 / 60);
        const webSearches = this.conversationHistory.filter(msg => msg.hasWebData).length;
        
        console.log(`
📊 === STATISTIQUES DE SESSION ===
⏱️  Durée: ${duration} minutes
❓ Questions posées: ${this.sessionData.questionsCount}
🌐 Recherches web: ${webSearches}
🏷️  Topics explorés: ${this.sessionData.topics.join(', ') || 'Aucun'}
💬 Messages total: ${this.conversationHistory.length}
        `);
    }

    async saveSession() {
        try {
            const sessionData = {
                timestamp: new Date().toISOString(),
                duration: Math.round((new Date() - this.sessionData.startTime) / 1000 / 60),
                stats: this.sessionData,
                conversation: this.conversationHistory
            };

            const filename = `brainstorm_session_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;
            const filepath = path.join(process.cwd(), 'agents', 'brainstorm', filename);
            
            // Créer le dossier sessions s'il n'existe pas
            await fs.mkdir(path.join(process.cwd(), 'agents', 'brainstorm'), { recursive: true });
            
            await fs.writeFile(filepath, JSON.stringify(sessionData, null, 2));
            console.log(`\n💾 Session sauvegardée: ${filename}`);
            
        } catch (error) {
            console.log('⚠️  Erreur de sauvegarde:', error.message);
        }
    }

    resetConversation() {
        this.conversationHistory = [];
        this.sessionData.questionsCount = 0;
        this.sessionData.topics = [];
        console.log('\n🧹 Conversation réinitialisée. Nouveau départ !');
    }

    goodbye() {
        console.log('\n👋 Merci d\'avoir utilisé Brainstorming AI Avancé !');
        console.log('💡 Session enrichie par les données web en temps réel');
        console.log('🚀 À bientôt pour de nouvelles explorations créatives !');
        process.exit(0);
    }
}

// Vérifications au démarrage
if (!process.env.ANTHROPIC_API_KEY) {
    console.log('\n❌ ERREUR: Clé API Claude manquante');
    console.log('📝 Configurez ANTHROPIC_API_KEY dans votre fichier .env');
    process.exit(1);
}

// Lancement de l'application
const brainstormingAI = new BrainstormingAI();

export default BrainstormingAI;