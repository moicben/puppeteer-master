/**
 * Générateur de tunnels de vente
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/Logger.js';
import { FileManager } from '../utils/FileManager.js';

export class TunnelGenerator {
  constructor(config) {
    this.config = config;
    this.logger = new Logger('TunnelGenerator');
    this.fileManager = new FileManager();
    this.tunnelsDir = path.join(config.projectRoot, 'tunnels');
  }

  async create(specification) {
    try {
      this.logger.info('Génération nouveau tunnel', { spec: specification });
      
      // Créer la structure du tunnel
      const tunnelDir = path.join(this.tunnelsDir, specification.name);
      await this.fileManager.ensureDirectory(tunnelDir);
      
      // Générer les fichiers du tunnel
      await this.generateTunnelFiles(tunnelDir, specification);
      
      this.logger.info('Tunnel généré avec succès', { path: tunnelDir });
      
      return {
        success: true,
        tunnelPath: tunnelDir,
        tunnelName: specification.name,
        message: `✅ Tunnel ${specification.name} créé dans ${tunnelDir}`
      };
      
    } catch (error) {
      this.logger.error('Erreur génération tunnel', error);
      throw error;
    }
  }

  async generateTunnelFiles(tunnelDir, spec) {
    // 1. Configuration principale
    const configCode = this.generateTunnelConfig(spec);
    await this.fileManager.writeFile(path.join(tunnelDir, 'config.js'), configCode);
    
    // 2. Landing page
    const landingCode = this.generateLandingPage(spec);
    await this.fileManager.writeFile(path.join(tunnelDir, 'landing.html'), landingCode);
    
    // 3. Logique de conversion
    const conversionCode = this.generateConversionLogic(spec);
    await this.fileManager.writeFile(path.join(tunnelDir, 'conversion.js'), conversionCode);
    
    // 4. Séquences email
    const emailCode = this.generateEmailSequences(spec);
    await this.fileManager.writeFile(path.join(tunnelDir, 'emails.js'), emailCode);
    
    // 5. Analytics
    const analyticsCode = this.generateAnalytics(spec);
    await this.fileManager.writeFile(path.join(tunnelDir, 'analytics.js'), analyticsCode);
  }

  generateTunnelConfig(spec) {
    return `/**
 * Configuration du tunnel ${spec.name}
 */

