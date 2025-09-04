import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import notificationService from '../services/notificationService';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();
  const { user } = useAuth();

  // Callback per gestire nuove notifiche
  const handleNewNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Mostra toast per la notifica
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'red';
        case 'medium': return 'orange';
        case 'low': return 'blue';
        default: return 'gray';
      }
    };

    toast({
      title: notification.title,
      description: notification.message,
      status: 'info',
      duration: notification.priority === 'high' ? 8000 : 5000,
      isClosable: true,
      position: 'top-right',
      variant: 'subtle',
      colorScheme: getPriorityColor(notification.priority)
    });
  }, [toast]);

  // Inizializza il servizio notifiche
  useEffect(() => {
    if (user?.id) {
      notificationService.init(user.id);
      
      // Richiedi permesso per notifiche browser
      notificationService.requestNotificationPermission();
      
      // Aggiungi listener per nuove notifiche
      const unsubscribe = notificationService.addListener(handleNewNotification);
      
      // Carica notifiche esistenti
      const existingNotifications = notificationService.getNotifications();
      setNotifications(existingNotifications);
      setUnreadCount(existingNotifications.filter(n => !n.read).length);
      
      return () => {
        unsubscribe();
        notificationService.destroy();
      };
    }
  }, [user?.id, handleNewNotification]);

  // Segna una notifica come letta
  const markAsRead = useCallback((notificationId) => {
    notificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Rimuovi una notifica
  const removeNotification = useCallback((notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    notificationService.removeNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, [notifications]);

  // Pulisci tutte le notifiche
  const clearAllNotifications = useCallback(() => {
    notificationService.clearNotifications();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Segna tutte le notifiche come lette
  const markAllAsRead = useCallback(() => {
    notifications.forEach(n => {
      if (!n.read) {
        notificationService.markAsRead(n.id);
      }
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

  // Forza il controllo di nuove notifiche
  const forceCheck = useCallback(async () => {
    await notificationService.forceCheck();
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    markAllAsRead,
    forceCheck
  };
};

export default useNotifications;