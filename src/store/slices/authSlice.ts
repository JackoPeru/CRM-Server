/**
 * Redux Slice per la gestione dell'autenticazione
 * Gestisce login, logout, refresh token e stato utente
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api';
import { authService } from '../../services/auth';

// Interfacce TypeScript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  avatar?: string;
  lastLogin?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  lastActivity: number;
  sessionExpiry: number | null;
}

interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  expiresIn: number;
}

// Stato iniziale
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  lastActivity: Date.now(),
  sessionExpiry: null,
};

// Carica il profilo utente dal localStorage se disponibile
try {
  console.log('[authSlice] Inizio caricamento stato iniziale da localStorage');
  const savedUserProfile = localStorage.getItem('crm_user_profile');
  const token = authService.getToken();

  if (savedUserProfile && token) {
    try {
      const userProfile = JSON.parse(savedUserProfile);
      initialState.user = userProfile;
      initialState.isAuthenticated = true;
      initialState.tokens = { accessToken: token, refreshToken: token };
      console.log('[authSlice] Stato iniziale impostato da crm_user_profile:', initialState);
    } catch (e) {
      console.error('Errore nel parsing del profilo utente, pulizia localStorage:', e);
      localStorage.removeItem('crm_user_profile');
      localStorage.removeItem('crm_auth_token');
    }
  } else {
    console.log('[authSlice] Nessun dato utente trovato in localStorage');
  }
} catch (error) {
  console.error('Errore nel caricamento dello stato iniziale:', error);
  // Pulisci in caso di qualsiasi errore
  localStorage.removeItem('crm_user_profile');
  localStorage.removeItem('crm_auth_token');
}

// Async Thunks

/**
 * Effettua il login dell'utente
 */
export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      // Gestisci sia username che email
      const loginCredentials = {
        username: credentials.username || credentials.email, // Usa username se disponibile, altrimenti email
        password: credentials.password
      };
      
      const authResponse = await authService.login(loginCredentials);
      const tokens = {
        accessToken: authResponse.token,
        refreshToken: authResponse.token // Utilizziamo lo stesso token come refreshToken
      };
      
      // Utilizziamo i dati utente dalla risposta di login
      const user: User = {
        id: authResponse.user.id,
        email: authResponse.user.email,
        name: authResponse.user.username, // Usa username invece di firstName + lastName
        role: authResponse.user.role as 'admin' | 'user' | 'viewer',
        permissions: authResponse.user.permissions,
        lastLogin: new Date().toISOString()
      };
      
      // Calcola scadenza sessione (default 24 ore)
      const expiresIn = 24 * 60 * 60 * 1000; // 24 ore in millisecondi
      
      return {
        user,
        tokens,
        expiresIn,
      };
    } catch (error: any) {
      console.error('Errore durante il login:', error);
      const message = error.response?.data?.message || error.message || 'Errore durante il login';
      return rejectWithValue(message);
    }
  }
);

/**
 * Effettua il logout dell'utente
 */
export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'auth/logoutUser',
  async (_) => {
    try {
      await authService.logout();
    } catch (error: any) {
      // Non bloccare il logout anche se la chiamata API fallisce
      console.warn('Errore durante il logout:', error);
    }
  }
);

/**
 * Verifica e aggiorna il token di accesso
 */
export const refreshToken = createAsyncThunk<
  AuthTokens,
  void,
  { rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // Il refresh viene gestito automaticamente dall'interceptor di Axios
      // Qui recuperiamo il token dal localStorage
      const token = authService.getToken();
      if (!token) {
        throw new Error('Token non trovato');
      }
      
      // Creiamo l'oggetto AuthTokens
      const tokens: AuthTokens = {
        accessToken: token,
        refreshToken: token // Utilizziamo lo stesso token come refreshToken
      };
      
      return tokens;
    } catch (error: any) {
      const message = error.message || 'Errore durante il refresh del token';
      return rejectWithValue(message);
    }
  }
);

/**
 * Verifica lo stato di autenticazione al caricamento dell'app
 */
export const checkAuthStatus = createAsyncThunk<
  { user: User; tokens: AuthTokens; expiresIn: number } | null,
  void,
  { rejectValue: string }
>(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const user = authService.getUser();
      const token = authService.getToken();

      if (user && token) {
        // Simula una risposta di login per coerenza
        const tokens = { accessToken: token, refreshToken: token };
        const expiresIn = 24 * 60 * 60 * 1000; // 24 ore
        const userForSlice: User = {
          id: user.id,
          email: user.email,
          name: user.username, // Map username to name
          role: user.role as 'admin' | 'user' | 'viewer',
          permissions: user.permissions,
        };
        return { user: userForSlice, tokens, expiresIn };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Errore nel controllo dello stato di autenticazione');
    }
  }
);



/**
 * Aggiorna il profilo utente
 */
export const updateUserProfile = createAsyncThunk<
  User,
  Partial<Pick<User, 'name' | 'email' | 'avatar'>>,
  { rejectValue: string }
