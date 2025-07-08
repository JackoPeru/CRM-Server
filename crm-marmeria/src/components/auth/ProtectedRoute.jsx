import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, permission }) => {
  const { isAuthenticated, currentUser, hasPermission } = useAuth();

  // Se non è autenticato, non mostrare nulla (l'App.jsx gestirà il redirect al login)
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  // Se è richiesta una permission specifica, verificala
  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Accesso Negato
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Non hai i permessi necessari per accedere a questa sezione.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;