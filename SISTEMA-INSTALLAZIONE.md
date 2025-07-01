# 🚀 CRM Marmeria - Sistema di Installazione Completo

## 📋 Panoramica

Ho creato un sistema completo di installazione per il CRM Marmeria che permette di distribuire facilmente l'applicazione su qualsiasi PC Windows.

## 📦 Componenti del Sistema

### 1. Script di Installazione

#### `setup.bat` - Script Windows Batch
- **Funzione**: Installazione automatica per sistemi Windows
- **Caratteristiche**:
  - Controlla presenza di Node.js e Git
  - Guida l'utente nell'installazione dei prerequisiti
  - Clona automaticamente il repository da GitHub
  - Installa le dipendenze npm
  - Crea script di avvio e aggiornamento

#### `setup.ps1` - Script PowerShell
- **Funzione**: Versione avanzata per utenti PowerShell
- **Caratteristiche**:
  - Interfaccia colorata e user-friendly
  - Gestione errori avanzata
  - Download automatico dei prerequisiti
  - Creazione script sia .ps1 che .bat per compatibilità

### 2. Documentazione

#### `INSTALLAZIONE.md` - Guida Completa
- **Contenuto**:
  - Requisiti di sistema
  - Installazione automatica e manuale
  - Risoluzione problemi comuni
  - Istruzioni per l'utilizzo quotidiano

#### `LEGGIMI.txt` - Guida Rapida
- **Contenuto**:
  - Istruzioni essenziali
  - Contenuto del pacchetto
  - Link alla versione online

### 3. Pacchetto di Distribuzione

#### `crea-pacchetto-distribuzione.bat`
- **Funzione**: Crea un pacchetto completo per la distribuzione
- **Output**: Cartella `CRM-Marmeria-Setup` con tutti i file necessari

#### `INSTALLA-QUI.bat` (Generato automaticamente)
- **Funzione**: Avvio rapido dell'installazione
- **Utilizzo**: Doppio click per iniziare l'installazione

## 🎯 Modalità di Installazione

### Opzione 1: Installazione Locale
```
1. Scarica il pacchetto CRM-Marmeria-Setup
2. Doppio click su INSTALLA-QUI.bat
3. Segui le istruzioni a schermo
4. Usa avvia-crm.bat per avviare l'app
```

### Opzione 2: Versione Online
```
Accesso diretto: https://jackoperu.github.io/Crm-Marmeria/
- Sempre aggiornata
- Nessuna installazione richiesta
- Accesso da qualsiasi dispositivo
```

## 🔄 Sistema di Aggiornamento

### Script Automatici Creati
- **`avvia-crm.bat`**: Avvia l'applicazione locale
- **`aggiorna-crm.bat`**: Scarica e installa aggiornamenti
- **`avvia-crm.ps1`**: Versione PowerShell per l'avvio
- **`aggiorna-crm.ps1`**: Versione PowerShell per aggiornamenti

## 📁 Struttura del Pacchetto di Distribuzione

```
CRM-Marmeria-Setup/
├── INSTALLA-QUI.bat      # Avvio installazione rapida
├── setup.bat             # Script installazione Windows
├── setup.ps1             # Script installazione PowerShell
├── INSTALLAZIONE.md      # Guida completa
├── LEGGIMI.txt          # Guida rapida
├── README.md            # Documentazione progetto
└── DEPLOY.md            # Istruzioni deploy GitHub Pages
```

## 🛠️ Funzionalità Avanzate

### Controlli Automatici
- ✅ Verifica presenza Node.js
- ✅ Verifica presenza Git
- ✅ Controllo connessione internet
- ✅ Gestione errori di installazione

### Compatibilità
- ✅ Windows 10/11
- ✅ PowerShell e Command Prompt
- ✅ Installazione con e senza Git
- ✅ Supporto caratteri Unicode

### Sicurezza
- ✅ Download solo da repository ufficiale
- ✅ Verifica integrità dei file
- ✅ Installazione in cartella utente
- ✅ Nessun requisito di privilegi amministratore

## 🚀 Deploy Automatico

### GitHub Actions
- **Trigger**: Push su branch master
- **Processo**: Build automatico e deploy su GitHub Pages
- **URL**: https://jackoperu.github.io/Crm-Marmeria/

### Configurazione
- ✅ Workflow GitHub Actions configurato
- ✅ Vite configurato per GitHub Pages
- ✅ Script di build per produzione

## 📞 Supporto e Manutenzione

### Repository
- **URL**: https://github.com/JackoPeru/Crm-Marmeria
- **Issues**: Segnalazione problemi
- **Releases**: Download versioni stabili

### Monitoraggio
- **GitHub Actions**: Stato dei deploy
- **GitHub Pages**: Stato del sito
- **npm**: Gestione dipendenze

## 🎉 Vantaggi del Sistema

1. **Facilità d'uso**: Un click per installare
2. **Flessibilità**: Installazione locale o online
3. **Aggiornamenti**: Sistema automatico di update
4. **Compatibilità**: Funziona su tutti i PC Windows
5. **Sicurezza**: Download da fonti verificate
6. **Supporto**: Documentazione completa

## 📋 Checklist Distribuzione

- [x] Script di installazione Windows (.bat)
- [x] Script di installazione PowerShell (.ps1)
- [x] Documentazione completa (INSTALLAZIONE.md)
- [x] Guida rapida (LEGGIMI.txt)
- [x] Pacchetto di distribuzione
- [x] Script di avvio automatico
- [x] Script di aggiornamento
- [x] Deploy automatico GitHub Pages
- [x] Gestione errori e troubleshooting
- [x] Compatibilità multi-ambiente

**Il sistema di installazione è completo e pronto per la distribuzione! 🚀**