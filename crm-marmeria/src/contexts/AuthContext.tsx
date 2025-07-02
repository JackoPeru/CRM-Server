import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User, LoginCredentials } from '../services/auth';
import toast from 'react-hot-toast';

// AuthContext module loaded

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inizializza l'autenticazione al caricamento dell'app
  useEffect(() => {
    let isMounted = true; // Flag per evitare aggiornamenti di stato se il componente è smontato
    
    const initAuth = async () => {
      try {
        // Delay minimo per evitare lampeggiamento
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Controlla se ci sono dati di autenticazione salvati
        const token = authService.getToken();
        const userData = authService.getUser();
        
        if (token && userData) {
          // Prima imposta i dati locali per evitare schermo bianco
          if (isMounted) {
            setUser(userData);
          }
          
          // Poi valida il token in background
          try {
            const isValid = await authService.validateToken();
            if (isMounted) {
              if (isValid) {
                // Token valido, aggiorna con i dati dal server se necessario
                const updatedUserData = authService.getUser();
                setUser(updatedUserData);
              } else {
                // Token non valido, pulisci l'autenticazione
                authService.clearAuth();
                setUser(null);
              }
            }
          } catch (validationError) {
            // Errore nella validazione (es. server non raggiungibile)
            console.warn('Errore validazione token, mantengo dati locali:', validationError);
            // Mantieni i dati locali già impostati
          }
        } else {
          // Nessun dato di autenticazione salvato
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Errore inizializzazione auth:', error);
        if (isMounted) {
          authService.clearAuth();
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    
    // Cleanup function per evitare memory leaks
    return () => {
      isMounted = false;
    };
  }, []); // Array di dipendenze vuoto per eseguire solo al mount

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
      toast.success(`Benvenuto, ${response.user.firstName}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante il login';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      toast.success('Logout effettuato con successo');
    } catch (error) {
      console.error('Errore logout:', error);
      // Anche in caso di errore, pulisci lo stato locale
      authService.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
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
    user,
    isAuthenticated: !!user,
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