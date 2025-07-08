# Istruzioni per l'Installazione e l'Utilizzo del Nuovo Server

## Introduzione

Questo documento fornisce istruzioni dettagliate per l'installazione e l'utilizzo del nuovo server di condivisione dati per l'applicazione CRM Marmeria. Il nuovo server è stato completamente riscritto per migliorare le prestazioni, la stabilità e aggiungere nuove funzionalità.

## Prerequisiti

- Node.js 14.x o superiore
- Electron 20.x o superiore
- Accesso a una cartella condivisa in rete (per la modalità Master)

## Installazione

### Passo 1: Backup dei File Esistenti

Prima di procedere con l'installazione del nuovo server, è consigliabile effettuare un backup dei file esistenti:

```
electron/server.cjs
electron/main.cjs
electron/preload.cjs
```

### Passo 2: Sostituzione dei File

Sostituire i file esistenti con i nuovi file:

1. Rinominare `server-new.cjs` in `server.cjs`
2. Rinominare `main-new.cjs` in `main.cjs`
3. Rinominare `preload-new.cjs` in `preload.cjs`

Eseguire i seguenti comandi nella cartella del progetto:

```bash
move electron\server-new.cjs electron\server.cjs
move electron\main-new.cjs electron\main.cjs
move electron\preload-new.cjs electron\preload.cjs
```

### Passo 3: Test del Server

Prima di avviare l'applicazione completa, è possibile testare il funzionamento del server utilizzando lo script di test fornito:

```bash
node electron/server-test.js
```

Questo script eseguirà una serie di test per verificare che il server funzioni correttamente.

## Configurazione

### Configurazione del Server Master

Per configurare un computer come server Master:

1. Avviare l'applicazione CRM Marmeria
2. Accedere alle impostazioni di rete
3. Selezionare la modalità "Master"
4. Specificare la porta (default: 3001)
5. Selezionare una cartella condivisa accessibile da tutti i client
6. Salvare le impostazioni

### Configurazione dei Client

Per configurare un computer come client:

1. Avviare l'applicazione CRM Marmeria
2. Accedere alle impostazioni di rete
3. Selezionare la modalità "Client"
4. Specificare il percorso della cartella condivisa del Master
5. Salvare le impostazioni

## Utilizzo

### Avvio e Arresto del Server

Il server viene avviato automaticamente quando l'applicazione viene avviata in modalità Master. È possibile avviare e arrestare manualmente il server dalle impostazioni di rete.

### Sincronizzazione dei Dati

La sincronizzazione dei dati può avvenire in diversi modi:

1. **Sincronizzazione Automatica**: il server esporta e importa automaticamente i dati a intervalli regolari
2. **Sincronizzazione Manuale**: è possibile forzare la sincronizzazione manualmente dalle impostazioni di rete
3. **Sincronizzazione con Peer Specifico**: è possibile sincronizzare i dati con un peer specifico selezionandolo dalla lista dei peer disponibili

### Gestione dei Backup

Il nuovo server include funzionalità avanzate per la gestione dei backup:

1. **Backup Automatici**: il server crea automaticamente backup periodici dei dati
2. **Backup Manuali**: è possibile creare manualmente backup dei dati dalle impostazioni di rete
3. **Ripristino dei Backup**: è possibile ripristinare i dati da un backup precedente

## Risoluzione dei Problemi

### Il server non si avvia

- Verificare che la porta specificata non sia già in uso
- Verificare che la cartella condivisa sia accessibile e abbia i permessi corretti
- Controllare i log dell'applicazione per eventuali errori

### La sincronizzazione non funziona

- Verificare che il server sia in esecuzione
- Verificare che la cartella condivisa sia accessibile
- Verificare che il discovery UDP non sia bloccato dal firewall
- Controllare i log dell'applicazione per eventuali errori di sincronizzazione

### I peer non vengono rilevati

- Verificare che il firewall non blocchi le porte UDP (41234)
- Verificare che i computer siano nella stessa rete locale
- Verificare che il broadcast UDP sia abilitato nella rete

## Nuove Funzionalità

Il nuovo server include diverse nuove funzionalità rispetto alla versione precedente:

1. **Discovery Automatico dei Peer**: il server rileva automaticamente altri peer nella rete locale
2. **Sincronizzazione in Tempo Reale**: i cambiamenti vengono trasmessi in tempo reale agli altri peer connessi
3. **Gestione Avanzata dei Backup**: funzionalità avanzate per la creazione e il ripristino dei backup
4. **Interfaccia API Migliorata**: API REST più complete e robuste
5. **Gestione degli Errori Migliorata**: gestione più robusta degli errori e dei casi limite

## Supporto

Per ulteriori informazioni o supporto, consultare la documentazione completa nel file `README-SERVER.md` o contattare il supporto tecnico.