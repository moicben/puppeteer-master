export class MessageManager {
    constructor(chatInstance) {
        this.chat = chatInstance;
    }

    sendMessage() {
        console.log('📤 === ENVOI MESSAGE ===');
        
        const message = this.chat.ui.messageInput.value.trim();
        console.log('📝 Message à envoyer:', {
            length: message.length,
            preview: message.substring(0, 100),
            isEmpty: !message,
            socketConnected: this.chat.socketManager.connected,
            socketId: this.chat.socketManager.id
        });

        // Vérifications renforcées
        if (!message) {
            console.warn('⚠️ Message vide, envoi annulé');
            return;
        }

        if (!this.chat.socketManager.socket) {
            console.error('❌ Socket.IO non initialisé');
            this.addMessage('error', 'Socket.IO non initialisé', new Date().toISOString());
            return;
        }

        if (!this.chat.socketManager.connected) {
            console.error('❌ Socket.IO non connecté');
            this.addMessage('error', 'Pas de connexion au serveur', new Date().toISOString());
            return;
        }

        if (this.chat.isProcessing) {
            console.warn('⚠️ Traitement en cours, envoi annulé');
            return;
        }

        try {
            // Créer une nouvelle conversation si nécessaire
            if (!this.chat.conversationManager.currentConversationId) {
                this.chat.conversationManager.createNewConversation();
            }

            // Marquer comme en traitement
            this.chat.isProcessing = true;
            
            // Ajouter le message à l'interface et à la conversation
            console.log('🎨 Ajout message utilisateur à l\'interface');
            const userMessage = {
                type: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };
            this.addMessage('user', message, userMessage.timestamp);
            this.chat.conversationManager.addToCurrentConversation(userMessage);
            
            // Vider l'input et désactiver
            this.chat.ui.messageInput.value = '';
            this.chat.ui.updateCharCount();
            this.chat.ui.disableInput();
            
            // Préparer les données avec plus d'informations
            const messageData = {
                message: message,
                timestamp: new Date().toISOString(),
                mode: this.chat.currentMode,
                socketId: this.chat.socketManager.id,
                conversationId: this.chat.conversationManager.currentConversationId,
                sessionInfo: {
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                }
            };
            
            console.log('📡 === EMISSION MESSAGE SOCKET ===');
            console.log('📊 Données à envoyer:', messageData);
            
            // Envoyer via Socket.IO avec callback
            this.chat.socketManager.emit('user_message', messageData, (acknowledgment) => {
                console.log('📨 Acknowledgment reçu:', acknowledgment);
            });
            
            console.log('✅ socket.emit(user_message) exécuté');
            
            // Timeout de sécurité
            setTimeout(() => {
                if (this.chat.isProcessing) {
                    console.warn('⏰ Timeout - aucune réponse en 30 secondes');
                    this.addMessage('error', 'Timeout - aucune réponse du serveur', new Date().toISOString());
                    this.chat.ui.enableInput();
                    this.chat.isProcessing = false;
                }
            }, 30000);
            
            // Mettre à jour les statistiques
            this.chat.messageCount++;
            this.chat.ui.updateMessageCount();

        } catch (error) {
            console.error('💥 Exception lors de l\'envoi:', error);
            this.addMessage('error', 'Erreur lors de l\'envoi: ' + error.message, new Date().toISOString());
            this.chat.ui.enableInput();
            this.chat.isProcessing = false;
        }
    }

    addMessage(type, content, timestamp) {
        console.log('💬 Ajout message:', { type, contentLength: content.length, timestamp });
        
        // Détecter si c'est un résultat de génération
        if (this.isGenerationResult(content)) {
            this.displayGenerationResult(type, content, timestamp);
        } else {
            this.displayRegularMessage(type, content, timestamp);
        }

        // Ajouter à la conversation seulement si c'est une réponse de l'assistant
        if (type === 'assistant') {
            this.chat.conversationManager.addToCurrentConversation({
                type: 'assistant',
                content: content,
                timestamp: timestamp
            });
        }
    }

    isGenerationResult(content) {
        return content.includes('Agent Créé avec Succès') || 
               content.includes('Agent Généré avec Succès') ||
               content.includes('✅ Agent') ||
               content.includes('agentPath') ||
               content.includes('Fichiers générés');
    }

    displayGenerationResult(type, content, timestamp) {
        console.log('🤖 Affichage résultat génération');
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type} generation-result`;
        
        const time = new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Extraire les chemins des fichiers pour ajouter des actions
        const pathMatches = content.match(/```[\s\S]*?```/g) || [];
        const agentPaths = pathMatches.map(match => 
            match.replace(/```/g, '').trim().split('\n')
        ).flat().filter(path => path.includes('Agent'));

        const mainAgentPath = agentPaths.find(path => 
            path.includes('Agent.js') && !path.includes('.test.') && !path.includes('.md')
        );

        messageEl.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                ${mainAgentPath ? this.createAgentActions(mainAgentPath) : ''}
                <div class="message-meta">
                    <span class="message-role">Agent CTO</span>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;

        this.chat.ui.messagesContainer.appendChild(messageEl);
        this.chat.ui.scrollToBottom();
    }

    displayRegularMessage(type, content, timestamp) {
        // Affichage normal des messages
        this.addMessageToInterface(type, content, timestamp);
    }

    createAgentActions(agentPath) {
        return `
            <div class="agent-actions">
                <button class="action-btn secondary" onclick="window.ctoChat.copyToClipboard('${agentPath}')">
                    📋 Copier le chemin
                </button>
                <button class="action-btn secondary" onclick="window.ctoChat.showAgentCode('${agentPath}')">
                    👁️ Voir le code
                </button>
                <button class="action-btn primary" onclick="window.ctoChat.testAgent('${agentPath}')">
                    🧪 Tester l'agent
                </button>
                <button class="action-btn info" onclick="window.ctoChat.listAgents()">
                    📋 Tous les agents
                </button>
            </div>
        `;
    }

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

        this.chat.ui.messagesContainer.appendChild(messageEl);
        this.chat.ui.scrollToBottom();
        
        console.log('✅ Message ajouté à l\'interface uniquement');
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
}
