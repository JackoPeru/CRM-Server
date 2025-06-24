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
    icon: path.join(__dirname, 'icon.png')
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
ipcMain.handle('server-start', async (event, port) => {
  try {
    const result = await dataSharingServer.start(port);
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

ipcMain.handle('test-connection', async (event, serverAddress, serverPort) => {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: serverAddress,
      port: serverPort,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      resolve({ success: res.statusCode === 200, status: res.statusCode });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout connessione' });
    });
    
    req.end();
  });
});

// Handler per sincronizzare i dati
ipcMain.handle('sync-data', async (event, collection, serverAddress, serverPort) => {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: serverAddress,
      port: serverPort,
      path: `/api/data/${collection}`,
      method: 'GET',
      timeout: 10000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(data);
            resolve({ success: true, data: jsonData });
          } else {
            resolve({ success: false, error: `Errore server: ${res.statusCode}` });
          }
        } catch (error) {
          resolve({ success: false, error: 'Errore parsing JSON' });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout connessione' });
    });
    
    req.end();
  });
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
      const result = await dataSharingServer.start(networkPrefs.masterPort || 3001);
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

// Handler per ottenere l'indirizzo IP locale
ipcMain.handle('get-local-ip', async () => {
  try {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];
      for (const network of networkInterface) {
        if (network.family === 'IPv4' && !network.internal) {
          return { success: true, ip: network.address };
        }
      }
    }
    
    return { success: false, error: 'Nessun indirizzo IP trovato' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});