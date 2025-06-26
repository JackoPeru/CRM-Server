const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const express = require('express');
const Discovery = require('./discovery.cjs');
const axios = require('axios');

class DataSharingServer {
  constructor() {
    this.app = express();
    this.httpServer = null;
    this.port = 3001;
    this.isRunning = false;
    this.sharedDataPath = null; // Percorso della cartella condivisa
    this.discovery = null; // Istanza del servizio di discovery
    this.lastSyncTimestamp = {}; // Timestamp dell'ultima sincronizzazione per collezione
    
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
  setSharedDataPath(sharedPath) {
    this.sharedDataPath = sharedPath;
    console.log(`📁 Cartella condivisa impostata: ${sharedPath}`);
  }

  async start(port = 3001, sharedPath = null) {
    if (this.isRunning) {
      throw new Error('Server già in esecuzione');
    }

    this.port = port;
    if (sharedPath) {
      this.setSharedDataPath(sharedPath);
    }

    return new Promise((resolve, reject) => {
      try {
        this.httpServer = this.app.listen(this.port, '0.0.0.0', () => {
          this.isRunning = true;
          console.log(`🚀 Server Master avviato su porta ${this.port}`);
          console.log(`📁 Dati condivisi in: ${this.sharedDataPath || 'cartella locale'}`);
          
          // Inizializza il servizio di discovery
          this.discovery = new Discovery(this.port);
          console.log('✅ Servizio di discovery avviato');

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
        reject(error);
      }
    });
  }

  async stop() {
    if (!this.isRunning || !this.httpServer) {
      return { success: true, message: 'Server non in esecuzione' };
    }

    return new Promise((resolve) => {
      this.httpServer.close(() => {
        this.isRunning = false;
        this.httpServer = null;
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
}

module.exports = DataSharingServer;