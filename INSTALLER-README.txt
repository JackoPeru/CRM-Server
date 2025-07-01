=== CRM MARMERIA - INSTALLER AGGIORNATO ===
Versione 1.2.0 - Con correzioni per sincronizzazione dati

🔧 PROBLEMI RISOLTI:
✅ Correzione sincronizzazione dati tra PC Master e Client
✅ Risolto problema textbox non cliccabili al primo avvio
✅ Migliorata gestione degli ID per evitare conflitti
✅ Aggiunto indicatore visivo dello stato di sincronizzazione
✅ Migliorata gestione errori durante la sincronizzazione
✅ Package Ultra-Ottimizzato: Ridotte le dimensioni dell'83% escludendo file di sviluppo
✅ Build Minimale: Solo file essenziali inclusi nell'installer (da 650MB a 110MB)
✅ Ottimizzazione Avanzata: Esclusione completa di node_modules e dipendenze di sviluppo

📦 FILE CREATI:
- releases/CRM-Marmeria-Setup.exe (110 MB) - Installer ultra-ottimizzato per Windows
- build/CRM-Marmeria-win32-x64/ (Applicazione impacchettata)
- installer.nsi - Script NSIS per la creazione dell'installer
- .electronignore - File per escludere contenuti non necessari dal package

🚀 INSTALLAZIONE:
1. Eseguire CRM-Marmeria-Setup.exe come Amministratore
2. Seguire la procedura guidata di installazione
3. L'applicazione verrà installata in: C:\Program Files\Marmeria Solutions\CRM Marmeria\
4. Verranno creati collegamenti sul Desktop e nel Menu Start

⚙️ CONFIGURAZIONE RETE:
1. PC MASTER:
   - Aprire Impostazioni > Rete
   - Selezionare "PC Master"
   - Scegliere la cartella condivisa per i dati
   - Il server si avvierà automaticamente sulla porta 3001

2. PC CLIENT:
   - Aprire Impostazioni > Rete
   - Selezionare "PC Client"
   - Inserire l'indirizzo IP del PC Master
   - Testare la connessione
   - Abilitare la sincronizzazione automatica

🔍 INDICATORI DI STATO:
Nell'header dell'applicazione vedrai:
- 🔄 Icona blu rotante: Sincronizzazione in corso
- 📶 Icona verde: Connesso al Master
- 📵 Icona rossa: Disconnesso dal Master
- "Master": PC configurato come Master

📋 FUNZIONALITÀ PRINCIPALI:
- Gestione clienti, progetti, materiali
- Preventivi e fatturazione
- Sincronizzazione dati in tempo reale
- Backup automatico
- Interfaccia moderna e responsive

🛠️ REQUISITI SISTEMA:
- Windows 10/11 (64-bit)
- 4GB RAM minimo
- 500MB spazio libero
- Connessione di rete per sincronizzazione

📞 SUPPORTO:
Per assistenza tecnica o segnalazione bug:
- Email: support@crmmarmeria.com
- GitHub: https://github.com/yourusername/crm-marmeria

⚠️ NOTE IMPORTANTI:
- Eseguire sempre backup prima di aggiornamenti
- Configurare il firewall per permettere comunicazione sulla porta 3001
- Per reti aziendali, consultare l'amministratore di sistema

📅 Data creazione: 24 Giugno 2025
🏷️ Versione: 1.2.0
👨‍💻 Sviluppato da: CRM Marmeria Team