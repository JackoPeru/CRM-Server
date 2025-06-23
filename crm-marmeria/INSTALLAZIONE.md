# 🚀 CRM Marmeria - Guida Installazione

## 📋 Requisiti di Sistema

- **Sistema Operativo**: Windows 10/11
- **Connessione Internet**: Necessaria per il download
- **Spazio Disco**: Almeno 500 MB liberi

## 🎯 Installazione Automatica (Consigliata)

### Metodo 1: Script Automatico

1. **Scarica il file di setup**:
   - Vai su: https://github.com/JackoPeru/Crm-Marmeria
   - Clicca su **"Code"** → **"Download ZIP"**
   - Estrai il file `setup.bat`

2. **Esegui l'installazione**:
   - Doppio click su `setup.bat`
   - Segui le istruzioni a schermo
   - Lo script installerà automaticamente tutto il necessario

### Cosa fa lo script automatico:

✅ **Controlla Node.js** - Se mancante, apre il download  
✅ **Controlla Git** - Se mancante, apre il download  
✅ **Scarica il codice** - Clona da GitHub  
✅ **Installa dipendenze** - Esegue `npm install`  
✅ **Crea script di avvio** - File `avvia-crm.bat`  
✅ **Crea script aggiornamento** - File `aggiorna-crm.bat`  

## 🔧 Installazione Manuale

### Passo 1: Installa Node.js
1. Vai su https://nodejs.org
2. Scarica la versione **LTS** (Long Term Support)
3. Installa con le impostazioni predefinite
4. Riavvia il computer

### Passo 2: Installa Git (Opzionale)
1. Vai su https://git-scm.com/download/win
2. Scarica e installa Git per Windows
3. Usa le impostazioni predefinite

### Passo 3: Scarica il Codice

**Opzione A - Con Git:**
```bash
git clone https://github.com/JackoPeru/Crm-Marmeria.git
cd Crm-Marmeria
```

**Opzione B - Download ZIP:**
1. Vai su https://github.com/JackoPeru/Crm-Marmeria
2. Clicca **"Code"** → **"Download ZIP"**
3. Estrai in una cartella a tua scelta

### Passo 4: Installa Dipendenze
```bash
npm install
```

### Passo 5: Avvia l'Applicazione
```bash
npm run dev
```

## 🚀 Utilizzo Quotidiano

### Avvio Rapido
- **Doppio click** su `avvia-crm.bat`
- Oppure apri http://localhost:5173 nel browser

### Aggiornamento
- **Doppio click** su `aggiorna-crm.bat`
- Scarica automaticamente gli ultimi aggiornamenti

### Versione Online
- **Sempre aggiornata**: https://jackoperu.github.io/Crm-Marmeria/
- **Nessuna installazione richiesta**
- **Accesso da qualsiasi dispositivo**

## 🛠️ Risoluzione Problemi

### Errore: "node non è riconosciuto"
**Soluzione**: Node.js non installato correttamente
1. Reinstalla Node.js da https://nodejs.org
2. Riavvia il computer
3. Riprova l'installazione

### Errore: "git non è riconosciuto"
**Soluzione**: Git non installato
1. Installa Git da https://git-scm.com
2. Riavvia il computer
3. Riprova l'installazione

### Errore: "npm install fallito"
**Soluzione**: Problemi di rete o permessi
1. Controlla la connessione internet
2. Esegui come amministratore
3. Prova: `npm cache clean --force`

### Porta 5173 occupata
**Soluzione**: Vite userà automaticamente una porta diversa
- Controlla il messaggio nel terminale
- Usa la porta indicata (es. 5174, 5175, ecc.)

## 📞 Supporto

- **Repository**: https://github.com/JackoPeru/Crm-Marmeria
- **Issues**: Segnala problemi nella sezione Issues di GitHub
- **Documentazione**: Leggi il file `DEPLOY.md` per il deploy

## 🎉 Installazione Completata!

Dopo l'installazione avrai:
- ✅ CRM Marmeria funzionante in locale
- ✅ Script di avvio rapido
- ✅ Script di aggiornamento automatico
- ✅ Accesso alla versione online

**Buon lavoro con il tuo CRM! 🚀**