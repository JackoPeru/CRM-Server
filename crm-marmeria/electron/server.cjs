const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

class DataSharingServer {
  constructor() {
    this.app = express();
    this.httpServer = null;
    this.io = null;
    this.port = 3001;
    this.isRunning = false;
    this.connectedClients = new Map();
    
    this.setupMiddleware();
    this.setupMiddlewareExpress();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Configura CORS manualmente
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
    
    this.setupWebSocket();
  }
  
  setupWebSocket() {
    // Configurazione WebSocket per comunicazione in tempo reale
    // Verrà inizializzato quando il server HTTP viene creato
  }

  setupMiddlewareExpress() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  }

  setupRoutes() {
    // Route per verificare lo stato del server
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Route per ottenere tutti i dati di una collezione
    this.app.get('/api/data/:collection', (req, res) => {
      try {
        const { collection } = req.params;
        const data = this.getLocalData(collection);
        
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
        
        this.saveLocalData(collection, newData);
        
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
        
        const currentData = this.getLocalData(collection);
        const itemWithId = {
          ...newItem,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedData = [...currentData, itemWithId];
        
        this.saveLocalData(collection, updatedData);
        
        // Notifica tutti i client connessi del nuovo elemento
        if (this.io) {
          this.io.emit('data-updated', {
            collection,
            action: 'add',
            item: itemWithId,
            data: updatedData
          });
        }
        
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
        
        const currentData = this.getLocalData(collection);
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
        
        this.saveLocalData(collection, updatedData);
        
        // Notifica tutti i client connessi dell'aggiornamento
        if (this.io && updatedItem) {
          this.io.emit('data-updated', {
            collection,
            action: 'update',
            item: updatedItem,
            data: updatedData
          });
        }
        
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
        
        const currentData = this.getLocalData(collection);
        const deletedItem = currentData.find(item => item.id === id);
        const updatedData = currentData.filter(item => item.id !== id);
        
        this.saveLocalData(collection, updatedData);
        
        // Notifica tutti i client connessi dell'eliminazione
        if (this.io && deletedItem) {
          this.io.emit('data-updated', {
            collection,
            action: 'delete',
            item: deletedItem,
            data: updatedData
          });
        }
        
        res.json({ success: true, data: updatedData, deletedId: id });
      } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Errore nell\'eliminazione dell\'elemento' });
      }
    });

    // Route per ottenere informazioni sul server
    this.app.get('/api/info', (req, res) => {
      res.json({
        serverName: 'CRM Marmeria Data Server',
        version: '1.0.0',
        mode: 'master',
        collections: ['customers', 'projects', 'materials', 'quotes', 'invoices'],
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });
  }

  // Funzione per leggere i dati dal localStorage (simulato tramite file)
  getLocalData(collection) {
    try {
      // In un'app Electron, possiamo accedere ai dati del renderer process
      // Per ora simuliamo leggendo da un file JSON
      const userDataPath = app.getPath('userData');
      const dataPath = path.join(userDataPath, 'crm-data', `${collection}.json`);
      
      if (fs.existsSync(dataPath)) {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
      }
      
      return [];
    } catch (error) {
      console.error('Error reading local data:', error);
      return [];
    }
  }

  // Funzione per salvare i dati nel localStorage (simulato tramite file)
  saveLocalData(collection, data) {
    try {
      const userDataPath = app.getPath('userData');
      const dataDir = path.join(userDataPath, 'crm-data');
      const dataPath = path.join(dataDir, `${collection}.json`);
      
      // Crea la directory se non esiste
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving local data:', error);
      return false;
    }
  }

  // Avvia il server
  start(port = 3001) {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        resolve({ success: true, message: 'Server già in esecuzione', port: this.port });
        return;
      }

      this.port = port;
      
      // Crea il server HTTP
      this.httpServer = http.createServer(this.app);
      
      // Inizializza Socket.IO
      this.io = new Server(this.httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST", "PUT", "DELETE"]
        }
      });
      
      // Gestione connessioni WebSocket
      this.io.on('connection', (socket) => {
        console.log(`🔌 Client connesso: ${socket.id}`);
        this.connectedClients.set(socket.id, {
          id: socket.id,
          connectedAt: new Date().toISOString()
        });
        
        // Invia lo stato iniziale al client
        socket.emit('connection-established', {
          clientId: socket.id,
          serverInfo: {
            name: 'CRM Marmeria Data Server',
            version: '1.0.0',
            collections: ['customers', 'projects', 'materials', 'quotes', 'invoices']
          }
        });
        
        // Gestione richiesta di sincronizzazione completa
        socket.on('request-full-sync', (collections) => {
          try {
            const syncData = {};
            const collectionsToSync = collections || ['customers', 'projects', 'materials', 'quotes', 'invoices'];
            
            collectionsToSync.forEach(collection => {
              syncData[collection] = this.getLocalData(collection);
            });
            
            socket.emit('full-sync-response', {
              success: true,
              data: syncData,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            socket.emit('full-sync-response', {
              success: false,
              error: error.message
            });
          }
        });
        
        // Gestione operazioni CRUD dal client
        socket.on('client-operation', async (operation) => {
          try {
            const { collection, action, data, id } = operation;
            let result;
            
            switch (action) {
              case 'add':
                const currentData = this.getLocalData(collection);
                const newItem = {
                  ...data,
                  id: Date.now().toString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                const updatedData = [...currentData, newItem];
                this.saveLocalData(collection, updatedData);
                
                // Notifica tutti gli altri client
                socket.broadcast.emit('data-updated', {
                  collection,
                  action: 'add',
                  item: newItem,
                  data: updatedData
                });
                
                result = { success: true, item: newItem, data: updatedData };
                break;
                
              case 'update':
                const currentUpdateData = this.getLocalData(collection);
                let updatedItem = null;
                const updatedUpdateData = currentUpdateData.map(item => {
                  if (item.id === id) {
                    updatedItem = {
                      ...item,
                      ...data,
                      updatedAt: new Date().toISOString()
                    };
                    return updatedItem;
                  }
                  return item;
                });
                this.saveLocalData(collection, updatedUpdateData);
                
                // Notifica tutti gli altri client
                if (updatedItem) {
                  socket.broadcast.emit('data-updated', {
                    collection,
                    action: 'update',
                    item: updatedItem,
                    data: updatedUpdateData
                  });
                }
                
                result = { success: true, item: updatedItem, data: updatedUpdateData };
                break;
                
              case 'delete':
                const currentDeleteData = this.getLocalData(collection);
                const deletedItem = currentDeleteData.find(item => item.id === id);
                const updatedDeleteData = currentDeleteData.filter(item => item.id !== id);
                this.saveLocalData(collection, updatedDeleteData);
                
                // Notifica tutti gli altri client
                if (deletedItem) {
                  socket.broadcast.emit('data-updated', {
                    collection,
                    action: 'delete',
                    item: deletedItem,
                    data: updatedDeleteData
                  });
                }
                
                result = { success: true, deletedId: id, data: updatedDeleteData };
                break;
                
              default:
                result = { success: false, error: 'Azione non supportata' };
            }
            
            socket.emit('operation-result', {
              operationId: operation.operationId,
              ...result
            });
          } catch (error) {
            socket.emit('operation-result', {
              operationId: operation.operationId,
              success: false,
              error: error.message
            });
          }
        });
        
        socket.on('disconnect', () => {
          console.log(`🔌 Client disconnesso: ${socket.id}`);
          this.connectedClients.delete(socket.id);
        });
      });
      
      this.httpServer.listen(port, '0.0.0.0', (error) => {
        if (error) {
          console.error('Errore nell\'avvio del server:', error);
          reject({ success: false, error: error.message });
          return;
        }
        
        this.isRunning = true;
        console.log(`🚀 Server CRM Marmeria avviato su porta ${port}`);
        console.log(`📡 Accessibile da altri PC all'indirizzo: http://[IP-QUESTO-PC]:${port}`);
        console.log(`🔌 WebSocket attivo per sincronizzazione in tempo reale`);
        
        resolve({ 
          success: true, 
          message: `Server avviato sulla porta ${port}`, 
          port: this.port 
        });
      });
      
      this.httpServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Porta ${port} già in uso`);
          reject({ success: false, error: `Porta ${port} già in uso` });
        } else {
          console.error('Errore del server:', error);
          reject({ success: false, error: error.message });
        }
      });
    });
  }

  // Ferma il server
  stop() {
    return new Promise((resolve) => {
      if (!this.isRunning || !this.httpServer) {
        resolve({ success: true, message: 'Server non in esecuzione' });
        return;
      }

      // Chiudi tutte le connessioni WebSocket
      if (this.io) {
        this.io.close();
        this.io = null;
      }
      
      // Pulisci la lista dei client connessi
      this.connectedClients.clear();

      this.httpServer.close(() => {
        this.isRunning = false;
        this.httpServer = null;
        console.log('🛑 Server fermato');
        resolve({ success: true, message: 'Server fermato con successo' });
      });
    });
  }

  // Ottieni lo stato del server
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      uptime: this.isRunning ? process.uptime() : 0
    };
  }
}

module.exports = DataSharingServer;