export const tunnelConfig = {
  name: '${spec.name}',
  type: '${spec.type || 'standard'}',
  audience: ${JSON.stringify(spec.audience || {}, null, 2)},
  product: ${JSON.stringify(spec.product || {}, null, 2)},
  pricing: ${JSON.stringify(spec.pricing || {}, null, 2)},
  automation: {
    emailSequences: true,
    paymentProcessing: true,
    leadScoring: true,
    analytics: true
  },
  integrations: {
    stripe: process.env.STRIPE_KEY,
    mailchimp: process.env.MAILCHIMP_KEY,
    facebook: process.env.FACEBOOK_PIXEL,
    google: process.env.GOOGLE_ANALYTICS
  }
};`;
  }

  generateLandingPage(spec) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${spec.name} - ${spec.headline || 'Transformez votre business'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 80px 20px; text-align: center; }
        .hero h1 { font-size: 3em; margin-bottom: 20px; }
        .hero p { font-size: 1.2em; margin-bottom: 30px; }
        .cta-button { background: #ff6b6b; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 1.1em; cursor: pointer; }
        .features { padding: 60px 20px; max-width: 1200px; margin: 0 auto; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .feature { text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <section class="hero">
        <h1>${spec.headline || 'Transformez Votre Business'}</h1>
        <p>${spec.subheadline || 'Découvrez notre solution révolutionnaire'}</p>
        <button class="cta-button" onclick="showOptin()">Je Veux Commencer Maintenant</button>
    </section>

    <section class="features">
        <div class="feature-grid">
            <div class="feature">
                <h3>🚀 Résultats Rapides</h3>
                <p>Voyez des résultats dès les premiers jours</p>
            </div>
            <div class="feature">
                <h3>💰 ROI Garanti</h3>
                <p>Retour sur investissement mesurable</p>
            </div>
            <div class="feature">
                <h3>🎯 Support Expert</h3>
                <p>Accompagnement personnalisé</p>
            </div>
        </div>
    </section>

    <script>
        function showOptin() {
            // TODO: Implémenter opt-in
            alert('Opt-in à implémenter');
        }
        
        // Analytics
        gtag('event', 'page_view', { page_title: '${spec.name} Landing' });
    </script>
</body>
</html>`;
  }

  generateConversionLogic(spec) {
    return `/**
 * Logique de conversion pour ${spec.name}
 */

export class ConversionEngine {
  constructor(config) {
    this.config = config;
    this.leads = [];
    this.conversions = [];
  }

  async captureLead(leadData) {
    try {
      // Validation des données
      this.validateLeadData(leadData);
      
      // Enrichissement des données
      const enrichedLead = await this.enrichLead(leadData);
      
      // Scoring du lead
      const score = this.scoreLead(enrichedLead);
      
      // Sauvegarde
      await this.saveLead(enrichedLead, score);
      
      // Déclenchement de la séquence
      await this.triggerEmailSequence(enrichedLead);
      
      return { success: true, leadId: enrichedLead.id };
      
    } catch (error) {
      console.error('Erreur capture lead:', error);
      throw error;
    }
  }

  validateLeadData(data) {
    const required = ['email', 'firstName'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(\`Champs requis manquants: \${missing.join(', ')}\`);
    }
  }

  async enrichLead(leadData) {
    return {
      ...leadData,
      id: this.generateLeadId(),
      timestamp: new Date().toISOString(),
      source: '${spec.name}',
      ip: this.getClientIP(),
      userAgent: navigator.userAgent
    };
  }

  scoreLead(lead) {
    let score = 0;
    
    // Scoring basique
    if (lead.email.includes('.com')) score += 10;
    if (lead.phone) score += 15;
    if (lead.company) score += 20;
    
    return Math.min(score, 100);
  }

  async saveLead(lead, score) {
    // TODO: Intégration Supabase
    this.leads.push({ ...lead, score });
  }

  async triggerEmailSequence(lead) {
    // TODO: Intégration système email
    console.log(\`Séquence email déclenchée pour \${lead.email}\`);
  }

  generateLeadId() {
    return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getClientIP() {
    // TODO: Implémenter détection IP
    return '0.0.0.0';
  }
}`;
  }

  generateEmailSequences(spec) {
    return `/**
 * Séquences email pour ${spec.name}
 */

export const emailSequences = {
  welcome: {
    name: 'Séquence de bienvenue',
    emails: [
      {
        delay: 0, // Immédiat
        subject: 'Bienvenue ! Votre première étape vers le succès',
        template: 'welcome_immediate'
      },
      {
        delay: 24 * 60 * 60 * 1000, // 24h
        subject: 'Jour 1: Votre plan d\\'action personnalisé',
        template: 'welcome_day1'
      },
      {
        delay: 3 * 24 * 60 * 60 * 1000, // 3 jours
        subject: 'Évitez cette erreur que font 90% des débutants',
        template: 'welcome_day3'
      }
    ]
  },
  
  nurturing: {
    name: 'Séquence de nurturing',
    emails: [
      {
        delay: 7 * 24 * 60 * 60 * 1000, // 7 jours
        subject: 'Étude de cas: Comment Marc a multiplié ses revenus par 3',
        template: 'nurturing_case_study'
      },
      {
        delay: 14 * 24 * 60 * 60 * 1000, // 14 jours
        subject: 'Offre spéciale: -50% pour les 48 prochaines heures',
        template: 'nurturing_special_offer'
      }
    ]
  }
};

export const emailTemplates = {
  welcome_immediate: \`
Bonjour {{firstName}},

Bienvenue dans ${spec.name} !

Vous venez de faire le premier pas vers la transformation de votre business.

Dans les prochaines minutes, vous allez recevoir vos accès personnalisés.

À très bientôt,
L'équipe ${spec.name}
  \`,
  
  welcome_day1: \`
Bonjour {{firstName}},

Voici votre plan d'action personnalisé pour les 7 prochains jours:

✅ Jour 1: Configuration de base
✅ Jour 2: Première optimisation
✅ Jour 3: Mesure des résultats

Commencez dès maintenant!

Cordialement,
L'équipe ${spec.name}
  \`
};`;
  }

  generateAnalytics(spec) {
    return `/**
 * Analytics pour ${spec.name}
 */

export class TunnelAnalytics {
  constructor(config) {
    this.config = config;
    this.events = [];
  }

  trackEvent(eventType, data) {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      tunnel: '${spec.name}',
      sessionId: this.getSessionId()
    };
    
    this.events.push(event);
    this.sendToAnalytics(event);
  }

  trackPageView(page) {
    this.trackEvent('page_view', { page });
  }

  trackLeadCapture(leadData) {
    this.trackEvent('lead_capture', leadData);
  }

  trackConversion(conversionData) {
    this.trackEvent('conversion', conversionData);
  }

  async getMetrics() {
    return {
      totalViews: this.events.filter(e => e.type === 'page_view').length,
      totalLeads: this.events.filter(e => e.type === 'lead_capture').length,
      totalConversions: this.events.filter(e => e.type === 'conversion').length,
      conversionRate: this.calculateConversionRate(),
      topSources: this.getTopSources()
    };
  }

  calculateConversionRate() {
    const views = this.events.filter(e => e.type === 'page_view').length;
    const conversions = this.events.filter(e => e.type === 'conversion').length;
    
    return views > 0 ? (conversions / views * 100).toFixed(2) : 0;
  }

  getTopSources() {
    // TODO: Implémenter analyse des sources
    return [];
  }

  getSessionId() {
    return 'session_' + Date.now();
  }

  sendToAnalytics(event) {
    // TODO: Intégration Google Analytics, Facebook Pixel, etc.
    console.log('Analytics event:', event);
  }
}`;
  }
}