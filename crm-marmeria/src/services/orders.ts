/**
 * Servizio per la gestione degli ordini
 * Implementa CRUD operations con API REST e funzioni specifiche per voice-bot
 */
import api from './api';
import { cacheService } from './cache';
import { authService } from './auth';
import toast from 'react-hot-toast';

// Interfacce TypeScript
export interface AssignedWorker {
  id: string;
  username: string;
  name: string; // Nome visualizzato (username)
  assignedAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description?: string;
  type?: 'order' | 'quote' | 'invoice' | 'project';
  status: 'Preventivo' | 'In Attesa' | 'In Corso' | 'Completato' | 'Annullato';
  priority: 'Bassa' | 'Media' | 'Alta' | 'Urgente';
  startDate: string;
  endDate: string;
  deliveryDate?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  amount: number;
  materials: OrderMaterial[];
  notes?: string;
  assignedWorker?: AssignedWorker | null; // Operaio assegnato quando in lavorazione
  createdAt: string;
  updatedAt: string;
  // Proprietà aggiuntive per compatibilità con API legacy
  name?: string; // Alias per title
  client?: string; // Alias per clientName
  deadline?: string; // Alias per endDate
  budget?: string | number; // Alias per amount
}

export interface OrderMaterial {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderRequest {
  clientId: string;
  title: string;
  description?: string;
  type?: Order['type'];
  status: Order['status'];
  priority: Order['priority'];
  startDate: string;
  endDate: string;
  estimatedDelivery?: string;
  amount: number;
  materials: Omit<OrderMaterial, 'id'>[];
  notes?: string;
}

export interface UpdateOrderRequest extends Partial<CreateOrderRequest> {
  id: string;
}

// Interfacce specifiche per voice-bot
export interface OrderStatus {
  id: string;
  status: Order['status'];
  eta: string | null; // Estimated time of arrival
  clientName: string;
  title: string;
  priority: Order['priority'];
  completionPercentage: number;
  delaysCount: number;
  lastUpdate: string;
}

class OrdersService {

  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minuti per dati più dinamici

  /**
   * Recupera tutti gli ordini
   */
  async getOrders(): Promise<Order[]> {
    try {
      // Recupera sia ordini che progetti
      const [ordersResponse, projectsResponse] = await Promise.all([
        api.get<Order[]>('/orders'),
        api.get<Order[]>('/projects')
      ]);
      
      // Normalizza i dati dei progetti per compatibilità con l'interfaccia Order
      const normalizedProjects = projectsResponse.data.map(project => ({
        ...project,
        title: project.name || project.title || '',
        clientName: project.client || project.clientName || '',
        endDate: project.deadline || project.endDate || new Date().toISOString(),
        startDate: project.startDate || new Date().toISOString(),
        amount: this.parseAmount(project.budget) || project.amount || 0,
        materials: project.materials || [],
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: project.updatedAt || new Date().toISOString(),
        type: 'project' as const
      }));
      
      // Normalizza i dati degli ordini
      const normalizedOrders = ordersResponse.data.map(order => ({
        ...order,
        title: order.title || order.name || '',
        clientName: order.clientName || order.client || '',
        endDate: order.endDate || order.deadline || new Date().toISOString(),
        startDate: order.startDate || new Date().toISOString(),
        amount: order.amount || this.parseAmount(order.budget) || 0,
        materials: order.materials || [],
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString(),
        type: order.type as Order['type']
      }));
      
      const orders = [...normalizedOrders, ...normalizedProjects];
      
      // Salva nel cache per uso offline
      await cacheService.set('orders', 'all', orders, this.CACHE_TTL);
      
      return orders;
    } catch (error: any) {
      console.error('Errore nel recupero ordini:', error);
      
      // Fallback al cache se errore di rete
      if (error.code === 'ERR_NETWORK') {
        const cachedOrders = await cacheService.get<Order[]>('orders', 'all');
        if (cachedOrders) {
          // Notifica ridotta per evitare spam
          const lastOfflineToast = localStorage.getItem('lastOfflineToast');
          const now = Date.now();
          
          if (!lastOfflineToast || (now - parseInt(lastOfflineToast)) > 30000) {
            toast.error('Sei offline – dati in sola lettura', {
              duration: 5000,
              id: 'offline-mode'
            });
            localStorage.setItem('lastOfflineToast', now.toString());
          }
          return cachedOrders;
        }
      }
      
      throw error;
    }
  }

