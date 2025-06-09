console.log('🚀 === DEMARRAGE APP.JS ===');

class CTOChat {
    constructor() {
        console.log('🏗️ Construction de CTOChat...');
        this.socket = null;
        this.currentMode = 'chat';
        this.messageCount = 0;
        this.sessionStartTime = Date.now();
        this.isConnected = false;
        this.isProcessing = false;
        this.conversations = new Map(); // Stockage local des conversations
        this.currentConversationId = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.connectSocket();
        this.startSessionTimer();
        this.loadConversations();
        
        console.log('✅ CTOChat initialisé');
    }

    initializeElements() {
        console.log('🎯 Initialisation des éléments DOM...');
        
        // Elements principaux
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.messageForm = document.getElementById('messageForm');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.chatTitle = document.getElementById('chatTitle');
        
        // Elements de la sidebar
        this.chatHistory = document.getElementById('chatHistory');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.exportChatBtn = document.getElementById('exportChatBtn');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        
        // Elements de statistiques
        this.charCount = document.getElementById('charCount');
        this.messageCountEl = document.getElementById('messageCount');
        this.sessionTime = document.getElementById('sessionTime');
        this.currentModeEl = document.getElementById('currentMode');
        
        // Indicateur de frappe
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // Vérifications
        const requiredElements = [
            'messagesContainer', 'messageInput', 'sendButton', 'messageForm', 
            'statusIndicator', 'typingIndicator'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('❌ Éléments DOM manquants:', missingElements);
        } else {
            console.log('✅ Tous les éléments DOM trouvés');
        }
        
        // Initialiser l'interface
        this.updateStatus('Connexion en cours...', 'connecting');
        this.hideTypingIndicator();
    }

