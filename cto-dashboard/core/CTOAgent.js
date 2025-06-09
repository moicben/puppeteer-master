/**
 * Agent CTO principal - Gestionnaire d'intelligence artificielle
 */

import { Logger } from '../utils/Logger.js';

export class CTOAgent {
  constructor(config) {
    this.config = config;
    this.logger = new Logger('CTOAgent');
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.logger.info('🤖 Initialisation de l\'agent CTO...');
      
      // Simulation de l'initialisation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isInitialized = true;
      this.logger.info('✅ Agent CTO initialisé avec succès');
      
      // Test rapide
      const testResponse = await this.processMessage("Test d'initialisation");
      this.logger.info('🧪 Test agent OK, réponse générée:', testResponse.length + ' caractères');
      
    } catch (error) {
      this.logger.error('❌ Erreur initialisation agent CTO:', error);
      throw error;
    }
  }

  async getCTOResponse(conversationHistory) {
    this.logger.info('🤖 === DEBUT TRAITEMENT AGENT CTO ===');
    
    if (!this.isInitialized) {
      this.logger.error('❌ Agent non initialisé lors de getCTOResponse');
      throw new Error('Agent CTO non initialisé');
    }

    this.logger.info('📊 Analyse historique conversation:', {
      totalMessages: conversationHistory.length,
      messageTypes: conversationHistory.map(msg => msg.role),
      lastActivity: conversationHistory[conversationHistory.length - 1]?.timestamp
    });

    const lastMessage = conversationHistory[conversationHistory.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      this.logger.error('❌ Aucun message utilisateur valide trouvé:', {
        lastMessage: lastMessage,
        hasLastMessage: !!lastMessage,
        lastMessageRole: lastMessage?.role
      });
      throw new Error('Aucun message utilisateur trouvé');
    }

    this.logger.info('📩 Message utilisateur à traiter:', {
      role: lastMessage.role,
      timestamp: lastMessage.timestamp,
      contentLength: lastMessage.content.length,
      contentPreview: lastMessage.content.substring(0, 100) + '...'
    });

    this.logger.info('⚙️ Démarrage processMessage...');
    const startTime = Date.now();
    
    const response = await this.processMessage(lastMessage.content);
    
    const processingTime = Date.now() - startTime;
    this.logger.info('✅ processMessage terminé:', {
      processingTimeMs: processingTime,
      responseGenerated: true,
      responseLength: response.length
    });
    
    this.logger.info('🎉 === TRAITEMENT AGENT CTO TERMINE ===');
    return response;
  }

  async processMessage(message, options = {}) {
    this.logger.info('⚡ === DEBUT PROCESS MESSAGE ===');
    
    if (!this.isInitialized) {
      this.logger.error('❌ Tentative d\'utilisation d\'un agent non initialisé');
      throw new Error('Agent CTO non initialisé');
    }

    this.logger.info('📝 Détails du message à traiter:', {
      messageLength: message.length,
      firstWords: message.split(' ').slice(0, 10).join(' '),
      options: options
    });

    try {
      // 🆕 Détecter les commandes de génération
      if (this.isGenerationCommand(message)) {
        this.logger.info('🚀 Commande de génération détectée');
        return await this.handleGenerationCommand(message, options);
      }

      // Traitement normal
      const processingTime = Math.random() * 2000 + 500; // 0.5-2.5 secondes
      this.logger.info('🕐 Simulation traitement IA...', {
        estimatedTimeMs: Math.round(processingTime)
      });
      
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      this.logger.info('🧠 Génération de la réponse...');
      const response = `En tant que CTO Assistant, je comprends votre question: "${message}". 
      
Voici ma réponse basée sur mon expertise technique et business :

🔧 **Analyse technique :** Votre demande nécessite une approche structurée.

📊 **Recommandations :**
- Évaluer les solutions existantes
- Considérer l'impact sur l'architecture
- Planifier la mise en œuvre

💡 **Prochaines étapes :** Je recommande de définir les spécifications détaillées avant de procéder.

Comment puis-je vous aider davantage sur ce sujet ?`;

      this.logger.info('✅ Réponse générée avec succès:', {
        responseLength: response.length,
        responsePreview: response.substring(0, 100) + '...',
        responseLines: response.split('\n').length
      });
      
      this.logger.info('🎉 === PROCESS MESSAGE TERMINE ===');
      return response;

    } catch (error) {
      this.logger.error('💥 === ERREUR PROCESS MESSAGE ===');
      this.logger.error('❌ Erreur lors du traitement:', error.message);
      this.logger.error('❌ Stack trace:', error.stack);
      throw error;
    }
  }

  isGenerationCommand(message) {
    const generationCommands = [
      '/create-agent',
      '/generate-agent', 
      '/new-agent',
      'générer le code',
      'créer maintenant',
      'générer maintenant',
      'lancer la génération'
    ];
    
    return generationCommands.some(cmd => 
      message.toLowerCase().includes(cmd.toLowerCase())
    );
  }

  async handleGenerationCommand(message, options) {
    try {
      this.logger.info('📋 Extraction des spécifications depuis l\'historique...');
      
      // Extraire les specs depuis l'historique de conversation
      const specs = this.extractSpecsFromHistory(options.conversationHistory || []);
      
      if (!specs.name || !specs.domain) {
        this.logger.info('⚠️ Spécifications insuffisantes');
        return this.requestMoreSpecs();
      }
      
      this.logger.info('🚀 Génération de l\'agent avec les specs:', specs);
      
      // Générer l'agent
      const { AgentGenerator } = await import('../generators/AgentGenerator.js');
      const generator = new AgentGenerator(this.config);
      
      const result = await generator.create(specs);
      
      this.logger.info('✅ Génération terminée:', result);
      return this.formatGenerationSuccess(result);
      
    } catch (error) {
      this.logger.error('❌ Erreur génération depuis CTOAgent:', error);
      return this.formatGenerationError(error);
    }
  }

  extractSpecsFromHistory(history) {
    const specs = {
      name: null,
      domain: 'custom',
      capabilities: [],
      integrations: []
    };
    
    // Analyser les derniers messages pour extraire les specs
    const recentMessages = history.slice(-10); // 10 derniers messages
    const fullText = recentMessages.map(m => m.content).join(' ').toLowerCase();
    
    this.logger.info('📝 Analyse du texte pour extraction:', {
      messagesAnalyzed: recentMessages.length,
      textLength: fullText.length
    });
    
    // Patterns pour extraire le nom
    const namePatterns = [
      /agent\s+([a-zA-Z]+)/i,
      /appelons[- ]le\s+([a-zA-Z]+)/i,
      /nommer\s+([a-zA-Z]+)/i,
      /nom:?\s*([a-zA-Z]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = fullText.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        specs.name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        this.logger.info('🏷️ Nom extrait:', specs.name);
        break;
      }
    }
    
    // Si pas de nom trouvé, générer un nom par défaut
    if (!specs.name) {
      specs.name = `Smart${Date.now().toString().slice(-4)}`;
      this.logger.info('🏷️ Nom généré par défaut:', specs.name);
    }
    
    // Domaines détectés
    const domainKeywords = {
      'analytics': ['analytics', 'analyse', 'métrique', 'rapport', 'dashboard'],
      'scraping': ['scraping', 'scraper', 'extraction', 'récupérer', 'crawl'],
      'payment': ['payment', 'paiement', 'stripe', 'transaction', 'monetiz'],
      'tunnel': ['tunnel', 'conversion', 'vente', 'landing', 'funnel'],
      'security': ['sécurité', 'auth', 'protection', 'monitoring'],
      'social': ['social', 'facebook', 'instagram', 'linkedin', 'twitter']
    };
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        specs.domain = domain;
        this.logger.info('📌 Domaine détecté:', domain);
        break;
      }
    }
    
    // Capacités détectées
    const capabilityKeywords = {
      'analysis': ['analys', 'rapport', 'métrique'],
      'automation': ['automat', 'tâche', 'workflow'],
      'monitoring': ['monitor', 'surveill', 'watch'],
      'optimization': ['optim', 'amélior', 'performance']
    };
    
    for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        specs.capabilities.push(capability);
      }
    }
    
    if (specs.capabilities.length === 0) {
      specs.capabilities = ['automation', 'analysis'];
    }
    
    this.logger.info('📋 Spécifications finales extraites:', specs);
    return specs;
  }

  requestMoreSpecs() {
    return `# 🤖 Génération d'Agent - Spécifications Requises

Pour générer votre agent, j'ai besoin de plus d'informations précises :

## ❓ Informations Manquantes

### 1. **Nom de l'agent**
Comment voulez-vous l'appeler ? (ex: PaymentAnalyzer, DataExtractor, SecurityMonitor)

### 2. **Domaine de spécialisation**
- 📊 **Analytics** : Analyse de données, métriques, rapports
- 🔍 **Scraping** : Extraction de données web, crawling
- 💰 **Payment** : Gestion des paiements, transactions
- 🚀 **Tunnel** : Optimisation des tunnels de conversion
- 🛡️ **Security** : Sécurité, authentification, monitoring
- 📱 **Social** : Gestion des réseaux sociaux

### 3. **Objectif principal**
Quelle tâche spécifique doit automatiser cet agent ?

## 💡 Exemple Complet
\`\`\`
Nom: PaymentAnalyzer
Domaine: Analytics  
Objectif: Analyser les échecs de paiement Stripe et proposer des optimisations
\`\`\`

**🚀 Une fois ces informations fournies, je génère immédiatement votre agent personnalisé !**

*Tapez simplement: "Créer un agent [Nom] pour [Objectif] dans le domaine [Domaine]"*`;
  }

  formatGenerationSuccess(result) {
    return `# 🎉 Agent Généré avec Succès !

## ✅ ${result.agentName}

Votre agent spécialisé a été créé et est opérationnel !

### 📁 Fichiers générés
\`\`\`
🤖 Agent: ${result.agentPath}
🧪 Tests: ${result.testPath}
📄 Documentation: ${result.docPath}
\`\`\`

### 🧪 Test immédiat
\`\`\`bash
# Tester votre agent
node "${result.testPath}"
\`\`\`

### 🔧 Prochaines étapes
1. **Personnalisez la logique** dans les méthodes \`analyze()\`, \`process()\`, \`optimize()\`
2. **Ajoutez vos intégrations** API dans le constructeur
3. **Testez avec des données réelles**
4. **Intégrez à votre orchestrateur principal**

### 🚀 Utilisation
\`\`\`javascript
import { ${result.agentName} } from '${result.agentPath}';

const agent = new ${result.agentName}(config);
await agent.initialize();
const result = await agent.execute(task);
\`\`\`

### 📊 Capacités incluses
${result.capabilities ? result.capabilities.map(cap => `- ⚙️ **${cap}**`).join('\n') : '- Configuration de base'}

**💬 Voulez-vous créer un autre agent ou configurer celui-ci ?**`;
  }

  formatGenerationError(error) {
    return `# ❌ Erreur de Génération

**Problème rencontré :** ${error.message}

### 🔧 Solutions
1. **Vérifiez les permissions** du dossier /agents/
2. **Redémarrez l'application** si nécessaire  
3. **Reformulez votre demande** avec plus de détails

### 💡 Aide
Décrivez clairement :
- Le **nom** de votre agent
- Son **domaine** d'expertise  
- Sa **tâche principale**

**🚀 Je suis prêt à réessayer dès que vous voulez !**`;
  }

  async testAgent() {
    try {
      this.logger.info('🧪 Test de l\'agent CTO...');
      const testMessage = "Pouvez-vous me conseiller sur l'architecture de notre nouveau projet ?";
      const response = await this.processMessage(testMessage);
      this.logger.info('✅ Test agent réussi');
      return { success: true, response };
    } catch (error) {
      this.logger.error('❌ Test agent échoué:', error);
      return { success: false, error: error.message };
    }
  }
}