  /**
   * Recupera un ordine specifico per ID
   */
  async getOrder(id: string): Promise<Order> {
    try {
      // Prima prova con l'endpoint degli ordini
      let response;
      let isProject = false;
      try {
        response = await api.get<Order>(`/orders/${id}`);
      } catch (orderError: any) {
        // Se non trovato negli ordini, prova con i progetti
        if (orderError.response?.status === 404) {
          response = await api.get<Order>(`/projects/${id}`);
          isProject = true;
        } else {
          throw orderError;
        }
      }
      
      let order = response.data;
      
      // Normalizza i dati se è un progetto
      if (isProject || order.type === 'project') {
        order = {
          ...order,
          title: order.name || order.title || '',
          clientName: order.client || order.clientName || '',
          endDate: order.deadline || order.endDate || new Date().toISOString(),
          startDate: order.startDate || new Date().toISOString(),
          amount: this.parseAmount(order.budget) || order.amount || 0,
          materials: order.materials || [],
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt || new Date().toISOString(),
          type: 'project' as const
        };
      } else {
        // Normalizza anche gli ordini per consistenza
        order = {
          ...order,
          title: order.title || order.name || '',
          clientName: order.clientName || order.client || '',
          endDate: order.endDate || order.deadline || new Date().toISOString(),
          startDate: order.startDate || new Date().toISOString(),
          amount: order.amount || this.parseAmount(order.budget) || 0,
          materials: order.materials || [],
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt || new Date().toISOString(),
          type: order.type as Order['type']
        };
      }
      
      // Salva nel cache
      await cacheService.set('orders', id, order, this.CACHE_TTL);
      
      return order;
    } catch (error: any) {
      console.error(`Errore nel recupero ordine ${id}:`, error);
      
      // Fallback al cache se errore di rete
      if (error.code === 'ERR_NETWORK') {
        const cachedOrder = await cacheService.get<Order>('orders', id);
        if (cachedOrder) {
          // Usa la stessa logica di throttling per le notifiche
          const lastOfflineToast = localStorage.getItem('lastOfflineToast');
          const now = Date.now();
          
          if (!lastOfflineToast || (now - parseInt(lastOfflineToast)) > 30000) {
            toast.error('Sei offline – dati in sola lettura', {
              duration: 5000,
              id: 'offline-mode'
            });
            localStorage.setItem('lastOfflineToast', now.toString());
          }
          return cachedOrder;
        }
      }
      
      throw error;
    }
  }

  /**
   * VOICE-BOT FUNCTION: Ottiene lo stato di un ordine specifico
   * Utilizzata da micro-servizi esterni per il voice-bot
   * @param orderId ID dell'ordine
   * @returns Stato dettagliato dell'ordine per voice-bot
   */
  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    try {
      const response = await api.get<OrderStatus>(`/orders/${orderId}/status`);
      const orderStatus = response.data;
      
      // Salva nel cache con TTL ridotto per dati real-time
      await cacheService.set('orders', `status_${orderId}`, orderStatus, 60000); // 1 minuto
      
      return orderStatus;
    } catch (error: any) {
      console.error(`Errore nel recupero stato ordine ${orderId}:`, error);
      
      // Fallback al cache se errore di rete
      if (error.code === 'ERR_NETWORK') {
        const cachedStatus = await cacheService.get<OrderStatus>('orders', `status_${orderId}`);
        if (cachedStatus) {
          return cachedStatus;
        }
        
        // Fallback ulteriore: calcola stato da ordine completo in cache
        const cachedOrder = await cacheService.get<Order>('orders', orderId);
        if (cachedOrder) {
          return this.calculateOrderStatusFromOrder(cachedOrder);
        }
      }
      
      throw error;
    }
  }

