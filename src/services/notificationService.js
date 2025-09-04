// Servizio per la gestione delle notifiche in-app
class NotificationService {
  constructor() {
    this.listeners = new Set();
    this.notifications = [];
    this.isPolling = false;
    this.pollInterval = null;
    this.lastCheck = null;
  }

  // Inizializza il servizio di notifiche
  init(userId) {
    this.userId = userId;
    this.startPolling();
  }

  // Ferma il servizio di notifiche
  destroy() {
    this.stopPolling();
    this.listeners.clear();
    this.notifications = [];
  }

  // Aggiungi un listener per le notifiche
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notifica tutti i listener
  notifyListeners(notification) {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Errore nel listener notifiche:', error);
      }
    });
  }

  // Inizia il polling per nuovi appunti
  startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.lastCheck = new Date().toISOString();
    
    // Controlla ogni 30 secondi
    this.pollInterval = setInterval(() => {

    }, 30000);
  }

  // Ferma il polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }



  // Mostra una notifica per un nuovo appunto
  showNotification(note) {
    const notification = {
      id: `note_${note.id}`,
      type: 'note',
      title: 'Nuovo Appunto',
      message: `${note.fromUserName}: ${note.title}`,
      priority: note.priority,
      timestamp: new Date().toISOString(),
      data: note
    };

    // Aggiungi alla lista delle notifiche
    this.notifications.unshift(notification);
    
    // Mantieni solo le ultime 50 notifiche
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Notifica i listener
    this.notifyListeners(notification);

    // Mostra notifica browser se supportata
    this.showBrowserNotification(notification);
  }

  // Mostra notifica del browser
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'high'
      });

      // Auto-chiudi dopo 5 secondi (eccetto priorità alta)
      if (notification.priority !== 'high') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }

  // Richiedi permesso per le notifiche del browser
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Ottieni tutte le notifiche
  getNotifications() {
    return this.notifications;
  }

  // Segna una notifica come letta
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Rimuovi una notifica
  removeNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  // Pulisci tutte le notifiche
  clearNotifications() {
    this.notifications = [];
  }

  // Forza il controllo di nuovi appunti
  async forceCheck() {

  }
}

// Istanza singleton del servizio notifiche
const notificationService = new NotificationService();

export default notificationService;