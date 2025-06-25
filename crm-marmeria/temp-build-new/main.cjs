const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DataSharingServer = require('./server.cjs');
const isDev = process.env.NODE_ENV === 'development';

// Istanza del server di condivisione dati
let dataSharingServer = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  // Carica l'app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  
  // Inizializza il server di condivisione dati
  dataSharingServer = new DataSharingServer();
  
  // Controlla se deve avviare il server in modalità Master
  checkAndStartServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Ferma il server prima di chiudere l'app
    if (dataSharingServer) {
      dataSharingServer.stop();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Funzione per controllare e avviare il server se necessario
function checkAndStartServer() {
  try {
    const fs = require('fs');
    const userDataPath = app.getPath('userData');
    const prefsPath = path.join(userDataPath, 'network-prefs.json');
    
    if (fs.existsSync(prefsPath)) {
      const networkPrefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
      
      if (networkPrefs.mode === 'master') {
        const port = networkPrefs.masterPort || 3001;
        dataSharingServer.start(port)
          .then(result => {
            console.log('✅ Server avviato automaticamente:', result.message);
          })
          .catch(error => {
            console.error('❌ Errore nell\'avvio automatico del server:', error);
          });
      }
    }
  } catch (error) {
    console.error('Errore nel controllo delle preferenze di rete:', error);
  }
}

// IPC handlers per comunicare con il renderer process
ipcMain.handle('server-start', async (event, port, sharedPath) => {
  try {
    const result = await dataSharingServer.start(port, sharedPath);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('server-stop', async () => {
  try {
    const result = await dataSharingServer.stop();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('server-status', async () => {
  return dataSharingServer.getStatus();
});

// Test connessione al PC master
ipcMain.handle('test-master-connection', async (event, masterPath) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Verifica se il percorso esiste e è accessibile
    if (!fs.existsSync(masterPath)) {
      return { success: false, error: 'Percorso non trovato' };
    }
    
    // Testa la scrittura creando un file temporaneo
    const testFile = path.join(masterPath, '.test-access');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Sincronizza con il PC master
ipcMain.handle('sync-with-master', async (event, collection, masterPath) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const dataFile = path.join(masterPath, `${collection}.json`);
    
    if (fs.existsSync(dataFile)) {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      return { success: true, data };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Invia dati al PC master
ipcMain.handle('push-to-master', async (event, collection, action, data, masterPath) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const dataFile = path.join(masterPath, `${collection}.json`);
    let currentData = [];
    
    // Leggi i dati esistenti
    if (fs.existsSync(dataFile)) {
      currentData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
    
    // Applica l'operazione
    switch (action) {
      case 'add':
        const newItem = {
          ...data,
          id: data.id || Date.now().toString(),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        currentData.push(newItem);
        break;
        
      case 'update':
        const { id, updates } = data;
        currentData = currentData.map(item => 
          item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
        );
        break;
        
      case 'delete':
        currentData = currentData.filter(item => item.id !== data.id);
        break;
    }
    
    // Salva i dati aggiornati
    fs.writeFileSync(dataFile, JSON.stringify(currentData, null, 2));
    
    return { success: true, data: currentData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handler per salvare le preferenze di rete
ipcMain.handle('save-network-prefs', async (event, networkPrefs) => {
  try {
    const fs = require('fs');
    const userDataPath = app.getPath('userData');
    const prefsPath = path.join(userDataPath, 'network-prefs.json');
    
    fs.writeFileSync(prefsPath, JSON.stringify(networkPrefs, null, 2));
    
    // Se la modalità è cambiata, gestisci il server di conseguenza
    if (networkPrefs.mode === 'master' && !dataSharingServer.getStatus().isRunning) {
      const result = await dataSharingServer.start(networkPrefs.masterPort || 3001, networkPrefs.sharedPath);
      return { success: true, serverStarted: result.success };
    } else if (networkPrefs.mode !== 'master' && dataSharingServer.getStatus().isRunning) {
      const result = await dataSharingServer.stop();
      return { success: true, serverStopped: result.success };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});