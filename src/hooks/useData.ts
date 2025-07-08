import { useClients } from './useClients';
import { useOrders } from './useOrders';
import { useMaterials } from './useMaterials';
import { useAuth } from './useAuth';
import { useAnalytics } from './useAnalytics';
import { useMemo, useCallback } from 'react';

/**
 * Hook unificato per accedere a tutti i dati dell'applicazione
 * Combina tutti gli hook specifici per fornire un'interfaccia centralizzata
 */
export const useData = () => {
  const clients = useClients();
  const orders = useOrders();
  const materials = useMaterials();
  const auth = useAuth();
  const analytics = useAnalytics();

  // Stato di caricamento per ogni tipo di dato
  const loading = {
    clients: clients.loading,
    orders: orders.loading,
    materials: materials.loading,
    auth: auth.loading || false,
    analytics: analytics.loading
  };
  
  // Stato degli errori di permesso
  const permissionDenied = {
    clients: clients.permissionDenied || false,
    orders: false, // orders non ha la proprietà permissionDenied
    materials: false, // materials non ha la proprietà permissionDenied
    auth: false, // Assumiamo che auth non abbia errori di permesso
    analytics: false // analytics non ha la proprietà permissionDenied
  };
  
  // Stato degli errori
  const errors = {
    clients: clients.error,
    orders: orders.error,
    materials: materials.error,
    auth: auth.error,
    analytics: analytics.error
  };
  
  // Funzione per verificare se ci sono errori di permesso in qualsiasi parte dell'app
  const hasPermissionErrors = useMemo(() => {
    return (
      permissionDenied.clients || 
      permissionDenied.orders || 
      permissionDenied.materials || 
      permissionDenied.analytics
    );
  }, [permissionDenied]);
  
  // Funzione per pulire tutti gli errori
  const clearAllErrors = useCallback(() => {
    clients.clearError && clients.clearError();
    orders.clearError && orders.clearError();
    materials.clearError && materials.clearError();
    // analytics non ha il metodo clearError
    // Aggiungi altri metodi clearError se necessario
  }, [clients, orders, materials]);
  
  // Funzione per verificare i permessi prima di eseguire un'operazione
  const checkPermissions = useCallback((dataType: 'clients' | 'orders' | 'materials' | 'analytics') => {
    if (permissionDenied[dataType]) {
      // Mostra un messaggio di errore più evidente per problemi di permessi
      console.error(errors[dataType] || 'Non hai i permessi necessari per questa operazione');
      return false;
    }
    return true;
  }, [permissionDenied, errors]);

  return {
    // Dati utente
    currentUser: auth.currentUser,
    isAuthenticated: auth.isAuthenticated,
    
    // Clienti
    customers: clients.clients,
    customersLoading: clients.loading,
    addCustomer: clients.addClient,
    updateCustomer: clients.updateClient,
    deleteCustomer: clients.removeClient,
    
    // Progetti (ordini)
    projects: orders.orders.filter(order => order.type === 'project' || !order.type),
    projectsLoading: orders.loading,
    addProject: orders.addOrder,
    updateProject: orders.updateOrder,
    updateProjectStatus: orders.updateOrderStatus,
    deleteProject: orders.removeOrder,
    
    // Materiali
    materials: materials.materials,
    materialsLoading: materials.loading,
    addMaterial: materials.addMaterial,
    updateMaterial: materials.updateMaterial,
    deleteMaterial: materials.removeMaterial,
    
    // Preventivi (subset di ordini con tipo 'quote')
    quotes: orders.orders.filter(order => order.type === 'quote'),
    quotesLoading: orders.loading,
    addQuote: (quoteData: any) => orders.addOrder({ ...quoteData, type: 'quote' }),
    updateQuote: orders.updateOrder,
    deleteQuote: orders.removeOrder,
    
    // Fatture (subset di ordini con tipo 'invoice')
    invoices: orders.orders.filter(order => order.type === 'invoice'),
    invoicesLoading: orders.loading,
    addInvoice: (invoiceData: any) => orders.addOrder({ ...invoiceData, type: 'invoice' }),
    updateInvoice: orders.updateOrder,
    deleteInvoice: orders.removeOrder,
    
    // Analytics e statistiche
    analytics: {
      dailySummary: analytics.dailySummary,
      weeklySummary: analytics.weeklySummary,
      monthlySummary: analytics.monthlySummary,
      performanceMetrics: analytics.performanceMetrics,
      trendData: analytics.trendData
    },
    analyticsLoading: analytics.loading,
    
    // Stato generale
    dataState: {
      currentUser: auth.currentUser,
      customers: clients.clients,
      projects: orders.orders.filter(order => order.type === 'project' || !order.type),
      materials: materials.materials,
      quotes: orders.orders.filter(order => order.type === 'quote'),
      invoices: orders.orders.filter(order => order.type === 'invoice'),
    },
    
    // Gestione errori e permessi
    loading,
    errors,
    clearAllErrors,
    permissionDenied,
    hasPermissionErrors,
    checkPermissions
  };
};

export default useData;
