import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, permission }) => {
  const { isAuthenticated, currentUser, hasPermission } = useAuth();

  // Se non è autenticato, non mostrare nulla (l'App.jsx gestirà il redirect al login)
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  // Se è richiesta una permission specifica, verificala
  if (permission && !hasPermission(permission)) {
    return <AccessDenied />;
  }

  return children;
};

const AccessDenied = () => {
  const { currentUser } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 shadow-lg max-w-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 dark:text-red-400 mr-2">🔒</span>
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Accesso Negato
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 ml-2 text-sm"
            >
              ⚠️
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Accesso Negato
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm md:text-base">
            Non hai i permessi necessari per accedere a questa sezione.
          </p>
          {currentUser && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Utente: {currentUser.username} ({currentUser.role})
            </div>
          )}
          <button
            onClick={() => setIsMinimized(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200 md:hidden"
          >
            Minimizza
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;