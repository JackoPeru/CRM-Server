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

// Importazione delle dipendenze
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const axios = require('axios');
const dgram = require('dgram');
const os = require('os');

/**
 * Classe per la gestione del servizio di discovery nella rete locale
 * Permette di trovare automaticamente altri server CRM nella rete
 */
class NetworkDiscovery {
  constructor(serverPort, onPeerDiscovered, onPeerLost) {
    this.serverPort = serverPort;
    this.peers = new Map(); // Mappa per tenere traccia dei peer e del loro ultimo heartbeat
    this.onPeerDiscovered = onPeerDiscovered || (() => {});
    this.onPeerLost = onPeerLost || (() => {});
    this.heartbeatInterval = null;
    this.checkPeersInterval = null;
    this.DISCOVERY_PORT = 41234;
    this.BROADCAST_ADDR = '255.255.255.255';
    this.PEER_TIMEOUT = 180000; // 3 minuti senza heartbeat = peer perso
    
    // Inizializza il socket UDP
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    
    this.setupSocketListeners();
  }
  
  /**
   * Configura i listener per il socket UDP
   */
  setupSocketListeners() {
    // Gestione dei messaggi in arrivo
    this.socket.on('message', (message, rinfo) => {
      try {
        const msg = JSON.parse(message.toString());
        
        // Verifica che sia un messaggio del nostro protocollo e non dal nostro stesso server
        if (msg.type === 'crm-marmeria-discovery' && msg.port !== this.serverPort) {
          const peer = `${rinfo.address}:${msg.port}`;
          const isNewPeer = !this.peers.has(peer);
          
          // Aggiorna il timestamp dell'ultimo heartbeat
          this.peers.set(peer, {
            address: rinfo.address,
            port: msg.port,
            lastSeen: Date.now(),
            info: msg.info || {}
          });
          
          // Se è un nuovo peer, notifica il callback
          if (isNewPeer) {
            console.log(`🔍 Nuovo peer scoperto: ${peer}`);
            this.onPeerDiscovered(peer, rinfo.address, msg.port, msg.info);
            
            // Invia una risposta al peer per confermare la scoperta
            this.sendMessage({
              type: 'crm-marmeria-response',
              port: this.serverPort,
              info: this.getServerInfo()
            }, rinfo.address, msg.port);
          }
        }
        
        // Gestione delle risposte di conferma
        if (msg.type === 'crm-marmeria-response' && msg.port !== this.serverPort) {
          const peer = `${rinfo.address}:${msg.port}`;
          const isNewPeer = !this.peers.has(peer);
          
          // Aggiorna il timestamp dell'ultimo heartbeat
          this.peers.set(peer, {
            address: rinfo.address,
            port: msg.port,
            lastSeen: Date.now(),
            info: msg.info || {}
          });
          
          // Se è un nuovo peer, notifica il callback
          if (isNewPeer) {
            console.log(`🔍 Nuovo peer scoperto (risposta): ${peer}`);
            this.onPeerDiscovered(peer, rinfo.address, msg.port, msg.info);
          }
        }
      } catch (error) {
        console.error('❌ Errore nella gestione del messaggio di discovery:', error);
      }
    });
    
    // Quando il socket è pronto per l'ascolto
    this.socket.on('listening', () => {
      const address = this.socket.address();
      console.log(`🔊 Socket discovery in ascolto su ${address.address}:${address.port}`);
      this.socket.setBroadcast(true);
      
      // Invia subito un messaggio di discovery
      this.broadcast();
    });
    
    // Gestione degli errori
    this.socket.on('error', (error) => {
      console.error('❌ Errore nel socket discovery:', error);
    });
  }
  
  /**
   * Avvia il servizio di discovery
   */
  start() {
    // Avvia l'ascolto sul socket
    this.socket.bind(this.DISCOVERY_PORT);
    
    // Imposta l'invio periodico di heartbeat
    this.heartbeatInterval = setInterval(() => this.broadcast(), 60000); // Ogni minuto
    
    // Imposta il controllo periodico dei peer attivi
    this.checkPeersInterval = setInterval(() => this.checkPeers(), 60000); // Ogni minuto
    
    console.log('✅ Servizio di discovery avviato');
    return this;
  }
  
