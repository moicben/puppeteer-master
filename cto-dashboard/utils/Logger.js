/**
 * Logger utilitaire pour l'orchestrateur
 */

export class Logger {
  constructor(component) {
    this.component = component;
  }

  info(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.component}] INFO: ${message}`);
    if (data) {
      console.log('   Data:', data);
    }
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.component}] ERROR: ${message}`);
    if (error) {
      console.error('   Error:', error);
    }
  }

  warn(message, data = null) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [${this.component}] WARN: ${message}`);
    if (data) {
      console.warn('   Data:', data);
    }
  }

  debug(message, data = null) {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [${this.component}] DEBUG: ${message}`);
    if (data) {
      console.debug('   Data:', data);
    }
  }
}