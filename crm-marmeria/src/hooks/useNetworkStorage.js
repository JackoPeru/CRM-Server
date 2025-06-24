import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';

// Hook per la gestione dei dati con supporto di rete
const useNetworkStorage = (collectionName) => {
  const localStorageHook = useLocalStorage(collectionName);
  const [networkPrefs, setNetworkPrefs] = useState(() => {
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
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error'

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

  // Funzione per testare la connessione al server
  const testConnection = useCallback(async () => {
    if (networkPrefs.mode !== 'client') return;
    
    setSyncStatus('testing');
    try {
      const result = await window.electronAPI.network.testConnection(
        networkPrefs.serverAddress, 
        networkPrefs.serverPort
      );
      
      if (result.success) {
        setNetworkPrefs(prev => ({ ...prev, connectionStatus: 'connected' }));
        setSyncStatus('idle');
        return true;
      } else {
        throw new Error(result.error || 'Server non raggiungibile');
      }
    } catch (error) {
      console.error('Errore test connessione:', error);
      setNetworkPrefs(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      setSyncStatus('error');
      return false;
    }
  }, [networkPrefs]);

  // Funzione per sincronizzare i dati con il server
  const syncWithServer = useCallback(async () => {
    if (networkPrefs.mode !== 'client' || !isOnline) return;
    
    setSyncStatus('syncing');
    try {
      // Sincronizza ogni collezione
      const collections = ['customers', 'projects', 'materials', 'invoices'];
      
      for (const collection of collections) {
        const result = await window.electronAPI.network.syncData(
          collection,
          networkPrefs.serverAddress,
          networkPrefs.serverPort
        );
        
        if (result.success) {
          // Aggiorna i dati locali con quelli del server
          localStorage.setItem(collection, JSON.stringify(result.data));
        } else {
          throw new Error(result.error || `Errore sincronizzazione ${collection}`);
        }
      }
      
      setNetworkPrefs(prev => ({ 
        ...prev, 
        lastSync: new Date().toISOString(),
        connectionStatus: 'connected'
      }));
      setSyncStatus('idle');
      return true;
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      setNetworkPrefs(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      setSyncStatus('error');
      return false;
    }
  }, [networkPrefs, isOnline]);

  // Sincronizzazione automatica
  useEffect(() => {
    if (networkPrefs.autoSync && networkPrefs.mode === 'client' && isOnline) {
      const interval = setInterval(() => {
        syncWithServer();
      }, networkPrefs.syncInterval);
      
      return () => clearInterval(interval);
    }
  }, [networkPrefs, isOnline, syncWithServer]);

  // Override delle funzioni CRUD per supportare la sincronizzazione
  const addItem = async (item) => {
    try {
      // Aggiungi localmente
      const newItem = await localStorageHook.addItem(item);
      
      // Se siamo in modalità client, prova a sincronizzare
      if (networkPrefs.mode === 'client' && isOnline) {
        await syncWithServer();
      }
      
      return newItem;
    } catch (error) {
      throw error;
    }
  };

  const updateItem = async (id, updates) => {
    try {
      // Aggiorna localmente
      await localStorageHook.updateItem(id, updates);
      
      // Se siamo in modalità client, prova a sincronizzare
      if (networkPrefs.mode === 'client' && isOnline) {
        await syncWithServer();
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteItem = async (id) => {
    try {
      // Elimina localmente
      await localStorageHook.deleteItem(id);
      
      // Se siamo in modalità client, prova a sincronizzare
      if (networkPrefs.mode === 'client' && isOnline) {
        await syncWithServer();
      }
    } catch (error) {
      throw error;
    }
  };

  // Funzione per inviare dati al server (per modalità client)
  const sendToServer = async (collection, action, data) => {
    if (networkPrefs.mode !== 'client' || !isOnline) return;
    
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
    ...localStorageHook,
    addItem,
    updateItem,
    deleteItem,
    // Funzioni specifiche per la rete
    networkPrefs,
    isOnline,
    syncStatus,
    testConnection,
    syncWithServer,
    sendToServer,
  };
};

export default useNetworkStorage;