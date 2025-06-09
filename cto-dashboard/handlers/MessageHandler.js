/**
 * Gestionnaire de messages utilisateur
 */

import { Logger } from '../utils/Logger.js';

export class MessageHandler {
  constructor(ctoAgent, sessionHandler) {
    this.ctoAgent = ctoAgent;
    this.sessionHandler = sessionHandler;
    this.logger = new Logger('MessageHandler');
  }

  isAgentCreationRequest(message) {
    const creationKeywords = [
      'créer un agent',
      'générer un agent', 
      'je veux créer',
      'nouvel agent',
      'agent pour',
      'automatiser avec un agent',
      '/create-agent',
      '/generate-agent',
      'créer maintenant',
      'générer le code'
    ];
    
    return creationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  async extractAgentSpecs(message, history) {
    // Parser les spécifications depuis la conversation
    const specs = {
      name: this.extractAgentName(message),
      domain: this.extractDomain(message, history),
      capabilities: this.extractCapabilities(message, history),
      integrations: this.extractIntegrations(message, history),
      description: this.extractDescription(message)
    };
    
    this.logger.info('📋 Spécifications extraites:', specs);
    
    // Vérifier si on a assez d'infos pour générer
    if (specs.name && specs.domain) {
      return specs;
    }
    
    return null;
  }

  async createActualAgent(specs) {
    try {
      this.logger.info('🚀 Création réelle de l\'agent:', specs);
      
      const { AgentGenerator } = await import('../generators/AgentGenerator.js');
      const generator = new AgentGenerator(this.ctoAgent.config);
      
      const result = await generator.create(specs);
      
      this.logger.info('✅ Agent créé avec succès:', result);
      return result;
      
    } catch (error) {
      this.logger.error('❌ Erreur création agent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatAgentCreationResponse(result) {
    if (result.success) {
      return `# 🎉 Agent Créé avec Succès !

## ✅ ${result.agentName} 

Votre nouvel agent a été généré et est prêt à fonctionner !

### 📍 Localisation
\`\`\`
${result.agentPath}
\`\`\`

### 🚀 Prochaines étapes
1. **Testez votre agent** : \`node ${result.agentPath}\`
2. **Personnalisez la logique** dans les méthodes \`analyze()\`, \`process()\`, \`optimize()\`
3. **Intégrez avec vos APIs** existantes
4. **Déployez en production** 

### 🔧 Capacités disponibles
${result.capabilities ? result.capabilities.map(cap => `- ${cap}`).join('\n') : '- Configuration basique'}

**Voulez-vous que je vous aide à configurer les intégrations spécifiques ?**`;
    } else {
      return `# ❌ Erreur lors de la création

**Problème rencontré :** ${result.error}

### 💡 Suggestions
1. **Précisez davantage** : Quel type d'agent souhaitez-vous ?
2. **Domaine d'expertise** : Analytics, Scraping, Payment, etc.
3. **Cas d'usage concret** : Quelle tâche automatiser ?

**Reformulez votre demande avec plus de détails pour que je puisse générer l'agent parfait !**`;
    }
  }

  requestMoreSpecs() {
    return `# 🤖 Spécifications Manquantes

Pour générer votre agent, j'ai besoin de plus d'informations :

## ❓ Questions Essentielles

### 1. **Nom de l'agent**
Comment voulez-vous l'appeler ? (ex: PaymentAnalyzer, DataScraper, etc.)

### 2. **Domaine d'expertise**
- 📊 **Analytics** : Analyse de données, métriques, rapports
- 🔍 **Scraping** : Extraction de données web
- 💰 **Payment** : Gestion des paiements, transactions
- 🚀 **Tunnel** : Optimisation des tunnels de vente
- 🛡️ **Security** : Sécurité, authentification
- 📱 **Social** : Gestion réseaux sociaux

### 3. **Tâche principale**
Décrivez en une phrase ce que l'agent doit automatiser.

## 💡 Exemple
\`\`\`
Agent: PaymentAnalyzer
Domaine: Analytics  
Tâche: Analyser les échecs de paiement et proposer des optimisations
\`\`\`

**Répondez avec ces informations et je génère immédiatement votre agent !**`;
  }

  extractAgentName(message) {
    // Regex pour extraire le nom de l'agent
    const patterns = [
      /agent\s+([a-zA-Z]+)/i,
      /créer\s+([a-zA-Z]+)/i,
      /([a-zA-Z]+)\s+agent/i,
      /appel[eo]ns?[- ]le\s+([a-zA-Z]+)/i,
      /nom:?\s*([a-zA-Z]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1);
      }
    }
    
    return `Custom${Date.now().toString().slice(-4)}`;
  }

  extractDomain(message, history) {
    const domains = {
      'analytics': ['analys', 'métrique', 'rapport', 'dashboard', 'data'],
      'scraping': ['scrap', 'récupér', 'extract', 'web', 'crawl'],
      'payment': ['paie', 'transaction', 'stripe', 'paypal', 'monetiz'],
      'tunnel': ['tunnel', 'conversion', 'vente', 'landing', 'funnel'],
      'security': ['sécur', 'auth', 'protection', 'monitor'],
      'social': ['social', 'facebook', 'instagram', 'linkedin', 'twitter']
    };
    
    const fullText = (message + ' ' + history.slice(-3).map(h => h.content).join(' ')).toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        return domain;
      }
    }
    
    return 'custom';
  }

