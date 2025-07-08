import React, { createContext, useContext, useState, useCallback } from 'react';

const AIAssistantContext = createContext();

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant deve essere utilizzato all\'interno di AIAssistantProvider');
  }
  return context;
};

export const AIAssistantProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [messages, setMessages] = useState([]);

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

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
    if (message.role === 'assistant' && !isOpen) {
      setHasUnreadMessages(true);
    }
  }, [isOpen]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value = {
    isOpen,
    hasUnreadMessages,
    messages,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    markAsUnread,
    addMessage,
    clearMessages,
    setMessages
  };

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};

export default AIAssistantContext;