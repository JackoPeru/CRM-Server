/**
 * Configurazione Axios con interceptor per autenticazione JWT
 * e gestione automatica del refresh token
 */
import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

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

    // Response interceptor - gestisce errori di autenticazione
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Se è un errore 401, pulisci l'autenticazione
        if (error.response?.status === 401) {
          this.handleAuthError();
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

}

// Istanza singleton dell'API client
export const apiClient = new ApiClient();
export default apiClient.getInstance();