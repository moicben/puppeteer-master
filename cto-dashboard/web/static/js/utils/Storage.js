export class Storage {
    constructor(key) {
        this.key = key;
    }

    save(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${this.key}:`, error);
            return false;
        }
    }

    load() {
        try {
            const saved = localStorage.getItem(this.key);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error(`❌ Erreur chargement ${this.key}:`, error);
            return null;
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.key);
            return true;
        } catch (error) {
            console.error(`❌ Erreur suppression ${this.key}:`, error);
            return false;
        }
    }
}
