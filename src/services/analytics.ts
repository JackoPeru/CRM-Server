/**
 * Servizio per analytics e reportistica
 * Implementa funzioni specifiche per voice-bot e dashboard
 */
import api from './api';
import { cacheService } from './cache';
import toast from 'react-hot-toast';

// Interfacce TypeScript
export interface DailySummary {
  date: string;
  ordersCompleted: number;
  deliveriesDue: number;
  delays: number;
  newOrders: number;
  revenue: number;
  activeProjects: number;
  urgentTasks: number;
  clientsContacted: number;
  materials: {
    lowStock: number;
    outOfStock: number;
  };
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  clientSatisfaction: number;
  deliveryPerformance: number;
  topMaterials: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface MonthlySummary {
  month: string;
  year: number;
  totalOrders: number;
  totalRevenue: number;
  newClients: number;
  completionRate: number;
  averageDeliveryTime: number;
  topClients: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  growthRate: number;
}

export interface PerformanceMetrics {
  onTimeDelivery: number;
  customerSatisfaction: number;
  orderAccuracy: number;
  responseTime: number;
  qualityScore: number;
}

export interface TrendData {
  period: string;
  orders: number;
  revenue: number;
  clients: number;
  satisfaction: number;
}

class AnalyticsService {
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minuti per dati analytics

  /**
   * VOICE-BOT FUNCTION: Ottiene il riepilogo giornaliero
   * Utilizzata da micro-servizi esterni per il voice-bot
   * @param date Data specifica (opzionale, default oggi)
   * @returns Riepilogo completo della giornata
   */
  async getTodaySummary(date?: string): Promise<DailySummary> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `daily_summary_${targetDate}`;
    
    try {
      const response = await api.get<DailySummary>(`/analytics/daily/${targetDate}`);
      const summary = response.data;
      
      // Salva nel cache con TTL ridotto per dati real-time
      await cacheService.set('analytics', cacheKey, summary, this.CACHE_TTL);
      
      return summary;
    } catch (error: any) {
      console.error(`Errore nel recupero riepilogo giornaliero ${targetDate}:`, error);
      
      // Fallback al cache se errore di rete
      if (error.code === 'ERR_NETWORK') {
        const cachedSummary = await cacheService.get<DailySummary>('analytics', cacheKey);
        if (cachedSummary) {
          return cachedSummary;
        }
        
        // Fallback ulteriore: calcola da dati in cache
        const calculatedSummary = await this.calculateTodaySummaryFromCache(targetDate);
        if (calculatedSummary) {
          return calculatedSummary;
        }
      }
      
      throw error;
    }
  }

  /**
   * Ottiene il riepilogo settimanale
   */
  async getWeeklySummary(weekStart?: string): Promise<WeeklySummary> {
    const targetWeek = weekStart || this.getWeekStart(new Date());
    const cacheKey = `weekly_summary_${targetWeek}`;
    
    try {
      const response = await api.get<WeeklySummary>(`/analytics/weekly/${targetWeek}`);
      const summary = response.data;
      
      await cacheService.set('analytics', cacheKey, summary, this.CACHE_TTL * 2);
      
      return summary;
    } catch (error: any) {
      console.error(`Errore nel recupero riepilogo settimanale ${targetWeek}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        const cachedSummary = await cacheService.get<WeeklySummary>('analytics', cacheKey);
        if (cachedSummary) {
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
          return cachedSummary;
        }
      }
      
      throw error;
    }
  }

  /**
   * Ottiene il riepilogo mensile
   */
  async getMonthlySummary(month: number, year: number): Promise<MonthlySummary> {
    const cacheKey = `monthly_summary_${year}_${month}`;
    
    try {
      const response = await api.get<MonthlySummary>(`/analytics/monthly/${year}/${month}`);
      const summary = response.data;
      
      await cacheService.set('analytics', cacheKey, summary, this.CACHE_TTL * 5);
      
      return summary;
    } catch (error: any) {
      console.error(`Errore nel recupero riepilogo mensile ${year}/${month}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        const cachedSummary = await cacheService.get<MonthlySummary>('analytics', cacheKey);
        if (cachedSummary) {
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
          return cachedSummary;
        }
      }
      
      throw error;
    }
  }

