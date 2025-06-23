const { contextBridge, ipcRenderer } = require('electron');

// Espone API sicure al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Qui puoi aggiungere API personalizzate se necessario
  platform: process.platform,
  version: process.versions.electron
});

// Previene l'accesso diretto a Node.js dal renderer
window.addEventListener('DOMContentLoaded', () => {
  console.log('CRM Marmeria - Electron App Loaded');
});