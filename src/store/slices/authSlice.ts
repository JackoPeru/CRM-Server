/**
 * Redux Slice per la gestione dell'autenticazione
 * Gestisce login, logout, refresh token e stato utente
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api';

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
  email: string;
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
      const tokens = await apiClient.login(credentials.email, credentials.password);
      
      // Recupera informazioni utente
      const userResponse = await apiClient.getInstance().get<User>('/auth/me');
      const user = userResponse.data;
      
      // Calcola scadenza sessione (default 24 ore)
      const expiresIn = 24 * 60 * 60 * 1000; // 24 ore in millisecondi
      
      return {
        user,
        tokens,
        expiresIn,
      };
    } catch (error: any) {
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
      await apiClient.logout();
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
      // Qui recuperiamo solo i token aggiornati dal localStorage
      const tokensString = localStorage.getItem('authTokens');
      if (!tokensString) {
        throw new Error('Token non trovati');
      }
      
      const tokens: AuthTokens = JSON.parse(tokensString);
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
  { user: User; tokens: AuthTokens },
  void,
  { rejectValue: string }
>(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      // Verifica se ci sono token salvati
      const tokensString = localStorage.getItem('authTokens');
      if (!tokensString) {
        throw new Error('Nessun token trovato');
      }
      
      const tokens: AuthTokens = JSON.parse(tokensString);
      
      // Verifica la validità del token recuperando le info utente
      const userResponse = await apiClient.getInstance().get<User>('/auth/me');
      const user = userResponse.data;
      
      return { user, tokens };
    } catch (error: any) {
      // Pulisce i token non validi
      localStorage.removeItem('authTokens');
      const message = error.response?.data?.message || 'Sessione scaduta';
      return rejectWithValue(message);
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
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await apiClient.getInstance().patch<User>('/auth/profile', profileData);
      return response.data;
    } catch (error: any) {
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
    },
    
    /**
     * Imposta l'utente manualmente
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
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
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore durante il login';
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
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
      })
      .addCase(logoutUser.rejected, (state) => {
        // Anche se il logout fallisce, pulisce lo stato locale
        state.loading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.sessionExpiry = null;
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
      });
    
    // Check Auth Status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.lastActivity = Date.now();
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sessione non valida';
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
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

// Export types
export type { User, LoginCredentials, AuthTokens, AuthState };

// Export reducer
export default authSlice.reducer;