  /**
   * Ottiene metriche di performance
   */
  async getPerformanceMetrics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<PerformanceMetrics> {
    const cacheKey = `performance_${period}`;
    
    try {
      const response = await api.get<PerformanceMetrics>(`/analytics/performance/${period}`);
      const metrics = response.data;
      
      await cacheService.set('analytics', cacheKey, metrics, this.CACHE_TTL);
      
      return metrics;
    } catch (error: any) {
      console.error(`Errore nel recupero metriche performance ${period}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        const cachedMetrics = await cacheService.get<PerformanceMetrics>('analytics', cacheKey);
        if (cachedMetrics) {
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
          return cachedMetrics;
        }
      }
      
      throw error;
    }
  }

  /**
   * Ottiene dati di trend per grafici
   */
  async getTrendData(
    metric: 'orders' | 'revenue' | 'clients' | 'satisfaction',
    period: 'week' | 'month' | 'quarter',
    startDate: string,
    endDate: string
  ): Promise<TrendData[]> {
    const cacheKey = `trend_${metric}_${period}_${startDate}_${endDate}`;
    
    try {
      const response = await api.get<TrendData[]>('/analytics/trends', {
        params: { metric, period, startDate, endDate }
      });
      const trendData = response.data;
      
      await cacheService.set('analytics', cacheKey, trendData, this.CACHE_TTL);
      
      return trendData;
    } catch (error: any) {
      console.error(`Errore nel recupero trend ${metric}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        const cachedTrend = await cacheService.get<TrendData[]>('analytics', cacheKey);
        if (cachedTrend) {
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
          return cachedTrend;
        }
      }
      
      throw error;
    }
  }

  /**
   * Ottiene statistiche dashboard in tempo reale
   */
  async getDashboardStats(): Promise<any> {
    const cacheKey = 'dashboard_stats';
    
    try {
      const response = await api.get('/analytics/dashboard');
      const stats = response.data;
      
      await cacheService.set('analytics', cacheKey, stats, 60000); // 1 minuto per dashboard
      
      return stats;
    } catch (error: any) {
      console.error('Errore nel recupero statistiche dashboard:', error);
      
      if (error.code === 'ERR_NETWORK') {
        const cachedStats = await cacheService.get<any>('analytics', cacheKey);
        if (cachedStats) {
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
          return cachedStats;
        }
      }
      
      throw error;
    }
  }

  /**
   * Calcola il riepilogo giornaliero dai dati in cache
   * Utilizzato come fallback quando l'API non è disponibile
   */
  private async calculateTodaySummaryFromCache(date: string): Promise<DailySummary | null> {
    try {
      // Recupera ordini dal cache
      const cachedOrders = await cacheService.get<any[]>('orders', 'all');
      if (!cachedOrders) {
        return null;
      }

      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Filtra ordini per la data target
      const todayOrders = cachedOrders.filter((order: any) => {
        const orderDate = new Date(order.updatedAt);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });

      // Calcola statistiche di base
      const ordersCompleted = todayOrders.filter((order: any) => order.status === 'Completato').length;
      const deliveriesDue = todayOrders.filter((order: any) => {
        const deliveryDate = new Date(order.estimatedDelivery || order.endDate);
        return deliveryDate.toDateString() === targetDate.toDateString();
      }).length;
      const delays = todayOrders.filter((order: any) => {
        const endDate = new Date(order.endDate);
        return endDate < new Date() && order.status !== 'Completato';
      }).length;
      const newOrders = todayOrders.filter((order: any) => {
        const createdDate = new Date(order.createdAt);
        return createdDate >= startOfDay && createdDate <= endOfDay;
      }).length;
      const revenue = todayOrders
        .filter((order: any) => order.status === 'Completato')
        .reduce((sum: number, order: any) => sum + (order.amount || 0), 0);
      const activeProjects = todayOrders.filter((order: any) => order.status === 'In Corso').length;
      const urgentTasks = todayOrders.filter((order: any) => order.priority === 'Urgente').length;

      return {
        date,
        ordersCompleted,
        deliveriesDue,
        delays,
        newOrders,
        revenue,
        activeProjects,
        urgentTasks,
        clientsContacted: 0, // Non calcolabile dal cache ordini
        materials: {
          lowStock: 0, // Richiederebbe dati materiali
          outOfStock: 0,
        },
      };
    } catch (error) {
      console.error('Errore nel calcolo riepilogo da cache:', error);
      return null;
    }
  }

  /**
   * Ottiene l'inizio della settimana per una data
   */
  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunedì come primo giorno
    const weekStart = new Date(d.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  /**
   * Pulisce tutto il cache analytics
   */
  async clearCache(): Promise<void> {
    try {
      await cacheService.clear('analytics');
      console.log('Cache analytics pulito');
    } catch (error) {
      console.error('Errore nella pulizia cache analytics:', error);
    }
  }
}

// Istanza singleton del servizio analytics
export const analyticsService = new AnalyticsService();
export default analyticsService;