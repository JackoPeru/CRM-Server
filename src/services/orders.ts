/**
 * Servizio per la gestione degli ordini
 * Implementa CRUD operations con API REST e funzioni specifiche per voice-bot
 */
import api from './api';
import { cacheService } from './cache';
import toast from 'react-hot-toast';

// Interfacce TypeScript
export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description?: string;
  status: 'Preventivo' | 'In Attesa' | 'In Lavorazione' | 'Completato' | 'Annullato';
  priority: 'Bassa' | 'Media' | 'Alta' | 'Urgente';
  startDate: string;
  endDate: string;
  deliveryDate?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  amount: number;
  materials: OrderMaterial[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
      const response = await api.get<Order[]>('/orders');
      const orders = response.data;
      
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
      const response = await api.get<Order>(`/orders/${id}`);
      const order = response.data;
      
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
      const response = await api.post<Order>('/orders', orderData);
      const newOrder = response.data;
      
      // Aggiorna il cache
      await this.invalidateCache();
      
      toast.success('Ordine creato con successo');
      return newOrder;
    } catch (error: any) {
      console.error('Errore nella creazione ordine:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Impossibile creare l\'ordine offline');
      }
      
      throw error;
    }
  }

  /**
   * Aggiorna un ordine esistente
   */
  async updateOrder(id: string, orderData: Partial<CreateOrderRequest>): Promise<Order> {
    try {
      const response = await api.patch<Order>(`/orders/${id}`, orderData);
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
   * Aggiorna solo lo stato di un ordine
   */
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    try {
      const response = await api.patch<Order>(`/orders/${id}/status`, { status });
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
      await api.delete(`/orders/${id}`);
      
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
    try {
      const response = await api.get<Order[]>(`/orders/search`, {
        params: { q: query }
      });
      
      return response.data;
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
          const filteredOrders = cachedOrders.filter(order => 
            order.title.toLowerCase().includes(query.toLowerCase()) ||
            order.clientName.toLowerCase().includes(query.toLowerCase()) ||
            order.status.toLowerCase().includes(query.toLowerCase())
          );
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
    try {
      const response = await api.get<Order[]>(`/orders/by-status/${status}`);
      return response.data;
    } catch (error: any) {
      console.error(`Errore nel recupero ordini per stato ${status}:`, error);
      
      // Fallback al cache
      if (error.code === 'ERR_NETWORK') {
        const cachedOrders = await cacheService.get<Order[]>('orders', 'all');
        if (cachedOrders) {
          const filteredOrders = cachedOrders.filter(order => order.status === status);
          toast.error('Sei offline – dati in sola lettura');
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
    const endDate = new Date(order.endDate);
    const startDate = new Date(order.startDate);
    
    // Calcola percentuale di completamento basata su date e stato
    let completionPercentage = 0;
    switch (order.status) {
      case 'Preventivo':
        completionPercentage = 0;
        break;
      case 'In Attesa':
        completionPercentage = 10;
        break;
      case 'In Lavorazione':
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        completionPercentage = Math.min(90, Math.max(10, (elapsed / totalDuration) * 80 + 10));
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
    if (order.status === 'In Lavorazione' && order.estimatedDelivery) {
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
    const byStatus: Record<Order['status'], number> = {
      'Preventivo': 0,
      'In Attesa': 0,
      'In Lavorazione': 0,
      'Completato': 0,
      'Annullato': 0
    };
    
    let totalValue = 0;
    let pendingDeliveries = 0;
    
    orders.forEach(order => {
      byStatus[order.status]++;
      totalValue += order.amount;
      
      if (order.status === 'In Lavorazione' || order.status === 'In Attesa') {
        pendingDeliveries++;
      }
    });
    
    return {
      total: orders.length,
      byStatus,
      totalValue,
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