  /**
   * Crea un nuovo ordine
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      // Determina l'endpoint corretto in base al tipo
      const endpoint = orderData.type === 'project' ? '/projects' : '/orders';
      const response = await api.post<Order>(endpoint, orderData);
      const newOrder = response.data;
      
      // Aggiorna il cache
      await this.invalidateCache();
      
      const entityType = orderData.type === 'project' ? 'Progetto' : 'Ordine';
      toast.success(`${entityType} creato con successo`);
      return newOrder;
    } catch (error: any) {
      console.error('Errore nella creazione ordine:', error);
      
      if (error.code === 'ERR_NETWORK') {
        const entityType = orderData.type === 'project' ? 'progetto' : 'ordine';
        toast.error(`Impossibile creare il ${entityType} offline`);
      }
      
      throw error;
    }
  }

  /**
   * Aggiorna un ordine esistente
   */
  async updateOrder(id: string, orderData: Partial<CreateOrderRequest>): Promise<Order> {
    try {
      // Determina l'endpoint corretto in base al tipo di ordine
      let endpoint = '/orders';
      let response;
      
      // Se è esplicitamente un progetto, usa l'endpoint dei progetti
      if (orderData.type === 'project') {
        endpoint = '/projects';
      } else if (orderData.type === undefined) {
        // Se il tipo non è specificato, prova a determinarlo
        const isProjectType = await this.isProject(id);
        if (isProjectType) {
          endpoint = '/projects';
        }
      }
      
      try {
        // Prova prima con l'endpoint determinato
        response = await api.patch<Order>(`${endpoint}/${id}`, orderData);
      } catch (firstError: any) {
        // Se fallisce e non abbiamo ancora provato l'altro endpoint
        if (firstError.response?.status === 404) {
          const alternativeEndpoint = endpoint === '/orders' ? '/projects' : '/orders';
          try {
            response = await api.patch<Order>(`${alternativeEndpoint}/${id}`, orderData);
          } catch (secondError: any) {
            // Se entrambi gli endpoint falliscono, lancia l'errore originale
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }
      
      const updatedOrder = response.data;
      
      // Aggiorna il cache
      await cacheService.set('orders', id, updatedOrder, this.CACHE_TTL);
      await this.invalidateCache(); // Invalida la lista completa
      
      toast.success('Ordine aggiornato con successo');
      return updatedOrder;
    } catch (error: any) {
      console.error(`Errore nell'aggiornamento ordine ${id}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Impossibile aggiornare l\'ordine offline');
      }
      
      throw error;
    }
  }
  
  /**
   * Verifica se un ordine è un progetto
   * @private
   */
  private async isProject(id: string): Promise<boolean> {
    try {
      // Prima controlla nella cache
      const cachedOrder = await cacheService.get<Order>('orders', id);
      if (cachedOrder) {
        return cachedOrder.type === 'project';
      }
      
      // Se non è in cache, prova a recuperare l'ordine
      // Ma non lanciare errori se non trovato
      try {
        const order = await this.getOrder(id);
        return order.type === 'project';
      } catch (getOrderError: any) {
        // Se l'ordine non esiste in nessuno dei due endpoint,
        // non possiamo determinare il tipo, quindi assumiamo che non sia un progetto
        console.warn(`Impossibile determinare il tipo per l'ordine ${id}:`, getOrderError.message);
        return false;
      }
    } catch (cacheError) {
      // Errore nel cache, prova comunque a recuperare l'ordine
      try {
        const order = await this.getOrder(id);
        return order.type === 'project';
      } catch {
        // In caso di errore, assume che non sia un progetto
        return false;
      }
    }
  }

  /**
   * Aggiorna solo lo stato di un ordine
   */
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    try {
      // Determina l'endpoint corretto in base al tipo di ordine
      let endpoint = '/orders';
      let response;
      
      // Prova a determinare se è un progetto
      const isProjectType = await this.isProject(id);
      if (isProjectType) {
        endpoint = '/projects';
      }
      
      try {
        // Prova prima con l'endpoint determinato
        response = await api.patch<Order>(`${endpoint}/${id}/status`, { status });
      } catch (firstError: any) {
        // Se fallisce e non abbiamo ancora provato l'altro endpoint
        if (firstError.response?.status === 404) {
          const alternativeEndpoint = endpoint === '/orders' ? '/projects' : '/orders';
          try {
            response = await api.patch<Order>(`${alternativeEndpoint}/${id}/status`, { status });
          } catch (secondError: any) {
            // Se entrambi gli endpoint falliscono, lancia l'errore originale
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }
      
      const updatedOrder = response.data;
      
      // Aggiorna il cache
      await cacheService.set('orders', id, updatedOrder, this.CACHE_TTL);
      await this.invalidateCache();
      
      toast.success(`Stato ordine aggiornato a: ${status}`);
      return updatedOrder;
    } catch (error: any) {
      console.error(`Errore nell'aggiornamento stato ordine ${id}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Impossibile aggiornare lo stato offline');
      }
      
      throw error;
    }
  }

  /**
   * Elimina un ordine
   */
  async deleteOrder(id: string): Promise<void> {
    try {
      // Determina l'endpoint corretto in base al tipo di ordine
      let endpoint = '/orders';
      
      // Prova a determinare se è un progetto
      const isProjectType = await this.isProject(id);
      if (isProjectType) {
        endpoint = '/projects';
      }
      
      try {
        // Prova prima con l'endpoint determinato
        await api.delete(`${endpoint}/${id}`);
      } catch (firstError: any) {
        // Se fallisce e non abbiamo ancora provato l'altro endpoint
        if (firstError.response?.status === 404) {
          const alternativeEndpoint = endpoint === '/orders' ? '/projects' : '/orders';
          try {
            await api.delete(`${alternativeEndpoint}/${id}`);
          } catch (secondError: any) {
            // Se entrambi gli endpoint falliscono, lancia l'errore originale
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }
      
      // Rimuove dal cache
      await cacheService.delete('orders', id);
      await cacheService.delete('orders', `status_${id}`);
      await this.invalidateCache();
      
      toast.success('Ordine eliminato con successo');
    } catch (error: any) {
      console.error(`Errore nell'eliminazione ordine ${id}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Impossibile eliminare l\'ordine offline');
      }
      
      throw error;
    }
  }

  /**
   * Cerca ordini per titolo, cliente o stato
   */
  async searchOrders(query: string): Promise<Order[]> {
    // Validazione input
    if (!query || typeof query !== 'string') {
      return [];
    }
    
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return [];
    }
    
    try {
      const response = await api.get<Order[]>(`/orders/search`, {
        params: { q: query }
      });
      
      return response.data || [];
    } catch (error: any) {
      console.error('Errore nella ricerca ordini:', error);
      
      // Fallback al cache per ricerca offline
      if (error.code === 'ERR_NETWORK') {
        const cachedOrders = await cacheService.get<Order[]>('orders', 'all');
        if (cachedOrders) {
          // Usa la stessa logica di throttling per le notifiche
          const lastOfflineToast = localStorage.getItem('lastOfflineToast');
          const now = Date.now();
          
          if (!lastOfflineToast || (now - parseInt(lastOfflineToast)) > 30000) {
            toast.error('Sei offline – dati in sola lettura', {
              duration: 5000,
              id: 'offline-mode'
            });
            localStorage.setItem('lastOfflineToast', now.toString());
          }
          
          // Ricerca più robusta con gestione sicura delle proprietà
          const filteredOrders = cachedOrders.filter(order => {
            try {
              const title = (order.title || '').toLowerCase();
              const clientName = (order.clientName || '').toLowerCase();
              const status = (order.status || '').toLowerCase();
              const description = (order.description || '').toLowerCase();
              
              return title.includes(normalizedQuery) ||
                     clientName.includes(normalizedQuery) ||
                     status.includes(normalizedQuery) ||
                     description.includes(normalizedQuery);
            } catch (filterError) {
              console.warn('Errore nel filtraggio ordine:', order.id, filterError);
              return false;
            }
          });
          
          return filteredOrders;
        }
      }
      
      throw error;
    }
  }

  /**
   * Ottiene ordini per stato
   */
  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    // Validazione input
    if (!status) {
      throw new Error('Status è richiesto');
    }
    
    try {
      const response = await api.get<Order[]>(`/orders/by-status/${status}`);
      return response.data || [];
    } catch (error: any) {
      console.error(`Errore nel recupero ordini per stato ${status}:`, error);
      
      // Fallback al cache
      if (error.code === 'ERR_NETWORK') {
        const cachedOrders = await cacheService.get<Order[]>('orders', 'all');
        if (cachedOrders) {
          const filteredOrders = cachedOrders.filter(order => {
            try {
              return order.status === status;
            } catch (filterError) {
              console.warn('Errore nel filtraggio ordine per stato:', order.id, filterError);
              return false;
            }
          });
          
          // Usa la stessa logica di throttling per le notifiche
          const lastOfflineToast = localStorage.getItem('lastOfflineToast');
          const now = Date.now();
          
          if (!lastOfflineToast || (now - parseInt(lastOfflineToast)) > 30000) {
            toast.error('Sei offline – dati in sola lettura', {
              duration: 5000,
              id: 'offline-mode'
            });
            localStorage.setItem('lastOfflineToast', now.toString());
          }
          
          return filteredOrders;
        }
      }
      
      throw error;
    }
  }

