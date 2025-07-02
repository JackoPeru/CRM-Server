const { contextBridge, ipcRenderer } = require('electron');

// Espone API sicure al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Informazioni di sistema
  platform: process.platform,
  version: process.versions.electron,
  
  // API per la condivisione dati
  network: {
    // Server management
    startServer: (port, sharedPath) => ipcRenderer.invoke('server-start', port, sharedPath),
    stopServer: () => ipcRenderer.invoke('server-stop'),
    getServerStatus: () => ipcRenderer.invoke('server-status'),
    
    // Master PC connection testing
    testMasterConnection: (masterPath) => 
      ipcRenderer.invoke('test-master-connection', masterPath),
    
    // Data synchronization with master PC
    syncWithMaster: (collection, masterPath) => 
      ipcRenderer.invoke('sync-with-master', collection, masterPath),
    
    // Push data to master PC
    pushToMaster: (collection, action, data, masterPath) => 
      ipcRenderer.invoke('push-to-master', collection, action, data, masterPath),
    
    // Preferences management
    saveNetworkPrefs: (networkPrefs) => 
      ipcRenderer.invoke('save-network-prefs', networkPrefs),
    
    // Backup management in shared folder
    saveBackupToSharedFolder: (backupData, filename) => 
      ipcRenderer.invoke('save-backup-to-shared', backupData, filename),
    
    loadBackupFromSharedFolder: (filename) => 
      ipcRenderer.invoke('load-backup-from-shared', filename),
    
    listBackupsInSharedFolder: () => 
      ipcRenderer.invoke('list-backups-in-shared')
  }
});

// Previene l'accesso diretto a Node.js dal renderer
window.addEventListener('DOMContentLoaded', () => {
  console.log('CRM Marmeria - Electron App Loaded');
});