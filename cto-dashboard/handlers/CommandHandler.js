/**
 * Gestionnaire de commandes spéciales
 */

import { Logger } from '../utils/Logger.js';

export class CommandHandler {
  constructor(ctoAgent) {
    this.ctoAgent = ctoAgent;
    this.logger = new Logger('CommandHandler');
  }

  async handleCommand(socket, data) {
    this.logger.info('⚡ Commande reçue:', data);
    
    try {
      switch (data.command) {
        case 'status':
          return { status: 'active', agent: this.ctoAgent ? 'ready' : 'not_ready' };
        
        case 'clear':
          return { message: 'Conversation effacée' };
        
        default:
          return { error: 'Commande inconnue' };
      }
    } catch (error) {
      this.logger.error('❌ Erreur commande:', error);
      throw error;
    }
  }
}