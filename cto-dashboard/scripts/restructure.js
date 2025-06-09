/**
 * Script de restructuration du dossier orchestrator
 * Organise et optimise la structure du projet
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchestratorRoot = path.resolve(__dirname, '..');

class OrchestratorRestructurer {
  constructor() {
    this.newStructure = {
      'core': 'Logique centrale',
      'handlers': 'Gestionnaires d\'événements', 
      'analyzers': 'Analyseurs de projet',
      'generators': 'Générateurs de code',
      'prompts': 'Prompts spécialisés',
      'utils': 'Utilitaires',
      'web/static/css': 'Styles CSS',
      'web/static/js': 'Scripts JavaScript',
      'web/static/assets': 'Assets statiques',
      'web/templates': 'Templates HTML',
      'config': 'Configuration',
      'docs': 'Documentation',
      'scripts': 'Scripts utilitaires',
      'data': 'Données persistantes'
    };
  }

  async createNewStructure() {
    console.log('🏗️ Création de la nouvelle structure...');
    
    for (const dir of Object.keys(this.newStructure)) {
      const dirPath = path.join(orchestratorRoot, dir);
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✅ Créé: ${dir}/`);
    }
  }

  async extractCoreComponents() {
    console.log('🔧 Extraction des composants centraux...');
    
    // 1. CTOAgent.js - Classe principale
    await this.createCTOAgent();
    
    // 2. WebServer.js - Serveur Express + Socket.IO
    await this.createWebServer();
    
    // 3. SystemPrompts.js - Configuration des prompts
    await this.createSystemPrompts();
  }

  async createCTOAgent() {
    const ctoAgentCode = `/**
 * Agent CTO - Classe principale
 * Gère la logique métier et l'interaction avec Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { SystemPrompts } from './SystemPrompts.js';
import { ProjectAnalyzer } from '../analyzers/ProjectAnalyzer.js';
import { Logger } from '../utils/Logger.js';

export class CTOAgent {
  constructor(config) {
    this.config = config;
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey
    });
    this.systemPrompts = new SystemPrompts(config.businessContext);
    this.projectAnalyzer = new ProjectAnalyzer(config.projectRoot);
    this.logger = new Logger('CTOAgent');
    
    this.conversationHistory = [];
  }

  async getCTOResponse(messages) {
    try {
      this.logger.info('Génération réponse Claude', { messageCount: messages.length });
      
      const response = await this.anthropic.messages.create({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: this.config.maxTokens || 2000,
        temperature: this.config.temperature || 0.7,
        system: this.systemPrompts.getMainPrompt(),
        messages: messages
      });

      const responseText = response.content[0].text;
      this.logger.info('Réponse générée', { responseLength: responseText.length });
      
      return responseText;
    } catch (error) {
      this.logger.error('Erreur API Claude', error);
      throw new Error(\`Erreur de communication avec Claude: \${error.message}\`);
    }
  }

  async analyzeProject() {
    return await this.projectAnalyzer.getFullAnalysis();
  }

  async generateAgent(specification) {
    // Déléguer à AgentGenerator
    const { AgentGenerator } = await import('../generators/AgentGenerator.js');
    const generator = new AgentGenerator(this.config);
    return await generator.create(specification);
  }

  async generateTunnel(specification) {
    // Déléguer à TunnelGenerator
    const { TunnelGenerator } = await import('../generators/TunnelGenerator.js');
    const generator = new TunnelGenerator(this.config);
    return await generator.create(specification);
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'core', 'CTOAgent.js'),
      ctoAgentCode
    );
    console.log('✅ CTOAgent.js créé');
  }

  async createWebServer() {
    const webServerCode = `/**
 * Serveur Web pour l'Agent CTO
 * Gère Express, Socket.IO et les routes
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { CTOAgent } from './CTOAgent.js';
import { MessageHandler } from '../handlers/MessageHandler.js';
import { CommandHandler } from '../handlers/CommandHandler.js';
import { SessionHandler } from '../handlers/SessionHandler.js';
import { Logger } from '../utils/Logger.js';

export class WebServer {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);
    this.logger = new Logger('WebServer');
    
    this.ctoAgent = new CTOAgent(config);
    this.messageHandler = new MessageHandler(this.ctoAgent);
    this.commandHandler = new CommandHandler(this.ctoAgent);
    this.sessionHandler = new SessionHandler(config);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  setupMiddleware() {
    this.app.use(express.static(path.join(this.config.orchestratorRoot, 'web', 'static')));
    this.app.use(express.json());
    
    this.logger.info('Middleware configuré');
  }

  setupRoutes() {
    // Route principale
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(this.config.orchestratorRoot, 'web', 'templates', 'index.html'));
    });

    // API routes
    this.app.get('/api/context', (req, res) => {
      res.json(this.config.businessContext);
    });

    this.app.get('/api/sessions', async (req, res) => {
      const sessions = await this.sessionHandler.getAllSessions();
      res.json(sessions);
    });
    
    this.logger.info('Routes configurées');
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      this.logger.info('Nouvelle connexion', { socketId: socket.id });
      
      // Initialiser la session
      this.sessionHandler.createSession(socket.id);
      
      // Gestionnaires d'événements
      socket.on('user_message', (data) => {
        this.messageHandler.handleUserMessage(socket, data);
      });
      
      socket.on('command', (data) => {
        this.commandHandler.handleCommand(socket, data);
      });
      
      socket.on('save_session', (data) => {
        this.sessionHandler.saveSession(socket, data);
      });
      
      socket.on('edit_message', (data) => {
        this.messageHandler.handleEditMessage(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.logger.info('Déconnexion', { socketId: socket.id });
        this.sessionHandler.cleanup(socket.id);
      });
    });
  }

  async start() {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, () => {
        this.logger.info(\`Serveur démarré sur http://localhost:\${this.config.port}\`);
        resolve();
      });
    });
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'core', 'WebServer.js'),
      webServerCode
    );
    console.log('✅ WebServer.js créé');
  }

  async createSystemPrompts() {
    const systemPromptsCode = `/**
 * Prompts système pour l'Agent CTO
 * Centralise tous les prompts et templates
 */

