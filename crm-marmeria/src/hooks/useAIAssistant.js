import { useState, useCallback } from 'react';

// Hook globale per gestire lo stato dell'assistente IA
const useAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const openAssistant = useCallback(() => {
    setIsOpen(true);
    setHasUnreadMessages(false);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        setHasUnreadMessages(false);
      }
      return !prev;
    });
  }, []);

  const markAsUnread = useCallback(() => {
    if (!isOpen) {
      setHasUnreadMessages(true);
    }
  }, [isOpen]);

  return {
    isOpen,
    hasUnreadMessages,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    markAsUnread
  };
};

export default useAIAssistant;