/**
 * Prompts spécialisés pour l'analyse
 */

export class AnalysisPrompts {
  static getAnalysisPrompt() {
    return `# 🔍 Analyse Stratégique de l'Écosystème

## 🎯 Contexte
Nous allons analyser votre infrastructure actuelle pour identifier les opportunités d'orchestration multi-agents.

## 📊 Points d'Analyse

### 1. Architecture Actuelle
- **Stack technique** : DigitalOcean + Puppeteer + Supabase
- **Volumes** : 10k+ prospects/mois
- **Processus** : Création comptes, paiements, analyse documents

### 2. Goulots d'Étranglement Identifiés
- ⚠️ **Séquentiel vs Parallèle** : Tâches exécutées une par une
- ⚠️ **Dépendance manuelle** : Trop d'intervention humaine
- ⚠️ **Scalabilité limitée** : Difficile de passer à 100k+/mois

### 3. Opportunités d'Orchestration
- 🚀 **Agent Scraping** : Automatisation data collection
- 🚀 **Agent Payment** : Gestion paiements intelligente  
- 🚀 **Agent Analytics** : Analyse prédictive des tunnels
- 🚀 **Agent Orchestrateur** : Coordination globale

## 💡 Recommandations Stratégiques

1. **Parallélisation** : Transformer les processus séquentiels
2. **Spécialisation** : Un agent par domaine d'expertise
3. **Orchestration** : Master agent pour coordination
4. **Monitoring** : Tableau de bord temps réel

**Quelle partie voulez-vous approfondir en premier ?**

- 🔧 Architecture technique détaillée
- 📈 Plan de montée en charge
- 🤖 Spécifications des agents
- 🎼 Stratégie d'orchestration`;
  }
}