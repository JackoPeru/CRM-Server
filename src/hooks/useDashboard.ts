import { useMemo, useCallback } from 'react';
import { useAppSelector } from '../store';
import { useClients } from './useClients';
import { useOrders } from './useOrders';
import { useMaterials } from './useMaterials';
import { useAnalytics } from './useAnalytics';
import { useNetworkStatus } from '../contexts/NetworkStatusProvider';
import {
  selectDashboardData,
  selectVoiceBotData,
} from '../store';

/**
 * Hook personalizzato per il dashboard
 * Combina dati da clienti, ordini, materiali e analytics
 */
export const useDashboard = () => {
  const { networkStatus } = useNetworkStatus();
  
  // Hook per i singoli moduli
  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    stats: clientsStats,
  } = useClients();
  
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    stats: ordersStats,
  } = useOrders();
  
  const {
    materials,
    loading: materialsLoading,
    error: materialsError,
    stats: materialsStats,
  } = useMaterials();
  
  const {
    dailySummary,
    weeklySummary,
    monthlySummary,
    performanceMetrics,
    trendData,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics();

  // Selettori combinati dal store
  const dashboardData = useAppSelector(selectDashboardData);
  const voiceBotData = useAppSelector(selectVoiceBotData);

  // Stato di loading combinato
  const isLoading = clientsLoading || ordersLoading || materialsLoading || analyticsLoading;
  
  // Errori combinati
  const errors = {
    clients: clientsError,
    orders: ordersError,
    materials: materialsError,
    analytics: analyticsError,
  };
  
  const hasErrors = Object.values(errors).some(error => error !== null);

  /**
   * Ricarica tutti i dati del dashboard
   */
  const refetchAll = useCallback(() => {
    // Gli hook si ricaricano automaticamente tramite i loro useEffect
    // Non è necessario chiamare manualmente le funzioni di ricarica
    window.location.reload();
  }, []);

  const mainMetrics = useMemo(() => {
    return {
      totalClients: clients.length,
      totalOrders: orders.length,
      totalMaterials: materials.length,
      pendingOrders: orders.filter(order => order.status === 'In Attesa' || order.status === 'In Lavorazione').length,
      completedOrders: orders.filter(order => order.status === 'Completato').length,
      lowStockMaterials: materials.filter(material => 
        material.stockQuantity <= (material.minStockLevel || 10)
      ).length,
      recentClients: clients.filter(client => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(client.createdAt) >= oneWeekAgo;
      }).length,
    };
  }, [clients, orders, materials]);

  const recentOrders = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return orders
      .filter(order => new Date(order.createdAt) >= oneWeekAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [orders]);

  const lowStockMaterials = useMemo(() => {
    return materials
      .filter(material => material.stockQuantity <= (material.minStockLevel || 10))
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 10);
  }, [materials]);

  const topClients = useMemo(() => {
    const clientOrderCounts = clients.map(client => {
      const orderCount = orders.filter(order => order.clientId === client.id).length;
      return { ...client, orderCount };
    });
    
    return clientOrderCounts
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);
  }, [clients, orders]);

  const currentMonthRevenue = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear &&
               order.status === 'Completato';
      })
      .reduce((total, order) => total + (order.amount || 0), 0);
  }, [orders]);

  const alerts = useMemo(() => {
    const alerts = [];
    
    if (lowStockMaterials.length > 0) {
      alerts.push({
        type: 'warning' as const,
        title: 'Scorte basse',
        message: `${lowStockMaterials.length} materiali hanno scorte basse`,
        count: lowStockMaterials.length,
      });
    }
    
    const overdueOrders = orders.filter(order => {
      if (order.status === 'Completato') return false;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(order.createdAt) < thirtyDaysAgo;
    });
    
    if (overdueOrders.length > 0) {
      alerts.push({
        type: 'error' as const,
        title: 'Ordini in ritardo',
        message: `${overdueOrders.length} ordini sono in ritardo`,
        count: overdueOrders.length,
      });
    }
    
    if (!networkStatus.isOnline) {
      alerts.push({
        type: 'info' as const,
        title: 'Modalità offline',
        message: 'Stai lavorando offline. I dati potrebbero non essere aggiornati.',
        count: 0,
      });
    }
    
    return alerts;
  }, [lowStockMaterials, orders, networkStatus.isOnline]);

  return {
    // Dati grezzi
    clients,
    orders,
    materials,
    
    // Analytics
    dailySummary,
    weeklySummary,
    monthlySummary,
    performanceMetrics,
    trendData,
    
    // Statistiche
    clientsStats,
    ordersStats,
    materialsStats,
    
    // Dati combinati dal store
    dashboardData,
    voiceBotData,
    
    // Stato
    isLoading,
    errors,
    hasErrors,
    isOnline: networkStatus.isOnline,
    
    // Azioni
    refetchAll,
    
    // Metriche calcolate
    mainMetrics,
    recentOrders,
    lowStockMaterials,
    topClients,
    currentMonthRevenue,
    alerts,
  };
};

export default useDashboard;