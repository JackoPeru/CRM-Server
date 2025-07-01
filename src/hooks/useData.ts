import { useClients } from './useClients';
import { useOrders } from './useOrders';
import { useMaterials } from './useMaterials';
import { useAuth } from './useAuth';
import { useAnalytics } from './useAnalytics';

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

  return {
    // Dati utente
    user: auth.currentUser,
    isAuthenticated: auth.isAuthenticated,
    updateUser: auth.updateProfile,
    
    // Clienti
    customers: clients.clients,
    customersLoading: clients.loading,
    addCustomer: clients.addClient,
    updateCustomer: clients.updateClient,
    deleteCustomer: clients.removeClient,
    
    // Progetti (ordini)
    projects: orders.orders,
    projectsLoading: orders.loading,
    addProject: orders.addOrder,
    updateProject: orders.updateOrder,
    deleteProject: orders.removeOrder,
    
    // Materiali
    materials: materials.materials,
    materialsLoading: materials.loading,
    addMaterial: materials.addMaterial,
    updateMaterial: materials.updateMaterial,
    deleteMaterial: materials.removeMaterial,
    
    // Preventivi (subset di ordini con status 'Preventivo')
    quotes: orders.orders.filter(order => order.status === 'Preventivo'),
    quotesLoading: orders.loading,
    addQuote: (quoteData: any) => orders.addOrder({ ...quoteData, status: 'Preventivo' }),
    updateQuote: orders.updateOrder,
    deleteQuote: orders.removeOrder,
    
    // Fatture (subset di ordini completati - potrebbero essere fatturati)
    invoices: orders.orders.filter(order => order.status === 'Completato'),
    invoicesLoading: orders.loading,
    addInvoice: (invoiceData: any) => orders.addOrder({ ...invoiceData, status: 'Completato' }),
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
      user: auth.currentUser,
      customers: clients.clients,
      projects: orders.orders,
      materials: materials.materials,
      quotes: orders.orders.filter(order => order.status === 'Preventivo'),
      invoices: orders.orders.filter(order => order.status === 'Completato'),
    }
  };
};

export default useData;