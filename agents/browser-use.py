from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from browser_use import Agent, BrowserSession
from dotenv import load_dotenv
import asyncio
import sys
import os

load_dotenv()

# Configuration du modèle LLM
def get_llm():
    model_type = os.getenv('LLM_TYPE', 'anthropic')  # par défaut anthropic
    
    if model_type.lower() == 'openai':
        return ChatOpenAI(model=os.getenv('OPENAI_MODEL', 'gpt-4o'))
    else:
        return ChatAnthropic(model=os.getenv('ANTHROPIC_MODEL_SONNET'))

llm = get_llm()

# Configuration de session navigateur améliorée
browser_session = BrowserSession(
    executable_path=os.getenv('PUPPETEER_EXECUTABLE_PATH', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'),
    user_data_dir=os.getenv('PUPPETEER_USER_DATA_DIR', 'C:\\Users\\bendo\\Desktop\\Documents\\Tech\\Puppeteer Master\\chrome-profil'),
    viewport={'width': 1440, 'height': 900},
    startMaximized=False,
    headless=False,
    args=[
        '--window-size=1440,900',
        '--disable-web-security',
        '--no-first-run',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox'
    ]
)

def show_help():
    """Affiche l'aide d'utilisation"""
    print("""
🤖 === AGENT BROWSER AUTOMATION ===
🧠 Contrôle intelligent du navigateur avec IA

📝 USAGE:
  python browser-use.py "tâche à effectuer"
  python browser-use.py --help

🎯 EXEMPLES DE TÂCHES:
  • Navigation web:
    python browser-use.py "aller sur Google et rechercher les dernières news IA"
    
  • Création de comptes:
    python browser-use.py "créer un compte Gmail avec mes informations"
    
  • E-commerce:
    python browser-use.py "rechercher un iPhone 15 sur Amazon et comparer les prix"
    
  • Réseaux sociaux:
    python browser-use.py "poster un message sur LinkedIn"
    
  • Formulaires:
    python browser-use.py "remplir le formulaire de contact sur le site exemple.com"
    
  • Recherche d'informations:
    python browser-use.py "rechercher des informations sur les startups françaises"

⚙️ CONFIGURATION:
  • Modèle IA: {model_type} ({model_name})
  • Mémoire: {"Activée" if check_memory_available() else "Désactivée"}
  • Profil Chrome: Personnalisé
""".format(
        model_type=os.getenv('LLM_TYPE', 'anthropic').upper(),
        model_name=os.getenv('ANTHROPIC_MODEL_SONNET', 'claude-3-sonnet'),
    ))

def check_memory_available():
    """Vérifie si les packages mémoire sont installés"""
    try:
        import browser_use.memory
        return True
    except ImportError:
        return False

async def main():
    print("🚀 === BROWSER AUTOMATION AGENT ===")
    print(f"🧠 Modèle: {os.getenv('LLM_TYPE', 'anthropic').upper()}")
    print(f"💾 Mémoire: {'✅ Activée' if check_memory_available() else '⚠️ Désactivée'}")
    
    # Vérifier les arguments
    if len(sys.argv) < 2 or sys.argv[1] in ['--help', '-h', 'help']:
        show_help()
        return
    
    
    # Récupérer et valider la tâche
    task = " ".join(sys.argv[1:])
    
    if len(task.strip()) < 5:
        print("❌ Erreur: La tâche doit contenir au moins 5 caractères.")
        show_help()
        return
    
    print(f"\n🎯 Tâche: {task}")
    print("🌐 Lancement du navigateur...\n")
    
    # Configuration de l'agent avec mémoire si disponible
    agent_config = {
        'task': task,
        'llm': llm,
        'browser_session': browser_session,
        'enable_memory': False,  # Par défaut désactivé
        
    }
    
    # Activer la mémoire si disponible
    if check_memory_available():
        agent_config['enable_memory'] = True
        print("💾 Mémoire activée - L'agent se souviendra des actions précédentes")
    else:
        agent_config['enable_memory'] = False
        print("⚠️  Mémoire désactivée - Mode session unique")
    
    agent = Agent(**agent_config)
    
    try:
        print("🤖 Démarrage de l'exécution...\n")
        result = await agent.run()
        
        print(f"\n✅ === TÂCHE TERMINÉE ===")
        print(f"📋 Résultat: {result}")
        print(f"⏱️  Session terminée avec succès!")
        
    except KeyboardInterrupt:
        print(f"\n⏹️  Tâche interrompue par l'utilisateur")
    except Exception as e:
        print(f"\n❌ === ERREUR ===")
        print(f"💥 {str(e)}")
        print(f"🔧 Vérifiez votre configuration et réessayez")

if __name__ == "__main__":
    asyncio.run(main())