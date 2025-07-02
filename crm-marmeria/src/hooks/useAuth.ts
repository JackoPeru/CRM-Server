import { useEffect } from 'react';
import { useAppDispatch, useAppSelector, selectIsAuthenticated, selectCurrentUser, selectAuthLoading, selectAuthError } from '../store';
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

  // Controlla lo stato di autenticazione all'avvio
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  /**
   * Effettua il login dell'utente
   */
  const login = async (credentials: LoginCredentials) => {
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

  return {
    // Stato
    isAuth: isAuthenticated,
    isAuthenticated,
    loading,
    error,
    currentUser,
    
    // Azioni
    login,
    logout,
    updateProfile,
    clearError,
    forceRefreshToken,
  };
};

export default useAuth;