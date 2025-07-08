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
  username?: string;
  password: string;
  email?: string; // Opzionale per compatibilità con authSlice
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private readonly TOKEN_KEY = 'crm_auth_token';
  private readonly USER_KEY = 'crm_user_profile';
  private validationPromise: Promise<boolean> | null = null; // Cache per evitare chiamate multiple

  // Login utente
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('Login con credenziali:', credentials);
    try {
      // Assicurati che la richiesta contenga i campi corretti
      if (!credentials.username && !credentials.email) {
        throw new Error('È necessario fornire username o email per il login');
      }
      
      const loginData = {
        username: credentials.username || credentials.email, // Usa username se disponibile, altrimenti email
        password: credentials.password
      };
      
      const response = await apiClient.post('/auth/login', loginData);
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
    console.log('[AuthService] Verifica autenticazione');
    const hasToken = !!this.getToken();
    const hasUser = !!this.getUser();
    console.log('[AuthService] Stato autenticazione:', { hasToken, hasUser });
    return hasToken && hasUser;
  }

  // Ottieni token corrente
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('[AuthService] getToken:', { token });
    return token;
  }

  // Salva token
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Ottieni dati utente corrente
  getUser(): User | null {
    console.log('[AuthService] Recupero dati utente');
    const userData = localStorage.getItem(this.USER_KEY);
    console.log('[AuthService] Dati utente da localStorage:', { userData });
    if (!userData) {
      console.log('[AuthService] Nessun dato utente trovato');
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
    
    // Sincronizza con il formato del profilo utente per authSlice
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.username, // Usa lo username invece di firstName + lastName
      role: user.role as 'admin' | 'user' | 'viewer',
      permissions: user.permissions,
      lastLogin: new Date().toISOString()
    };
    

  }

  // Pulisci tutti i dati di autenticazione
  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    // Rimuovi anche il profilo utente utilizzato da authSlice
    localStorage.removeItem('crm_user_profile');
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

  // Aggiorna il token di accesso
  async refreshToken(): Promise<string | null> {
    try {
      // In una implementazione reale, qui si farebbe una chiamata API
      // per ottenere un nuovo token usando il refresh token
      
      // Per ora, restituiamo semplicemente il token corrente
      const token = this.getToken();
      if (!token) {
        throw new Error('Nessun token disponibile per il refresh');
      }
      
      return token;
    } catch (error) {
      console.error('Errore durante il refresh del token:', error);
      this.clearAuth(); // Pulisci l'autenticazione in caso di errore
      return null;
    }
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

// Crea un'istanza singleton di AuthService
export const authService = new AuthService();
export default authService;