/**
 * Gestionnaire de fichiers optimisé
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from './Logger.js';

export class FileManager {
  constructor() {
    this.logger = new Logger('FileManager');
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      this.logger.debug('Répertoire créé', { path: dirPath });
    } catch (error) {
      this.logger.error('Erreur création répertoire', error);
      throw error;
    }
  }

  async writeFile(filepath, content) {
    try {
      const dir = path.dirname(filepath);
      await this.ensureDirectory(dir);
      await fs.writeFile(filepath, content, 'utf8');
      this.logger.info('Fichier écrit', { filepath });
    } catch (error) {
      this.logger.error('Erreur écriture fichier', error);
      throw error;
    }
  }

  async readFile(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      this.logger.debug('Fichier lu', { filepath });
      return content;
    } catch (error) {
      this.logger.error('Erreur lecture fichier', error);
      throw error;
    }
  }

  async listFiles(dirPath, extension = null) {
    try {
      const files = await fs.readdir(dirPath);
      const filtered = extension 
        ? files.filter(f => f.endsWith(extension))
        : files;
      
      this.logger.debug('Fichiers listés', { dirPath, count: filtered.length });
      return filtered;
    } catch (error) {
      this.logger.error('Erreur listage fichiers', error);
      return [];
    }
  }
}