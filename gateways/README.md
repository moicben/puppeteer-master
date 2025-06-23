# Système de Gateway Centralisé

Ce système permet de gérer de manière centralisée l'inscription sur différentes plateformes (gateways) tout en gardant les workflows spécifiques séparés.

## Architecture

### Fichiers principaux

1. **`gatewayRegister.js`** - Module centralisé contenant :
   - Validation des données de compte
   - Préparation des données 
   - Gestion des captures d'écran
   - Logique de traitement générique des comptes
   - Interface avec Supabase

2. **`workflows/`** - Dossier contenant les workflows spécifiques :
   - `bricksWorkflow.js` - Workflow Puppeteer pour Bricks
   - `rentoWorkflow.js` - Workflow Puppeteer pour Rento

3. **`config/supabase.js`** - Configuration et services Supabase
   - Nouvelle méthode `getAccountsByService()` pour filtrer par service

### Services spécifiques

- **`bricks/bricksRegister.js`** - Utilise le workflow Bricks
- **`rento/rentoRegister.js`** - Utilise le workflow Rento

## Utilisation

### Pour traiter des comptes Bricks

```bash
cd gateways/bricks
node bricksRegister.js
```

### Pour traiter des comptes Rento

```bash
cd gateways/rento
node rentoRegister.js
```

### Programmation

```javascript
import { processAccountsByService } from '../gatewayRegister.js';
import { bricksWorkflow } from '../workflows/bricksWorkflow.js';

// Traiter tous les comptes avec service "bricks" et status "new"
const result = await processAccountsByService('bricks', bricksWorkflow);
```

## Filtrage par service

Le système filtre automatiquement les comptes dans Supabase selon le champ `service` :
- Les comptes avec `service = "bricks"` sont traités par bricksRegister.js
- Les comptes avec `service = "rento"` sont traités par rentoRegister.js

## Avantages du nouveau système

1. **Code réutilisable** - Validation, gestion d'erreurs, captures d'écran centralisées
2. **Workflows séparés** - Chaque plateforme garde sa logique Puppeteer spécifique
3. **Filtrage automatique** - Seuls les comptes du bon service sont traités
4. **Maintenance simplifiée** - Un seul endroit pour les modifications communes
5. **Extensibilité** - Facile d'ajouter de nouveaux services

## Ajout d'un nouveau service

1. Créer le workflow dans `workflows/newServiceWorkflow.js`
2. Créer le fichier principal `newService/newServiceRegister.js`
3. Utiliser `processAccountsByService('newservice', newServiceWorkflow)`
4. Assurer que les comptes en base ont `service = "newservice"` 