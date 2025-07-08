import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector, selectAllOrders, selectOrdersLoading, selectOrdersError, selectSelectedOrder, selectOrdersPagination, selectOrdersFilters, selectOrdersStats, selectVoiceBotOrderStatus } from '../store';
import { selectOrderById } from '../store/slices/ordersSlice';
import {
  fetchOrders,
  createOrder,
  updateOrder,
  deleteOrder as removeOrderAction,
  searchOrders,
  fetchOrdersStats,
  fetchOrderStatusForVoiceBot,
  setOrdersFilters,
  setOrdersPagination,
  clearOrdersError,
} from '../store/slices/ordersSlice';
import type { Order, OrdersFilters } from '../store/slices/ordersSlice';
import { ordersService } from '../services/orders';

/**
 * Hook personalizzato per gestire gli ordini
 * Fornisce metodi CRUD e stato per la gestione degli ordini
 */
export const useOrders = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectAllOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const pagination = useAppSelector(selectOrdersPagination);
  const filters = useAppSelector(selectOrdersFilters);
  const stats = useAppSelector(selectOrdersStats);
  const voiceBotOrderStatus = useAppSelector(selectVoiceBotOrderStatus);

  // Carica gli ordini all'avvio
  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchOrdersStats());
  }, [dispatch]);

  // Listener per aggiornamenti dati dall'AI Assistant
  useEffect(() => {
    const handleAIDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, action, data } = customEvent.detail;
      console.log('useOrders: Ricevuto aggiornamento AI:', { type, action, data });
      
      if (type === 'quotes' || type === 'projects' || type === 'orders' || type === 'invoices') {
        // Ricarica i dati degli ordini/preventivi/fatture
        dispatch(fetchOrders());
        dispatch(fetchOrdersStats());
      }
    };

    window.addEventListener('ai-data-updated', handleAIDataUpdate);
    
    return () => {
      window.removeEventListener('ai-data-updated', handleAIDataUpdate);
    };
  }, [dispatch]);

  /**
   * Ricarica gli ordini con i filtri correnti
   */
  const refetch = useCallback(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  /**
   * Aggiunge un nuovo ordine
   */
  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await dispatch(createOrder(orderData));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'aggiunta
      dispatch(fetchOrders());
      dispatch(fetchOrdersStats());
      return result.payload; // Restituisce il progetto/ordine creato
    }
    return null;
  }, [dispatch]);

  /**
   * Aggiorna un ordine esistente
   */
  const updateOrderData = useCallback(async (id: string, orderData: Partial<Order>) => {
    const result = await dispatch(updateOrder({ id, data: orderData }));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'aggiornamento
      dispatch(fetchOrders());
      dispatch(fetchOrdersStats());
      return true;
    }
    return false;
  }, [dispatch]);

  /**
   * Aggiorna solo lo stato di un ordine/progetto
   */
  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    try {
      await ordersService.updateOrderStatus(id, status);
      // Ricarica la lista dopo l'aggiornamento
      dispatch(fetchOrders());
      dispatch(fetchOrdersStats());
      return true;
    } catch (error) {
      console.error('Errore nell\'aggiornamento stato:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Elimina un ordine
   */
  const removeOrder = useCallback(async (id: string) => {
    const result = await dispatch(removeOrderAction(id));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'eliminazione
      dispatch(fetchOrders());
      dispatch(fetchOrdersStats());
      return true;
    }
    return false;
  }, [dispatch]);

  /**
   * Cerca ordini
   */
  const searchOrderData = useCallback(async (query: string) => {
    const result = await dispatch(searchOrders(query));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);

  /**
   * Ottiene lo stato di un ordine per il voice-bot
   */
  const getOrderStatusForVoiceBot = useCallback(async (orderId: string) => {
    const result = await dispatch(fetchOrderStatusForVoiceBot(orderId));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);

  /**
   * Imposta i filtri per gli ordini
   */
  const setFilter = useCallback((filter: Partial<OrdersFilters>) => {
    dispatch(setOrdersFilters(filter));
    // Ricarica i dati con i nuovi filtri
    dispatch(fetchOrders());
  }, [dispatch]);

  /**
   * Cambia pagina
   */
  const setPage = useCallback((page: number) => {
    dispatch(setOrdersPagination({ page }));
    dispatch(fetchOrders());
  }, [dispatch]);

  /**
   * Pulisce gli errori
   */
  const clearError = useCallback(() => {
    dispatch(clearOrdersError());
  }, [dispatch]);

  /**
   * Trova un ordine per ID
   */
  const getOrderById = useCallback((id: string) => {
    return useAppSelector(state => selectOrderById(id)(state));
  }, []);

  return {
    // Stato
    orders,
    loading,
    error,
    pagination,
    filters,
    stats,
    voiceBotOrderStatus,
    
    // Azioni
    refetch,
    addOrder,
    updateOrder: updateOrderData,
    updateOrderStatus,
    removeOrder,
    searchOrders: searchOrderData,
    getOrderStatusForVoiceBot,
    setFilter,
    setPage,
    clearError,
    getOrderById,
  };
};

export default useOrders;