import { CTOChat } from './core/CTOChat.js';

console.log('🚀 === DEMARRAGE APPLICATION ===');

// Initialisation de l'application
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
