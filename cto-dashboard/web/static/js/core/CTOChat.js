import { SocketManager } from './SocketManager.js';
import { MessageManager } from '../features/MessageManager.js';
import { ConversationManager } from '../features/ConversationManager.js';
import { UIManager } from '../ui/UIManager.js';
import { EventHandler } from '../ui/EventHandler.js';

export class CTOChat {
    constructor() {
        console.log('🏗️ Construction de CTOChat...');
        
        // Propriétés principales
        this.currentMode = 'chat';
        this.messageCount = 0;
        this.sessionStartTime = Date.now();
        this.isProcessing = false;
        
        // Initialiser les gestionnaires
        this.ui = new UIManager(this);
        this.socketManager = new SocketManager(this);
        this.messageManager = new MessageManager(this);
        this.conversationManager = new ConversationManager(this);
        this.eventHandler = new EventHandler(this);
        
        // Démarrer l'application
        this.init();
        
        console.log('✅ CTOChat initialisé');
    }

    async init() {
        // Connecter socket
        this.socketManager.connect();
        
        // Démarrer le timer de session
        this.startSessionTimer();
        
        // Charger les conversations
        this.conversationManager.loadConversations();
    }

    switchMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
        
        if (this.ui.currentModeEl) {
            this.ui.currentModeEl.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        }
        
        console.log('🔄 Mode changé vers:', mode);
    }

    handleQuickAction(action) {
        console.log('⚡ Action rapide:', action);
        
        const actionMessages = {
            'analyze': 'Analyser mon projet et donner des recommandations techniques',
            'create-agent': 'Créer un agent intelligent pour automatiser une tâche',
            'create-tunnel': 'Créer un tunnel sécurisé pour accéder aux services',
            'orchestrate': 'Orchestrer plusieurs services et APIs ensemble'
        };
        
        // Mapping entre actions et modes
        const actionToMode = {
            'analyze': 'analyze',
            'create-agent': 'create',
            'create-tunnel': 'create',
            'orchestrate': 'orchestrate'
        };
        
        const message = actionMessages[action];
        const mode = actionToMode[action];
        
        if (message && this.ui.messageInput) {
            // Remplir le message
            this.ui.messageInput.value = message;
            this.ui.updateCharCount();
            this.ui.adjustTextareaHeight();
            this.ui.messageInput.focus();
            
            // Changer le mode automatiquement
            if (mode) {
                this.switchMode(mode);
            }
        }
    }

    startSessionTimer() {
        setInterval(() => {
            const elapsed = Date.now() - this.sessionStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            if (this.ui.sessionTime) {
                this.ui.sessionTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
}