  /**
   * Calcola lo stato dell'ordine da un oggetto Order completo
   * Utilizzato come fallback quando l'API non è disponibile
   */
  private calculateOrderStatusFromOrder(order: Order): OrderStatus {
    const now = new Date();
    
    // Gestione sicura delle date
    let endDate: Date;
    let startDate: Date;
    
    try {
      endDate = new Date(order.endDate);
      startDate = new Date(order.startDate);
      
      // Verifica che le date siano valide
      if (isNaN(endDate.getTime())) {
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default: 30 giorni da ora
      }
      if (isNaN(startDate.getTime())) {
        startDate = new Date(); // Default: ora
      }
    } catch (error) {
      console.warn('Errore nel parsing delle date dell\'ordine:', order.id, error);
      endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      startDate = new Date();
    }
    
    // Calcola percentuale di completamento basata su date e stato
    let completionPercentage = 0;
    switch (order.status) {
      case 'Preventivo':
        completionPercentage = 0;
        break;
      case 'In Attesa':
        completionPercentage = 10;
        break;
      case 'In Corso':
        const totalDuration = endDate.getTime() - startDate.getTime();
        if (totalDuration > 0) {
          const elapsed = now.getTime() - startDate.getTime();
          completionPercentage = Math.min(90, Math.max(10, (elapsed / totalDuration) * 80 + 10));
        } else {
          completionPercentage = 50; // Default per durata non valida
        }
        break;
      case 'Completato':
        completionPercentage = 100;
        break;
      case 'Annullato':
        completionPercentage = 0;
        break;
    }

    // Calcola ETA
    let eta: string | null = null;
    if (order.status === 'In Corso' && order.estimatedDelivery) {
      eta = order.estimatedDelivery;
    } else if (order.status === 'Completato' && order.actualDelivery) {
      eta = order.actualDelivery;
    }

    // Calcola ritardi (semplificato)
    const delaysCount = (endDate < now && order.status !== 'Completato') ? 1 : 0;

    return {
      id: order.id,
      status: order.status,
      eta,
      clientName: order.clientName,
      title: order.title,
      priority: order.priority,
      completionPercentage: Math.round(completionPercentage),
      delaysCount,
      lastUpdate: order.updatedAt,
    };
  }

