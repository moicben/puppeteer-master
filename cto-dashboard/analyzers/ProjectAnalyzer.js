/**
 * Analyseur de projet - Analyse la structure et les dépendances
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/Logger.js';

export class ProjectAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.logger = new Logger('ProjectAnalyzer');
  }

  async getFullAnalysis() {
    try {
      this.logger.info('Démarrage analyse projet', { projectRoot: this.projectRoot });
      
      const structure = await this.analyzeStructure();
      const dependencies = await this.analyzeDependencies();
      const metrics = await this.calculateMetrics();
      
      return {
        structure,
        dependencies,
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Erreur analyse projet', error);
      return {
        structure: {},
        dependencies: [],
        metrics: {},
        error: error.message
      };
    }
  }

  async analyzeStructure() {
    const structure = {};
    
    try {
      const mainDirs = ['bricks', 'tunnels', 'agents', 'orchestrator', 'utils'];
      
      for (const dir of mainDirs) {
        const dirPath = path.join(this.projectRoot, dir);
        try {
          const files = await fs.readdir(dirPath);
          structure[dir] = files.filter(f => f.endsWith('.js'));
        } catch (error) {
          structure[dir] = [];
        }
      }
      
      this.logger.debug('Structure analysée', structure);
      return structure;
    } catch (error) {
      this.logger.error('Erreur analyse structure', error);
      return {};
    }
  }

  async analyzeDependencies() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      return {
        dependencies: Object.keys(packageData.dependencies || {}),
        devDependencies: Object.keys(packageData.devDependencies || {}),
        total: Object.keys(packageData.dependencies || {}).length + Object.keys(packageData.devDependencies || {}).length
      };
    } catch (error) {
      this.logger.error('Erreur analyse dépendances', error);
      return { dependencies: [], devDependencies: [], total: 0 };
    }
  }

  async calculateMetrics() {
    try {
      const totalFiles = await this.countFiles();
      const codeLines = await this.countCodeLines();
      
      return {
        totalFiles,
        codeLines,
        lastAnalysis: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Erreur calcul métriques', error);
      return { totalFiles: 0, codeLines: 0 };
    }
  }

  async countFiles() {
    let count = 0;
    try {
      const dirs = await fs.readdir(this.projectRoot);
      for (const dir of dirs) {
        const dirPath = path.join(this.projectRoot, dir);
        const stat = await fs.stat(dirPath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(dirPath);
          count += files.filter(f => f.endsWith('.js')).length;
        }
      }
    } catch (error) {
      this.logger.error('Erreur comptage fichiers', error);
    }
    return count;
  }

  async countCodeLines() {
    // Implémentation basique - peut être améliorée
    return 1000; // Placeholder
  }
}