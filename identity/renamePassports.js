import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';

/**
 * Renomme les fichiers de passeport dans le dossier `proceed` en format `prenom-nom.jpg`.
 * @param {string} xlsxPath - Chemin vers le fichier XLSX contenant les données.
 * @param {string} proceedDir - Chemin vers le dossier contenant les passeports.
 */
export function renamePassportsFromXlsx(xlsxPath, proceedDir) {
    try {
        // Lire le fichier XLSX
        const workbook = xlsx.readFile(xlsxPath);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(sheetData);

        // Lire les fichiers du dossier `proceed`
        const files = fs.readdirSync(proceedDir);
        let index = 1;

        sheetData.forEach(account => {
            if (!account.FirstName || !account.LastName) {
                console.warn(`⚠️ Données manquantes pour:`, account);
                return;
            }

            const cleanFirstName = account.FirstName.toLowerCase().split(' ')[0];
            const cleanLastName = account.LastName.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[éèêë]/g, 'e')
                .replace(/[àâä]/g, 'a')
                .replace(/[ùûü]/g, 'u')
                .replace(/[ôö]/g, 'o')
                .replace(/[îï]/g, 'i')
                .replace(/ç/g, 'c');

            const newFileName = `${cleanFirstName}-${cleanLastName}.jpg`;
            console.log(`Processing: ${newFileName}`);

            const matchingFile = files.find(file => file === `passport-${String(index)}.jpg`);

            if (matchingFile) {
                const oldFilePath = path.join(proceedDir, matchingFile);
                const newFilePath = path.join(proceedDir, newFileName);

                fs.renameSync(oldFilePath, newFilePath);
                console.log(`✅ Renommé: ${matchingFile} -> ${newFileName}`);
            } else {
                console.warn(`⚠️ Aucun fichier correspondant trouvé pour: ${account.FirstName} ${account.LastName}`);
            }
            index++;
        });
    } catch (error) {
        console.error('❌ Erreur lors du renommage des passeports:', error);
    }
}

// Exemple d'utilisation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xlsxPath = path.resolve(__dirname, '..', 'assets', 'passports', 'passports_data.xlsx');
const proceedDir = path.resolve(__dirname, '..', 'assets', 'passports', 'proceed');

console.log('XLSX Path:', xlsxPath);
console.log('Proceed Directory:', proceedDir);

renamePassportsFromXlsx(xlsxPath, proceedDir);