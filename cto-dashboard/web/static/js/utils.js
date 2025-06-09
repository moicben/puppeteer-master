/**
 * Utilitaires généraux pour l'interface CTO
 */

class Utils {
    // Formatage des dates
    static formatDate(date = new Date()) {
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Formatage du temps écoulé
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Debounce pour éviter les appels répétés
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Sauvegarde dans localStorage
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde localStorage:', error);
            return false;
        }
    }

    // Lecture depuis localStorage
    static getFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Erreur lecture localStorage:', error);
            return defaultValue;
        }
    }

    // Copier du texte dans le presse-papier
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Erreur copie presse-papier:', error);
            return false;
        }
    }

    // Notifications toast
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animation d'entrée
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Suppression automatique
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, duration);
    }

    // Validation email simple
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Échapper le HTML
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Parsing sécurisé du JSON
    static safeJsonParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.error('Erreur parsing JSON:', error);
            return defaultValue;
        }
    }
}

// Export global
window.Utils = Utils;