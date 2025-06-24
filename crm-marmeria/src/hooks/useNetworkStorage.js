import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import useRealtimeSync from './useRealtimeSync';

// Hook per la gestione dei dati con supporto di rete
const useNetworkStorage = (collectionName, networkPrefs = null) => {
  const localStorageHook = useLocalStorage(collectionName);
  const [internalNetworkPrefs, setInternalNetworkPrefs] = useState(() => {
    const saved = localStorage.getItem('networkPrefs');
    return saved ? JSON.parse(saved) : {
      mode: 'standalone',
      serverAddress: '',
      serverPort: '3001',
      masterPort: '3001',
      connectionStatus: 'disconnected',
      lastSync: null,
      autoSync: true,
      syncInterval: 30000,
    };
  });
  
  // Usa networkPrefs passato come parametro o quello interno
  const currentNetworkPrefs = networkPrefs || internalNetworkPrefs;
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error'
  const [data, setData] = useState(localStorageHook.data);
  
  // Hook per la sincronizzazione in tempo reale
  const realtimeSync = useRealtimeSync(collectionName, currentNetworkPrefs);

  // Monitora lo stato della connessione internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Listener per aggiornamenti in tempo reale
  useEffect(() => {
    const handleDataSynced = (event) => {
      if (event.detail.collection === collectionName) {
        setData(event.detail.data);
        setInternalNetworkPrefs(prev => ({ 
          ...prev, 
          lastSync: event.detail.timestamp,
          connectionStatus: 'connected'
        }));
      }
    };
    
    const handleDataUpdated = (event) => {
      if (event.detail.collection === collectionName) {
        setData(event.detail.data);
        setInternalNetworkPrefs(prev => ({ 
          ...prev, 
          lastSync: event.detail.timestamp,
          connectionStatus: 'connected'
        }));
      }
    };
    
    window.addEventListener('data-synced', handleDataSynced);
    window.addEventListener('data-updated', handleDataUpdated);
    
    return () => {
      window.removeEventListener('data-synced', handleDataSynced);
      window.removeEventListener('data-updated', handleDataUpdated);
    };
  }, [collectionName]);
  
  // Sincronizza i dati locali con quelli del localStorage hook
  useEffect(() => {
    setData(localStorageHook.data);
  }, [localStorageHook.data]);

  // Funzione per testare la connessione al server
  const testConnection = useCallback(async () => {
    if (currentNetworkPrefs.mode !== 'client') return;
    
    setSyncStatus('testing');
    try {
      const result = await window.electronAPI.network.testConnection(
        currentNetworkPrefs.serverAddress,
      currentNetworkPrefs.serverPort
      );
      
      if (result.success) {
        setInternalNetworkPrefs(prev => ({ ...prev, connectionStatus: 'connected' }));
        setSyncStatus('idle');
        return true;
      } else {
        throw new Error(result.error || 'Server non raggiungibile');
      }
    } catch (error) {
      console.error('Errore test connessione:', error);
      setInternalNetworkPrefs(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      setSyncStatus('error');
      return false;
    }
  }, [currentNetworkPrefs]);

  // Funzione per sincronizzare i dati con il server
  const syncWithServer = useCallback(async () => {
    if (currentNetworkPrefs.mode !== 'client' || !isOnline) return;
    
    setSyncStatus('syncing');
    try {
      // Sincronizza ogni collezione
      const collections = ['customers', 'projects', 'materials', 'invoices'];
      
      for (const collection of collections) {
        const result = await window.electronAPI.network.syncData(
          collection,
          currentNetworkPrefs.serverAddress,
      currentNetworkPrefs.serverPort
        );
        
        if (result.success) {
          // Aggiorna i dati locali con quelli del server
          localStorage.setItem(collection, JSON.stringify(result.data));
        } else {
          throw new Error(result.error || `Errore sincronizzazione ${collection}`);
        }
      }
      
      setInternalNetworkPrefs(prev => ({ 
        ...prev, 
        lastSync: new Date().toISOString(),
        connectionStatus: 'connected'
      }));
      setSyncStatus('idle');
      return true;
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      setInternalNetworkPrefs(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      setSyncStatus('error');
      return false;
    }
  }, [currentNetworkPrefs, isOnline]);

  // Sincronizzazione automatica
  useEffect(() => {
    if (currentNetworkPrefs.autoSync && currentNetworkPrefs.mode === 'client' && isOnline) {
      const interval = setInterval(() => {
        syncWithServer();
      }, currentNetworkPrefs.syncInterval);
      
      return () => clearInterval(interval);
    }
  }, [currentNetworkPrefs, isOnline, syncWithServer]);

  // Override delle funzioni CRUD per supportare la sincronizzazione
  const addItem = async (item) => {
    try {
      // Se siamo connessi in tempo reale, invia direttamente al server
      if (currentNetworkPrefs.mode === 'client' && realtimeSync.isConnected) {
        const result = await realtimeSync.sendOperation('add', item);
        return result.item;
      } else {
        // Altrimenti aggiungi localmente
        const newItem = await localStorageHook.addItem(item);
        
        // Se siamo in modalità client ma non connessi in tempo reale, prova la sincronizzazione tradizionale
        if (currentNetworkPrefs.mode === 'client' && isOnline) {
          await syncWithServer();
        }
        
        return newItem;
      }
    } catch (error) {
      // Fallback: aggiungi localmente se l'operazione remota fallisce
      console.warn('Operazione remota fallita, salvataggio locale:', error);
      return await localStorageHook.addItem(item);
    }
  };

  const updateItem = async (id, updates) => {
    try {
      // Se siamo connessi in tempo reale, invia direttamente al server
      if (currentNetworkPrefs.mode === 'client' && realtimeSync.isConnected) {
        const result = await realtimeSync.sendOperation('update', updates, id);
        return result.item;
      } else {
        // Altrimenti aggiorna localmente
        await localStorageHook.updateItem(id, updates);
        
        // Se siamo in modalità client ma non connessi in tempo reale, prova la sincronizzazione tradizionale
        if (currentNetworkPrefs.mode === 'client' && isOnline) {
          await syncWithServer();
        }
      }
    } catch (error) {
      // Fallback: aggiorna localmente se l'operazione remota fallisce
      console.warn('Operazione remota fallita, aggiornamento locale:', error);
      await localStorageHook.updateItem(id, updates);
    }
  };

  const deleteItem = async (id) => {
    try {
      // Se siamo connessi in tempo reale, invia direttamente al server
      if (currentNetworkPrefs.mode === 'client' && realtimeSync.isConnected) {
        await realtimeSync.sendOperation('delete', null, id);
      } else {
        // Altrimenti elimina localmente
        await localStorageHook.deleteItem(id);
        
        // Se siamo in modalità client ma non connessi in tempo reale, prova la sincronizzazione tradizionale
        if (currentNetworkPrefs.mode === 'client' && isOnline) {
          await syncWithServer();
        }
      }
    } catch (error) {
      // Fallback: elimina localmente se l'operazione remota fallisce
      console.warn('Operazione remota fallita, eliminazione locale:', error);
      await localStorageHook.deleteItem(id);
    }
  };

  // Funzione per inviare dati al server (per modalità client)
  const sendToServer = async (collection, action, data) => {
    if (currentNetworkPrefs.mode !== 'client' || !isOnline) return;
    
    try {
      // Per ora utilizziamo la sincronizzazione completa
      // In futuro si può implementare l'invio di singole operazioni
      await syncWithServer();
      return true;
    } catch (error) {
      console.error('Errore invio al server:', error);
      return false;
    }
  };

  return {
    // Dati e funzioni CRUD
    data,
    addItem,
    updateItem,
    deleteItem,
    // Funzioni specifiche per la rete
    networkPrefs: currentNetworkPrefs,
    isOnline,
    syncStatus,
    testConnection,
    syncWithServer,
    sendToServer,
    // Funzioni di sincronizzazione in tempo reale
    isRealtimeConnected: realtimeSync.isConnected,
    realtimeSyncStatus: realtimeSync.syncStatus,
    lastSync: realtimeSync.lastSync || currentNetworkPrefs.lastSync,
    requestFullSync: realtimeSync.requestFullSync,
    // Funzioni di compatibilità
    setData: (newData) => {
      // Manteniamo la compatibilità ma non è più necessario
      console.warn('setData è deprecato, i dati vengono gestiti automaticamente');
    }
  };
};

export default useNetworkStorage;