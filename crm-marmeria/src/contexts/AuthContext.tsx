import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/auth';
import type { User, LoginCredentials } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector, selectIsAuthenticated, selectCurrentUser, selectAuthLoading, selectAuthError } from '../store';
import { loginUser, logoutUser, updateUserProfile, checkAuthStatus } from '../store/slices/authSlice';

// AuthContext module loaded

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('[AuthContext] Inizializzazione AuthProvider');
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  console.log('[AuthContext] Stato corrente:', { isAuthenticated, currentUser, isLoading, error });

  useEffect(() => {
    console.log('[AuthContext] useEffect - Chiamata a checkAuthStatus');
    dispatch(checkAuthStatus());
  }, [dispatch]); // Dipendenza dal dispatch per eseguire solo al mount

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      console.log('🔐 [AuthContext] Login tramite Redux');
      const result = await dispatch(loginUser(credentials));
      
      if (result.meta.requestStatus === 'fulfilled' && result.payload) {
        // Check if result.payload is a LoginResponse object with user property
        if (typeof result.payload === 'object' && 'user' in result.payload) {
          const userData = result.payload.user;
          toast.success(`Benvenuto, ${userData.name}!`);
        } else {
          toast.success('Login effettuato con successo');
        }
      } else {
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Errore durante il login';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante il login';
      toast.error(message);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔐 [AuthContext] Logout tramite Redux');
      await dispatch(logoutUser());
      toast.success('Logout effettuato con successo');
    } catch (error) {
      console.error('Errore logout:', error);
      // Anche in caso di errore, pulisci lo stato locale
      authService.clearAuth();
    }
  };

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return authService.hasAnyRole(roles);
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};