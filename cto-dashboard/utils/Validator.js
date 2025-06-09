/**
 * Système de validation
 */

import { Logger } from './Logger.js';

export class Validator {
  constructor() {
    this.logger = new Logger('Validator');
  }

  validateAgentConfig(config) {
    const required = ['name', 'type', 'capabilities'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Champs requis manquants: ${missing.join(', ')}`);
    }
    
    this.logger.debug('Configuration agent validée', config);
    return true;
  }

  validateTunnelConfig(config) {
    const required = ['name', 'steps', 'targetAudience'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Champs requis manquants: ${missing.join(', ')}`);
    }
    
    this.logger.debug('Configuration tunnel validée', config);
    return true;
  }

  validateEnvironment() {
    const required = ['ANTHROPIC_API_KEY'];
    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
    }
    
    return true;
  }
}