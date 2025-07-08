const { contextBridge, ipcRenderer } = require('electron');

/**
 * API esposta al renderer process tramite contextBridge
 * Fornisce metodi sicuri per interagire con le funzionalità di Electron
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Informazioni di sistema
  platform: process.platform,
  electronVersion: process.versions.electron,
  
  // Funzionalità di rete e server
  network: {
    // Gestione del server
    startServer: (port, sharedPath) => ipcRenderer.invoke('server-start', port, sharedPath),
    stopServer: () => ipcRenderer.invoke('server-stop'),
    getServerStatus: () => ipcRenderer.invoke('server-status'),
    
    // Gestione della connessione master
    testMasterConnection: (masterPath) => ipcRenderer.invoke('test-master-connection', masterPath),
    syncWithMaster: (collection, masterPath) => ipcRenderer.invoke('sync-with-master', collection, masterPath),
    pushToMaster: (collection, action, data, masterPath) => ipcRenderer.invoke('push-to-master', collection, action, data, masterPath),
    
    // Gestione delle preferenze di rete
    saveNetworkPrefs: (prefs) => ipcRenderer.invoke('save-network-prefs', prefs),
    
    // Gestione dei backup
    saveBackupToShared: (data, filename) => ipcRenderer.invoke('save-backup-to-shared', data, filename),
    loadBackupFromShared: (filename) => ipcRenderer.invoke('load-backup-from-shared', filename),
    listBackupsInShared: () => ipcRenderer.invoke('list-backups-in-shared'),
    
    // Nuove funzionalità di rete
    getNetworkPeers: () => ipcRenderer.invoke('get-network-peers'),
    syncWithPeer: (peerId, collections) => ipcRenderer.invoke('sync-with-peer', peerId, collections),
    
    // Controllo della sincronizzazione automatica
    startAutoSync: () => ipcRenderer.invoke('start-auto-sync'),
    stopAutoSync: () => ipcRenderer.invoke('stop-auto-sync'),
    getAutoSyncStatus: () => ipcRenderer.invoke('get-auto-sync-status')
  }
});

/**
 * Gestione degli eventi di sistema
 */
process.once('loaded', () => {
  console.log('Preload script caricato');
});