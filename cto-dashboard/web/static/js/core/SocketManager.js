export class SocketManager {
    constructor(chatInstance) {
        this.chat = chatInstance;
        this.socket = null;
        this.isConnected = false;
    }

    connect() {
        console.log('🔌 === CONNEXION SOCKET.IO ===');
        
        try {
            // Vérifier que Socket.IO est disponible
            if (typeof io === 'undefined') {
                console.error('❌ Socket.IO non chargé - URL:', window.location.href);
                this.chat.ui.updateStatus('Erreur: Socket.IO non disponible', 'error');
                return;
            }

            console.log('🔗 Création connexion Socket.IO vers:', window.location.origin);
            this.socket = io();
            console.log('🔌 Socket.IO instance créée');

            this.setupEventListeners();

        } catch (error) {
            console.error('💥 Exception lors de la connexion Socket.IO:', error);
            this.chat.ui.updateStatus('Erreur de connexion', 'error');
        }
    }

    setupEventListeners() {
        // Événements de connexion
        this.socket.on('connect', () => {
            console.log('✅ === SOCKET.IO CONNECTE ===');
            console.log('🆔 Socket ID:', this.socket.id);
            console.log('🌐 Transport:', this.socket.io.engine.transport.name);
            this.isConnected = true;
            this.chat.ui.updateStatus('Connecté', 'connected');
            this.chat.ui.enableInput();
        });

        this.socket.on('connected', (data) => {
            console.log('🎉 Confirmation serveur reçue:', data);
            this.chat.ui.updateStatus(`Connecté • Agent: ${data.agentStatus}`, 'connected');
            
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
            this.chat.ui.showTypingIndicator();
            this.chat.ui.updateStatus('Message en traitement...', 'processing');
        });

        this.socket.on('agent_response', (data) => {
            console.log('🤖 === REPONSE AGENT RECUE ===');
            console.log('📊 Données réponse:', {
                messageLength: data.message?.length,
                timestamp: data.timestamp,
                messageId: data.messageId
            });
            
            this.chat.ui.hideTypingIndicator();
            this.chat.messageManager.addMessage('assistant', data.message, data.timestamp);
            this.chat.ui.updateStatus('Connecté', 'connected');
            this.chat.ui.enableInput();
        });

        // Événements d'erreur avec plus de détails
        this.socket.on('error', (data) => {
            console.error('❌ === ERREUR SOCKET ===');
            console.error('📊 Données erreur:', data);
            console.error('📊 Stack trace:', data.stack);
            
            this.chat.ui.hideTypingIndicator();
            this.chat.messageManager.addMessage('error', data.message, data.timestamp || new Date().toISOString());
            this.chat.ui.updateStatus('Erreur', 'error');
            this.chat.ui.enableInput();
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ === ERREUR CONNEXION SOCKET ===');
            console.error('📊 Type d\'erreur:', error.type);
            console.error('📊 Description:', error.description);
            console.error('📊 Context:', error.context);
            console.error('📊 Transport:', error.transport);
            
            this.chat.ui.updateStatus('Erreur de connexion', 'error');
            this.chat.ui.disableInput();
        });

        // Log des événements de transport
        this.socket.io.on('error', (error) => {
            console.error('🚨 Erreur transport Socket.IO:', error);
        });
    }

    emit(event, data, callback) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data, callback);
        } else {
            console.error('❌ Socket non connecté pour l\'émission:', event);
        }
    }

    get connected() {
        return this.socket && this.socket.connected;
    }

    get id() {
        return this.socket ? this.socket.id : null;
    }
}
