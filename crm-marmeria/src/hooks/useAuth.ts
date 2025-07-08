import { useEffect } from 'react';
import { useAppDispatch, useAppSelector, selectIsAuthenticated, selectCurrentUser, selectAuthLoading, selectAuthError, selectAuthToken } from '../store';
import {
  loginUser,
  logoutUser,
  refreshToken,
  checkAuthStatus,
  updateUserProfile,
  clearAuthError,
} from '../store/slices/authSlice';
import type { LoginCredentials, User } from '../store/slices/authSlice';

/**
 * Hook personalizzato per gestire l'autenticazione
 * Fornisce metodi e stato per login, logout, refresh token e gestione utente
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const currentUser = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAuthToken);

  // Nota: checkAuthStatus viene chiamato dall'AuthProvider, non qui per evitare loop infiniti

  /**
   * Effettua il login dell'utente
   */
  const login = async (credentials: { username?: string; email?: string; password: string }) => {
    const result = await dispatch(loginUser(credentials));
    return result.meta.requestStatus === 'fulfilled';
  };

  /**
   * Effettua il logout dell'utente
   */
  const logout = async () => {
    await dispatch(logoutUser());
  };

  /**
   * Aggiorna il profilo dell'utente
   */
  const updateProfile = async (userData: Partial<User>) => {
    const result = await dispatch(updateUserProfile(userData));
    return result.meta.requestStatus === 'fulfilled';
  };

  /**
   * Pulisce gli errori di autenticazione
   */
  const clearError = () => {
    dispatch(clearAuthError());
  };

  /**
   * Forza il refresh del token
   */
  const forceRefreshToken = async () => {
    const result = await dispatch(refreshToken());
    return result.meta.requestStatus === 'fulfilled';
  };

  /**
   * Verifica se l'utente ha un permesso specifico
   */
  const hasPermission = (permission: string): boolean => {
    if (!currentUser || !currentUser.permissions) return false;
    return currentUser.permissions.includes(permission);
  };

  /**
   * Verifica se l'utente ha un ruolo specifico
   */
  const hasRole = (role: string): boolean => {
    if (!currentUser) return false;
    return currentUser.role === role;
  };

  /**
   * Verifica se l'utente ha uno dei ruoli specificati
   */
  const hasAnyRole = (roles: string[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  return {
    // Stato
    isAuth: isAuthenticated,
    isAuthenticated,
    loading,
    error,
    currentUser,
    token,
    
    // Azioni
    login,
    logout,
    updateProfile,
    clearError,
    forceRefreshToken,
    
    // Verifiche di autorizzazione
    hasPermission,
    hasRole,
    hasAnyRole,
  };
};

export default useAuth;