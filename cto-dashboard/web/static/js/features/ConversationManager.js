import { Storage } from '../utils/Storage.js';

export class ConversationManager {
    constructor(chatInstance) {
        this.chat = chatInstance;
        this.conversations = new Map();
        this.currentConversationId = null;
        this.storage = new Storage('cto_conversations');
    }

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
        this.chat.ui.messagesContainer.innerHTML = '';
        this.chat.messageCount = 0;
        this.chat.ui.updateMessageCount();
        
        // Mettre à jour le titre
        if (this.chat.ui.chatTitle) {
            this.chat.ui.chatTitle.textContent = conversation.title;
        }
        
        // Sauvegarder et mettre à jour l'affichage
        this.saveConversations();
        this.renderConversationHistory();
        
        console.log('✅ Nouvelle conversation créée:', conversationId);
    }

    loadConversation(conversationId) {
        console.log('📂 Chargement conversation:', conversationId);
        
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;
        
        this.currentConversationId = conversationId;
        
        // Vider l'interface
        this.chat.ui.messagesContainer.innerHTML = '';
        
        // Charger les messages SANS les ajouter à la conversation (ils y sont déjà)
        conversation.messages.forEach(msg => {
            this.chat.messageManager.addMessageToInterface(msg.type, msg.content, msg.timestamp);
        });
        
        // Mettre à jour le titre
        if (this.chat.ui.chatTitle) {
            this.chat.ui.chatTitle.textContent = conversation.title;
        }
        
        this.chat.messageCount = conversation.messages.filter(m => m.type === 'user').length;
        this.chat.ui.updateMessageCount();

        this.renderConversationHistory();
        
        console.log('✅ Conversation chargée');
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
                if (this.chat.ui.chatTitle) {
                    this.chat.ui.chatTitle.textContent = conversation.title;
                }
            }
            
            this.saveConversations();
            this.renderConversationHistory();
        }
    }

    deleteConversation(conversationId) {
        const conversation = this.conversations.get(conversationId);
        const conversationTitle = conversation ? conversation.title : 'cette conversation';
        
        if (confirm(`Supprimer définitivement "${conversationTitle}" ?\n\nCette action est irréversible.`)) {
            console.log('🗑️ Suppression conversation:', conversationId);
            
            this.conversations.delete(conversationId);
            
            if (this.currentConversationId === conversationId) {
                this.currentConversationId = null;
                this.chat.ui.messagesContainer.innerHTML = '';
                this.chat.messageCount = 0;
                this.chat.ui.updateMessageCount();
                if (this.chat.ui.chatTitle) {
                    this.chat.ui.chatTitle.textContent = 'Nouvelle conversation';
                }
            }
            
            this.saveConversations();
            this.renderConversationHistory();
            
            // Feedback utilisateur
            this.chat.ui.showToast(`Conversation "${conversationTitle}" supprimée`, 'success');
        } else {
            console.log('🚫 Suppression annulée par l\'utilisateur');
        }
    }

    clearCurrentConversation() {
        if (!this.currentConversationId) return;
        
        if (confirm('Êtes-vous sûr de vouloir effacer cette conversation ?')) {
            console.log('🧹 Effacement conversation:', this.currentConversationId);
            
            this.chat.ui.messagesContainer.innerHTML = '';
            this.chat.messageCount = 0;
            this.chat.ui.updateMessageCount();
            
            const conversation = this.conversations.get(this.currentConversationId);
            if (conversation) {
                conversation.messages = [];
                conversation.title = 'Nouvelle conversation';
                if (this.chat.ui.chatTitle) {
                    this.chat.ui.chatTitle.textContent = conversation.title;
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

    renderConversationHistory() {
        if (!this.chat.ui.chatHistory) return;
        
        this.chat.ui.chatHistory.innerHTML = '';
        
        if (this.conversations.size === 0) {
            this.chat.ui.chatHistory.innerHTML = '<div class="no-conversations">Aucune conversation</div>';
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
            
            // Clic pour charger la conversation
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.conversation-delete')) {
                    this.loadConversation(conversation.id);
                }
            });
            
            // Bouton supprimer avec confirmation
            const deleteBtn = div.querySelector('.conversation-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                deleteBtn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    deleteBtn.style.transform = 'scale(1)';
                    this.deleteConversation(conversation.id);
                }, 100);
            });
            
            this.chat.ui.chatHistory.appendChild(div);
        });
    }

    saveConversations() {
        const conversationsArray = Array.from(this.conversations.entries());
        this.storage.save(conversationsArray);
        console.log('💾 Conversations sauvegardées');
    }

    loadConversations() {
        const saved = this.storage.load();
        if (saved) {
            this.conversations = new Map(saved);
            console.log('📂 Conversations chargées:', this.conversations.size);
            this.renderConversationHistory();
        }
    }
}
