/**
 * Templates de code réutilisables
 */

export class CodeTemplates {
  static getAgentTemplate(name, capabilities) {
    return `/**
 * ${name}Agent - Agent spécialisé
 */

export class ${name}Agent {
  constructor(config) {
    this.config = config;
    this.capabilities = ${JSON.stringify(capabilities, null, 4)};
    this.status = 'initialized';
  }

  async initialize() {
    this.status = 'ready';
    return { success: true };
  }

  async execute(task) {
    this.status = 'working';
    const result = await this.processTask(task);
    this.status = 'ready';
    return result;
  }

  async processTask(task) {
    // TODO: Implémenter logique spécifique
    return { success: true, result: task };
  }
}`;
  }

  static getTunnelTemplate(name, type) {
    return `/**
 * Tunnel ${name} - ${type}
 */

export class ${name}Tunnel {
  constructor(config) {
    this.config = config;
    this.type = '${type}';
    this.steps = [];
  }

  async initialize() {
    // TODO: Initialiser le tunnel
    return { success: true };
  }

  async processLead(leadData) {
    // TODO: Traiter le lead
    return { success: true, leadId: this.generateId() };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}`;
  }
}