  extractCapabilities(message, history) {
    const capabilities = [];
    const fullText = (message + ' ' + history.slice(-3).map(h => h.content).join(' ')).toLowerCase();
    
    const capabilityMap = {
      'analyse': ['analys', 'rapport', 'métrique', 'insight'],
      'monitoring': ['monitor', 'surveill', 'watch', 'track'],
      'automation': ['automat', 'tâche', 'process', 'workflow'],
      'integration': ['api', 'intégr', 'connect', 'webhook'],
      'optimization': ['optim', 'améliorer', 'performance', 'efficac']
    };
    
    for (const [capability, keywords] of Object.entries(capabilityMap)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        capabilities.push(capability);
      }
    }
    
    return capabilities.length > 0 ? capabilities : ['automation', 'analysis'];
  }

  extractIntegrations(message, history) {
    const integrations = [];
    const fullText = (message + ' ' + history.slice(-3).map(h => h.content).join(' ')).toLowerCase();
    
    const integrationMap = {
      'stripe': ['stripe', 'payment', 'paiement'],
      'supabase': ['supabase', 'database', 'bdd'],
      'facebook': ['facebook', 'fb', 'meta'],
      'google': ['google', 'analytics', 'ads'],
      'slack': ['slack', 'notification'],
      'email': ['email', 'mail', 'smtp']
    };
    
    for (const [integration, keywords] of Object.entries(integrationMap)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        integrations.push(integration);
      }
    }
    
    return integrations;
  }

  extractDescription(message) {
    // Extraire une description simple depuis le message
    const cleanMessage = message.replace(/créer un agent|générer un agent|agent pour/gi, '').trim();
    
    if (cleanMessage.length > 10) {
      return `Agent spécialisé pour ${cleanMessage}`;
    }
    
    return 'Agent généré automatiquement';
  }

  async handleUserMessage(socket, data) {
    this.logger.info('📨 === DEBUT TRAITEMENT MESSAGE ===');
    this.logger.info('📨 Données reçues:', {
      socketId: socket.id,
      messageLength: data?.message?.length,
      timestamp: data?.timestamp,
      messagePreview: data?.message?.substring(0, 100)
    });
    
    try {
      // Vérification 1: Agent disponible
      this.logger.info('🔍 Vérification 1: Agent CTO...');
      if (!this.ctoAgent) {
        this.logger.error('❌ Agent CTO non disponible');
        throw new Error('Agent CTO non disponible');
      }
      this.logger.info('✅ Agent CTO disponible');

      // Vérification 2: Agent initialisé
      this.logger.info('🔍 Vérification 2: Initialisation agent...');
      if (!this.ctoAgent.isInitialized) {
        this.logger.error('❌ Agent CTO non initialisé');
        throw new Error('Agent CTO non initialisé');
      }
      this.logger.info('✅ Agent CTO initialisé');

      // Vérification 3: Session
      this.logger.info('🔍 Vérification 3: Session utilisateur...');
      const session = this.sessionHandler.getSession(socket.id);
      if (!session) {
        this.logger.error('❌ Session non trouvée pour:', socket.id);
        throw new Error('Session non trouvée');
      }
      this.logger.info('✅ Session trouvée:', {
        sessionId: session.id,
        messagesCount: session.conversationHistory.length,
        createdAt: session.createdAt
      });

      // Étape 1: Ajouter message utilisateur
      this.logger.info('📝 Étape 1: Ajout message utilisateur...');
      const userMessage = {
        role: 'user',
        content: data.message,
        timestamp: new Date().toISOString()
      };
      
      session.conversationHistory.push(userMessage);
      this.logger.info('✅ Message utilisateur ajouté:', {
        messageId: userMessage.timestamp,
        totalMessages: session.conversationHistory.length
      });

      // Étape 2: Confirmation réception
      this.logger.info('📤 Étape 2: Envoi confirmation réception...');
      socket.emit('message_received', {
        messageId: userMessage.timestamp,
        status: 'processing'
      });
      this.logger.info('✅ Confirmation envoyée');

      // Étape 3: Détecter les demandes de création d'agent
      this.logger.info('🔍 Étape 3a: Détection création d\'agent...');
      const message = data.message;
      
      let agentResponse;
      
      if (this.isAgentCreationRequest(message)) {
        this.logger.info('🤖 Demande de création d\'agent détectée');
        const agentSpecs = await this.extractAgentSpecs(message, session.conversationHistory);
        
        if (agentSpecs) {
          this.logger.info('✅ Spécifications extraites:', agentSpecs);
          const creationResult = await this.createActualAgent(agentSpecs);
          agentResponse = this.formatAgentCreationResponse(creationResult);
        } else {
          this.logger.info('⚠️ Spécifications insuffisantes, demande de précisions');
          agentResponse = this.requestMoreSpecs();
        }
      } else {
        // Traitement normal par l'agent CTO
        this.logger.info('🤖 Étape 3b: Traitement par agent CTO...');
        this.logger.info('📋 Historique envoyé à l\'agent:', {
          totalMessages: session.conversationHistory.length,
          lastMessage: session.conversationHistory[session.conversationHistory.length - 1]
        });
        
        const startTime = Date.now();
        agentResponse = await this.ctoAgent.getCTOResponse(session.conversationHistory);
        const processingTime = Date.now() - startTime;
        
        this.logger.info('✅ Réponse agent reçue:', {
          processingTimeMs: processingTime,
          responseLength: agentResponse.length,
          responsePreview: agentResponse.substring(0, 150) + '...'
        });
      }
      
      this.logger.info('✅ Réponse générée');
      
      // Étape 4: Ajouter réponse à l'historique
      this.logger.info('📝 Étape 4: Ajout réponse à l\'historique...');
      const assistantMessage = {
        role: 'assistant',
        content: agentResponse,
        timestamp: new Date().toISOString()
      };
      
      session.conversationHistory.push(assistantMessage);
      this.logger.info('✅ Réponse ajoutée à l\'historique:', {
        messageId: assistantMessage.timestamp,
        totalMessages: session.conversationHistory.length
      });

      // Étape 5: Envoi au client
      this.logger.info('📤 Étape 5: Envoi réponse au client...');
      const responseData = {
        message: agentResponse,
        timestamp: assistantMessage.timestamp,
        messageId: assistantMessage.timestamp
      };
      
      socket.emit('agent_response', responseData);
      this.logger.info('✅ Réponse envoyée via socket.emit:', {
        event: 'agent_response',
        socketId: socket.id,
        messageId: responseData.messageId
      });

      // Étape 6: Sauvegarde
      this.logger.info('💾 Étape 6: Sauvegarde conversation...');
      await this.sessionHandler.saveConversation(socket.id, session.conversationHistory);
      this.logger.info('✅ Conversation sauvegardée');

      this.logger.info('🎉 === TRAITEMENT MESSAGE TERMINE AVEC SUCCES ===');

    } catch (error) {
      this.logger.error('💥 === ERREUR TRAITEMENT MESSAGE ===');
      this.logger.error('❌ Message d\'erreur:', error.message);
      this.logger.error('❌ Stack trace:', error.stack);
      this.logger.error('❌ Données contexte:', {
        socketId: socket.id,
        hasAgent: !!this.ctoAgent,
        agentInitialized: this.ctoAgent?.isInitialized,
        hasSessionHandler: !!this.sessionHandler
      });
      
      // Envoyer l'erreur au client
      const errorData = {
        message: 'Erreur lors du traitement: ' + error.message,
        timestamp: new Date().toISOString(),
        error: true
      };
      
      socket.emit('error', errorData);
      this.logger.error('📤 Erreur envoyée au client:', errorData);
    }
  }

  handleEditMessage(socket, data) {
    this.logger.info('✏️ Édition de message:', data);
    
    try {
      const session = this.sessionHandler.getSession(socket.id);
      if (!session) {
        throw new Error('Session non trouvée');
      }

      // Trouver et modifier le message
      const messageIndex = session.conversationHistory.findIndex(
        msg => msg.timestamp === data.messageId
      );

      if (messageIndex !== -1) {
        session.conversationHistory[messageIndex].content = data.newContent;
        session.conversationHistory[messageIndex].edited = true;
        session.conversationHistory[messageIndex].editedAt = new Date().toISOString();

        socket.emit('message_edited', {
          messageId: data.messageId,
          newContent: data.newContent
        });

        this.logger.info('✅ Message édité avec succès');
      }

    } catch (error) {
      this.logger.error('❌ Erreur édition message:', error);
      socket.emit('error', { message: 'Erreur lors de l\'édition: ' + error.message });
    }
  }

  handleDeleteMessage(socket, data) {
    this.logger.info('🗑️ Suppression de message:', data);
    
    try {
      const session = this.sessionHandler.getSession(socket.id);
      if (!session) {
        throw new Error('Session non trouvée');
      }

      // Supprimer le message
      const messageIndex = session.conversationHistory.findIndex(
        msg => msg.timestamp === data.messageId
      );

      if (messageIndex !== -1) {
        session.conversationHistory.splice(messageIndex, 1);

        socket.emit('message_deleted', {
          messageId: data.messageId
        });

        this.logger.info('✅ Message supprimé avec succès');
      }

    } catch (error) {
      this.logger.error('❌ Erreur suppression message:', error);
      socket.emit('error', { message: 'Erreur lors de la suppression: ' + error.message });
    }
  }
}
