# Documentazione del Server di Condivisione Dati

## Panoramica

Il server di condivisione dati è un componente fondamentale dell'applicazione CRM Marmeria che consente la sincronizzazione dei dati tra diverse istanze dell'applicazione in una rete locale. Il server utilizza una combinazione di tecnologie per garantire una comunicazione efficiente e affidabile:

- **Express.js**: per le API REST
- **WebSocket**: per la comunicazione in tempo reale
- **UDP**: per il discovery automatico dei peer nella rete
- **Chokidar**: per il monitoraggio dei file

## Architettura

Il sistema è composto da due classi principali:

1. **NetworkDiscovery**: gestisce il discovery dei peer nella rete locale utilizzando UDP
2. **DataSharingServer**: gestisce il server HTTP, WebSocket e la sincronizzazione dei dati

## Modalità di Funzionamento

Il server può operare in due modalità:

- **Modalità Master**: il server gestisce una cartella condivisa accessibile da tutti i client nella rete
- **Modalità Client**: il client si connette a un server master per sincronizzare i dati

## Funzionalità Principali

### Discovery Automatico

Il sistema utilizza UDP per il discovery automatico dei peer nella rete locale. Ogni istanza del server invia periodicamente messaggi di broadcast per annunciare la propria presenza e ascolta i messaggi degli altri peer.

### Sincronizzazione dei Dati

La sincronizzazione dei dati avviene attraverso diversi meccanismi:

1. **Sincronizzazione Automatica**: il server esporta e importa automaticamente i dati a intervalli regolari
2. **Sincronizzazione Manuale**: l'utente può forzare la sincronizzazione con un peer specifico
3. **Sincronizzazione File-Based**: i dati vengono sincronizzati attraverso file JSON in una cartella condivisa
4. **Sincronizzazione WebSocket**: i cambiamenti vengono trasmessi in tempo reale agli altri peer connessi

### Gestione delle Collezioni

Il server gestisce diverse collezioni di dati:

- Clienti
- Progetti
- Materiali
- Preventivi
- Fatture

Ogni collezione viene salvata in un file JSON separato nella cartella condivisa.

### API REST

Il server espone diverse API REST per la gestione dei dati:

- `/api/health`: verifica lo stato del server
- `/api/collections`: ottiene la lista delle collezioni disponibili
- `/api/data/:collection`: CRUD per le collezioni
- `/api/export`: esporta manualmente i dati
- `/api/import`: importa manualmente i dati
- `/api/sync/auto`: controlla la sincronizzazione automatica
- `/api/sync/peer`: sincronizza con un peer specifico

### WebSocket

Il server utilizza WebSocket per notificare i client in tempo reale quando i dati vengono modificati. I client possono sottoscriversi a specifiche collezioni per ricevere aggiornamenti.

## Utilizzo

### Avvio del Server

```javascript
const DataSharingServer = require('./server-new.cjs');
const server = new DataSharingServer();

// Avvio del server sulla porta 3001 con una cartella condivisa
server.start(3001, 'C:\\SharedFolder')
  .then(result => console.log('Server avviato:', result))
  .catch(error => console.error('Errore:', error));
```

### Arresto del Server

```javascript
server.stop()
  .then(result => console.log('Server fermato:', result))
  .catch(error => console.error('Errore:', error));
```

### Controllo dello Stato

```javascript
const status = server.getStatus();
console.log('Stato del server:', status);
```

### Gestione della Sincronizzazione Automatica

```javascript
// Avvio della sincronizzazione automatica
server.startAutoSync();

// Arresto della sincronizzazione automatica
server.stopAutoSync();

// Controllo dello stato della sincronizzazione automatica
const isActive = server.isAutoSyncActive();
console.log('Sincronizzazione automatica attiva:', isActive);
```

## Integrazione con Electron

Il server è integrato nell'applicazione Electron attraverso i seguenti file:

- `main-new.cjs`: gestisce l'istanza del server e gli handler IPC
- `preload-new.cjs`: espone le API del server al renderer process

## Gestione degli Errori

Il server implementa una gestione robusta degli errori per garantire la stabilità dell'applicazione:

- Errori di connessione alla cartella condivisa
- Errori di sincronizzazione
- Errori di discovery
- Errori di WebSocket

## Sicurezza

Il server implementa diverse misure di sicurezza:

- CORS configurato per accettare solo connessioni dalla stessa origine
- Validazione dei dati in ingresso
- Controllo degli accessi alla cartella condivisa

## Limitazioni

- Il server è progettato per funzionare in una rete locale e non è adatto per l'uso su Internet
- La sincronizzazione dei dati può generare conflitti se più utenti modificano gli stessi dati contemporaneamente
- Il discovery UDP potrebbe non funzionare correttamente in alcune configurazioni di rete

## Risoluzione dei Problemi

### Il server non si avvia

- Verificare che la porta non sia già in uso
- Verificare che la cartella condivisa sia accessibile e abbia i permessi corretti

### La sincronizzazione non funziona

- Verificare che il server sia in esecuzione
- Verificare che la cartella condivisa sia accessibile
- Verificare che il discovery UDP non sia bloccato dal firewall

### I peer non vengono rilevati

- Verificare che il firewall non blocchi le porte UDP
- Verificare che i computer siano nella stessa rete locale
- Verificare che il broadcast UDP sia abilitato nella rete