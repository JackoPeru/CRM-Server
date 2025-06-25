import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';

// Hook per la gestione dei dati con supporto PC master
const useNetworkStorage = (collectionName, networkPrefs = null) => {
  const localStorageHook = useLocalStorage(collectionName);
  const [internalNetworkPrefs, setInternalNetworkPrefs] = useState(() => {
    const saved = localStorage.getItem('networkPrefs');
    return saved ? JSON.parse(saved) : {
      mode: 'standalone', // 'standalone', 'master', 'client'
      masterPath: '', // Percorso di rete al PC master
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
  
  // Sincronizza i dati locali con quelli del localStorage hook
  useEffect(() => {
    setData(localStorageHook.data);
  }, [localStorageHook.data]);

  // Auto-sync per modalità client
  useEffect(() => {
    if (currentNetworkPrefs.autoSync && currentNetworkPrefs.mode === 'client' && isOnline) {
      const interval = setInterval(() => {
        syncWithMaster();
      }, currentNetworkPrefs.syncInterval);
      
      return () => clearInterval(interval);
    }
  }, [currentNetworkPrefs, isOnline]);

  // Funzione per testare la connessione al PC master
  const testConnection = useCallback(async () => {
    if (currentNetworkPrefs.mode !== 'client' || !currentNetworkPrefs.masterPath) return false;
    
    setSyncStatus('testing');
    try {
      const result = await window.electronAPI.network.testMasterConnection(
        currentNetworkPrefs.masterPath
      );
      
      if (result.success) {
        setInternalNetworkPrefs(prev => ({ ...prev, connectionStatus: 'connected' }));
        setSyncStatus('idle');
        return true;
      } else {
        throw new Error(result.error || 'PC Master non raggiungibile');
      }
    } catch (error) {
      console.error('Errore test connessione:', error);
      setInternalNetworkPrefs(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      setSyncStatus('error');
      return false;
    }
  }, [currentNetworkPrefs.masterPath, currentNetworkPrefs.mode]);

  // Funzione per sincronizzare con il PC master
  const syncWithMaster = useCallback(async () => {
    if (currentNetworkPrefs.mode !== 'client' || !currentNetworkPrefs.masterPath) return;
    
    setSyncStatus('syncing');
    try {
      const result = await window.electronAPI.network.syncWithMaster(
        collectionName,
        currentNetworkPrefs.masterPath
      );
      
      if (result.success) {
        // Aggiorna i dati locali con quelli del master
        if (result.data) {
          setData(result.data);
          // Salva anche nel localStorage locale
          localStorage.setItem(collectionName, JSON.stringify(result.data));
        }
        
        setInternalNetworkPrefs(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
          connectionStatus: 'connected'
        }));
        setSyncStatus('idle');
        
        return result;
      } else {
        throw new Error(result.error || 'Errore durante la sincronizzazione');
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      setInternalNetworkPrefs(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      setSyncStatus('error');
      throw error;
    }
  }, [collectionName, currentNetworkPrefs.masterPath, currentNetworkPrefs.mode]);

  // Funzioni CRUD che gestiscono la sincronizzazione
  const addItem = async (item) => {
    try {
      // Aggiungi localmente prima
      const result = await localStorageHook.addItem(item);
      
      // Se siamo in modalità client, sincronizza con il master
      if (currentNetworkPrefs.mode === 'client' && currentNetworkPrefs.masterPath && isOnline) {
        try {
          const syncResult = await window.electronAPI.network.pushToMaster(
            collectionName,
            'add',
            item,
            currentNetworkPrefs.masterPath
          );
          
          if (syncResult.success) {
            console.log('Dati sincronizzati con il master');
          }
        } catch (error) {
          console.warn('Impossibile sincronizzare con il master:', error);
          // Continua comunque con l'operazione locale
        }
      }
      
      return result;
    } catch (error) {
      console.error('Errore durante l\'aggiunta dell\'elemento:', error);
      throw error;
    }
  };

  const updateItem = async (id, updates) => {
    try {
      // Aggiorna localmente prima
      const result = await localStorageHook.updateItem(id, updates);
      
      // Se siamo in modalità client, sincronizza con il master
      if (currentNetworkPrefs.mode === 'client' && currentNetworkPrefs.masterPath && isOnline) {
        try {
          const syncResult = await window.electronAPI.network.pushToMaster(
            collectionName,
            'update',
            { id, updates },
            currentNetworkPrefs.masterPath
          );
          
          if (syncResult.success) {
            console.log('Aggiornamento sincronizzato con il master');
          }
        } catch (error) {
          console.warn('Impossibile sincronizzare aggiornamento con il master:', error);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'elemento:', error);
      throw error;
    }
  };

  const deleteItem = async (id) => {
    try {
      // Elimina localmente prima
      const result = await localStorageHook.deleteItem(id);
      
      // Se siamo in modalità client, sincronizza con il master
      if (currentNetworkPrefs.mode === 'client' && currentNetworkPrefs.masterPath && isOnline) {
        try {
          const syncResult = await window.electronAPI.network.pushToMaster(
            collectionName,
            'delete',
            { id },
            currentNetworkPrefs.masterPath
          );
          
          if (syncResult.success) {
            console.log('Eliminazione sincronizzata con il master');
          }
        } catch (error) {
          console.warn('Impossibile sincronizzare eliminazione con il master:', error);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'elemento:', error);
      throw error;
    }
  };

  // Aggiorna le preferenze di rete
  const updateNetworkPrefs = useCallback((newPrefs) => {
    const updatedPrefs = { ...currentNetworkPrefs, ...newPrefs };
    setInternalNetworkPrefs(updatedPrefs);
    localStorage.setItem('networkPrefs', JSON.stringify(updatedPrefs));
  }, [currentNetworkPrefs]);

  return {
    data,
    loading: localStorageHook.loading,
    error: localStorageHook.error,
    addItem,
    updateItem,
    deleteItem,
    updateNetworkPrefs,
    networkPrefs: currentNetworkPrefs,
    syncStatus,
    testConnection,
    syncWithMaster,
    isOnline,
    lastSync: currentNetworkPrefs.lastSync,
  };
};

export default useNetworkStorage;