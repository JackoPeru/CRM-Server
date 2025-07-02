const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Gestione dei percorsi per l'app impacchettata
const isDev = process.env.NODE_ENV === 'development';
const appPath = isDev ? __dirname : process.resourcesPath;
const modulesPath = isDev ? path.join(__dirname, '..', 'node_modules') : path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');

// Aggiungi il percorso dei moduli al module path
if (!isDev) {
  require('module').globalPaths.push(modulesPath);
}

const express = require('express');
const Discovery = require('./discovery.cjs');
const axios = require('axios');
const chokidar = require('chokidar');
const WebSocket = require('ws');

class DataSharingServer {
  constructor() {
    this.app = express();
    this.httpServer = null;
    this.port = 3001;
    this.isRunning = false;
    this.sharedDataPath = null; // Percorso della cartella condivisa
    this.discovery = null; // Istanza del servizio di discovery
    this.lastSyncTimestamp = {}; // Timestamp dell'ultima sincronizzazione per collezione
    this.fileWatcher = null; // Istanza del watcher per i file
    this.wss = null; // Istanza del server WebSocket
    this.autoSyncInterval = null; // Intervallo per la sincronizzazione automatica
    this.collections = ['customers', 'projects', 'materials', 'quotes', 'invoices']; // Collezioni da sincronizzare
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Configura CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  }

