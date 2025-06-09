/**
 * Gestionnaire de sessions utilisateur
 */

import { Logger } from '../utils/Logger.js';

export class SessionHandler {
  constructor(config) {
    this.config = config;
    this.logger = new Logger('SessionHandler');
    this.sessions = new Map();
  }

  createSession(socketId) {
    const session = {
      id: socketId,
      conversationHistory: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.sessions.set(socketId, session);
    this.logger.info('📝 Session créée:', socketId);
    return session;
  }

  getSession(socketId) {
    return this.sessions.get(socketId);
  }

  updateSession(socketId, updates) {
    const session = this.sessions.get(socketId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = new Date().toISOString();
    }
    return session;
  }

  async saveConversation(socketId, conversationHistory) {
    const session = this.getSession(socketId);
    if (session) {
      session.conversationHistory = conversationHistory;
      session.lastActivity = new Date().toISOString();
      this.logger.info('💾 Conversation sauvegardée:', socketId);
    }
  }

  cleanup(socketId) {
    this.sessions.delete(socketId);
    this.logger.info('🗑️ Session nettoyée:', socketId);
  }

  async getAllSessions() {
    return Array.from(this.sessions.values());
  }

  async getAllConversations() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      messageCount: session.conversationHistory.length
    }));
  }
}