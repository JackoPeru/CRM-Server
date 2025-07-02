import { apiClient } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private readonly TOKEN_KEY = 'crm_auth_token';
  private readonly USER_KEY = 'crm_user_data';
  private validationPromise: Promise<boolean> | null = null; // Cache per evitare chiamate multiple

  // Login utente
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const data: AuthResponse = response.data;
      
      // Salva token e dati utente
      this.setToken(data.token);
      this.setUser(data.user);
      
      return data;
    } catch (error: any) {
      console.error('Errore login:', error);
      // Gestisci errori di rete o del server
      if (error?.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error?.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Errore durante il login');
      }
    }
  }

  // Logout utente
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Errore logout:', error);
    } finally {
      // Rimuovi sempre i dati locali
      this.clearAuth();
    }
  }

  // Verifica se l'utente è autenticato
  isAuthenticated(): boolean {
    const hasToken = !!this.getToken();
    const hasUser = !!this.getUser();
    return hasToken && hasUser;
  }

  // Ottieni token corrente
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Salva token
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Ottieni dati utente corrente
  getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) {
      return null;
    }
    
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Errore parsing userData:', error);
      return null;
    }
  }

  // Salva dati utente
  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Pulisci tutti i dati di autenticazione
  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    // Pulisci anche la cache di validazione
    this.validationPromise = null;
  }

  // Verifica se l'utente ha un permesso specifico
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  // Verifica se l'utente ha un ruolo specifico
  hasRole(role: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    return user.role === role;
  }

  // Verifica se l'utente ha uno dei ruoli specificati
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  // Ottieni header di autorizzazione per le richieste API
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return {};
    
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // Verifica validità del token (chiamata al server)
  async validateToken(): Promise<boolean> {
    // Se c'è già una validazione in corso, restituisci quella promise
    if (this.validationPromise) {
      return this.validationPromise;
    }

    // Crea una nuova promise di validazione
    this.validationPromise = this.performTokenValidation();
    
    try {
      const result = await this.validationPromise;
      return result;
    } finally {
      // Pulisci la promise dopo 1 secondo per permettere nuove validazioni
      setTimeout(() => {
        this.validationPromise = null;
      }, 1000);
    }
  }

  // Metodo privato che esegue effettivamente la validazione
  private async performTokenValidation(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }

      const response = await apiClient.get('/auth/me');
      
      // Aggiorna i dati utente solo se la risposta è valida
      if (response.data?.user) {
        this.setUser(response.data.user);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Errore durante validazione token:', error);
      
      // Se è un errore di autenticazione (401), cancella i dati
      if (error?.response?.status === 401) {
        this.clearAuth();
      }
      
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;