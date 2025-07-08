import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  role,
  roles,
  fallback
}) => {
  const { isAuthenticated, hasPermission, hasRole, hasAnyRole, currentUser } = useAuth();

  // Se non è autenticato, non mostrare nulla (sarà gestito dall'App)
  if (!isAuthenticated) {
    return null;
  }

  // Verifica permesso specifico
  if (permission && !hasPermission(permission)) {
    return fallback || <AccessDenied />;
  }

  // Verifica ruolo specifico
  if (role && !hasRole(role)) {
    return fallback || <AccessDenied />;
  }

  // Verifica uno dei ruoli specificati
  if (roles && !hasAnyRole(roles)) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
};

const AccessDenied: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Accesso Negato
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Non hai i permessi necessari per accedere a questa sezione.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <div className="text-left">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Utente corrente: {currentUser?.name}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Ruolo: {currentUser?.role}
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Se ritieni che questo sia un errore, contatta l'amministratore del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;