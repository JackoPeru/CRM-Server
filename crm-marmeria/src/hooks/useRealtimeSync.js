import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// Hook per la sincronizzazione in tempo reale tramite WebSocket
const useRealtimeSync = (collectionName, networkPrefs) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [lastSync, setLastSync] = useState(null);
  const operationQueue = useRef([]);
  const operationId = useRef(0);
  const pendingOperations = useRef(new Map());

  // Connessione al server WebSocket
  const connectToServer = useCallback(() => {
    if (networkPrefs.mode !== 'client' || !networkPrefs.serverAddress) {
      return;
    }

    setSyncStatus('connecting');
    
    const socketUrl = `http://${networkPrefs.serverAddress}:${networkPrefs.serverPort}`;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connesso al server WebSocket');
      setIsConnected(true);
      setSyncStatus('connected');
      setLastSync(new Date().toISOString());
      
      // Richiedi sincronizzazione completa all'avvio
      newSocket.emit('request-full-sync', [collectionName]);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnesso dal server WebSocket');
      setIsConnected(false);
      setSyncStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Errore connessione WebSocket:', error);
      setIsConnected(false);
      setSyncStatus('error');
    });

    newSocket.on('connection-established', (data) => {
      console.log('✅ Connessione stabilita:', data);
    });

    newSocket.on('full-sync-response', (response) => {
      if (response.success && response.data[collectionName]) {
        // Aggiorna i dati locali con quelli del server
        localStorage.setItem(collectionName, JSON.stringify(response.data[collectionName]));
        
        // Trigger un evento personalizzato per notificare il componente
        window.dispatchEvent(new CustomEvent('data-synced', {
          detail: {
            collection: collectionName,
            data: response.data[collectionName],
            timestamp: response.timestamp
          }
        }));
        
        setLastSync(response.timestamp);
        console.log(`📊 Sincronizzazione completa per ${collectionName}`);
      }
    });

    newSocket.on('data-updated', (update) => {
      if (update.collection === collectionName) {
        // Aggiorna i dati locali
        localStorage.setItem(collectionName, JSON.stringify(update.data));
        
        // Trigger un evento personalizzato per notificare il componente
        window.dispatchEvent(new CustomEvent('data-updated', {
          detail: {
            collection: collectionName,
            action: update.action,
            item: update.item,
            data: update.data,
            timestamp: new Date().toISOString()
          }
        }));
        
        setLastSync(new Date().toISOString());
        console.log(`🔄 Dati aggiornati per ${collectionName}:`, update.action, update.item?.id);
      }
    });

    newSocket.on('operation-result', (result) => {
      const pendingOp = pendingOperations.current.get(result.operationId);
      if (pendingOp) {
        pendingOperations.current.delete(result.operationId);
        
        if (result.success) {
          // Aggiorna i dati locali
          localStorage.setItem(collectionName, JSON.stringify(result.data));
          
          // Trigger un evento personalizzato
          window.dispatchEvent(new CustomEvent('data-updated', {
            detail: {
              collection: collectionName,
              action: pendingOp.action,
              item: result.item,
              data: result.data,
              timestamp: new Date().toISOString()
            }
          }));
          
          pendingOp.resolve(result);
        } else {
          pendingOp.reject(new Error(result.error));
        }
      }
    });

    setSocket(newSocket);
  }, [networkPrefs, collectionName]);

  // Disconnessione dal server
  const disconnectFromServer = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setSyncStatus('disconnected');
    }
  }, [socket]);

  // Effetto per gestire la connessione/disconnessione
  useEffect(() => {
    if (networkPrefs.mode === 'client' && networkPrefs.serverAddress) {
      connectToServer();
    } else {
      disconnectFromServer();
    }

    return () => {
      disconnectFromServer();
    };
  }, [networkPrefs.mode, networkPrefs.serverAddress, networkPrefs.serverPort, connectToServer, disconnectFromServer]);

  // Funzione per inviare operazioni al server
  const sendOperation = useCallback((action, data, id = null) => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error('Non connesso al server'));
        return;
      }

      const currentOperationId = ++operationId.current;
      const operation = {
        operationId: currentOperationId,
        collection: collectionName,
        action,
        data,
        id,
        timestamp: new Date().toISOString()
      };

      // Salva l'operazione in attesa
      pendingOperations.current.set(currentOperationId, {
        action,
        resolve,
        reject,
        timestamp: new Date().toISOString()
      });

      // Invia l'operazione al server
      socket.emit('client-operation', operation);

      // Timeout per l'operazione
      setTimeout(() => {
        if (pendingOperations.current.has(currentOperationId)) {
          pendingOperations.current.delete(currentOperationId);
          reject(new Error('Timeout operazione'));
        }
      }, 10000); // 10 secondi di timeout
    });
  }, [socket, isConnected, collectionName]);

  // Funzione per richiedere sincronizzazione completa
  const requestFullSync = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('request-full-sync', [collectionName]);
    }
  }, [socket, isConnected, collectionName]);

  return {
    isConnected,
    syncStatus,
    lastSync,
    sendOperation,
    requestFullSync,
    connectToServer,
    disconnectFromServer
  };
};

export default useRealtimeSync;