# 🤖 Agent CTO - Guide de Démarrage Rapide

## Configuration Requise

1. **Obtenez votre clé API Claude :**
   - Rendez-vous sur [console.anthropic.com](https://console.anthropic.com)
   - Créez un compte si nécessaire
   - Générez une nouvelle clé API

2. **Configurez l'agent :**
   ```bash
   # Éditez le fichier .env
   ANTHROPIC_API_KEY=sk-ant-api03-... # Votre vraie clé API
   ```

## Lancement

### Interface Web (Recommandée)
```bash
cd orchestrator
npm run web
```
- Ouvre automatiquement http://localhost:3001
- Interface similaire à Claude
- Chat temps réel avec l'agent CTO

### Interface Terminal
```bash
cd orchestrator
npm run cto
```
- Interface en ligne de commande
- Pour les utilisateurs préférant le terminal

## Commandes Rapides

- `analyze` - Analyse de l'écosystème actuel
- `strategy` - Brainstorming stratégique
- `roadmap` - Planification d'architecture
- `context` - Contexte business détaillé
- `help` - Aide et commandes disponibles

## Premier Usage

1. Lancez l'interface web : `npm run web`
2. Tapez `analyze` pour commencer l'analyse
3. Suivez les recommandations de l'agent CTO

## Support

- Fichiers de configuration : `config.js`
- Logs de conversation sauvegardés automatiquement
- Interface responsive (mobile/desktop)

**Prêt à transformer votre approche de développeur en vision CTO ! 🚀**
