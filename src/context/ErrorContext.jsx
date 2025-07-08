import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { Box, useDisclosure } from '@chakra-ui/react';

// Crea il contesto per la gestione degli errori
const ErrorContext = createContext();

/**
 * Provider per la gestione centralizzata degli errori nell'applicazione
 */
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Aggiungi un errore alla lista
  const addError = useCallback((error) => {
    const errorId = Date.now().toString();
    const newError = {
      id: errorId,
      type: error.type || 'general',
      message: error.message,
      retryAction: error.retryAction,
      timestamp: new Date(),
      autoClose: error.autoClose !== undefined ? error.autoClose : true,
      timeout: error.timeout || 5000
    };

    setErrors(prev => [...prev, newError]);
    onOpen();

    // Chiudi automaticamente l'errore dopo il timeout se autoClose è true
    if (newError.autoClose) {
      setTimeout(() => {
        removeError(errorId);
      }, newError.timeout);
    }

    return errorId;
  }, [onOpen]);

  // Rimuovi un errore dalla lista
  const removeError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
    if (errors.length <= 1) {
      onClose();
    }
  }, [errors.length, onClose]);

  // Pulisci tutti gli errori
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    onClose();
  }, [onClose]);

  // Gestisci gli errori di permesso
  const handlePermissionError = useCallback((message) => {
    addError({
      type: 'permission',
      message,
      autoClose: false
    });
  }, [addError]);

  // Gestisci gli errori di rete
  const handleNetworkError = useCallback((message) => {
    addError({
      type: 'network',
      message,
      autoClose: true,
      timeout: 5000
    });
  }, [addError]);

  // Ascolta gli eventi di rete
  useEffect(() => {
    const handleOffline = () => {
      handleNetworkError('Sei offline. Alcune funzionalità potrebbero non essere disponibili.');
    };

    const handleOnline = () => {
      // Rimuovi tutti gli errori di rete quando torni online
      setErrors(prev => prev.filter(error => error.type !== 'network'));
    };

    window.addEventListener('app:offline', handleOffline);
    window.addEventListener('app:online', handleOnline);

    return () => {
      window.removeEventListener('app:offline', handleOffline);
      window.removeEventListener('app:online', handleOnline);
    };
  }, [handleNetworkError]);

  // Valore del contesto
  const contextValue = {
    errors,
    addError,
    removeError,
    clearAllErrors,
    handlePermissionError,
    handleNetworkError
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}

      {/* Visualizzazione degli errori */}
      {isOpen && errors.length > 0 && (
        <Box
          position="fixed"
          bottom="20px"
          right="20px"
          zIndex="toast"
          maxWidth="400px"
          width="100%"
        >
          {errors.map(error => (
            <ErrorDisplay
              key={error.id}
              type={error.type}
              message={error.message}
              onRetry={error.retryAction ? () => error.retryAction() : undefined}
              onDismiss={() => removeError(error.id)}
              showRetry={!!error.retryAction}
              showDismiss={true}
            />
          ))}
        </Box>
      )}
    </ErrorContext.Provider>
  );
};

/**
 * Hook per utilizzare il contesto degli errori
 */
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError deve essere utilizzato all\'interno di un ErrorProvider');
  }
  return context;
};

export default ErrorContext;