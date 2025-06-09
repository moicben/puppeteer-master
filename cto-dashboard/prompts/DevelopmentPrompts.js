/**
 * Prompts pour le développement et la génération de code
 */

export class DevelopmentPrompts {
  static getCreateAgentPrompt() {
    return `# 🤖 Assistant Création d'Agent

## 🎯 Configurons votre nouvel agent spécialisé

Pour créer un agent optimisé, j'ai besoin de comprendre :

### 1. **Domaine de Spécialisation**
- 📊 **Analytics** : Analyse données, métriques, optimisation
- 🔍 **Scraping** : Collection données, monitoring sites
- 💰 **Payment** : Gestion paiements, facturation, comptabilité  
- 🚀 **Tunnel** : Optimisation tunnels, A/B testing
- 🛡️ **Security** : Sécurité, compliance, monitoring
- 📱 **Social** : Gestion réseaux sociaux, engagement
- 🎯 **Custom** : Spécialisation sur-mesure

### 2. **Cas d'Usage Précis**
Décrivez le problème business que cet agent doit résoudre :
- Quel processus actuel consomme trop de votre temps ?
- Quelles tâches répétitives voulez-vous automatiser ?
- Quel ROI attendez-vous de cette automatisation ?

### 3. **Intégrations Requises**
- APIs externes (Facebook, Google, Stripe...)
- Base de données (Supabase, PostgreSQL...)
- Services tiers (Email, SMS, Analytics...)
- Outils existants (Puppeteer, monitoring...)

## 💡 Exemple de Spécification

\`\`\`
Agent: PaymentAnalytics
Domaine: Analyse des performances paiement
Objectif: Optimiser les taux de conversion paiement
Intégrations: Stripe API, Supabase, Slack notifications
ROI Cible: +15% taux conversion, -50% temps analyse manuelle
\`\`\`

**Décrivez-moi l'agent que vous voulez créer !** 🚀`;
  }

  static getCreateTunnelPrompt() {
    return `# 🚀 Assistant Création de Tunnel

## 🎯 Configurons votre tunnel de vente optimisé

### 1. **Type de Tunnel**
- 📚 **Formation** : Vente de formations en ligne
- 🛒 **E-commerce** : Produits physiques/digitaux
- 💼 **Service** : Prestations de service/consulting
- 📱 **App** : Applications mobile/web
- 🎯 **Lead Gen** : Génération de prospects qualifiés
- 💰 **High Ticket** : Ventes à fort montant

### 2. **Audience Cible**
- **Démographie** : Âge, localisation, revenus
- **Problématiques** : Quels problèmes résolvez-vous ?
- **Comportement** : Où trouvent-ils l'information ?
- **Budget** : Capacité d'investissement moyenne

### 3. **Architecture du Tunnel**
\`\`\`
Étape 1: Attraction (Ads Facebook/Google)
    ↓
Étape 2: Landing Page (Capture lead)
    ↓  
Étape 3: Séquence Email (Nurturing)
    ↓
Étape 4: Page Vente (Conversion)
    ↓
Étape 5: Upsells/Cross-sells
    ↓
Étape 6: Livraison + Fidélisation
\`\`\`

### 4. **Automatisations Requises**
- **Lead capture** : Formulaires, pop-ups, chatbots
- **Email sequences** : Nurturing, relance, segmentation
- **Payment processing** : Stripe, PayPal, plan paiement
- **Analytics** : Tracking, attribution, optimisation
- **Delivery** : Accès produit, onboarding client

## 💡 Exemple de Spécification

\`\`\`
Tunnel: Formation E-commerce
Audience: Entrepreneurs 25-45 ans, revenus 50k+
Produit: Formation complète e-commerce (1997€)
Volume Cible: 100 ventes/mois
Automatisation: Complète de A à Z
\`\`\`

**Décrivez-moi le tunnel que vous voulez créer !** 💰`;
  }

  static getOrchestrationPrompt(analysis) {
    return `# 🎼 Configuration Orchestration Globale

## 📊 Analyse Actuelle
${analysis ? `
**Structure détectée :**
${Object.entries(analysis.structure).map(([dir, files]) => 
  `- **${dir}/** : ${files.length} fichiers`
).join('\n')}

**Composants identifiés :**
- Bricks d'automatisation : ${analysis.structure.bricks?.length || 0}
- Tunnels existants : ${analysis.structure.tunnels?.length || 0}
- Agents actuels : ${analysis.structure.agents?.length || 0}
` : ''}

## 🏗️ Architecture Recommandée

### Master Orchestrateur
\`\`\`javascript
class MasterOrchestrator {
  async executeMission(objective) {
    // 1. Analyse de l'objectif
    const strategy = await this.planStrategy(objective);
    
    // 2. Décomposition en tâches
    const tasks = this.breakdownTasks(strategy);
    
    // 3. Assignation aux agents spécialisés
    const assignments = this.assignToAgents(tasks);
    
    // 4. Exécution parallèle
    const results = await Promise.all(assignments);
    
    // 5. Consolidation et reporting
    return this.consolidateResults(results);
  }
}
\`\`\`

### Agents Spécialisés Proposés

1. **🔍 DataAgent** 
   - Scraping et monitoring
   - APIs externes
   - Validation données

2. **💰 PaymentAgent**
   - Gestion transactions
   - Récupération échecs
   - Analytics revenus

3. **📊 AnalyticsAgent**
   - Métriques performance
   - Prédictions trends
   - Rapports automatisés

4. **🚀 TunnelAgent**
   - Optimisation conversion
   - A/B testing
   - Personnalisation

## 🎯 Configuration Initiale

### Priorités de Déploiement
1. **Urgent** : Quel agent vous ferait gagner le plus de temps dès demain ?
2. **Impact** : Quel processus multiplierait votre chiffre d'affaires ?
3. **Facilité** : Quel agent serait le plus simple à implémenter ?

### Métriques de Succès
- **Temps libéré** : Heures/semaine récupérées
- **Revenue impact** : % d'augmentation CA
- **Error reduction** : % diminution erreurs manuelles
- **Scale capacity** : Multiplication volume possible

## 💡 Plan d'Action Immédiat

**Étape 1** : Choisir les 2 premiers agents critiques
**Étape 2** : Définir les interfaces de communication
**Étape 3** : Implémenter le Master Orchestrateur
**Étape 4** : Tests en parallèle avec système actuel
**Étape 5** : Migration progressive et optimisation

**Quel agent voulez-vous déployer en premier ?** 🚀`;
  }
}