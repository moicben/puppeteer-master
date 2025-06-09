/**
 * Prompts stratégiques pour l'orchestration
 */

export class StrategyPrompts {
  static getStrategyPrompt() {
    return `# 🎼 Stratégie d'Orchestration Multi-Agents

## 🚀 Vision Cible
Transformer votre approche "développeur hands-on" vers "chef d'orchestre stratégique"

## 🏗️ Architecture Proposée

### Master Orchestrateur
\`\`\`
MasterAgent (Chef d'orchestre)
├── AnalyticsAgent (Données & métriques)
├── ScrapingAgent (Collection de données)
├── PaymentAgent (Gestion paiements)
├── TunnelAgent (Optimisation tunnels)
└── MonitoringAgent (Surveillance système)
\`\`\`

**Par quel agent commençons-nous ?** 🤖`;
  }

  static getRoadmapPrompt() {
    return `# 🗺️ Roadmap Technique - Orchestration Multi-Agents

## 📅 Sprint 1-2 : Infrastructure (2 semaines)
### Objectif : Poser les bases solides
- ✅ **Master Orchestrateur** : Core engine + API Claude
- ✅ **Queue System** : Redis pour gestion des tâches
- ✅ **Monitoring** : Logs structurés + dashboard basique

**Quel Quick Win attaque-t-on en premier ?** ⚡`;
  }

  static getHelpMessage() {
    return `# 🎯 Guide d'Utilisation - Agent CTO

## 🚀 Commandes Rapides

### 📊 Analyse & Stratégie
- \`analyze\` - Diagnostic complet de votre stack
- \`strategy\` - Brainstorming architecture multi-agents
- \`roadmap\` - Planning technique par sprints

**Quelle question stratégique vous préoccupe le plus ?** 💡`;
  }
}