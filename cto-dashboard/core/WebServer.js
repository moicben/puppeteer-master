/**
 * Serveur Web pour l'Agent CTO
 * Gère Express, Socket.IO et les routes
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { MessageHandler } from '../handlers/MessageHandler.js';
import { CommandHandler } from '../handlers/CommandHandler.js';
import { SessionHandler } from '../handlers/SessionHandler.js';
import { Logger } from '../utils/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebServer {
  // 🔧 CORRECTION: Accepter l'agent CTO en paramètre
  constructor(config, ctoAgent = null) {
    this.config = config;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);
    this.logger = new Logger('WebServer');
    
    // 🔧 CORRECTION: Utiliser l'agent fourni ou créer un agent par défaut
    this.ctoAgent = ctoAgent;
    this.sessionHandler = new SessionHandler(config);
    this.messageHandler = new MessageHandler(this.ctoAgent, this.sessionHandler);
    this.commandHandler = new CommandHandler(this.ctoAgent);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  setupMiddleware() {
    this.app.use(express.static(path.join(__dirname, '..', 'web', 'static')));
    this.app.use(express.json());
    this.app.use('/static', express.static(path.join(__dirname, '../web/static')));
    this.app.use('/js', express.static(path.join(__dirname, '../web/static/js')));
    this.app.use('/css', express.static(path.join(__dirname, '../web/static/css')));
    
    this.logger.info('Middleware configuré');
  }

  setupRoutes() {
    // Route principale
    this.app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'web', 'templates', 'index.html'));
    });

    // API routes
    this.app.get('/api/context', (req, res) => {
        res.json(this.config.businessContext);
    });

    this.app.get('/api/sessions', async (req, res) => {
        const sessions = await this.sessionHandler.getAllSessions();
        res.json(sessions);
    });

    this.app.get('/api/conversations', async (req, res) => {
        try {
            const conversations = await this.sessionHandler.getAllConversations();
            res.json(conversations);
        } catch (error) {
            console.error('Erreur récupération conversations:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });
    
    this.logger.info('Routes configurées');
  }

  setupSocketIO() {
    this.logger.info('🔧 Configuration Socket.IO...');
    
    this.io.on('connection', (socket) => {
        this.logger.info('🔌 === NOUVELLE CONNEXION SOCKET ===');
        this.logger.info('🔌 Client connecté:', {
          socketId: socket.id,
          clientIP: socket.handshake.address,
          timestamp: new Date().toISOString()
        });
        
        // Vérifier les composants nécessaires
        this.logger.info('🔍 État des composants:');
        this.logger.info('  - CTO Agent:', {
          exists: !!this.ctoAgent,
          initialized: this.ctoAgent?.isInitialized,
          status: this.ctoAgent ? (this.ctoAgent.isInitialized ? 'READY' : 'NOT_INITIALIZED') : 'MISSING'
        });
        this.logger.info('  - Session Handler:', { exists: !!this.sessionHandler });
        this.logger.info('  - Message Handler:', { exists: !!this.messageHandler });
        
        // Initialiser la session
        this.logger.info('📝 Création session...');
        const session = this.sessionHandler.createSession(socket.id);
        this.logger.info('✅ Session créée:', {
          sessionId: session.id,
          createdAt: session.createdAt
        });
        
        // Envoyer confirmation de connexion
        this.logger.info('📤 Envoi confirmation connexion...');
        const connectionData = {
            sessionId: socket.id,
            timestamp: new Date().toISOString(),
            agentStatus: this.ctoAgent && this.ctoAgent.isInitialized ? 'ready' : 'not_ready'
        };
        
        socket.emit('connected', connectionData);
        this.logger.info('✅ Confirmation connexion envoyée:', connectionData);
        
        // Écouter les messages utilisateur
        socket.on('user_message', async (data) => {
            this.logger.info('📨 === MESSAGE UTILISATEUR RECU ===');
            this.logger.info('📨 Détails du message:', { 
                socketId: socket.id,
                timestamp: new Date().toISOString(),
                messageExists: !!data?.message,
                messageLength: data?.message?.length,
                messagePreview: data?.message?.substring(0, 50) + '...',
                rawData: data
            });
            
            try {
                // Vérifications préliminaires avec logs détaillés
                this.logger.info('🔍 Vérifications préliminaires...');
                
                if (!this.ctoAgent) {
                    const errorMsg = 'Agent CTO non disponible - Veuillez redémarrer le serveur';
                    this.logger.error('❌ Agent CTO manquant');
                    socket.emit('error', { message: errorMsg });
                    return;
                }
                this.logger.info('✅ Agent CTO présent');

                if (!this.ctoAgent.isInitialized) {
                    const errorMsg = 'Agent CTO non initialisé';
                    this.logger.error('❌ Agent CTO non initialisé');
                    socket.emit('error', { message: errorMsg });
                    return;
                }
                this.logger.info('✅ Agent CTO initialisé');

                if (!this.messageHandler) {
                    const errorMsg = 'Message Handler non disponible';
                    this.logger.error('❌ Message Handler manquant');
                    socket.emit('error', { message: errorMsg });
                    return;
                }
                this.logger.info('✅ Message Handler présent');

                // Transfert vers MessageHandler
                this.logger.info('🔄 === TRANSFERT VERS MESSAGE HANDLER ===');
                this.logger.info('🔄 Données transférées:', {
                  socketId: socket.id,
                  dataKeys: Object.keys(data),
                  messagePreview: data.message?.substring(0, 100)
                });
                
                await this.messageHandler.handleUserMessage(socket, data);
                
                this.logger.info('✅ === MESSAGE TRAITE AVEC SUCCES ===');

            } catch (error) {
                this.logger.error('💥 === ERREUR WEBSOCKET ===');
                this.logger.error('❌ Erreur dans WebServer:', {
                  message: error.message,
                  stack: error.stack,
                  socketId: socket.id
                });
                
                socket.emit('error', { 
                    message: 'Erreur serveur: ' + error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // 🆕 Nouvelles actions pour les agents générés
        socket.on('get_agent_code', async (data, callback) => {
            this.logger.info('📄 Demande de code agent:', data.path);
            
            try {
                const fs = await import('fs/promises');
                const code = await fs.readFile(data.path, 'utf8');
                callback({ success: true, code });
            } catch (error) {
                this.logger.error('❌ Erreur lecture code agent:', error);
                callback({ success: false, error: error.message });
            }
        });
        
        socket.on('test_agent', async (data, callback) => {
            this.logger.info('🧪 Test agent demandé:', data.path);
            
            try {
                const startTime = Date.now();
                
                // Importer et tester l'agent
                const agentModule = await import(data.path);
                const AgentClass = Object.values(agentModule)[0];
                
                const testConfig = {
                    name: 'TestAgent',
                    testMode: true,
                    projectRoot: this.config.projectRoot
                };
                
                const agent = new AgentClass(testConfig);
                await agent.initialize();
                
                const testTask = {
                    type: 'analyze',
                    data: { test: 'données de test' }
                };
                
                const result = await agent.execute(testTask);
                const duration = Date.now() - startTime;
                
                callback({ 
                    success: true, 
                    result: result.success ? 'Test réussi' : result.error || 'Test échoué',
                    duration 
                });
                
            } catch (error) {
                this.logger.error('❌ Erreur test agent:', error);
                callback({ success: false, error: error.message });
            }
        });
        
        socket.on('list_agents', async (callback) => {
            this.logger.info('📋 Liste des agents demandée');
            
            try {
                const fs = await import('fs/promises');
                const path = await import('path');
                
                const agentsDir = path.join(this.config.projectRoot, 'agents');
                
                try {
                    const files = await fs.readdir(agentsDir);
                    const agents = files
                        .filter(file => file.endsWith('Agent.js'))
                        .map(file => ({
                            name: file.replace('.js', ''),
                            path: path.join(agentsDir, file),
                            testPath: path.join(agentsDir, file.replace('.js', '.test.js')),
                            docPath: path.join(agentsDir, file.replace('.js', '.md'))
                        }));
                    
                    callback({ success: true, agents });
                } catch (dirError) {
                    // Dossier agents n'existe pas encore
                    callback({ success: true, agents: [] });
                }
                
            } catch (error) {
                this.logger.error('❌ Erreur liste agents:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Log des autres événements
        socket.on('command', async (data, callback) => {
            this.logger.info('⚡ Commande reçue:', { command: data?.command, socketId: socket.id });
            // ...existing code...
        });
        
        socket.on('save_conversation', (data) => {
            this.logger.info('💾 Sauvegarde conversation demandée:', { socketId: socket.id });
            // ...existing code...
        });
        
        socket.on('edit_message', (data) => {
            this.logger.info('✏️ Édition message demandée:', { messageId: data?.messageId, socketId: socket.id });
            // ...existing code...
        });

        socket.on('delete_message', (data) => {
            this.logger.info('🗑️ Suppression message demandée:', { messageId: data?.messageId, socketId: socket.id });
            // ...existing code...
        });
        
        // Déconnexion avec logs détaillés
        socket.on('disconnect', (reason) => {
            this.logger.info('👋 === DECONNEXION SOCKET ===');
            this.logger.info('👋 Client déconnecté:', {
              socketId: socket.id,
              reason: reason,
              timestamp: new Date().toISOString()
            });
            this.sessionHandler.cleanup(socket.id);
            this.logger.info('🧹 Session nettoyée');
        });
    });
    
    this.logger.info('✅ Socket.IO configuré avec logs renforcés');
  }

  async start() {
    try {
        // 🔧 CORRECTION: Ne pas réinitialiser l'agent ici s'il est déjà fourni
        if (!this.ctoAgent) {
            throw new Error('Agent CTO non fourni au serveur web');
        }
        
        return new Promise((resolve) => {
            this.server.listen(this.config.port || 3000, () => {
                this.logger.info(`🌐 Serveur démarré sur http://localhost:${this.config.port || 3000}`);
                resolve();
            });
        });
    } catch (error) {
        this.logger.error('❌ Erreur démarrage serveur:', error);
        throw error;
    }
  }

  stop() {
    if (this.server) {
        this.server.close();
        this.logger.info('🛑 Serveur arrêté');
    }
  }
}