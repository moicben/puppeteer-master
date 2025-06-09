export class EventHandler {
    constructor(chatInstance) {
        this.chat = chatInstance;
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('🎮 Configuration des event listeners...');
        
        // Formulaire de message
        if (this.chat.ui.messageForm) {
            this.chat.ui.messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📤 Soumission formulaire détectée');
                this.chat.messageManager.sendMessage();
            });
        }

        // Input textarea
        if (this.chat.ui.messageInput) {
            this.chat.ui.messageInput.addEventListener('input', () => {
                this.chat.ui.updateCharCount();
                this.chat.ui.adjustTextareaHeight();
            });

            this.chat.ui.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('🔄 Envoi via Enter détecté');
                    this.chat.messageManager.sendMessage();
                }
            });
        }

        // Bouton d'envoi
        if (this.chat.ui.sendButton) {
            this.chat.ui.sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🖱️ Clic bouton envoi détecté');
                this.chat.messageManager.sendMessage();
            });
        }

        // Boutons de la sidebar
        if (this.chat.ui.newChatBtn) {
            this.chat.ui.newChatBtn.addEventListener('click', () => {
                console.log('🆕 Nouvelle conversation');
                this.chat.conversationManager.createNewConversation();
            });
        }

        if (this.chat.ui.clearChatBtn) {
            this.chat.ui.clearChatBtn.addEventListener('click', () => {
                console.log('🧹 Effacer conversation');
                this.chat.conversationManager.clearCurrentConversation();
            });
        }

        if (this.chat.ui.exportChatBtn) {
            this.chat.ui.exportChatBtn.addEventListener('click', () => {
                console.log('📤 Exporter conversation');
                this.chat.conversationManager.exportCurrentConversation();
            });
        }

        if (this.chat.ui.sidebarToggle) {
            this.chat.ui.sidebarToggle.addEventListener('click', () => {
                console.log('📱 Toggle sidebar');
                this.chat.ui.toggleSidebar();
            });
        }

        // Boutons de mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-mode');
                console.log('🔄 Changement mode:', mode);
                this.chat.switchMode(mode);
            });
        });

        // Actions rapides
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                console.log('⚡ Action rapide:', action);
                this.chat.handleQuickAction(action);
            });
        });

        console.log('✅ Event listeners configurés');
    }
}
