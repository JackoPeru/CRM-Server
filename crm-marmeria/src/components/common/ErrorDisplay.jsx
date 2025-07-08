import React from 'react';
import { Alert, AlertIcon, AlertTitle, AlertDescription, Box, Button } from '@chakra-ui/react';
import { FiAlertTriangle, FiLock, FiWifiOff } from 'react-icons/fi';

/**
 * Componente per visualizzare errori in modo coerente nell'interfaccia utente
 * 
 * @param {Object} props - Proprietà del componente
 * @param {string} props.type - Tipo di errore ('permission', 'network', 'validation', 'general')
 * @param {string} props.message - Messaggio di errore
 * @param {Function} props.onRetry - Funzione da chiamare quando l'utente clicca su "Riprova"
 * @param {Function} props.onDismiss - Funzione da chiamare quando l'utente chiude l'errore
 * @param {boolean} props.showRetry - Se mostrare il pulsante "Riprova"
 * @param {boolean} props.showDismiss - Se mostrare il pulsante "Chiudi"
 */
const ErrorDisplay = ({ 
  type = 'general', 
  message = 'Si è verificato un errore', 
  onRetry, 
  onDismiss,
  showRetry = false,
  showDismiss = true
}) => {
  // Configurazione in base al tipo di errore
  const errorConfig = {
    permission: {
      status: 'error',
      icon: <FiLock size={20} />,
      title: 'Errore di permesso',
      defaultMessage: 'Non hai i permessi necessari per questa operazione'
    },
    network: {
      status: 'warning',
      icon: <FiWifiOff size={20} />,
      title: 'Errore di connessione',
      defaultMessage: 'Sei offline. Alcune funzionalità potrebbero non essere disponibili'
    },
    validation: {
      status: 'warning',
      icon: <FiAlertTriangle size={20} />,
      title: 'Errore di validazione',
      defaultMessage: 'I dati inseriti non sono validi'
    },
    general: {
      status: 'error',
      icon: <FiAlertTriangle size={20} />,
      title: 'Errore',
      defaultMessage: 'Si è verificato un errore'
    }
  };

  const config = errorConfig[type] || errorConfig.general;
  const displayMessage = message || config.defaultMessage;

  return (
    <Alert
      status={config.status}
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      borderRadius="md"
      p={4}
      mb={4}
    >
      <AlertIcon as={() => config.icon} boxSize="24px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        {config.title}
      </AlertTitle>
      <AlertDescription maxWidth="sm">
        {displayMessage}
      </AlertDescription>
      
      {(showRetry || showDismiss) && (
        <Box mt={4} display="flex" justifyContent="center" gap={2}>
          {showRetry && onRetry && (
            <Button size="sm" onClick={onRetry} colorScheme="blue">
              Riprova
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button size="sm" onClick={onDismiss} variant="ghost">
              Chiudi
            </Button>
          )}
        </Box>
      )}
    </Alert>
  );
};

export default ErrorDisplay;