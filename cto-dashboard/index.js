/**
 * Point d'entrée principal de l'orchestrateur CTO
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { WebServer } from './core/WebServer.js';
import { CTOAgent } from './core/CTOAgent.js';
import { Logger } from './utils/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Orchestrator {
    constructor() {
        this.logger = new Logger('Orchestrator');
        this.webServer = null;
        this.ctoAgent = null;
        this.config = this.loadConfig();
    }

    loadConfig() {
        return {
            port: process.env.PORT || 3000,
            
            // 🔧 AJOUT: Chemins nécessaires pour SessionHandler
            paths: {
                data: path.join(__dirname, 'data'),
                conversations: path.join(__dirname, 'data', 'conversations'),
                sessions: path.join(__dirname, 'data', 'sessions'),
                web: path.join(__dirname, 'web'),
                static: path.join(__dirname, 'web', 'static'),
                templates: path.join(__dirname, 'web', 'templates')
            },
            
            businessContext: {
                company: "Tech Startup",
                domain: "Development & Innovation",
                role: "CTO Assistant"
            },
            
            // Configuration de session
            session: {
                timeout: 30 * 60 * 1000, // 30 minutes
                autoSave: true,
                saveInterval: 30000 // 30 secondes
            },
            
            // Configuration de l'agent
            agent: {
                model: 'gpt-4',
                maxTokens: 4000,
                temperature: 0.7
            }
        };
    }

    async start() {
        try {
            this.logger.info('🚀 Démarrage de l\'orchestrateur CTO...');

            // Créer les dossiers nécessaires
            await this.ensureDirectories();

            // Initialiser l'agent CTO AVANT le serveur web
            this.ctoAgent = new CTOAgent(this.config);
            await this.ctoAgent.initialize();
            this.logger.info('✅ Agent CTO initialisé');

            // Test de l'agent
            const testResult = await this.ctoAgent.testAgent();
            if (testResult.success) {
                this.logger.info('🧪 Test agent CTO réussi');
            } else {
                this.logger.warn('⚠️ Test agent CTO échoué:', testResult.error);
            }

            // Passer l'agent au serveur web lors de l'initialisation
            this.webServer = new WebServer(this.config, this.ctoAgent);
            
            await this.webServer.start();
            this.logger.info(`🌐 Serveur web démarré sur http://localhost:${this.config.port}`);

            this.logger.info('✅ Orchestrateur CTO démarré avec succès');
            this.logger.info('🔗 Interface disponible sur: http://localhost:' + this.config.port);
            
            // Gérer l'arrêt propre
            this.setupGracefulShutdown();

        } catch (error) {
            this.logger.error('❌ Erreur lors du démarrage:', error);
            process.exit(1);
        }
    }

    // 🔧 AJOUT: Créer les dossiers nécessaires
    async ensureDirectories() {
        const { paths } = this.config;
        
        for (const [name, dirPath] of Object.entries(paths)) {
            try {
                await fs.promises.mkdir(dirPath, { recursive: true });
                this.logger.info(`📁 Dossier créé/vérifié: ${dirPath}`);
                
                // Vérifier que le dossier existe bien
                const exists = fs.existsSync(dirPath);
                this.logger.info(`🔍 Vérification ${name}: ${exists ? 'OK' : 'ERREUR'}`);
                
            } catch (error) {
                this.logger.warn(`⚠️ Erreur création dossier ${dirPath}:`, error.message);
            }
        }
        
        // Vérifier spécifiquement les fichiers web
        const indexPath = path.join(this.config.paths.templates, 'index.html');
        const chatJsPath = path.join(this.config.paths.static, 'js', 'chat.js');
        
        this.logger.info(`🔍 Fichier index.html: ${fs.existsSync(indexPath) ? 'OK' : 'MANQUANT'}`);
        this.logger.info(`🔍 Fichier chat.js: ${fs.existsSync(chatJsPath) ? 'OK' : 'MANQUANT'}`);
    }

    setupGracefulShutdown() {
        const gracefulShutdown = (signal) => {
            this.logger.info(`🛑 Signal reçu: ${signal}`);
            this.logger.info('Arrêt en cours...');
            
            if (this.webServer) {
                this.webServer.stop();
            }
            
            process.exit(0);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
}

// Démarrage
const orchestrator = new Orchestrator();
orchestrator.start().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
});