  /**
   * Ferma il servizio di discovery
   */
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.checkPeersInterval) {
      clearInterval(this.checkPeersInterval);
      this.checkPeersInterval = null;
    }
    
    try {
      this.socket.close();
      console.log('🛑 Servizio di discovery fermato');
    } catch (error) {
      console.error('❌ Errore nella chiusura del socket discovery:', error);
    }
  }
  
  /**
   * Invia un messaggio broadcast a tutta la rete
   */
  broadcast() {
    const message = Buffer.from(JSON.stringify({
      type: 'crm-marmeria-discovery',
      port: this.serverPort,
      info: this.getServerInfo()
    }));
    
    this.socket.send(message, 0, message.length, this.DISCOVERY_PORT, this.BROADCAST_ADDR, (err) => {
      if (err) {
        console.error('❌ Errore nell\'invio del messaggio broadcast:', err);
      }
    });
  }
  
  /**
   * Invia un messaggio diretto a un host specifico
   */
  sendMessage(msg, host, port) {
    const message = Buffer.from(JSON.stringify(msg));
    this.socket.send(message, 0, message.length, port, host, (err) => {
      if (err) {
        console.error(`❌ Errore nell'invio del messaggio a ${host}:${port}`, err);
      }
    });
  }
  
  /**
   * Verifica quali peer sono ancora attivi
   */
  checkPeers() {
    const now = Date.now();
    const peersToRemove = [];
    
    // Controlla tutti i peer
    for (const [peerKey, peerData] of this.peers.entries()) {
      // Se non si è visto un heartbeat per troppo tempo, considera il peer perso
      if (now - peerData.lastSeen > this.PEER_TIMEOUT) {
        peersToRemove.push(peerKey);
      }
    }
    
    // Rimuovi i peer inattivi
    peersToRemove.forEach(peer => {
      this.peers.delete(peer);
      console.log(`🔍 Peer perso: ${peer}`);
      this.onPeerLost(peer);
    });
  }
  
  /**
   * Ottiene la lista dei peer attivi
   */
  getPeers() {
    return Array.from(this.peers.keys());
  }
  
  /**
   * Ottiene i dettagli di tutti i peer attivi
   */
  getPeersDetails() {
    return Array.from(this.peers.entries()).map(([key, data]) => ({
      id: key,
      address: data.address,
      port: data.port,
      lastSeen: data.lastSeen,
      info: data.info
    }));
  }
  
  /**
   * Ottiene informazioni sul server locale
   */
  getServerInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      version: '2.0.0',
      timestamp: Date.now()
    };
  }
}

/**
 * Classe principale del server di condivisione dati
 * Gestisce la sincronizzazione dei dati tra i client e i server nella rete
 */
