const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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
      
      if (networkPrefs.mode === 'master' && !dataSharingServer.isServerRunning) {
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
    
    // Verifica i permessi di lettura
    try {
      fs.accessSync(masterPath, fs.constants.R_OK);
    } catch (readError) {
      return { success: false, error: 'Permessi di lettura negati sulla cartella condivisa' };
    }
    
    // Verifica i permessi di scrittura
    try {
      fs.accessSync(masterPath, fs.constants.W_OK);
    } catch (writeError) {
      return { success: false, error: 'Permessi di scrittura negati sulla cartella condivisa. Verificare che la cartella sia condivisa con permessi di scrittura per questo utente.' };
    }
    
    // Testa la scrittura creando un file temporaneo
    const testFile = path.join(masterPath, '.test-access');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (fileError) {
      return { success: false, error: `Impossibile scrivere nella cartella condivisa: ${fileError.message}. Verificare i permessi di condivisione di rete.` };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: `Errore di connessione: ${error.message}` };
  }
});

// Handler per salvare backup nella cartella condivisa
ipcMain.handle('save-backup-to-shared', async (event, backupData, filename) => {
  const fs = require('fs');
  
  try {
    if (!dataSharingServer || !dataSharingServer.sharedDataPath) {
      return { success: false, error: 'Cartella condivisa non configurata' };
    }
    
    const backupPath = path.join(dataSharingServer.sharedDataPath, filename);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    return { success: true, path: backupPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handler per caricare backup dalla cartella condivisa
ipcMain.handle('load-backup-from-shared', async (event, filename) => {
  const fs = require('fs');
  
  try {
    if (!dataSharingServer || !dataSharingServer.sharedDataPath) {
      return { success: false, error: 'Cartella condivisa non configurata' };
    }
    
    const backupPath = path.join(dataSharingServer.sharedDataPath, filename);
    
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'File di backup non trovato' };
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    return { success: true, data: backupData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handler per elencare i backup nella cartella condivisa
ipcMain.handle('list-backups-in-shared', async (event) => {
  const fs = require('fs');
  
  try {
    if (!dataSharingServer || !dataSharingServer.sharedDataPath) {
      return { success: false, error: 'Cartella condivisa non configurata' };
    }
    
    const files = fs.readdirSync(dataSharingServer.sharedDataPath)
      .filter(file => file.endsWith('.json') && file.includes('backup'))
      .map(file => {
        const filePath = path.join(dataSharingServer.sharedDataPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Sincronizza con il PC master
ipcMain.handle('sync-with-master', async (event, collection, masterPath) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const syncFile = path.join(masterPath, 'crm-marmeria-sync.json');
    
    if (fs.existsSync(syncFile)) {
      const allData = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
      const data = allData[collection] || [];
      
      // Salva i dati anche nella cartella condivisa locale del client
      if (dataSharingServer && dataSharingServer.isRunning) {
        dataSharingServer.saveSharedData(collection, data);
        console.log(`✅ Dati ${collection} sincronizzati e salvati nella cartella condivisa locale`);
      }
      
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
    const syncFile = path.join(masterPath, 'crm-marmeria-sync.json');
    let allData = {};
    
    // Leggi i dati esistenti dal file di sincronizzazione
    if (fs.existsSync(syncFile)) {
      allData = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
    }
    
    let currentData = allData[collection] || [];
    
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
    
    // Aggiorna i dati nel file di sincronizzazione
    allData[collection] = currentData;
    allData._lastModified = new Date().toISOString();
    allData._source = 'client';
    
    // Salva il file di sincronizzazione aggiornato
    fs.writeFileSync(syncFile, JSON.stringify(allData, null, 2));
    
    // Salva i dati anche nella cartella condivisa locale del client
    if (dataSharingServer && dataSharingServer.isRunning) {
      dataSharingServer.saveSharedData(collection, currentData);
      console.log(`✅ Dati ${collection} aggiornati e salvati nella cartella condivisa locale`);
    }
    
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