  setupRoutes() {
    // Route per la sincronizzazione con un peer specifico
    this.app.post('/api/sync/peer', async (req, res) => {
      try {
        const { peerData, collection } = req.body;
        const currentData = this.getSharedData(collection);
        
        // Unisci i dati locali con quelli del peer, mantenendo le versioni più recenti
        const mergedData = this.mergeData(currentData, peerData);
        
        // Salva i dati uniti
        this.saveSharedData(collection, mergedData);
        
        res.json({ success: true, message: 'Dati sincronizzati con successo' });
      } catch (error) {
        console.error('Errore durante la sincronizzazione con il peer:', error);
        res.status(500).json({ error: 'Errore durante la sincronizzazione' });
      }
    });

    // Route per ottenere i timestamp di sincronizzazione
    this.app.get('/api/sync/timestamps', (req, res) => {
      res.json(this.lastSyncTimestamp);
    });

    // Route per verificare lo stato del server
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        mode: 'master',
        sharedPath: this.sharedDataPath
      });
    });

    // Route per ottenere tutti i dati di una collezione
    this.app.get('/api/data/:collection', (req, res) => {
      try {
        const { collection } = req.params;
        const data = this.getSharedData(collection);
        
        res.json(data);
      } catch (error) {
        console.error('Error getting data:', error);
        res.status(500).json({ error: 'Errore nel recupero dei dati' });
      }
    });

    // Route per aggiornare tutti i dati di una collezione
    this.app.post('/api/data/:collection', (req, res) => {
      try {
        const { collection } = req.params;
        const newData = req.body;
        
        this.saveSharedData(collection, newData);
        
        res.json({ success: true, message: 'Dati aggiornati con successo' });
      } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Errore nel salvataggio dei dati' });
      }
    });

    // Route per aggiungere un singolo elemento
    this.app.post('/api/data/:collection/add', (req, res) => {
      try {
        const { collection } = req.params;
        const newItem = req.body;
        
        const currentData = this.getSharedData(collection);
        const itemWithId = {
          ...newItem,
          id: newItem.id || Date.now().toString(),
          createdAt: newItem.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedData = [...currentData, itemWithId];
        
        this.saveSharedData(collection, updatedData);
        
        res.json({ success: true, data: updatedData, item: itemWithId });
      } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Errore nell\'aggiunta dell\'elemento' });
      }
    });

    // Route per aggiornare un singolo elemento
    this.app.put('/api/data/:collection/:id', (req, res) => {
      try {
        const { collection, id } = req.params;
        const updates = req.body;
        
        const currentData = this.getSharedData(collection);
        let updatedItem = null;
        const updatedData = currentData.map(item => {
          if (item.id === id) {
            updatedItem = {
              ...item,
              ...updates,
              updatedAt: new Date().toISOString()
            };
            return updatedItem;
          }
          return item;
        });
        
        this.saveSharedData(collection, updatedData);
        
        res.json({ success: true, data: updatedData, item: updatedItem });
      } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'elemento' });
      }
    });

    // Route per eliminare un singolo elemento
    this.app.delete('/api/data/:collection/:id', (req, res) => {
      try {
        const { collection, id } = req.params;
        
        const currentData = this.getSharedData(collection);
        const updatedData = currentData.filter(item => item.id !== id);
        
        this.saveSharedData(collection, updatedData);
        
        res.json({ success: true, data: updatedData });
      } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Errore nell\'eliminazione dell\'elemento' });
      }
    });

    // Route per sincronizzazione completa
    this.app.post('/api/sync', (req, res) => {
      try {
        const { collections } = req.body;
        const syncData = {};
        
        const collectionsToSync = collections || ['customers', 'projects', 'materials', 'quotes', 'invoices'];
        
        collectionsToSync.forEach(collection => {
          syncData[collection] = this.getSharedData(collection);
        });
        
        res.json({
          success: true,
          data: syncData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error during sync:', error);
        res.status(500).json({ error: 'Errore durante la sincronizzazione' });
      }
    });

    // Route per controllare la sincronizzazione automatica
    this.app.post('/api/auto-sync/start', (req, res) => {
      try {
        this.startAutoSync();
        res.json({ success: true, message: 'Sincronizzazione automatica avviata' });
      } catch (error) {
        console.error('Error starting auto-sync:', error);
        res.status(500).json({ error: 'Errore nell\'avvio della sincronizzazione automatica' });
      }
    });

    this.app.post('/api/auto-sync/stop', (req, res) => {
      try {
        this.stopAutoSync();
        res.json({ success: true, message: 'Sincronizzazione automatica fermata' });
      } catch (error) {
        console.error('Error stopping auto-sync:', error);
        res.status(500).json({ error: 'Errore nel fermare la sincronizzazione automatica' });
      }
    });

    this.app.get('/api/auto-sync/status', (req, res) => {
      try {
        res.json({ 
          isActive: this.autoSyncInterval !== null,
          sharedPath: this.sharedDataPath,
          lastSync: this.lastSyncTimestamp
        });
      } catch (error) {
        console.error('Error getting auto-sync status:', error);
        res.status(500).json({ error: 'Errore nel recupero dello stato' });
      }
    });

    // Route per esportazione manuale
    this.app.post('/api/export', (req, res) => {
      try {
        const backupPath = this.exportManualBackup();
        res.json({ 
          success: true, 
          message: 'Dati esportati con successo',
          backupPath: backupPath
        });
      } catch (error) {
        console.error('Error during export:', error);
        res.status(500).json({ error: 'Errore durante l\'esportazione' });
      }
    });

    // Route per importazione manuale
    this.app.post('/api/import', (req, res) => {
      try {
        const hasChanges = this.importLatestData();
        res.json({ 
          success: true, 
          message: hasChanges ? 'Dati importati con successo' : 'Nessun aggiornamento necessario',
          hasChanges: hasChanges
        });
      } catch (error) {
        console.error('Error during import:', error);
        res.status(500).json({ error: 'Errore durante l\'importazione' });
      }
    });
  }

  // Gestione dati nella cartella condivisa
  getSharedData(collection) {
    try {
      const dataPath = this.getDataPath(collection);
      
      if (fs.existsSync(dataPath)) {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
      }
      
      return [];
    } catch (error) {
      console.error(`Errore lettura dati ${collection}:`, error);
      return [];
    }
  }

  async syncWithPeers(collection, localData) {
    if (!this.discovery) return;
    
    const peers = this.discovery.getPeers();
    for (const peer of peers) {
      try {
        const [host, port] = peer.split(':');
        const peerUrl = `http://${host}:${port}/api/sync/peer`;
        
        // Invia i dati locali al peer
        await axios.post(peerUrl, {
          collection,
          peerData: localData
        });
        
        console.log(`Sincronizzazione con ${peer} completata`);
      } catch (error) {
        console.error(`Errore sincronizzazione con ${peer}:`, error);
      }
    }
  }

  mergeData(localData, peerData) {
    const mergedMap = new Map();
    
    // Indicizza i dati locali per ID
    localData.forEach(item => {
      mergedMap.set(item.id, item);
    });
    
    // Unisci o aggiorna con i dati del peer
    peerData.forEach(peerItem => {
      const localItem = mergedMap.get(peerItem.id);
      
      if (!localItem || new Date(peerItem.updatedAt) > new Date(localItem.updatedAt)) {
        mergedMap.set(peerItem.id, peerItem);
      }
    });
    
    return Array.from(mergedMap.values());
  }

  saveSharedData(collection, data) {
    try {
      const dataPath = this.getDataPath(collection);
      const dataDir = path.dirname(dataPath);
      
      // Crea la directory se non esiste
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log(`✅ Dati ${collection} salvati in:`, dataPath);
      
      // Aggiorna il timestamp di sincronizzazione
      this.lastSyncTimestamp[collection] = new Date().toISOString();
      
      // Sincronizza con i peer
      this.syncWithPeers(collection, data);
    } catch (error) {
      console.error(`Errore salvataggio dati ${collection}:`, error);
      throw error;
    }
  }

  getDataPath(collection) {
    if (this.sharedDataPath) {
      // Usa la cartella condivisa specificata
      return path.join(this.sharedDataPath, `${collection}.json`);
    } else {
      // Fallback alla cartella locale dell'app
      const userDataPath = app.getPath('userData');
      return path.join(userDataPath, 'shared-data', `${collection}.json`);
    }
  }

  // Imposta il percorso della cartella condivisa
  setSharedDataPath(newPath) {
    this.sharedDataPath = newPath;
    console.log(`📁 Cartella condivisa impostata: ${newPath}`);
    // Qui potresti voler riavviare il watcher se il percorso cambia mentre il server è in esecuzione
    if (this.isRunning) {
      this.stopFileWatcher();
      this.startFileWatcher();
    }
  }

  startWebSocketServer() {
    this.wss = new WebSocket.Server({ server: this.httpServer });
    this.wss.on('connection', ws => {
      console.log('Client connesso al WebSocket');
      ws.on('close', () => {
        console.log('Client disconnesso dal WebSocket');
      });
    });
  }

  broadcastUpdate(collection) {
    if (this.wss) {
      const message = JSON.stringify({ type: 'data-update', collection });
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  startFileWatcher() {
    if (this.sharedDataPath) {
      this.fileWatcher = chokidar.watch(this.sharedDataPath, { persistent: true, ignoreInitial: true });
      this.fileWatcher.on('all', (event, filePath) => {
        const collection = path.basename(filePath, '.json');
        console.log(`File ${collection} modificato, notifico i client...`);
        this.broadcastUpdate(collection);
      });
    }
  }

  async start(port = 3001, sharedPath = null) {
    if (this.isRunning) {
      throw new Error('Server già in esecuzione');
    }

    this.isRunning = true; // Imposta subito il flag per evitare doppi avvii
    this.port = port;
    if (sharedPath) {
      this.setSharedDataPath(sharedPath);
    }

    return new Promise((resolve, reject) => {
      try {
        this.httpServer = this.app.listen(this.port, '0.0.0.0', () => {
          console.log(`🚀 Server Master avviato su porta ${this.port}`);
          console.log(`📁 Dati condivisi in: ${this.sharedDataPath || 'cartella locale'}`);
          
          // Inizializza il servizio di discovery
          this.discovery = new Discovery(this.port);
          console.log('✅ Servizio di discovery avviato');

          // Avvia il server WebSocket
          this.startWebSocketServer();
          console.log('✅ Server WebSocket avviato');

          // Avvia il monitoraggio dei file
          this.startFileWatcher();
          console.log('✅ Monitoraggio file avviato');

          // Avvia la sincronizzazione automatica
          this.startAutoSync();
          console.log('✅ Sincronizzazione automatica avviata');
          
          resolve({
            success: true,
            port: this.port,
            sharedPath: this.sharedDataPath
          });
        });

        this.httpServer.on('error', (error) => {
          console.error('❌ Errore avvio server:', error);
          this.isRunning = false;
          reject(error);
        });
      } catch (error) {
        console.error('❌ Errore configurazione server:', error);
        this.isRunning = false;
        reject(error);
      }
    });
  }

  stopFileWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
      console.log('Monitoraggio file interrotto');
    }
  }

  // Esporta tutti i dati in un file fisso nella cartella condivisa
  exportAllData() {
    if (!this.sharedDataPath) {
      console.log('⚠️ Cartella condivisa non impostata, skip esportazione');
      return;
    }

    try {
      const allData = {};
      
      // Raccoglie tutti i dati dalle collezioni
      this.collections.forEach(collection => {
        allData[collection] = this.getSharedData(collection);
      });

      // Aggiunge timestamp di ultima modifica
      allData._lastModified = new Date().toISOString();
      allData._source = 'master';

      // Usa un nome file fisso che viene sovrascritto
      const syncFileName = 'crm-marmeria-sync.json';
      const syncPath = path.join(this.sharedDataPath, syncFileName);

      // Salva il file di sincronizzazione
      fs.writeFileSync(syncPath, JSON.stringify(allData, null, 2));
      console.log(`📤 Dati sincronizzati in: ${syncFileName}`);
      
      return syncPath;
    } catch (error) {
      console.error('❌ Errore durante l\'esportazione:', error);
    }
  }

  // Esporta un backup manuale con timestamp
  exportManualBackup() {
    if (!this.sharedDataPath) {
      console.log('⚠️ Cartella condivisa non impostata, skip esportazione');
      return;
    }

    try {
      const allData = {};
      
      // Raccoglie tutti i dati dalle collezioni
      this.collections.forEach(collection => {
        allData[collection] = this.getSharedData(collection);
      });

      // Crea il nome del file con timestamp per backup manuale
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `crm-marmeria-backup-${timestamp}.json`;
      const backupPath = path.join(this.sharedDataPath, backupFileName);

      // Salva il file di backup
      fs.writeFileSync(backupPath, JSON.stringify(allData, null, 2));
      console.log(`📤 Backup manuale creato: ${backupFileName}`);
      
      return backupPath;
    } catch (error) {
      console.error('❌ Errore durante l\'esportazione del backup:', error);
    }
  }

  // Trova il file di sincronizzazione nella cartella condivisa
  findSyncFile() {
    if (!this.sharedDataPath || !fs.existsSync(this.sharedDataPath)) {
      return null;
    }

    try {
      const syncFileName = 'crm-marmeria-sync.json';
      const syncPath = path.join(this.sharedDataPath, syncFileName);
      
      if (fs.existsSync(syncPath)) {
        const stats = fs.statSync(syncPath);
        return {
          name: syncFileName,
          path: syncPath,
          mtime: stats.mtime
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Errore nella ricerca del file di sincronizzazione:', error);
      return null;
    }
  }

  // Importa i dati dal file di sincronizzazione
  importLatestData() {
    const syncFile = this.findSyncFile();
    
    if (!syncFile) {
      console.log('📥 Nessun file di sincronizzazione trovato');
      return false;
    }

    try {
      const rawData = fs.readFileSync(syncFile.path, 'utf8');
      const importedData = JSON.parse(rawData);
      
      // Verifica se il file è stato modificato da un client
      if (importedData._source === 'master') {
        // Il file è stato scritto da questo master, non importare
        return false;
      }
      
      let hasChanges = false;
      
      // Importa i dati per ogni collezione
      this.collections.forEach(collection => {
        if (importedData[collection]) {
          const currentData = this.getSharedData(collection);
          const importedCollectionData = importedData[collection];
          
          // Confronta se ci sono differenze
          if (JSON.stringify(currentData) !== JSON.stringify(importedCollectionData)) {
            this.saveSharedDataSilent(collection, importedCollectionData);
            hasChanges = true;
            console.log(`📥 Dati ${collection} aggiornati da client`);
          }
        }
      });
      
      if (hasChanges) {
        console.log(`✅ Sincronizzazione completata da client`);
        this.broadcastUpdate('all'); // Notifica tutti i client
      }
      
      return hasChanges;
    } catch (error) {
      console.error('❌ Errore durante l\'importazione:', error);
      return false;
    }
  }

  // Salva i dati senza attivare la sincronizzazione con i peer (per evitare loop)
  saveSharedDataSilent(collection, data) {
    try {
      const dataPath = this.getDataPath(collection);
      const dataDir = path.dirname(dataPath);
      
      // Crea la directory se non esiste
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      
      // Aggiorna il timestamp di sincronizzazione
      this.lastSyncTimestamp[collection] = new Date().toISOString();
    } catch (error) {
      console.error(`Errore salvataggio silenzioso dati ${collection}:`, error);
      throw error;
    }
  }

  // Avvia la sincronizzazione automatica
  startAutoSync() {
    if (this.autoSyncInterval) {
      console.log('⚠️ Sincronizzazione automatica già attiva');
      return;
    }

    console.log('🔄 Avvio sincronizzazione automatica (ogni secondo)');
    
    this.autoSyncInterval = setInterval(() => {
      // Prima esporta i dati correnti
      this.exportAllData();
      
      // Poi importa il file più recente
      this.importLatestData();
    }, 1000); // Ogni secondo
  }

  // Ferma la sincronizzazione automatica
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('🛑 Sincronizzazione automatica fermata');
    }
  }

  async stop() {
    if (!this.isRunning || !this.httpServer) {
      return { success: true, message: 'Server non in esecuzione' };
    }

    return new Promise((resolve) => {
      this.httpServer.close(() => {
        this.isRunning = false;
        this.httpServer = null;
        this.stopFileWatcher();
        this.stopAutoSync();
        if (this.wss) {
          this.wss.close();
          this.wss = null;
        }
        console.log('🛑 Server Master fermato');
        resolve({ success: true, message: 'Server fermato con successo' });
      });
    });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      sharedPath: this.sharedDataPath
    };
  }

  // Getter per verificare se il server è in esecuzione
  get isServerRunning() {
    return this.isRunning;
  }
}

module.exports = DataSharingServer;