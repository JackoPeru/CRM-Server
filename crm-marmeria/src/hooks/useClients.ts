import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector, selectAllClients, selectClientsLoading, selectClientsError, selectSelectedClient, selectClientsPagination, selectClientsFilters, selectClientsStats } from '../store';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient as removeClientAction,
  searchClients,
  fetchClientsStats,
  setClientsFilters,
  setClientsPagination,
  clearClientsError,
} from '../store/slices/clientsSlice';
import type { Client, ClientsFilters } from '../store/slices/clientsSlice';

/**
 * Hook personalizzato per gestire i clienti
 * Fornisce metodi CRUD e stato per la gestione dei clienti
 */
export const useClients = () => {
  const dispatch = useAppDispatch();
  const clients = useAppSelector(selectAllClients);
  const loading = useAppSelector(selectClientsLoading);
  const error = useAppSelector(selectClientsError);
  const pagination = useAppSelector(selectClientsPagination);
  const filters = useAppSelector(selectClientsFilters);
  const stats = useAppSelector(selectClientsStats);

  // Carica i clienti all'avvio
  useEffect(() => {
    console.log('🔍 [useClients] useEffect iniziale - caricamento dati clienti');
    dispatch(fetchClients());
    dispatch(fetchClientsStats());
  }, [dispatch]);

  /**
   * Ricarica i clienti con i filtri correnti
   */
  const refetch = useCallback(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  /**
   * Aggiunge un nuovo cliente
   */
  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('➕ [useClients] Aggiunta cliente:', clientData.name);
    const result = await dispatch(createClient(clientData));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useClients] Cliente aggiunto con successo');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchClients());
      // dispatch(fetchClientsStats());
      return true;
    }
    console.log('❌ [useClients] Errore aggiunta cliente');
    return false;
  }, [dispatch]);

  /**
   * Aggiorna un cliente esistente
   */
  const updateClientData = useCallback(async (id: string, clientData: Partial<Client>) => {
    console.log('✏️ [useClients] Aggiornamento cliente:', id);
    const result = await dispatch(updateClient({ id, data: clientData }));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useClients] Cliente aggiornato con successo');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchClients());
      // dispatch(fetchClientsStats());
      return true;
    }
    console.log('❌ [useClients] Errore aggiornamento cliente');
    return false;
  }, [dispatch]);

  /**
   * Elimina un cliente
   */
  const removeClient = useCallback(async (id: string) => {
    console.log('🗑️ [useClients] Eliminazione cliente:', id);
    const result = await dispatch(removeClientAction(id));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useClients] Cliente eliminato con successo');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchClients());
      // dispatch(fetchClientsStats());
      return true;
    }
    console.log('❌ [useClients] Errore eliminazione cliente');
    return false;
  }, [dispatch]);

  /**
   * Cerca clienti
   */
  const searchClientData = useCallback(async (query: string) => {
    const result = await dispatch(searchClients(query));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);

  /**
   * Imposta i filtri per i clienti
   */
  const setFilter = useCallback((filter: Partial<ClientsFilters>) => {
    console.log('🔍 [useClients] Impostazione filtri:', filter);
    dispatch(setClientsFilters(filter));
    // PROBLEMA: Questa chiamata può causare troppe richieste API
    // dispatch(fetchClients());
  }, [dispatch]);

  /**
   * Cambia pagina
   */
  const setPage = useCallback((page: number) => {
    dispatch(setClientsPagination({ page }));
    dispatch(fetchClients());
  }, [dispatch]);

  /**
   * Pulisce gli errori
   */
  const clearError = useCallback(() => {
    dispatch(clearClientsError());
  }, [dispatch]);

  /**
   * Trova un cliente per ID
   */
  const getClientById = useCallback((id: string) => {
    return clients.find(client => client.id === id);
  }, [clients]);

  return {
    // Stato
    clients,
    loading,
    error,
    pagination,
    filters,
    stats,
    
    // Azioni
    refetch,
    addClient,
    updateClient: updateClientData,
    removeClient,
    searchClients: searchClientData,
    setFilter,
    setPage,
    clearError,
    getClientById,
  };
};

export default useClients;