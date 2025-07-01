// Hook per l'autenticazione
export { useAuth } from './useAuth';

// Hook per i clienti
export { useClients } from './useClients';

// Hook per gli ordini
export { useOrders } from './useOrders';

// Hook per i materiali
export { useMaterials } from './useMaterials';

// Hook per gli analytics
export { useAnalytics } from './useAnalytics';

// Hook per l'UI
export { default as useUI } from './useUI';

// Hook unificato per i dati
export { useData } from './useData';

// Hook per il dashboard
export { useDashboard } from './useDashboard';

// Hook legacy rimossi - non più disponibili

// Re-export dei tipi principali per comodità
export type { LoginCredentials, User } from '../store/slices/authSlice';
export type { Client, ClientsFilters } from '../store/slices/clientsSlice';
export type { Order, OrdersFilters } from '../store/slices/ordersSlice';
export type { Material, MaterialsFilters } from '../store/slices/materialsSlice';
export type { AnalyticsFilters } from '../store/slices/analyticsSlice';
export type { 
  Toast, 
  Modal, 
  SidebarState, 
  TableState,
  NotificationSettings
} from '../store/slices/uiSlice';