  /**
   * Converte un budget in formato stringa (es. '€ 15.000,00') in numero
   */
  private parseAmount(budget: string | number | null | undefined): number {
    if (typeof budget === 'number' && !isNaN(budget)) return budget;
    if (!budget || typeof budget !== 'string') return 0;
    
    try {
      // Rimuove simboli di valuta, spazi e converte virgole in punti
      const cleanAmount = budget
        .replace(/[€$£¥]/g, '') // Rimuove simboli di valuta
        .replace(/\s/g, '') // Rimuove spazi
        .replace(/\./g, '') // Rimuove punti (separatori delle migliaia)
        .replace(/,/g, '.'); // Converte virgole in punti decimali
      
      const parsed = parseFloat(cleanAmount);
      return isNaN(parsed) ? 0 : Math.max(0, parsed); // Assicura che non sia negativo
    } catch (error) {
      console.warn('Errore nel parsing del budget:', budget, error);
      return 0;
    }
  }

  /**
   * Invalida il cache degli ordini
   */
  private async invalidateCache(): Promise<void> {
    try {
      await cacheService.delete('orders', 'all');
    } catch (error) {
      console.error('Errore nell\'invalidazione cache ordini:', error);
    }
  }

  /**
   * Recupera le statistiche degli ordini
   */
  async getOrdersStats(): Promise<{
    total: number;
    byStatus: Record<Order['status'], number>;
    totalValue: number;
    pendingDeliveries: number;
  }> {
    try {
      const response = await api.get('/orders/stats');
      const stats = response.data;
      
      // Salva nel cache
      await cacheService.set('orders', 'stats', stats, this.CACHE_TTL);
      
      return stats;
    } catch (error: any) {
      console.error('Errore nel recupero statistiche ordini:', error);
      
      // Fallback al cache se errore di rete
       if (error.code === 'ERR_NETWORK') {
         const cachedStats = await cacheService.get<{
           total: number;
           byStatus: Record<Order['status'], number>;
           totalValue: number;
           pendingDeliveries: number;
         }>('orders', 'stats');
         if (cachedStats) {
           return cachedStats;
         }
       }
      
      // Calcolo locale delle statistiche se non disponibili
      const orders = await this.getOrders();
      const stats = this.calculateStatsFromOrders(orders);
      return stats;
    }
  }

