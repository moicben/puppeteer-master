/**
 * Analyseur de dépendances
 */

export class DependencyAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  async analyze() {
    return {
      dependencies: [],
      devDependencies: [],
      total: 0
    };
  }
}