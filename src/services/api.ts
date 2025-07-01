/**
 * Configurazione Axios con interceptor per autenticazione JWT
 * e gestione automatica del refresh token
 */
import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

// Interfacce TypeScript
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: any) => void;
  }> = [];

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
        return Promise.reject(error);
      }
    );

    // Response interceptor - gestisce il refresh del token
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Se è già in corso un refresh, mette in coda la richiesta
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
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
   * Processa la coda delle richieste in attesa del refresh
   */
  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token!);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Ottiene il token di accesso dal localStorage
   */
  private getAccessToken(): string | null {
    try {
      const tokens = localStorage.getItem('authTokens');
      if (tokens) {
        const parsed: AuthTokens = JSON.parse(tokens);
        return parsed.accessToken;
      }
    } catch (error) {
      console.error('Errore nel recupero del token:', error);
    }
    return null;
  }

  /**
   * Ottiene il refresh token dal localStorage
   */
  private getRefreshToken(): string | null {
    try {
      const tokens = localStorage.getItem('authTokens');
      if (tokens) {
        const parsed: AuthTokens = JSON.parse(tokens);
        return parsed.refreshToken;
      }
    } catch (error) {
      console.error('Errore nel recupero del refresh token:', error);
    }
    return null;
  }

  /**
   * Salva i token nel localStorage
   */
  private saveTokens(tokens: AuthTokens): void {
    localStorage.setItem('authTokens', JSON.stringify(tokens));
  }

  /**
   * Rimuove i token dal localStorage
   */
  private clearTokens(): void {
    localStorage.removeItem('authTokens');
  }

  /**
   * Effettua il refresh del token di accesso
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('Refresh token non disponibile');
    }

    try {
      const response = await axios.post<RefreshResponse>(
        `${this.axiosInstance.defaults.baseURL}/auth/refresh`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Salva i nuovi token
      this.saveTokens({
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
      });

      return accessToken;
    } catch (error) {
      console.error('Errore nel refresh del token:', error);
      throw error;
    }
  }

  /**
   * Gestisce gli errori di autenticazione
   */
  private handleAuthError(): void {
    this.clearTokens();
    toast.error('Sessione scaduta. Effettua nuovamente il login.');
    // TODO: Redirect al login
    window.location.href = '/login';
  }

  /**
   * Effettua il login
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      const response = await this.axiosInstance.post<AuthTokens>('/auth/login', {
        email,
        password,
      });

      this.saveTokens(response.data);
      return response.data;
    } catch (error) {
      console.error('Errore nel login:', error);
      throw error;
    }
  }

  /**
   * Effettua il logout
   */
  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Errore nel logout:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Verifica se l'utente è autenticato
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Restituisce l'istanza Axios configurata
   */
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }


}

// Istanza singleton dell'API client
export const apiClient = new ApiClient();
export default apiClient.getInstance();