  /**
   * Calcola le statistiche dagli ordini in cache
   */
  private calculateStatsFromOrders(orders: Order[]): {
    total: number;
    byStatus: Record<Order['status'], number>;
    totalValue: number;
    pendingDeliveries: number;
  } {
    // Validazione input
    if (!Array.isArray(orders)) {
      console.warn('calculateStatsFromOrders: orders non è un array valido');
      orders = [];
    }
    
    const byStatus: Record<Order['status'], number> = {
      'Preventivo': 0,
      'In Attesa': 0,
      'In Corso': 0,
      'Completato': 0,
      'Annullato': 0
    };
    
    let totalValue = 0;
    let pendingDeliveries = 0;
    
    orders.forEach(order => {
      try {
        // Verifica che l'ordine abbia le proprietà necessarie
        if (!order || typeof order !== 'object') {
          console.warn('Ordine non valido trovato nelle statistiche:', order);
          return;
        }
        
        // Gestione sicura dello status
        if (order.status && byStatus.hasOwnProperty(order.status)) {
          byStatus[order.status]++;
        } else {
          console.warn('Status non valido per ordine:', order.id, order.status);
        }
        
        // Gestione sicura dell'amount
        const amount = typeof order.amount === 'number' && !isNaN(order.amount) ? order.amount : 0;
        totalValue += Math.max(0, amount); // Assicura che non sia negativo
        
        // Conteggio consegne pendenti
        if (order.status === 'In Corso' || order.status === 'In Attesa') {
          pendingDeliveries++;
        }
      } catch (error) {
        console.warn('Errore nel calcolo statistiche per ordine:', order?.id, error);
      }
    });
    
    return {
      total: orders.length,
      byStatus,
      totalValue: Math.round(totalValue * 100) / 100, // Arrotonda a 2 decimali
      pendingDeliveries
    };
  }

  /**
   * Pulisce la cache degli ordini
   */
  async clearCache(): Promise<void> {
    try {
      await cacheService.clear('orders');
      console.log('Cache ordini pulito');
    } catch (error) {
      console.error('Errore nella pulizia cache ordini:', error);
    }
  }
}

// Istanza singleton del servizio ordini
export const ordersService = new OrdersService();
export default ordersService;