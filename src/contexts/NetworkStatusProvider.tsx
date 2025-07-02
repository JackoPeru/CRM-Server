/**
 * Provider per la gestione dello stato di connessione di rete
 * Monitora lo stato online/offline e fornisce contesto all'app
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

// Interfacce TypeScript
interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

interface NetworkStatusContextType {
  networkStatus: NetworkStatus;
  checkConnection: () => Promise<boolean>;
  forceOfflineMode: () => void;
  exitOfflineMode: () => void;
  isForceOffline: boolean;
}

// Creazione del contesto
const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

// Props del provider
interface NetworkStatusProviderProps {
  children: ReactNode;
}

/**
 * Provider per lo stato di rete
 */
export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({ children }) => {
  const [isForceOffline, setIsForceOffline] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    lastOnline: navigator.onLine ? new Date() : null,
    lastOffline: !navigator.onLine ? new Date() : null,
  });

  /**
   * Aggiorna le informazioni di rete avanzate
   */
  const updateNetworkInfo = () => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      setNetworkStatus(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      }));
    }
  };

  /**
   * Gestisce il cambio di stato online
   */
  const handleOnline = () => {
    if (!isForceOffline) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isOffline: false,
        lastOnline: new Date(),
      }));
      
      updateNetworkInfo();
      toast.success('Connessione ripristinata', {
        duration: 3000,
        icon: '🌐',
      });
    }
  };

  /**
   * Gestisce il cambio di stato offline
   */
  const handleOffline = () => {
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      isOffline: true,
      lastOffline: new Date(),
    }));
    
    // Toast disabilitato per evitare notifiche continue
    // toast.error('Connessione persa - Modalità offline attiva', {
    //   duration: 5000,
    //   icon: '📡',
    // });
  };

  /**
   * Verifica attivamente la connessione
   */
  const checkConnection = async (): Promise<boolean> => {
    if (isForceOffline) {
      return false;
    }

    try {
      // Usa l'URL completo del server per il controllo della connessione
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const healthUrl = `${baseURL}/health`;
      
      // Tenta una richiesta a un endpoint veloce
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(healthUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });
      
      clearTimeout(timeoutId);
      
      const isConnected = response.ok;
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: isConnected,
        isOffline: !isConnected,
        lastOnline: isConnected ? new Date() : prev.lastOnline,
        lastOffline: !isConnected ? new Date() : prev.lastOffline,
      }));
      
      return isConnected;
    } catch (error) {
      console.warn('Controllo connessione fallito:', error);
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isOffline: true,
        lastOffline: new Date(),
      }));
      
      return false;
    }
  };

  /**
   * Forza la modalità offline
   */
  const forceOfflineMode = () => {
    setIsForceOffline(true);
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      isOffline: true,
      lastOffline: new Date(),
    }));
    
    toast('Modalità offline forzata attivata', {
      duration: 3000,
      icon: '🔒',
    });
  };

  /**
   * Esce dalla modalità offline forzata
   */
  const exitOfflineMode = () => {
    setIsForceOffline(false);
    
    // Ricontrolla immediatamente la connessione
    if (navigator.onLine) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isOffline: false,
        lastOnline: new Date(),
      }));
      
      toast.success('Modalità offline disattivata', {
        duration: 3000,
        icon: '🔓',
      });
    }
  };

  // Effetti per il monitoraggio della rete
  useEffect(() => {
    // Event listeners per online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Event listener per cambi di connessione
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }
    
    // Controllo periodico della connessione disabilitato per evitare errori
    // const intervalId = setInterval(() => {
    //   if (!isForceOffline) {
    //     checkConnection();
    //   }
    // }, 30000);
    
    // Aggiorna info iniziali
    updateNetworkInfo();
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
      
      // clearInterval(intervalId);
    };
  }, [isForceOffline]);

  // Effetto per il salvataggio dello stato offline forzato
  useEffect(() => {
    localStorage.setItem('forceOfflineMode', JSON.stringify(isForceOffline));
  }, [isForceOffline]);

  // Effetto per il ripristino dello stato offline forzato
  useEffect(() => {
    const savedForceOffline = localStorage.getItem('forceOfflineMode');
    if (savedForceOffline) {
      try {
        const isForced = JSON.parse(savedForceOffline);
        if (isForced) {
          setIsForceOffline(true);
        }
      } catch (error) {
        console.error('Errore nel ripristino modalità offline:', error);
      }
    }
  }, []);

  const contextValue: NetworkStatusContextType = {
    networkStatus,
    checkConnection,
    forceOfflineMode,
    exitOfflineMode,
    isForceOffline,
  };

  return (
    <NetworkStatusContext.Provider value={contextValue}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

/**
 * Hook per utilizzare il contesto di rete
 */
export const useNetworkStatus = (): NetworkStatusContextType => {
  const context = useContext(NetworkStatusContext);
  
  if (context === undefined) {
    throw new Error('useNetworkStatus deve essere utilizzato all\'interno di NetworkStatusProvider');
  }
  
  return context;
};

/**
 * Hook semplificato per verificare solo lo stato online/offline
 */
export const useIsOnline = (): boolean => {
  const { networkStatus } = useNetworkStatus();
  return networkStatus.isOnline;
};

/**
 * Hook per ottenere informazioni dettagliate sulla connessione
 */
export const useConnectionInfo = () => {
  const { networkStatus } = useNetworkStatus();
  
  return {
    type: networkStatus.connectionType,
    effectiveType: networkStatus.effectiveType,
    downlink: networkStatus.downlink,
    rtt: networkStatus.rtt,
    quality: networkStatus.downlink > 1.5 ? 'good' : 
             networkStatus.downlink > 0.5 ? 'fair' : 'poor',
  };
};

export default NetworkStatusProvider;