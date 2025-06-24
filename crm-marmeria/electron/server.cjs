const express = require('express');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class DataSharingServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = 3001;
    this.isRunning = false;
    
    this.setupMiddleware();
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
        const updatedData = [...currentData, {
          ...newItem,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
        
        this.saveLocalData(collection, updatedData);
        
        res.json({ success: true, data: updatedData });
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
        const updatedData = currentData.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ...updates,
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        });
        
        this.saveLocalData(collection, updatedData);
        
        res.json({ success: true, data: updatedData });
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
        const updatedData = currentData.filter(item => item.id !== id);
        
        this.saveLocalData(collection, updatedData);
        
        res.json({ success: true, data: updatedData });
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
      
      this.server = this.app.listen(port, '0.0.0.0', (error) => {
        if (error) {
          console.error('Errore nell\'avvio del server:', error);
          reject({ success: false, error: error.message });
          return;
        }
        
        this.isRunning = true;
        console.log(`🚀 Server CRM Marmeria avviato su porta ${port}`);
        console.log(`📡 Accessibile da altri PC all'indirizzo: http://[IP-QUESTO-PC]:${port}`);
        
        resolve({ 
          success: true, 
          message: `Server avviato sulla porta ${port}`, 
          port: this.port 
        });
      });
      
      this.server.on('error', (error) => {
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
      if (!this.isRunning || !this.server) {
        resolve({ success: true, message: 'Server non in esecuzione' });
        return;
      }

      this.server.close(() => {
        this.isRunning = false;
        this.server = null;
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