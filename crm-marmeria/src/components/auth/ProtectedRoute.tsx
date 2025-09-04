import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Shield, AlertTriangle, X } from 'lucide-react';

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
  const [isMinimized, setIsMinimized] = React.useState(false);

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="p-3 max-w-xs bg-red-100 rounded-lg border border-red-200 shadow-lg dark:bg-red-900/20 dark:border-red-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="mr-2 w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Accesso Negato
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="relative p-6 text-center bg-white rounded-lg shadow-lg dark:bg-gray-800 md:p-8">
          {/* Pulsante per minimizzare su mobile */}
          <button
            onClick={() => setIsMinimized(true)}
            className="absolute top-4 right-4 text-gray-400 md:hidden hover:text-gray-600 dark:hover:text-gray-300"
            title="Minimizza"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex justify-center items-center mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full md:h-16 md:w-16 dark:bg-red-900/20">
            <Shield className="w-6 h-6 text-red-600 md:h-8 md:w-8 dark:text-red-400" />
          </div>
          
          <h2 className="mb-2 text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
            Accesso Negato
          </h2>
          
          <p className="mb-4 text-sm text-gray-600 md:text-base dark:text-gray-400 md:mb-6">
            Non hai i permessi necessari per accedere a questa sezione.
          </p>
          
          <div className="p-3 mb-4 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 md:p-4 md:mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium text-yellow-800 md:text-sm dark:text-yellow-200">
                  Utente: {currentUser?.name}
                </p>
                <p className="text-xs text-yellow-700 md:text-sm dark:text-yellow-300">
                  Ruolo: {currentUser?.role}
                </p>
              </div>
            </div>
          </div>
          
          <p className="mb-4 text-xs text-gray-500 md:text-sm dark:text-gray-400">
            Se ritieni che questo sia un errore, contatta l'amministratore del sistema.
          </p>
          
          {/* Pulsante per minimizzare su desktop */}
          <button
            onClick={() => setIsMinimized(true)}
            className="hidden items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors md:inline-flex dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Minimizza
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;