class DataSharingServer {
  constructor() {
    // Inizializzazione delle proprietà
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
    this.dataCache = new Map(); // Cache per i dati
    this.cacheTTL = 5 * 60 * 1000; // 5 minuti di TTL per la cache
    
    // Configurazione del server
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  /**
   * Configura i middleware di Express
   */
  setupMiddleware() {
    // Configura CORS per permettere richieste da qualsiasi origine
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Access-Control-Allow-Methods']
    }));
    
    // Middleware per il parsing del body delle richieste
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Middleware per il logging delle richieste
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }
  
  /**
   * Configura le routes di Express
   */
  setupRoutes() {
    // Route per verificare lo stato del server
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        mode: 'master',
        sharedPath: this.sharedDataPath,
        collections: this.collections,
        peers: this.discovery ? this.discovery.getPeers() : []
      });
    });
    
    // Route per ottenere tutti i dati di una collezione
    this.app.get('/api/data/:collection', (req, res) => {
      try {
        const { collection } = req.params;
        const data = this.getSharedData(collection);
        
        res.json(data);
      } catch (error) {
        console.error('❌ Errore nel recupero dei dati:', error);
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
        console.error('❌ Errore nel salvataggio dei dati:', error);
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
          id: newItem.id || this.generateId(),
          createdAt: newItem.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedData = [...currentData, itemWithId];
        
        this.saveSharedData(collection, updatedData);
        
        res.json({ success: true, data: updatedData, item: itemWithId });
      } catch (error) {
        console.error('❌ Errore nell\'aggiunta dell\'elemento:', error);
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
        console.error('❌ Errore nell\'aggiornamento dell\'elemento:', error);
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
        console.error('❌ Errore nell\'eliminazione dell\'elemento:', error);
        res.status(500).json({ error: 'Errore nell\'eliminazione dell\'elemento' });
      }
    });
    
    // Route per la ricerca in una collezione
    this.app.get('/api/data/:collection/search', (req, res) => {
      try {
        const { collection } = req.params;
        const { q } = req.query;
        
        if (!q) {
          return res.status(400).json({ error: 'Parametro di ricerca mancante' });
        }
        
        const data = this.getSharedData(collection);
        const searchTerm = q.toLowerCase();
        
        // Ricerca in tutti i campi di testo
        const results = data.filter(item => {
          return Object.values(item).some(value => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchTerm);
            }
            return false;
          });
        });
        
        res.json(results);
      } catch (error) {
        console.error('❌ Errore nella ricerca:', error);
        res.status(500).json({ error: 'Errore nella ricerca' });
      }
    });
    
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
        console.error('❌ Errore durante la sincronizzazione con il peer:', error);
        res.status(500).json({ error: 'Errore durante la sincronizzazione' });
      }
    });
    
    // Route per ottenere i timestamp di sincronizzazione
    this.app.get('/api/sync/timestamps', (req, res) => {
      res.json(this.lastSyncTimestamp);
    });
    
    // Route per sincronizzazione completa
    this.app.post('/api/sync', (req, res) => {
      try {
        const { collections } = req.body;
        const syncData = {};
        
        const collectionsToSync = collections || this.collections;
        
        collectionsToSync.forEach(collection => {
          syncData[collection] = this.getSharedData(collection);
        });
        
        res.json({
          success: true,
          data: syncData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Errore durante la sincronizzazione:', error);
        res.status(500).json({ error: 'Errore durante la sincronizzazione' });
      }
    });
    
    // Route per controllare la sincronizzazione automatica
    this.app.post('/api/auto-sync/start', (req, res) => {
      try {
        this.startAutoSync();
        res.json({ success: true, message: 'Sincronizzazione automatica avviata' });
      } catch (error) {
        console.error('❌ Errore nell\'avvio della sincronizzazione automatica:', error);
        res.status(500).json({ error: 'Errore nell\'avvio della sincronizzazione automatica' });
      }
    });
    
    this.app.post('/api/auto-sync/stop', (req, res) => {
      try {
        this.stopAutoSync();
        res.json({ success: true, message: 'Sincronizzazione automatica fermata' });
      } catch (error) {
        console.error('❌ Errore nel fermare la sincronizzazione automatica:', error);
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
        console.error('❌ Errore nel recupero dello stato della sincronizzazione:', error);
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
        console.error('❌ Errore durante l\'esportazione:', error);
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
        console.error('❌ Errore durante l\'importazione:', error);
        res.status(500).json({ error: 'Errore durante l\'importazione' });
      }
    });
    
    // Route per ottenere la lista dei peer
    this.app.get('/api/peers', (req, res) => {
      try {
        if (!this.discovery) {
          return res.json({ peers: [] });
        }
        
        const peers = this.discovery.getPeersDetails();
        res.json({ peers });
      } catch (error) {
        console.error('❌ Errore nel recupero dei peer:', error);
        res.status(500).json({ error: 'Errore nel recupero dei peer' });
      }
    });
    
    // Route per forzare la sincronizzazione con un peer specifico
    this.app.post('/api/peers/:peerId/sync', async (req, res) => {
      try {
        const { peerId } = req.params;
        const { collections } = req.body;
        
        if (!this.discovery) {
          return res.status(400).json({ error: 'Servizio di discovery non attivo' });
        }
        
        const peers = this.discovery.getPeersDetails();
        const peer = peers.find(p => p.id === peerId);
        
        if (!peer) {
          return res.status(404).json({ error: 'Peer non trovato' });
        }
        
        const collectionsToSync = collections || this.collections;
        const syncResults = {};
        
        for (const collection of collectionsToSync) {
          try {
            const localData = this.getSharedData(collection);
            const peerUrl = `http://${peer.address}:${peer.port}/api/sync/peer`;
            
            // Invia i dati locali al peer
            await axios.post(peerUrl, {
              collection,
              peerData: localData
            });
            
            syncResults[collection] = { success: true };
          } catch (error) {
            console.error(`❌ Errore sincronizzazione ${collection} con ${peerId}:`, error);
            syncResults[collection] = { success: false, error: error.message };
          }
        }
        
        res.json({
          success: true,
          peer: peerId,
          results: syncResults
        });
      } catch (error) {
        console.error('❌ Errore nella sincronizzazione con il peer:', error);
        res.status(500).json({ error: 'Errore nella sincronizzazione con il peer' });
      }
    });
  }
  
  /**
   * Genera un ID univoco
   */
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Ottiene i dati di una collezione dalla cache o dal file system
   */
  getSharedData(collection) {
    // Verifica se i dati sono in cache e non sono scaduti
    const cacheKey = `collection:${collection}`;
    const cachedData = this.dataCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < this.cacheTTL) {
      return cachedData.data;
    }
    
    // Se non in cache o scaduti, leggi dal file system
    try {
      const dataPath = this.getDataPath(collection);
      
      if (fs.existsSync(dataPath)) {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        
        // Aggiorna la cache
        this.dataCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        return data;
      }
      
      // Se il file non esiste, restituisci un array vuoto
      return [];
    } catch (error) {
      console.error(`❌ Errore lettura dati ${collection}:`, error);
      return [];
    }
  }
  
  /**
   * Salva i dati di una collezione e sincronizza con i peer
   */
  saveSharedData(collection, data) {
    try {
      const dataPath = this.getDataPath(collection);
      const dataDir = path.dirname(dataPath);
      
      // Crea la directory se non esiste
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Salva i dati nel file
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log(`✅ Dati ${collection} salvati in:`, dataPath);
      
      // Aggiorna la cache
      const cacheKey = `collection:${collection}`;
      this.dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Aggiorna il timestamp di sincronizzazione
      this.lastSyncTimestamp[collection] = new Date().toISOString();
      
      // Sincronizza con i peer
      this.syncWithPeers(collection, data);
      
      // Notifica i client WebSocket
      this.broadcastUpdate(collection);
      
      return true;
    } catch (error) {
      console.error(`❌ Errore salvataggio dati ${collection}:`, error);
      throw error;
    }
  }
  
  /**
   * Salva i dati senza attivare la sincronizzazione con i peer (per evitare loop)
   */
  saveSharedDataSilent(collection, data) {
    try {
      const dataPath = this.getDataPath(collection);
      const dataDir = path.dirname(dataPath);
      
      // Crea la directory se non esiste
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Salva i dati nel file
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      
      // Aggiorna la cache
      const cacheKey = `collection:${collection}`;
      this.dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Aggiorna il timestamp di sincronizzazione
      this.lastSyncTimestamp[collection] = new Date().toISOString();
      
      // Notifica i client WebSocket
      this.broadcastUpdate(collection);
      
      return true;
    } catch (error) {
      console.error(`❌ Errore salvataggio silenzioso dati ${collection}:`, error);
      throw error;
    }
  }
  
  /**
   * Sincronizza i dati con tutti i peer conosciuti
   */
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
        
        console.log(`✅ Sincronizzazione con ${peer} completata`);
      } catch (error) {
        console.error(`❌ Errore sincronizzazione con ${peer}:`, error);
      }
    }
  }
  
  /**
   * Unisce i dati locali con quelli di un peer
   */
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
  
  /**
   * Ottiene il percorso del file per una collezione
   */
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
  
  /**
   * Imposta il percorso della cartella condivisa
   */
  setSharedDataPath(newPath) {
    this.sharedDataPath = newPath;
    console.log(`📁 Cartella condivisa impostata: ${newPath}`);
    
    // Invalida la cache quando cambia il percorso
    this.dataCache.clear();
    
    // Riavvia il watcher se il percorso cambia mentre il server è in esecuzione
    if (this.isRunning) {
      this.stopFileWatcher();
      this.startFileWatcher();
    }
  }
  
  /**
   * Avvia il server WebSocket
   */
  startWebSocketServer() {
    this.wss = new WebSocket.Server({ server: this.httpServer });
    
    this.wss.on('connection', ws => {
      console.log('👤 Client connesso al WebSocket');
      
      // Invia un messaggio di benvenuto
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connesso al server CRM Marmeria',
        timestamp: new Date().toISOString()
      }));
      
      // Gestione della chiusura della connessione
      ws.on('close', () => {
        console.log('👤 Client disconnesso dal WebSocket');
      });
      
      // Gestione dei messaggi dal client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          // Gestione dei diversi tipi di messaggi
          if (data.type === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('❌ Errore nella gestione del messaggio WebSocket:', error);
        }
      });
    });
    
    console.log('✅ Server WebSocket avviato');
  }
  
  /**
   * Invia un aggiornamento a tutti i client WebSocket
   */
  broadcastUpdate(collection) {
    if (this.wss) {
      const message = JSON.stringify({
        type: 'data-update',
        collection,
        timestamp: new Date().toISOString()
      });
      
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }
  
  /**
   * Avvia il monitoraggio dei file nella cartella condivisa
   */
  startFileWatcher() {
    if (this.sharedDataPath) {
      this.fileWatcher = chokidar.watch(this.sharedDataPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      });
      
      this.fileWatcher.on('all', (event, filePath) => {
        // Ignora i file che non sono JSON
        if (!filePath.endsWith('.json')) return;
        
        const collection = path.basename(filePath, '.json');
        console.log(`📄 File ${collection} modificato (${event}), notifico i client...`);
        
        // Invalida la cache per questa collezione
        const cacheKey = `collection:${collection}`;
        this.dataCache.delete(cacheKey);
        
        // Notifica i client
        this.broadcastUpdate(collection);
      });
      
      console.log('✅ Monitoraggio file avviato');
    }
  }
  
  /**
   * Ferma il monitoraggio dei file
   */
  stopFileWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
      console.log('🛑 Monitoraggio file interrotto');
    }
  }
  
  /**
   * Avvia il server
   */
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
        // Avvia il server HTTP
        this.httpServer = this.app.listen(this.port, '0.0.0.0', () => {
          console.log(`🚀 Server avviato su porta ${this.port}`);
          console.log(`📁 Dati condivisi in: ${this.sharedDataPath || 'cartella locale'}`);
          
          // Inizializza il servizio di discovery
          this.discovery = new NetworkDiscovery(
            this.port,
            (peer) => console.log(`✅ Peer scoperto: ${peer}`),
            (peer) => console.log(`❌ Peer perso: ${peer}`)
          ).start();
          
          // Avvia il server WebSocket
          this.startWebSocketServer();
          
          // Avvia il monitoraggio dei file
          this.startFileWatcher();
          
          // Avvia la sincronizzazione automatica
          this.startAutoSync();
          
          resolve({
            success: true,
            port: this.port,
            sharedPath: this.sharedDataPath,
            message: `Server avviato su porta ${this.port}`
          });
        });

        // Gestione degli errori del server
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
  
  /**
   * Esporta tutti i dati in un file fisso nella cartella condivisa
   */
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
  
  /**
   * Esporta un backup manuale con timestamp
   */
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
  
  /**
   * Trova il file di sincronizzazione nella cartella condivisa
   */
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
  
  /**
   * Importa i dati dal file di sincronizzazione
   */
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
  
  /**
   * Avvia la sincronizzazione automatica
   */
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
  
  /**
   * Ferma la sincronizzazione automatica
   */
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('🛑 Sincronizzazione automatica fermata');
    }
  }
  
  /**
   * Ferma il server
   */
  async stop() {
    if (!this.isRunning || !this.httpServer) {
      return { success: true, message: 'Server non in esecuzione' };
    }

    return new Promise((resolve) => {
      // Ferma il servizio di discovery
      if (this.discovery) {
        this.discovery.stop();
        this.discovery = null;
      }
      
      // Ferma il monitoraggio dei file
      this.stopFileWatcher();
      
      // Ferma la sincronizzazione automatica
      this.stopAutoSync();
      
      // Chiudi il server WebSocket
      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }
      
      // Chiudi il server HTTP
      this.httpServer.close(() => {
        this.isRunning = false;
        this.httpServer = null;
        console.log('🛑 Server fermato');
        resolve({ success: true, message: 'Server fermato con successo' });
      });
    });
  }
  
  /**
   * Ottiene lo stato del server
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      sharedPath: this.sharedDataPath,
      collections: this.collections,
      peers: this.discovery ? this.discovery.getPeers() : [],
      lastSync: this.lastSyncTimestamp
    };
  }
  
  /**
   * Getter per verificare se il server è in esecuzione
   */
  get isServerRunning() {
    return this.isRunning;
  }
}

module.exports = DataSharingServer;