# Installazione Desktop CRM Marmeria

Guida per l'installazione dell'applicazione desktop CRM Marmeria su Windows.

## Prerequisiti

- **Node.js** (versione 18 o superiore)
- **npm** (incluso con Node.js)
- **Git** (per clonare il repository)

### Installazione Node.js

1. Scarica Node.js da [nodejs.org](https://nodejs.org/)
2. Installa la versione LTS (Long Term Support)
3. Verifica l'installazione aprendo il Prompt dei comandi e digitando:
   ```bash
   node --version
   npm --version
   ```

## Installazione Automatica

### Opzione 1: Script Batch (Raccomandato per Windows)

1. Clona il repository:
   ```bash
   git clone https://github.com/JackoPeru/Crm-Marmeria.git
   cd Crm-Marmeria
   ```

2. Esegui lo script di installazione:
   ```bash
   setup-desktop.bat
   ```

### Opzione 2: PowerShell

1. Apri PowerShell come amministratore
2. Naviga nella cartella del progetto:
   ```powershell
   cd "C:\percorso\del\progetto\Crm-Marmeria"
   ```

3. Esegui lo script:
   ```powershell
   .\setup-desktop.ps1
   ```

## Installazione Manuale

Se preferisci installare manualmente:

1. **Clona il repository:**
   ```bash
   git clone https://github.com/JackoPeru/Crm-Marmeria.git
   cd Crm-Marmeria
   ```

2. **Installa le dipendenze:**
   ```bash
   npm install
   ```

3. **Compila e crea l'installer:**
   ```bash
   npm run build:win
   ```

4. **Trova l'installer:**
   L'installer sarà creato nella cartella `dist-electron/`

## Esecuzione dell'Applicazione

Dopo l'installazione, puoi:

1. **Installare l'applicazione:** Esegui il file `.exe` creato in `dist-electron/`
2. **Eseguire in modalità sviluppo:** `npm run electron`

## Comandi Disponibili

- `npm run dev` - Avvia il server di sviluppo web
- `npm run build` - Compila per il web
- `npm run electron` - Avvia l'applicazione Electron
- `npm run build:win` - Compila e crea installer per Windows
- `npm run build:mac` - Compila e crea installer per macOS
- `npm run build:linux` - Compila e crea installer per Linux

## Struttura del Progetto

```
Crm-Marmeria/
├── src/                 # Codice sorgente React
├── electron/           # File di configurazione Electron
├── dist/               # Build web
├── dist-electron/      # Build desktop e installer
├── setup-desktop.bat  # Script di installazione Windows
├── setup-desktop.ps1  # Script PowerShell
└── package.json        # Configurazione del progetto
```

## Risoluzione Problemi

### Errore "npm non riconosciuto"

- Assicurati che Node.js sia installato correttamente
- Riavvia il Prompt dei comandi dopo l'installazione di Node.js
- Verifica che npm sia nel PATH di sistema

### Errore durante l'installazione delle dipendenze

1. Elimina la cartella `node_modules` e il file `package-lock.json`
2. Esegui nuovamente `npm install`
3. Se persiste, prova con `npm install --force`

### Errore durante la compilazione

- Verifica di avere abbastanza spazio su disco
- Controlla che non ci siano processi antivirus che bloccano la compilazione
- Prova a eseguire il Prompt dei comandi come amministratore

### Schermata bianca o errori di caricamento risorse

Questo problema è stato risolto con l'aggiornamento della configurazione Vite. L'applicazione ora utilizza percorsi relativi per Electron, garantendo il corretto caricamento delle risorse.

### Errori DevTools (Autofill.enable, etc.)

Gli errori come "Autofill.enable" o "Autofill.setAddresses" sono normali avvisi di Chrome DevTools e non influenzano il funzionamento dell'applicazione. Possono essere ignorati.

### Problemi con PowerShell

Se PowerShell blocca l'esecuzione degli script:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Supporto

Per problemi o domande:

1. Controlla la sezione "Risoluzione Problemi" sopra
2. Verifica i log di errore nel terminale
3. Apri una issue su GitHub con i dettagli dell'errore

## Note Tecniche

- L'applicazione è basata su **Electron** e **React**
- Utilizza **Vite** come build tool
- Supporta Windows, macOS e Linux
- L'installer per Windows è un file `.exe` autoestraente