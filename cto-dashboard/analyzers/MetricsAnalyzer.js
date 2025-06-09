/**
 * Analyseur de métriques
 */

export class MetricsAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  async analyze() {
    return {
      totalFiles: 0,
      codeLines: 0,
      lastAnalysis: new Date().toISOString()
    };
  }
}