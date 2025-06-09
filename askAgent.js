import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

console.log('🔍 Script démarré');

class CopilotAgent {
    constructor() {
        this.vscodeProcess = null;
        this.cookiesPath = path.join(process.cwd(), 'cookies', 'vscode.json');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async init() {
        console.log('🚀 Ouverture de VS Code avec Copilot...');
        
        try {
            // Ouvrir VS Code dans le répertoire courant
            const vscodeCommand = process.platform === 'win32' ? 'code.cmd' : 'code';
            
            // Commande pour ouvrir VS Code
            this.vscodeProcess = spawn(vscodeCommand, [
                '.',
                '--new-window'
            ], {
                stdio: 'pipe',
                shell: true
            });

            console.log('✅ VS Code ouvert');
            
            // Attendre que VS Code se lance complètement
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Ouvrir directement le chat Copilot
            await this.openCopilotChat();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'ouverture de VS Code:', error.message);
            throw error;
        }
    }

    async openCopilotChat() {
        try {
            console.log('🤖 Activation du panneau Copilot Chat...');
            
            // Exécuter le Raccourci Clavier Ctrl+Alt+I
            const command = 
            
            for (const command of commands) {
                await this.executeVSCodeCommand(command);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log('🤖 Panneau Copilot Chat activé');
            
        } catch (error) {
            console.log('❌ Erreur lors de l\'activation du panneau Copilot Chat:', error.message);

        }
    }


    async askAgent(question) {
        console.log(`🤖 Envoi automatique de la question: "${question}"`);
        
        try {
            // Attendre un peu pour s'assurer que Copilot Chat est prêt
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (process.platform === 'win32') {
                // Automation pour Windows
                const psScript = `
                Add-Type -AssemblyName System.Windows.Forms
                d
                # Copier la question dans le presse-papiers
                Set-Clipboard -Value "${question.replace(/"/g, '`"')}"
                Start-Sleep -Milliseconds 500
                
                # Coller dans VS Code (Ctrl+V)
                [System.Windows.Forms.SendKeys]::SendWait("^v")
                Start-Sleep -Milliseconds 500
                
                # Appuyer sur Entrée pour envoyer
                [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
                `;
                
                await execAsync(`powershell -Command "${psScript}"`);
                console.log('✅ Question envoyée automatiquement');
                
                // Attendre la réponse
                console.log('⏳ Attente de la réponse de Copilot...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                console.log('📝 Réponse disponible dans VS Code');
                
            } else {dddd
                // Fallback pour autres OS
                await this.copyToClipboard(question);
                console.log('📋 Question copiée - Collez manuellement dans VS Code');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi automatique:', error.message);
            await this.copyToClipboard(question);
        }
        
        return question;
    }

    async copyToClipboard(text) {
        try {
            const clipboardCommand = process.platform === 'win32' 
                ? `echo "${text}" | clip`
                : process.platform === 'darwin'
                ? `echo "${text}" | pbcopy`
                : `echo "${text}" | xclip -selection clipboard`;
                
            await execAsync(clipboardCommand);
            console.log('📋 Question copiée dans le presse-papiers');
        } catch (error) {
            console.log('⚠️ Impossible de copier dans le presse-papiers');
            console.log(`📝 Question: ${text}`);
        }
    }

    async interactiveMode() {
        console.log('\n🎯 Mode interactif automatisé activé');
        console.log('💡 Les questions seront envoyées automatiquement à Copilot');
        console.log('Tapez vos questions (ou "exit" pour quitter):');
        
        const askQuestion = () => {
            this.rl.question('\n💭 Votre question: ', async (question) => {
                if (question.toLowerCase() === 'exit') {
                    await this.close();
                    return;
                }
                
                if (question.trim()) {
                    await this.askAgent(question);
                }
                
                askQuestion();
            });
        };
        
        askQuestion();
    }

    async executeVSCodeCommand(command) {
        try {
            const vscodeCommand = process.platform === 'win32' ? 'code.cmd' : 'code';
            await execAsync(`${vscodeCommand} --command "${command}"`);
            return true;
        } catch (error) {
            console.error(`❌ Erreur lors de l'exécution de la commande: ${command}`);
            return false;
        }
    }

    async close() {
        console.log('\n🔒 Fermeture du script...');
        
        this.rl.close();
        
        console.log('💡 VS Code reste ouvert pour continuer à utiliser Copilot');
        console.log('✅ Session terminée');
        process.exit(0);
    }
}

// Fonction principale
async function main() {
    const agent = new CopilotAgent();
    
    try {
        await agent.init();
        
        // Vérifier si une question est passée en argument
        const args = process.argv.slice(2);
        
        if (args.length > 0) {
            // Mode question unique
            const question = args.join(' ');
            await agent.askAgent(question);
            console.log('\n💡 Question envoyée automatiquement');
            await agent.interactiveMode();
        } else {
            // Mode interactif
            await agent.interactiveMode();
        }
        
    } catch (error) {
        console.error('❌ Erreur fatale:', error.message);
        console.log('💡 Assurez-vous que VS Code est installé et accessible via la commande "code"');
        await agent.close();
    }
}

// Gestion des signaux de fermeture
process.on('SIGINT', async () => {
    console.log('\n⚠️ Interruption détectée...');
    process.exit(0);
});

// Lancement du script
main().catch(console.error);

export default CopilotAgent;