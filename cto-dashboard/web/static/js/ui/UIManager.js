export class UIManager {
    constructor(chatInstance) {
        this.chat = chatInstance;
        this.initializeElements();
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

    updateStatus(message, type = '') {
        console.log('📊 Mise à jour status:', { message, type });
        
        if (this.statusIndicator) {
            this.statusIndicator.textContent = message;
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
        this.chat.isProcessing = false;
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
            this.messageCountEl.textContent = this.chat.messageCount;
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

    toggleSidebar() {
        document.body.classList.toggle('sidebar-collapsed');
    }

    showToast(message, type = 'info', duration = 3000) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-tertiary, #2a2a2a);
            color: var(--text-primary, #e5e5e5);
            padding: 12px 20px;
            border-radius: 8px;
            border-left: 4px solid var(--accent-primary, #f97316);
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            font-size: 14px;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}
