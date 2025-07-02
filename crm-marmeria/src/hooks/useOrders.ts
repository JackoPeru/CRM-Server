import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector, selectAllOrders, selectOrdersLoading, selectOrdersError, selectSelectedOrder, selectOrdersPagination, selectOrdersFilters, selectOrdersStats, selectVoiceBotOrderStatus } from '../store';
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
    console.log('🔍 [useOrders] useEffect iniziale - caricamento dati ordini');
    dispatch(fetchOrders());
    dispatch(fetchOrdersStats());
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
    console.log('➕ [useOrders] Aggiunta ordine:', orderData.title);
    const result = await dispatch(createOrder(orderData));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useOrders] Ordine aggiunto con successo');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchOrders());
      // dispatch(fetchOrdersStats());
      return true;
    }
    console.log('❌ [useOrders] Errore aggiunta ordine');
    return false;
  }, [dispatch]);

  /**
   * Aggiorna un ordine esistente
   */
  const updateOrderData = useCallback(async (id: string, orderData: Partial<Order>) => {
    console.log('✏️ [useOrders] Aggiornamento ordine:', id);
    const result = await dispatch(updateOrder({ id, data: orderData }));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useOrders] Ordine aggiornato con successo');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchOrders());
      // dispatch(fetchOrdersStats());
      return true;
    }
    console.log('❌ [useOrders] Errore aggiornamento ordine');
    return false;
  }, [dispatch]);

  /**
   * Elimina un ordine
   */
  const removeOrder = useCallback(async (id: string) => {
    console.log('🗑️ [useOrders] Eliminazione ordine:', id);
    const result = await dispatch(removeOrderAction(id));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useOrders] Ordine eliminato con successo');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchOrders());
      // dispatch(fetchOrdersStats());
      return true;
    }
    console.log('❌ [useOrders] Errore eliminazione ordine');
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
    console.log('🔍 [useOrders] Impostazione filtri:', filter);
    dispatch(setOrdersFilters(filter));
    // PROBLEMA: Questa chiamata può causare troppe richieste API
    // dispatch(fetchOrders());
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
    return orders.find(order => order.id === id);
  }, [orders]);

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