export class SystemPrompts {
  constructor(businessContext) {
    this.businessContext = businessContext;
  }

  getMainPrompt() {
    return \`Tu es un CTO expérimenté et visionnaire, spécialisé dans l'automatisation business et les architectures multi-agents.

CONTEXTE BUSINESS:
- Tunnels de vente ecommerce/ads à grande échelle
- Stack actuel: \${JSON.stringify(this.businessContext.currentStack)}
- Défis: \${this.businessContext.currentChallenges.join(', ')}
- Objectifs: \${this.businessContext.objectives.join(', ')}

CAPACITÉS TECHNIQUES:
- Accès au système de fichiers du projet
- Création d'agents spécialisés
- Construction de tunnels de vente
- Orchestration multi-agents
- Génération de code automatisée

TON RÔLE:
- Analyser l'architecture existante
- Créer des agents spécialisés dans /agents/
- Construire des tunnels dans /tunnels/
- Orchestrer l'écosystème complet
- Penser stratégie ET implémentation

STYLE DE CONVERSATION:
- Direct et pragmatique
- Pose des questions stratégiques
- Propose du code concret
- Pense ROI et impact business
- Challenge les assumptions
- Utilise des emojis pour rendre la conversation plus vivante
- Structure tes réponses avec des titres et des listes

Tu collabores avec un entrepreneur qui veut passer du mode "développeur" au mode "chef d'orchestre".\`;
  }

  getWelcomeMessage() {
    return \`# 🚀 Agent CTO Activé - Interface Optimisée

Bienvenue dans votre interface CTO nouvelle génération ! 

## 🎯 Architecture Optimisée
- **Structure modulaire** : Code organisé et maintenable
- **Séparation des responsabilités** : Chaque composant a un rôle précis
- **Extensibilité** : Ajout facile de nouvelles fonctionnalités
- **Performance** : Chargement optimisé et réactivité accrue

## 💡 Commandes Rapides
- \\\`analyze\\\` - Diagnostic complet de votre stack
- \\\`strategy\\\` - Brainstorming d'orchestration
- \\\`roadmap\\\` - Planning technique détaillé
- \\\`scan\\\` - Analyse de la structure projet

**Que souhaitez-vous explorer en premier ?**\`;
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'core', 'SystemPrompts.js'),
      systemPromptsCode
    );
    console.log('✅ SystemPrompts.js créé');
  }

  async createHandlers() {
    console.log('🎮 Création des gestionnaires...');
    
    await this.createMessageHandler();
    await this.createCommandHandler();
    await this.createSessionHandler();
  }

  async createMessageHandler() {
    const messageHandlerCode = `/**
 * Gestionnaire des messages utilisateur
 */

import { Logger } from '../utils/Logger.js';

export class MessageHandler {
  constructor(ctoAgent) {
    this.ctoAgent = ctoAgent;
    this.logger = new Logger('MessageHandler');
  }

  async handleUserMessage(socket, data) {
    try {
      this.logger.info('Message utilisateur reçu', { messageLength: data.message.length });
      
      const session = this.getSession(socket.id);
      if (!session) return;

      // Ajouter le message utilisateur à l'historique
      session.conversationHistory.push({
        role: 'user',
        content: data.message
      });

      // Obtenir la réponse de Claude
      const response = await this.ctoAgent.getCTOResponse(session.conversationHistory);
      
      // Ajouter la réponse à l'historique
      session.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      // Sauvegarder automatiquement
      await this.saveConversation(socket.id, session.conversationHistory);

      // Envoyer la réponse
      socket.emit('message', {
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Erreur traitement message', error);
      socket.emit('error', {
        message: 'Erreur lors de la communication avec Claude'
      });
    }
  }

  async handleEditMessage(socket, data) {
    try {
      const session = this.getSession(socket.id);
      if (!session) return;

      // Reconstruire l'historique avec le message édité
      const editedHistory = [
        ...session.conversationHistory.slice(0, -1),
        {
          role: 'user',
          content: data.newContent
        }
      ];

      // Obtenir une nouvelle réponse
      const response = await this.ctoAgent.getCTOResponse(editedHistory);
      
      // Mettre à jour l'historique
      session.conversationHistory = [
        ...editedHistory,
        {
          role: 'assistant',
          content: response
        }
      ];

      socket.emit('message', {
        type: 'assistant',
        content: response,
        isEdit: true
      });

    } catch (error) {
      this.logger.error('Erreur édition message', error);
      socket.emit('error', {
        message: 'Erreur lors de l\\'édition du message'
      });
    }
  }

  getSession(sessionId) {
    // À implémenter avec SessionHandler
    return null;
  }

  async saveConversation(sessionId, conversationHistory) {
    // À implémenter avec SessionHandler
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'handlers', 'MessageHandler.js'),
      messageHandlerCode
    );
    console.log('✅ MessageHandler.js créé');
  }

  async createCommandHandler() {
    const commandHandlerCode = `/**
 * Gestionnaire des commandes rapides
 */

import { Logger } from '../utils/Logger.js';

export class CommandHandler {
  constructor(ctoAgent) {
    this.ctoAgent = ctoAgent;
    this.logger = new Logger('CommandHandler');
  }

  async handleCommand(socket, data) {
    try {
      if (!data || !data.command) {
        this.logger.error('Commande manquante', data);
        socket.emit('error', { message: 'Commande non spécifiée' });
        return;
      }
      
      const { command } = data;
      this.logger.info('Commande reçue', { command });

      let response = '';

      switch (command) {
        case 'analyze':
          response = await this.handleAnalyze();
          break;
        case 'strategy':
          response = await this.handleStrategy();
          break;
        case 'roadmap':
          response = await this.handleRoadmap();
          break;
        case 'scan':
          response = await this.handleScan();
          break;
        case 'create-agent':
          response = await this.handleCreateAgent();
          break;
        case 'create-tunnel':
          response = await this.handleCreateTunnel();
          break;
        case 'orchestrate':
          response = await this.handleOrchestrate();
          break;
        case 'context':
          response = await this.handleContext();
          break;
        case 'help':
          response = await this.handleHelp();
          break;
        default:
          response = '❌ Commande inconnue. Utilisez le menu des commandes rapides.';
      }

      socket.emit('message', {
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Erreur commande', error);
      socket.emit('error', {
        message: 'Erreur lors de l\\'exécution de la commande'
      });
    }
  }

  async handleAnalyze() {
    const { AnalysisPrompts } = await import('../prompts/AnalysisPrompts.js');
    return AnalysisPrompts.getAnalysisPrompt();
  }

  async handleStrategy() {
    const { StrategyPrompts } = await import('../prompts/StrategyPrompts.js');
    return StrategyPrompts.getStrategyPrompt();
  }

  async handleRoadmap() {
    const { StrategyPrompts } = await import('../prompts/StrategyPrompts.js');
    return StrategyPrompts.getRoadmapPrompt();
  }

  async handleScan() {
    const analysis = await this.ctoAgent.analyzeProject();
    return this.formatProjectAnalysis(analysis);
  }

  async handleCreateAgent() {
    const { DevelopmentPrompts } = await import('../prompts/DevelopmentPrompts.js');
    return DevelopmentPrompts.getCreateAgentPrompt();
  }

  async handleCreateTunnel() {
    const { DevelopmentPrompts } = await import('../prompts/DevelopmentPrompts.js');
    return DevelopmentPrompts.getCreateTunnelPrompt();
  }

  async handleOrchestrate() {
    const { DevelopmentPrompts } = await import('../prompts/DevelopmentPrompts.js');
    const analysis = await this.ctoAgent.analyzeProject();
    return DevelopmentPrompts.getOrchestrationPrompt(analysis);
  }

  async handleContext() {
    return \`# 📊 Contexte Business\\n\\n\\\`\\\`\\\`json\\n\${JSON.stringify(this.ctoAgent.config.businessContext, null, 2)}\\n\\\`\\\`\\\`\`;
  }

  async handleHelp() {
    const { StrategyPrompts } = await import('../prompts/StrategyPrompts.js');
    return StrategyPrompts.getHelpMessage();
  }

  formatProjectAnalysis(analysis) {
    return \`# 📁 Analyse du Projet

## 🏗️ Structure Optimisée
La nouvelle architecture modulaire améliore la maintenabilité et l'extensibilité.

\${Object.entries(analysis.structure).map(([dir, files]) => 
  \`**\${dir}/** : \${files.length} fichiers\\n\${files.map(f => \`- \${f}\`).join('\\n')}\`
).join('\\n\\n')}

## 🚀 Recommandations
1. **Modularité** : Structure claire et séparée
2. **Scalabilité** : Prêt pour l'ajout de nouveaux composants
3. **Maintenance** : Code organisé et documenté

*Architecture optimisée pour l'orchestration multi-agents !*\`;
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'handlers', 'CommandHandler.js'),
      commandHandlerCode
    );
    console.log('✅ CommandHandler.js créé');
  }

  async createSessionHandler() {
    const sessionHandlerCode = `/**
 * Gestionnaire des sessions et persistance
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/Logger.js';

export class SessionHandler {
  constructor(config) {
    this.config = config;
    this.logger = new Logger('SessionHandler');
    this.activeSessions = new Map();
    this.sessionsFile = path.join(config.orchestratorRoot, 'data', 'sessions.json');
    this.conversationsFile = path.join(config.orchestratorRoot, 'data', 'conversations.json');
  }

  createSession(sessionId) {
    this.activeSessions.set(sessionId, {
      conversationHistory: [],
      startTime: new Date()
    });
    
    this.logger.info('Session créée', { sessionId });
  }

  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  async saveSession(socket, data) {
    try {
      const session = this.activeSessions.get(socket.id);
      if (!session) return;

      const sessionData = {
        sessionId: data.sessionName || \`session_\${Date.now()}\`,
        name: data.sessionName,
        description: data.description || '',
        conversationHistory: session.conversationHistory,
        timestamp: new Date().toISOString(),
        messageCount: session.conversationHistory.length
      };

      // Lire les sessions existantes
      let sessions = [];
      try {
        const sessionsContent = await fs.readFile(this.sessionsFile, 'utf8');
        sessions = JSON.parse(sessionsContent);
      } catch (e) {
        // Fichier n'existe pas
      }

      // Ajouter ou mettre à jour
      const existingIndex = sessions.findIndex(s => s.sessionId === sessionData.sessionId);
      if (existingIndex >= 0) {
        sessions[existingIndex] = sessionData;
      } else {
        sessions.push(sessionData);
      }

      // Sauvegarder
      await fs.writeFile(this.sessionsFile, JSON.stringify(sessions, null, 2));
      
      this.logger.info('Session sauvegardée', { sessionName: data.sessionName });
      
      socket.emit('session_saved', {
        message: \`✅ Session "\${data.sessionName}" sauvegardée avec succès!\`,
        sessionData
      });

    } catch (error) {
      this.logger.error('Erreur sauvegarde session', error);
      socket.emit('error', {
        message: 'Erreur lors de la sauvegarde de session'
      });
    }
  }

  async getAllSessions() {
    try {
      const sessionsContent = await fs.readFile(this.sessionsFile, 'utf8');
      return JSON.parse(sessionsContent);
    } catch (error) {
      return [];
    }
  }

  async saveConversation(sessionId, conversationHistory) {
    try {
      let conversations = [];
      try {
        const data = await fs.readFile(this.conversationsFile, 'utf8');
        conversations = JSON.parse(data);
      } catch (e) {
        // Fichier n'existe pas
      }

      const conversationData = {
        sessionId,
        conversationHistory,
        lastUpdated: new Date().toISOString(),
        messageCount: conversationHistory.length
      };

      const existingIndex = conversations.findIndex(conv => conv.sessionId === sessionId);
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversationData;
      } else {
        conversations.push(conversationData);
      }

      // Limiter à 50 conversations
      if (conversations.length > 50) {
        conversations = conversations.slice(-50);
      }

      await fs.writeFile(this.conversationsFile, JSON.stringify(conversations, null, 2));
      
    } catch (error) {
      this.logger.error('Erreur sauvegarde conversation', error);
    }
  }

  cleanup(sessionId) {
    this.activeSessions.delete(sessionId);
    this.logger.info('Session nettoyée', { sessionId });
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'handlers', 'SessionHandler.js'),
      sessionHandlerCode
    );
    console.log('✅ SessionHandler.js créé');
  }

  async createUtilities() {
    console.log('🛠️ Création des utilitaires...');
    
    await this.createLogger();
    await this.createFileManager();
    await this.createValidator();
  }

  async createLogger() {
    const loggerCode = `/**
 * Système de logging avancé
 */

export class Logger {
  constructor(component) {
    this.component = component;
  }

  info(message, data = {}) {
    console.log(\`ℹ️  [\${this.component}] \${message}\`, data);
  }

  error(message, error = {}) {
    console.error(\`❌ [\${this.component}] \${message}\`, error);
  }

  debug(message, data = {}) {
    if (process.env.DEBUG === 'true') {
      console.log(\`🐛 [\${this.component}] \${message}\`, data);
    }
  }

  warn(message, data = {}) {
    console.warn(\`⚠️  [\${this.component}] \${message}\`, data);
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'utils', 'Logger.js'),
      loggerCode
    );
    console.log('✅ Logger.js créé');
  }

  async createFileManager() {
    const fileManagerCode = `/**
 * Gestionnaire de fichiers optimisé
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from './Logger.js';

export class FileManager {
  constructor() {
    this.logger = new Logger('FileManager');
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      this.logger.debug('Répertoire créé', { path: dirPath });
    } catch (error) {
      this.logger.error('Erreur création répertoire', error);
      throw error;
    }
  }

  async writeFile(filepath, content) {
    try {
      const dir = path.dirname(filepath);
      await this.ensureDirectory(dir);
      await fs.writeFile(filepath, content, 'utf8');
      this.logger.info('Fichier écrit', { filepath });
    } catch (error) {
      this.logger.error('Erreur écriture fichier', error);
      throw error;
    }
  }

  async readFile(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      this.logger.debug('Fichier lu', { filepath });
      return content;
    } catch (error) {
      this.logger.error('Erreur lecture fichier', error);
      throw error;
    }
  }

  async listFiles(dirPath, extension = null) {
    try {
      const files = await fs.readdir(dirPath);
      const filtered = extension 
        ? files.filter(f => f.endsWith(extension))
        : files;
      
      this.logger.debug('Fichiers listés', { dirPath, count: filtered.length });
      return filtered;
    } catch (error) {
      this.logger.error('Erreur listage fichiers', error);
      return [];
    }
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'utils', 'FileManager.js'),
      fileManagerCode
    );
    console.log('✅ FileManager.js créé');
  }

  async createValidator() {
    const validatorCode = `/**
 * Système de validation
 */

import { Logger } from './Logger.js';

export class Validator {
  constructor() {
    this.logger = new Logger('Validator');
  }

  validateAgentConfig(config) {
    const required = ['name', 'type', 'capabilities'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(\`Champs requis manquants: \${missing.join(', ')}\`);
    }
    
    this.logger.debug('Configuration agent validée', config);
    return true;
  }

  validateTunnelConfig(config) {
    const required = ['name', 'steps', 'targetAudience'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(\`Champs requis manquants: \${missing.join(', ')}\`);
    }
    
    this.logger.debug('Configuration tunnel validée', config);
    return true;
  }

  validateEnvironment() {
    const required = ['ANTHROPIC_API_KEY'];
    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      throw new Error(\`Variables d'environnement manquantes: \${missing.join(', ')}\`);
    }
    
    return true;
  }
}`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'utils', 'Validator.js'),
      validatorCode
    );
    console.log('✅ Validator.js créé');
  }

  async createMainIndex() {
    console.log('🎯 Création du point d\'entrée principal...');
    
    const indexCode = `/**
 * Point d'entrée principal de l'Agent CTO Orchestrateur
 * Version optimisée et modulaire
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { WebServer } from './core/WebServer.js';
import { Validator } from './utils/Validator.js';
import { Logger } from './utils/Logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = new Logger('Main');

async function startCTOAgent() {
  try {
    // Validation de l'environnement
    const validator = new Validator();
    validator.validateEnvironment();
    
    // Configuration
    const config = {
      port: process.env.CTO_PORT || 3001,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.CTO_AGENT_MODEL || 'claude-3-5-sonnet-20241022',
      maxTokens: parseInt(process.env.CTO_AGENT_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.CTO_AGENT_TEMPERATURE) || 0.7,
      orchestratorRoot: __dirname,
      projectRoot: path.resolve(__dirname, '..'),
      businessContext: {
        currentStack: {
          infrastructure: ['DigitalOcean', 'Puppeteer', 'Supabase'],
          automation: ['Account Creation', 'Payment Processing', 'Document Analysis'],
          channels: ['Facebook Ads', 'Google Ads', 'TikTok'],
          volume: '10k+ prospects/month'
        },
        currentChallenges: [
          'Trop proche de l\\'exécution technique',
          'Besoin d\\'orchestration multi-agents',
          'Mise à l\\'échelle des tunnels de vente',
          'Vision stratégique vs implémentation'
        ],
        objectives: [
          'Architecture agent-orchestrateur',
          'Délégation intelligente de tâches',
          'Automatisation end-to-end',
          'Scalabilité business'
        ]
      }
    };

    // Démarrage du serveur web
    const webServer = new WebServer(config);
    await webServer.start();
    
    logger.info('🚀 Agent CTO Orchestrateur démarré avec succès');
    logger.info(\`🌐 Interface disponible sur http://localhost:\${config.port}\`);
    
    // Ouverture automatique du navigateur
    await open(\`http://localhost:\${config.port}\`);
    logger.info('🔗 Navigateur ouvert automatiquement');

  } catch (error) {
    logger.error('Erreur de démarrage', error);
    process.exit(1);
  }
}

// Gestion des signaux de fermeture
process.on('SIGINT', () => {
  logger.info('🛑 Arrêt de l\\'Agent CTO...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Arrêt de l\\'Agent CTO...');
  process.exit(0);
});

// Démarrage
startCTOAgent().catch(error => {
  logger.error('Erreur fatale', error);
  process.exit(1);
});`;

    await fs.writeFile(
      path.join(orchestratorRoot, 'index.js'),
      indexCode
    );
    console.log('✅ index.js créé');
  }

  async createPackageJson() {
    console.log('📦 Mise à jour package.json...');
    
    const packageJson = {
      "name": "cto-orchestrateur",
      "version": "2.0.0",
      "description": "Agent CTO avec architecture modulaire optimisée",
      "type": "module",
      "main": "index.js",
      "scripts": {
        "start": "node index.js",
        "dev": "node --watch index.js",
        "restructure": "node scripts/restructure.js",
        "test": "echo \"Tests à implémenter\" && exit 1"
      },
      "dependencies": {
        "@anthropic-ai/sdk": "^0.27.0",
        "express": "^4.18.2",
        "socket.io": "^4.7.5",
        "dotenv": "^16.3.1",
        "open": "^10.0.3"
      },
      "devDependencies": {
        "nodemon": "^3.0.2"
      },
      "keywords": [
        "ai",
        "orchestration",
        "automation",
        "cto",
        "multi-agents"
      ],
      "author": "Agent CTO",
      "license": "MIT"
    };

    await fs.writeFile(
      path.join(orchestratorRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ package.json mis à jour');
  }

  async restructure() {
    console.log('🚀 Démarrage de la restructuration...');
    
    try {
      await this.createNewStructure();
      await this.extractCoreComponents();
      await this.createHandlers();
      await this.createUtilities();
      await this.createMainIndex();
      await this.createPackageJson();
      
      console.log('');
      console.log('✅ Restructuration terminée avec succès !');
      console.log('');
      console.log('📁 Nouvelle structure créée dans orchestrator/');
      console.log('🎯 Point d\'entrée: index.js');
      console.log('🚀 Pour démarrer: npm start');
      console.log('');
      console.log('🔧 Prochaines étapes:');
      console.log('1. Vérifier la configuration .env');
      console.log('2. Créer les prompts manquants');
      console.log('3. Implémenter les générateurs');
      console.log('4. Tester l\'interface web');
      
    } catch (error) {
      console.error('❌ Erreur lors de la restructuration:', error);
      throw error;
    }
  }
}

// Version corrigée pour Windows - utilise une approche plus robuste
const isMainModule = () => {
  try {
    // Méthode 1: Vérifier process.argv[1]
    const executedFile = process.argv[1];
    if (executedFile && executedFile.includes('restructure.js')) {
      return true;
    }
    
    // Méthode 2: Vérifier import.meta.url vs process.argv[1]
    const currentFileUrl = import.meta.url;
    const normalizedArgv = process.argv[1].replace(/\\/g, '/');
    
    if (currentFileUrl.includes(normalizedArgv) || 
        currentFileUrl.endsWith('restructure.js')) {
      return true;
    }
    
    return false;
  } catch (error) {
    // En cas de doute, on considère que c'est un appel direct
    console.log('⚠️  Détection du mode d\'exécution incertaine, exécution par défaut');
    return true;
  }
};

// Debug pour comprendre le problème
console.log('🔍 Debug informations:');
console.log('- import.meta.url:', import.meta.url);
console.log('- process.argv[1]:', process.argv[1]);
console.log('- __filename:', __filename);
console.log('- Détection module principal:', isMainModule());

// Exécution si appelé directement
if (isMainModule()) {
  console.log('✅ Script exécuté directement, démarrage...');
  const restructurer = new OrchestratorRestructurer();
  restructurer.restructure().catch(console.error);
} else {
  console.log('📦 Script importé comme module');
}

export default OrchestratorRestructurer;