>(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue, getState }) => {
    try {
      // Prepara i dati da inviare all'API
      const apiProfileData: Record<string, any> = {};
      
      // Invia il nome come username invece di dividerlo in firstName e lastName
      if (profileData.name) {
        apiProfileData.username = profileData.name;
      }
      
      if (profileData.email) {
        apiProfileData.email = profileData.email;
      }
      
      if (profileData.avatar) {
        apiProfileData.avatar = profileData.avatar;
      }
      
      // Invia la richiesta di aggiornamento
      const response = await apiClient.patch('/auth/profile', apiProfileData);
      
      // Ottieni lo stato corrente dell'utente
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        throw new Error('Utente non autenticato');
      }
      
      // Aggiorna solo i campi modificati
      const updatedUser = {
        ...currentUser,
        ...(profileData.name && { name: profileData.name }),
        ...(profileData.email && { email: profileData.email }),
        ...(profileData.avatar && { avatar: profileData.avatar })
      };
      
      // Salva immediatamente nel localStorage per garantire la persistenza
      localStorage.setItem('crm_user_profile', JSON.stringify(updatedUser));
      
      // Aggiorna anche authService per garantire coerenza
      const userData = {
        id: updatedUser.id,
        username: updatedUser.name,
        email: updatedUser.email,
        firstName: updatedUser.name,
        lastName: '',
        role: updatedUser.role,
        permissions: updatedUser.permissions || []
      };
      authService.setUser(userData);
      
      return updatedUser;
    } catch (error: any) {
      console.error('Errore aggiornamento profilo:', error);
      const message = error.response?.data?.message || error.message || 'Errore durante l\'aggiornamento del profilo';
      return rejectWithValue(message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Pulisce gli errori di autenticazione
     */
    clearAuthError: (state) => {
      state.error = null;
    },
    
    /**
     * Aggiorna l'ultima attività dell'utente
     */
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    /**
     * Imposta i token manualmente (per casi speciali)
     */
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
      state.isAuthenticated = true;
      
      // Salva i token nel localStorage tramite authService
      if (action.payload && action.payload.accessToken) {
        authService.setToken(action.payload.accessToken);
      }
    },
    
    /**
     * Imposta l'utente manualmente
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      
      // Salva i dati utente nel localStorage
      if (action.payload) {
        localStorage.setItem('crm_user_profile', JSON.stringify(action.payload));
      }
    },
    
    /**
     * Reset completo dello stato auth
     */
    resetAuthState: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.sessionExpiry = null;
      
      // Rimuovi i dati utente dal localStorage
      localStorage.removeItem('crm_user_profile');
    },
  },
  extraReducers: (builder) => {
    // Login User
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.sessionExpiry = Date.now() + action.payload.expiresIn;
        state.lastActivity = Date.now();
        state.error = null;
        
        // Salva i dati utente nel localStorage
        if (action.payload.user) {
          localStorage.setItem('crm_user_profile', JSON.stringify(action.payload.user));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore durante il login';
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
        
        // Rimuovi i dati utente dal localStorage
        localStorage.removeItem('crm_user_profile');
      });
    
    // Logout User
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.sessionExpiry = null;
        state.error = null;
        
        // Rimuovi i dati utente dal localStorage
        localStorage.removeItem('crm_user_profile');
      })
      .addCase(logoutUser.rejected, (state) => {
        // Anche se il logout fallisce, pulisce lo stato locale
        state.loading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.sessionExpiry = null;
        
        // Rimuovi i dati utente dal localStorage
        localStorage.removeItem('crm_user_profile');
      });
    
    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.tokens = action.payload;
        state.lastActivity = Date.now();
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.error = action.payload || 'Errore durante il refresh del token';
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
        
        // Rimuovi i dati utente dal localStorage
        localStorage.removeItem('crm_user_profile');
      });
    
    // Check Auth Status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        console.log('[authSlice] checkAuthStatus.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
      console.log('[authSlice] checkAuthStatus.fulfilled, payload:', action.payload);
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.sessionExpiry = Date.now() + action.payload.expiresIn;
      } else {
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
      }
      state.loading = false;
      state.lastActivity = Date.now();
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        console.log('[authSlice] checkAuthStatus.rejected, payload:', action.payload);
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
        state.error = typeof action.payload === 'string' ? action.payload : 'Sessione non valida';
      });
    
    // Update User Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
        
        // Salva il profilo utente aggiornato nel localStorage
        // Nota: questo è un backup, il salvataggio principale avviene nella thunk action
        if (action.payload) {
          localStorage.setItem('crm_user_profile', JSON.stringify(action.payload));
          
          // Aggiorna anche i dati utente in authService per garantire coerenza
          const userData = {
            id: action.payload.id,
            username: action.payload.name, // Usa il nome come username per coerenza
            email: action.payload.email,
            firstName: action.payload.name, // Usa il nome completo come firstName
            lastName: '', // Lascia lastName vuoto
            role: action.payload.role,
            permissions: action.payload.permissions || []
          };
          authService.setUser(userData);
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore durante l\'aggiornamento del profilo';
      });
  },
});

// Export actions
export const {
  clearAuthError,
  updateLastActivity,
  setTokens,
  setUser,
  resetAuthState,
} = authSlice.actions;

// Export selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectUserPermissions = (state: { auth: AuthState }) => state.auth.user?.permissions || [];
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.tokens?.accessToken;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;

// Export types
export type { User, LoginCredentials, AuthTokens, AuthState };

// Export reducer
export default authSlice.reducer;