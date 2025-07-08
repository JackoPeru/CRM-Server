/**
 * Configurazione Axios con interceptor per autenticazione JWT
 * e gestione automatica del refresh token
 */
import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';
import { authService } from './auth';  // Importa l'istanza singleton di AuthService

// Interfacce TypeScript


class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    // Legge l'URL base dalle variabili d'ambiente
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configura gli interceptor per request e response
   */
  private setupInterceptors(): void {
    // Request interceptor - aggiunge il token di autenticazione
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Errore nell\'interceptor di richiesta:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - gestisce errori di autenticazione e permessi
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Se è un errore 401 (Unauthorized) e non è già un retry
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;
          
          // Se siamo sulla pagina di login, non tentare il refresh del token
          if (window.location.pathname.includes('login')) {
            console.error('Errore di autenticazione durante il login:', error.response?.data);
            this.handleAuthError();
            return Promise.reject(error);
          }
          
          console.error('Errore di autenticazione (401), logout in corso.');
          this.handleAuthError();
          // Non reindirizzare qui, lascia che sia l'UI a gestire il cambio di stato
          // basato su isAuthenticated.
          return Promise.reject(error);
        }
        
        // Gestione errori 403 (Forbidden) - permessi insufficienti
        if (error.response?.status === 403) {
          console.error('Errore di permessi:', error.response?.data);
          // Mostra notifica solo se non è già stata mostrata di recente
          const lastPermissionError = localStorage.getItem('lastPermissionErrorToast');
          const now = Date.now();
          
          if (!lastPermissionError || (now - parseInt(lastPermissionError)) > 30000) { // 30 secondi
            toast.error('Permessi insufficienti per questa operazione', {
              duration: 5000,
              id: 'permission-error' // Previene duplicati
            });
            localStorage.setItem('lastPermissionErrorToast', now.toString());
          }
          
          // Aggiungiamo informazioni dettagliate all'errore per una migliore gestione a livello Redux
          error.permissionDenied = true;
          error.permissionMessage = 'Non hai i permessi necessari per eseguire questa operazione';
        }
        
        // Gestione errori di rete - notifica ridotta per evitare spam
        if (error.code === 'ERR_NETWORK') {
          // Mostra notifica solo se non è già stata mostrata di recente
          const lastNetworkError = localStorage.getItem('lastNetworkErrorToast');
          const now = Date.now();
          
          if (!lastNetworkError || (now - parseInt(lastNetworkError)) > 30000) { // 30 secondi
            toast.error('Sei offline – dati in sola lettura', {
              duration: 5000,
              id: 'network-error' // Previene duplicati
            });
            localStorage.setItem('lastNetworkErrorToast', now.toString());
          }
          
          // Emetti un evento per notificare l'app dello stato offline
          window.dispatchEvent(new CustomEvent('app:offline'));
        } else if (error.response && error.response.status !== 403) { // Evitiamo di loggare due volte gli errori 403
          console.error(`Errore API ${error.response.status}:`, error.response.data);
        }
        
        return Promise.reject(error);
      }
    );
  }



  /**
   * Ottiene il token di accesso dal localStorage
   */
  private getAccessToken(): string | null {
    try {
      // Usa la stessa chiave del servizio di autenticazione
      return localStorage.getItem('crm_auth_token');
    } catch (error) {
      console.error('Errore nel recupero del token:', error);
    }
    return null;
  }



  /**
   * Gestisce gli errori di autenticazione
   */
  private handleAuthError(): void {
    // Pulisci il token dal localStorage
    localStorage.removeItem('crm_auth_token');
    localStorage.removeItem('crm_user_data');
    // Rimuovi anche il profilo utente utilizzato da authSlice
    localStorage.removeItem('crm_user_profile');
    // Non ricaricare automaticamente la pagina per evitare loop infiniti
    // Lascia che sia l'AuthContext a gestire il cambio di stato
  }



  /**
   * Restituisce l'istanza Axios configurata
   */
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Metodo GET
   */
  async get(url: string, config?: any) {
    return this.axiosInstance.get(url, config);
  }

  /**
   * Metodo POST
   */
  async post(url: string, data?: any, config?: any) {
    return this.axiosInstance.post(url, data, config);
  }

  /**
   * Metodo PUT
   */
  async put(url: string, data?: any, config?: any) {
    return this.axiosInstance.put(url, data, config);
  }

  /**
   * Metodo DELETE
   */
  async delete(url: string, config?: any) {
    return this.axiosInstance.delete(url, config);
  }

  /**
   * Metodo PATCH
   */
  async patch(url: string, data?: any, config?: any) {
    return this.axiosInstance.patch(url, data, config);
  }

}

// Aggiungi un listener per quando l'app torna online
window.addEventListener('online', () => {
  console.log('App tornata online');
  toast.success('Connessione ristabilita');
  
  // Emetti un evento per notificare l'app dello stato online
  window.dispatchEvent(new CustomEvent('app:online'));
  
  // Ritenta le operazioni in sospeso
  import('./clients').then(module => {
    const clientsService = module.default;
    if (clientsService && typeof clientsService.retryPendingOperations === 'function') {
      clientsService.retryPendingOperations();
    }
  }).catch(err => {
    console.error('Errore nel caricamento del servizio clienti:', err);
  });
});

// Istanza singleton dell'API client
export const apiClient = new ApiClient();
export default apiClient.getInstance();