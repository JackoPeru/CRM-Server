import { useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { useError } from '../context/ErrorContext';
import {
  setTheme,
  addToast,
  removeToast,
  clearAllToasts,
  openModal,
  closeModal,
  closeAllModals,
  setSidebarOpen,
  toggleSidebar,
  updateTableState,
  setGlobalLoading,
  setOnlineStatus,
  updatePreferences,
  setGlobalSearchQuery,
  setBreadcrumb,
  selectTheme,
  selectToasts,
  selectModals,
  selectSidebar,
  selectTables,
  selectGlobalLoading,
  selectIsOnline,
  selectPreferences,
  selectGlobalSearch,
  selectBreadcrumb
} from '../store/slices/uiSlice';
import type { 
  Toast,
  Modal
} from '../store/slices/uiSlice';

type AppTheme = 'light' | 'dark';
type NotificationData = Omit<Toast, 'id'>;
type ModalData = Omit<Modal, 'isOpen'>;
type NetworkStatus = boolean;
type UserPreferences = Record<string, any>;
type BreadcrumbItem = { label: string; href?: string; };

/**
 * Hook personalizzato per gestire lo stato dell'UI
 * Fornisce metodi per gestire tema, notifiche, modali, sidebar, tabelle e altro
 */
const useUI = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const notifications = useAppSelector(selectToasts);
  const modals = useAppSelector(selectModals);
  const sidebar = useAppSelector(selectSidebar);
  const tables = useAppSelector(selectTables);
  const globalLoading = useAppSelector(selectGlobalLoading);
  const networkStatus = useAppSelector(selectIsOnline);
  const userPreferences = useAppSelector(selectPreferences);
  const globalSearch = useAppSelector(selectGlobalSearch);
  const breadcrumbs = useAppSelector(selectBreadcrumb);
  
  // Integrazione con ErrorContext
  const errorContext = useError();

  // Carica il tema e le preferenze da localStorage all'avvio
  useEffect(() => {
    const savedTheme = localStorage.getItem('crm_theme');
    const savedPreferences = localStorage.getItem('crm_preferences');
    
    if (savedTheme) {
      dispatch(setTheme(savedTheme as AppTheme));
    }
    
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        dispatch(updatePreferences(parsedPreferences));
      } catch (error) {
        console.error('Errore nel parsing delle preferenze salvate:', error);
      }
    }
  }, [dispatch]);

  // Gestione tema
  const changeTheme = useCallback((newTheme: AppTheme) => {
    dispatch(setTheme(newTheme));
    localStorage.setItem('crm_theme', newTheme);
  }, [dispatch]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
    localStorage.setItem('crm_theme', newTheme);
  }, [dispatch, theme]);

  // Gestione notifiche
  const showNotification = useCallback((notification: NotificationData) => {
    dispatch(addToast(notification));
  }, [dispatch]);

  const hideNotification = useCallback((id: string) => {
    dispatch(removeToast(id));
  }, [dispatch]);

  const clearAllNotifications = useCallback(() => {
    dispatch(clearAllToasts());
  }, [dispatch]);
  
  // Gestione errori integrata con ErrorContext
  const showError = useCallback((error: { type?: 'general' | 'permission' | 'network' | 'validation'; message: string; retryAction?: () => void; autoClose?: boolean; timeout?: number }) => {
    return errorContext.addError({
      type: error.type || 'general',
      message: error.message,
      retryAction: error.retryAction,
      autoClose: error.autoClose !== undefined ? error.autoClose : true,
      timeout: error.timeout || 5000
    });
  }, [errorContext]);
  
  const showPermissionError = useCallback((message: string) => {
    errorContext.handlePermissionError(message);
  }, [errorContext]);
  
  const showNetworkError = useCallback((message: string) => {
    errorContext.handleNetworkError(message);
  }, [errorContext]);
  
  const clearAllErrors = useCallback(() => {
    errorContext.clearAllErrors();
  }, [errorContext]);

  // Gestione modali
  const showModal = useCallback((modal: ModalData) => {
    dispatch(openModal(modal));
  }, [dispatch]);

  const hideModal = useCallback((id: string) => {
    dispatch(closeModal(id));
  }, [dispatch]);

  const hideAllModals = useCallback(() => {
    dispatch(closeAllModals());
  }, [dispatch]);

  // Gestione sidebar
  const openSidebar = useCallback(() => {
    dispatch(setSidebarOpen(true));
  }, [dispatch]);

  const closeSidebar = useCallback(() => {
    dispatch(setSidebarOpen(false));
  }, [dispatch]);

  const toggleSidebarState = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  // Gestione tabelle
  const updateTableSort = useCallback((tableId: string, sort: { sortBy: string; sortOrder: 'asc' | 'desc' }) => {
    dispatch(updateTableState({ tableId, updates: sort }));
  }, [dispatch]);

  const updateTableFilter = useCallback((tableId: string, filter: { filters: Record<string, any> }) => {
    dispatch(updateTableState({ tableId, updates: filter }));
  }, [dispatch]);

  const updateTablePage = useCallback((tableId: string, page: number) => {
    dispatch(updateTableState({ tableId, updates: { currentPage: page } }));
  }, [dispatch]);

  // Funzioni di compatibilità per i filtri delle tabelle
  const setTableFilter = useCallback((tableId: string, filters: Record<string, any>) => {
    dispatch(updateTableState({ tableId, updates: { filters } }));
  }, [dispatch]);

  // Utilità per ottenere dati specifici di tabelle
  const getTableState = useCallback((tableId: string) => {
    return tables[tableId] || {
      sortBy: '',
      sortOrder: 'asc',
      filters: {},
      selectedRows: [],
      pageSize: 25,
      currentPage: 1,
    };
  }, [tables]);

  // Getter per i filtri delle tabelle (memoizzato per evitare re-render)
  const tableFilters = useMemo(() => ({
    customers: getTableState('customers').filters || {},
    materials: getTableState('materials').filters || {},
    invoices: getTableState('invoices').filters || {},
    orders: getTableState('orders').filters || {}
  }), [getTableState]);

  // Gestione loading globale
  const setLoading = useCallback((loading: boolean) => {
    dispatch(setGlobalLoading({ loading }));
  }, [dispatch]);

  // Gestione stato di rete
  const updateNetworkStatus = useCallback((status: NetworkStatus) => {
    dispatch(setOnlineStatus(status));
  }, [dispatch]);

  // Gestione preferenze utente
  const updateUserPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    dispatch(updatePreferences(preferences));
    
    // Salva le preferenze aggiornate in localStorage
    const currentPreferences = userPreferences;
    const updatedPreferences = { ...currentPreferences, ...preferences };
    localStorage.setItem('crm_preferences', JSON.stringify(updatedPreferences));
  }, [dispatch, userPreferences]);

  // Gestione ricerca globale
  const updateGlobalSearch = useCallback((query: string) => {
    dispatch(setGlobalSearchQuery(query));
  }, [dispatch]);

  // Gestione breadcrumbs
  const updateBreadcrumbs = useCallback((breadcrumbs: BreadcrumbItem[]) => {
    dispatch(setBreadcrumb(breadcrumbs.map(item => ({
      label: item.label,
      path: item.href || '',
      icon: undefined
    }))));
  }, [dispatch]);

  // Utilità per verificare se un modale è aperto
  const isModalOpen = useCallback((modalId: string) => {
    return modals.some(modal => modal.id === modalId && modal.isOpen);
  }, [modals]);

  // Utilità per ottenere un modale specifico
  const getModal = useCallback((modalId: string) => {
    return modals.find(modal => modal.id === modalId);
  }, [modals]);

  return {
    // Stato
    theme,
    notifications,
    modals,
    sidebar,
    tables,
    globalLoading,
    networkStatus,
    userPreferences,
    globalSearch,
    breadcrumbs,
    
    // Azioni tema
    changeTheme,
    toggleTheme,
    
    // Azioni notifiche
    showNotification,
    hideNotification,
    clearAllNotifications,
    
    // Gestione errori
    showError,
    showPermissionError,
    showNetworkError,
    clearAllErrors,
    errors: errorContext.errors,
    
    // Azioni modali
    showModal,
    hideModal,
    hideAllModals,
    openModal: showModal,
    
    // Azioni sidebar
    openSidebar,
    closeSidebar,
    toggleSidebar: toggleSidebarState,
    
    // Azioni tabelle
    updateTableSort,
    updateTableFilter,
    updateTablePage,
    setTableFilter,
    tableFilters,
    
    // Azioni loading
    setLoading,
    
    // Azioni rete
    updateNetworkStatus,
    
    // Azioni preferenze
    updatePreferences: updateUserPreferences,
    
    // Azioni ricerca
    updateGlobalSearch,
    
    // Azioni breadcrumbs
    updateBreadcrumbs,
    setBreadcrumbs: updateBreadcrumbs,
    
    // Utilità
    getTableState,
    isModalOpen,
    getModal,
    
    // Alias per compatibilità
    showAlert: showError,
  };
};

export default useUI;