    setupEventListeners() {
        console.log('🎮 Configuration des event listeners...');
        
        // Formulaire de message
        if (this.messageForm) {
            this.messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📤 Soumission formulaire détectée');
                this.sendMessage();
            });
        }

        // Input textarea
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.updateCharCount();
                this.adjustTextareaHeight();
            });

            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('🔄 Envoi via Enter détecté');
                    this.sendMessage();
                }
            });
        }

        // Bouton d'envoi
        if (this.sendButton) {
            this.sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🖱️ Clic bouton envoi détecté');
                this.sendMessage();
            });
        }

        // Boutons de la sidebar
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => {
                console.log('🆕 Nouvelle conversation');
                this.createNewConversation();
            });
        }

        if (this.clearChatBtn) {
            this.clearChatBtn.addEventListener('click', () => {
                console.log('🧹 Effacer conversation');
                this.clearCurrentConversation();
            });
        }

        if (this.exportChatBtn) {
            this.exportChatBtn.addEventListener('click', () => {
                console.log('📤 Exporter conversation');
                this.exportCurrentConversation();
            });
        }

        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                console.log('📱 Toggle sidebar');
                this.toggleSidebar();
            });
        }

        // Boutons de mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-mode');
                console.log('🔄 Changement mode:', mode);
                this.switchMode(mode);
            });
        });

        // Actions rapides
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                console.log('⚡ Action rapide:', action);
                this.handleQuickAction(action);
            });
        });

        console.log('✅ Event listeners configurés');
    }

    connectSocket() {
        console.log('🔌 === CONNEXION SOCKET.IO ===');
        
        try {
            // Vérifier que Socket.IO est disponible
            if (typeof io === 'undefined') {
                console.error('❌ Socket.IO non chargé - URL:', window.location.href);
                this.updateStatus('Erreur: Socket.IO non disponible', 'error');
                return;
            }

            console.log('🔗 Création connexion Socket.IO vers:', window.location.origin);
            this.socket = io();
            console.log('🔌 Socket.IO instance créée');

            // Événements de connexion
            this.socket.on('connect', () => {
                console.log('✅ === SOCKET.IO CONNECTE ===');
                console.log('🆔 Socket ID:', this.socket.id);
                console.log('🌐 Transport:', this.socket.io.engine.transport.name);
                this.isConnected = true;
                this.updateStatus('Connecté', 'connected');
                this.enableInput();
            });

            this.socket.on('connected', (data) => {
                console.log('🎉 Confirmation serveur reçue:', data);
                this.updateStatus(`Connecté • Agent: ${data.agentStatus}`, 'connected');
                
                // Test de communication immédiat
                console.log('🧪 Test de communication...');
                this.socket.emit('test_ping', { test: 'ping', timestamp: new Date().toISOString() });
            });

            // Test de communication
            this.socket.on('test_pong', (data) => {
                console.log('🏓 Test pong reçu:', data);
            });

            // Événements de messages
            this.socket.on('message_received', (data) => {
                console.log('📨 Confirmation réception:', data);
                this.showTypingIndicator();
                this.updateStatus('Message en traitement...', 'processing');
            });

            this.socket.on('agent_response', (data) => {
                console.log('🤖 === REPONSE AGENT RECUE ===');
                console.log('📊 Données réponse:', {
                    messageLength: data.message?.length,
                    timestamp: data.timestamp,
                    messageId: data.messageId
                });
                
                this.hideTypingIndicator();
                this.addMessage('assistant', data.message, data.timestamp);
                this.updateStatus('Connecté', 'connected');
                this.enableInput();
            });

            // Événements d'erreur avec plus de détails
            this.socket.on('error', (data) => {
                console.error('❌ === ERREUR SOCKET ===');
                console.error('📊 Données erreur:', data);
                console.error('📊 Stack trace:', data.stack);
                
                this.hideTypingIndicator();
                this.addMessage('error', data.message, data.timestamp || new Date().toISOString());
                this.updateStatus('Erreur', 'error');
                this.enableInput();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ === ERREUR CONNEXION SOCKET ===');
                console.error('📊 Type d\'erreur:', error.type);
                console.error('📊 Description:', error.description);
                console.error('📊 Context:', error.context);
                console.error('📊 Transport:', error.transport);
                
                this.updateStatus('Erreur de connexion', 'error');
                this.disableInput();
            });

            // Log des événements de transport
            this.socket.io.on('error', (error) => {
                console.error('🚨 Erreur transport Socket.IO:', error);
            });

        } catch (error) {
            console.error('💥 Exception lors de la connexion Socket.IO:', error);
            this.updateStatus('Erreur de connexion', 'error');
        }
    }

    sendMessage() {
        console.log('📤 === ENVOI MESSAGE ===');
        
        const message = this.messageInput.value.trim();
        console.log('📝 Message à envoyer:', {
            length: message.length,
            preview: message.substring(0, 100),
            isEmpty: !message,
            socketConnected: this.socket?.connected,
            socketId: this.socket?.id
        });

        // Vérifications renforcées
        if (!message) {
            console.warn('⚠️ Message vide, envoi annulé');
            return;
        }

        if (!this.socket) {
            console.error('❌ Socket.IO non initialisé');
            this.addMessage('error', 'Socket.IO non initialisé', new Date().toISOString());
            return;
        }

        if (!this.socket.connected) {
            console.error('❌ Socket.IO non connecté');
            console.error('📊 État socket:', {
                connected: this.socket.connected,
                disconnected: this.socket.disconnected,
                id: this.socket.id
            });
            this.addMessage('error', 'Pas de connexion au serveur', new Date().toISOString());
            return;
        }

        if (this.isProcessing) {
            console.warn('⚠️ Traitement en cours, envoi annulé');
            return;
        }

        try {
            // Créer une nouvelle conversation si nécessaire
            if (!this.currentConversationId) {
                this.createNewConversation();
            }

            // Marquer comme en traitement
            this.isProcessing = true;
            
            // Ajouter le message à l'interface et à la conversation
            console.log('🎨 Ajout message utilisateur à l\'interface');
            const userMessage = {
                type: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };
            this.addMessage('user', message, userMessage.timestamp);
            this.addToCurrentConversation(userMessage);
            
            // Vider l'input et désactiver
            this.messageInput.value = '';
            this.updateCharCount();
            this.disableInput();
            
            // Préparer les données avec plus d'informations
            const messageData = {
                message: message,
                timestamp: new Date().toISOString(),
                mode: this.currentMode,
                socketId: this.socket.id,
                conversationId: this.currentConversationId,
                sessionInfo: {
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                }
            };
            
            console.log('📡 === EMISSION MESSAGE SOCKET ===');
            console.log('📊 Données à envoyer:', messageData);
            console.log('📊 État socket avant envoi:', {
                connected: this.socket.connected,
                id: this.socket.id,
                transport: this.socket.io.engine.transport.name
            });
            
            // Envoyer via Socket.IO avec callback
            this.socket.emit('user_message', messageData, (acknowledgment) => {
                console.log('📨 Acknowledgment reçu:', acknowledgment);
            });
            
            console.log('✅ socket.emit(user_message) exécuté');
            
            // Timeout de sécurité
            setTimeout(() => {
                if (this.isProcessing) {
                    console.warn('⏰ Timeout - aucune réponse en 30 secondes');
                    this.addMessage('error', 'Timeout - aucune réponse du serveur', new Date().toISOString());
                    this.enableInput();
                    this.isProcessing = false;
                }
            }, 30000);
            
            // Mettre à jour les statistiques
            this.messageCount++;
            this.updateMessageCount();

        } catch (error) {
            console.error('💥 Exception lors de l\'envoi:', error);
            this.addMessage('error', 'Erreur lors de l\'envoi: ' + error.message, new Date().toISOString());
            this.enableInput();
            this.isProcessing = false;
        }
    }

    loadConversation(conversationId) {
        console.log('📂 Chargement conversation:', conversationId);
        
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;
        
        this.currentConversationId = conversationId;
        
        // Vider l'interface
        this.messagesContainer.innerHTML = '';
        
        // Charger les messages SANS les ajouter à la conversation (ils y sont déjà)
        conversation.messages.forEach(msg => {
            this.addMessageToInterface(msg.type, msg.content, msg.timestamp);
        });
        
        // Mettre à jour le titre
        if (this.chatTitle) {
            this.chatTitle.textContent = conversation.title;
        }
        
        this.messageCount = conversation.messages.filter(m => m.type === 'user').length;
        this.updateMessageCount();

        this.renderConversationHistory();
        
        console.log('✅ Conversation chargée');
    }

    // Nouvelle méthode pour afficher seulement dans l'interface
    addMessageToInterface(type, content, timestamp) {
        console.log('💬 Ajout message interface uniquement:', { type, contentLength: content.length, timestamp });
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        
        const time = new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const roleLabels = {
            'user': 'Vous',
            'assistant': 'Agent CTO',
            'error': 'Erreur'
        };

        messageEl.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-meta">
                    <span class="message-role">${roleLabels[type] || type}</span>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
        
        console.log('✅ Message ajouté à l\'interface uniquement');
    }

    // Modifier la méthode addMessage pour séparer affichage et stockage
    addMessage(type, content, timestamp) {
        console.log('💬 Ajout message:', { type, contentLength: content.length, timestamp });
        
        // Afficher dans l'interface
        this.addMessageToInterface(type, content, timestamp);

        // Ajouter à la conversation seulement si c'est une réponse de l'assistant
        if (type === 'assistant') {
            this.addToCurrentConversation({
                type: 'assistant',
                content: content,
                timestamp: timestamp
            });
        }
    }

    // Gestion des conversations
    createNewConversation() {
        console.log('🆕 Création nouvelle conversation');
        
        const conversationId = 'conv_' + Date.now();
        const conversation = {
            id: conversationId,
            title: 'Nouvelle conversation',
            messages: [],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        this.conversations.set(conversationId, conversation);
        this.currentConversationId = conversationId;
        
        // Vider l'interface de chat
        this.messagesContainer.innerHTML = '';
        this.messageCount = 0;
        this.updateMessageCount();
        
        // Mettre à jour le titre
        if (this.chatTitle) {
            this.chatTitle.textContent = conversation.title;
        }
        
        // Sauvegarder et mettre à jour l'affichage
        this.saveConversations();
        this.renderConversationHistory();
        
        console.log('✅ Nouvelle conversation créée:', conversationId);
    }

    addToCurrentConversation(message) {
        if (!this.currentConversationId) return;
        
        const conversation = this.conversations.get(this.currentConversationId);
        if (conversation) {
            conversation.messages.push(message);
            conversation.lastActivity = new Date().toISOString();
            
            // Mettre à jour le titre avec le premier message utilisateur
            if (conversation.messages.length === 1 && message.type === 'user') {
                conversation.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
                if (this.chatTitle) {
                    this.chatTitle.textContent = conversation.title;
                }
            }
            
            this.saveConversations();
            this.renderConversationHistory();
        }
    }

    clearCurrentConversation() {
        if (!this.currentConversationId) return;
        
        if (confirm('Êtes-vous sûr de vouloir effacer cette conversation ?')) {
            console.log('🧹 Effacement conversation:', this.currentConversationId);
            
            this.messagesContainer.innerHTML = '';
            this.messageCount = 0;
            this.updateMessageCount();
            
            const conversation = this.conversations.get(this.currentConversationId);
            if (conversation) {
                conversation.messages = [];
                conversation.title = 'Nouvelle conversation';
                if (this.chatTitle) {
                    this.chatTitle.textContent = conversation.title;
                }
            }
            
            this.saveConversations();
            this.renderConversationHistory();
        }
    }

    exportCurrentConversation() {
        if (!this.currentConversationId) return;
        
        console.log('📤 Export conversation:', this.currentConversationId);
        
        const conversation = this.conversations.get(this.currentConversationId);
        if (!conversation) return;
        
        const exportData = {
            title: conversation.title,
            createdAt: conversation.createdAt,
            exportedAt: new Date().toISOString(),
            messages: conversation.messages
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation_${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Conversation exportée');
    }

    saveConversations() {
        try {
            const conversationsArray = Array.from(this.conversations.entries());
            localStorage.setItem('cto_conversations', JSON.stringify(conversationsArray));
            console.log('💾 Conversations sauvegardées');
        } catch (error) {
            console.error('❌ Erreur sauvegarde conversations:', error);
        }
    }

    loadConversations() {
        try {
            const saved = localStorage.getItem('cto_conversations');
            if (saved) {
                const conversationsArray = JSON.parse(saved);
                this.conversations = new Map(conversationsArray);
                console.log('📂 Conversations chargées:', this.conversations.size);
                this.renderConversationHistory();
            }
        } catch (error) {
            console.error('❌ Erreur chargement conversations:', error);
        }
    }

    renderConversationHistory() {
        if (!this.chatHistory) return;
        
        this.chatHistory.innerHTML = '';
        
        if (this.conversations.size === 0) {
            this.chatHistory.innerHTML = '<div class="no-conversations">Aucune conversation</div>';
            return;
        }
        
        const sortedConversations = Array.from(this.conversations.entries())
            .sort(([,a], [,b]) => new Date(b.lastActivity) - new Date(a.lastActivity));
        
        sortedConversations.forEach(([id, conversation]) => {
            const div = document.createElement('div');
            div.className = `conversation-item ${id === this.currentConversationId ? 'active' : ''}`;
            
            const lastActivity = new Date(conversation.lastActivity);
            const timeStr = lastActivity.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            div.innerHTML = `
                <div class="conversation-title" title="${conversation.title}">${conversation.title}</div>
                <div class="conversation-meta">
                    <span class="conversation-time">${timeStr}</span>
                    <span class="conversation-count">${conversation.messages.length} msg</span>
                </div>
                <div class="conversation-actions">
                    <button class="conversation-delete" data-id="${conversation.id}" title="Supprimer cette conversation">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Clic pour charger la conversation (éviter la propagation sur le bouton delete)
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.conversation-delete')) {
                    this.loadConversation(conversation.id);
                    // Retirer cette ligne qui cause un re-render inutile
                    // this.renderConversationHistory();
                }
            });
            
            // Bouton supprimer avec confirmation
            const deleteBtn = div.querySelector('.conversation-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher le clic de remonter
                e.preventDefault();
                
                // Animation du bouton pour feedback visuel
                deleteBtn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    deleteBtn.style.transform = 'scale(1)';
                    this.deleteConversation(conversation.id);
                }, 100);
            });
            
            this.chatHistory.appendChild(div);
        });
    }

    deleteConversation(conversationId) {
        // Améliorer le message de confirmation
        const conversation = this.conversations.get(conversationId);
        const conversationTitle = conversation ? conversation.title : 'cette conversation';
        
        if (confirm(`Supprimer définitivement "${conversationTitle}" ?\n\nCette action est irréversible.`)) {
            console.log('🗑️ Suppression conversation:', conversationId);
            
            this.conversations.delete(conversationId);
            
            if (this.currentConversationId === conversationId) {
                this.currentConversationId = null;
                this.messagesContainer.innerHTML = '';
                this.messageCount = 0;
                this.updateMessageCount();
                if (this.chatTitle) {
                    this.chatTitle.textContent = 'Nouvelle conversation';
                }
            }
            
            this.saveConversations();
            this.renderConversationHistory();
            
            // Feedback utilisateur
            this.showToast(`Conversation "${conversationTitle}" supprimée`, 'success');
        } else {
            console.log('🚫 Suppression annulée par l\'utilisateur');
        }
    }

    toggleSidebar() {
        document.body.classList.toggle('sidebar-collapsed');
    }

    switchMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
        
        if (this.currentModeEl) {
            this.currentModeEl.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
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
        
        if (message && this.messageInput) {
            // Remplir le message
            this.messageInput.value = message;
            this.updateCharCount();
            this.adjustTextareaHeight();
            this.messageInput.focus();
            
            // Changer le mode automatiquement
            if (mode) {
                this.switchMode(mode);
            }
        }
    }

    updateStatus(message, type = '') {
        console.log('📊 Mise à jour status:', { message, type });
        
        if (this.statusIndicator) {
            // Ne pas afficher de texte, juste changer la classe pour l'indicateur visuel
            this.statusIndicator.textContent = '';
            this.statusIndicator.className = `status-indicator ${type}`;
        }
    }

    showTypingIndicator() {
        console.log('⌨️ Affichage indicateur de frappe');
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'flex';
        }
    }

    hideTypingIndicator() {
        console.log('🚫 Masquage indicateur de frappe');
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }

    enableInput() {
        console.log('🔓 Activation input');
        if (this.messageInput) this.messageInput.disabled = false;
        if (this.sendButton) this.sendButton.disabled = false;
        if (this.messageInput) this.messageInput.focus();
        this.isProcessing = false;
    }

    disableInput() {
        console.log('🔒 Désactivation input');
        if (this.messageInput) this.messageInput.disabled = true;
        if (this.sendButton) this.sendButton.disabled = true;
    }

    updateCharCount() {
        if (this.charCount && this.messageInput) {
            const count = this.messageInput.value.length;
            this.charCount.textContent = `${count}/4000`;
        }
    }

    updateMessageCount() {
        if (this.messageCountEl) {
            this.messageCountEl.textContent = this.messageCount;
        }
    }

    adjustTextareaHeight() {
        if (this.messageInput) {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    formatMessage(content) {
        // Escape HTML and convert line breaks to <br>
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>');
    }

    startSessionTimer() {
        setInterval(() => {
            const elapsed = Date.now() - this.sessionStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            if (this.sessionTime) {
                this.sessionTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
}

// Initialisation simplifiée sans modules ES6
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 === DOM PRET ===');
    console.log('🔍 Vérifications environnement:', {
        socketIO: typeof io !== 'undefined',
        socketIOVersion: typeof io !== 'undefined' ? io.version : 'N/A',
        url: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host
    });
    
    try {
        window.ctoChat = new CTOChat();
        console.log('🎉 === APPLICATION INITIALISEE ===');
        
        // Test de l'état des éléments DOM
        setTimeout(() => {
            console.log('🔍 État des éléments après 1 seconde:', {
                messageInput: !!document.getElementById('messageInput'),
                sendButton: !!document.getElementById('sendButton'),
                messageForm: !!document.getElementById('messageForm'),
                messagesContainer: !!document.getElementById('messagesContainer')
            });
        }, 1000);
        
    } catch (error) {
        console.error('💥 Erreur initialisation application:', error);
        console.error('📊 Stack trace:', error.stack);
    }
});

// Log global des erreurs
window.addEventListener('error', (event) => {
    console.error('💥 Erreur JavaScript globale:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Test de connexion au chargement
window.addEventListener('load', () => {
    console.log('🔗 Page entièrement chargée');
    console.log('🔍 Éléments disponibles:', {
        socketIO: typeof io !== 'undefined',
        messageInput: !!document.getElementById('messageInput'),
        sendButton: !!document.getElementById('sendButton'),
        messageForm: !!document.getElementById('messageForm'),
        messagesContainer: !!document.getElementById('messagesContainer'),
    });
});