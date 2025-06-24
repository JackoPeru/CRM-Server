const { contextBridge, ipcRenderer } = require('electron');

// Espone API sicure al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Informazioni di sistema
  platform: process.platform,
  version: process.versions.electron,
  
  // API per la condivisione dati
  network: {
    // Server management
    startServer: (port) => ipcRenderer.invoke('server-start', port),
    stopServer: () => ipcRenderer.invoke('server-stop'),
    getServerStatus: () => ipcRenderer.invoke('server-status'),
    
    // Connection testing
    testConnection: (serverAddress, serverPort) => 
      ipcRenderer.invoke('test-connection', serverAddress, serverPort),
    
    // Data synchronization
    syncData: (collection, serverAddress, serverPort) => 
      ipcRenderer.invoke('sync-data', collection, serverAddress, serverPort),
    
    // Preferences management
    saveNetworkPrefs: (networkPrefs) => 
      ipcRenderer.invoke('save-network-prefs', networkPrefs),
    
    // Network utilities
    getLocalIP: () => ipcRenderer.invoke('get-local-ip')
  }
});

// Previene l'accesso diretto a Node.js dal renderer
window.addEventListener('DOMContentLoaded', () => {
  console.log('CRM Marmeria - Electron App Loaded');
});