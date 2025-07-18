import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector, selectAllClients, selectClientsLoading, selectClientsError, selectSelectedClient, selectClientsPagination, selectClientsFilters, selectClientsStats } from '../store';
import { selectClientById } from '../store/slices/clientsSlice';
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
  const permissionDenied = useAppSelector(state => state.clients.permissionDenied);

  // Carica i clienti all'avvio
  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchClientsStats());
  }, [dispatch]);

  // Listener per aggiornamenti dati dall'AI Assistant
  useEffect(() => {
    const handleAIDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, action, data } = customEvent.detail;
      console.log('useClients: Ricevuto aggiornamento AI:', { type, action, data });
      
      if (type === 'clients') {
        // Ricarica i dati dei clienti
        dispatch(fetchClients());
        dispatch(fetchClientsStats());
      }
    };

    window.addEventListener('ai-data-updated', handleAIDataUpdate);
    
    return () => {
      window.removeEventListener('ai-data-updated', handleAIDataUpdate);
    };
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
    const result = await dispatch(createClient(clientData));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'aggiunta
      dispatch(fetchClients());
      dispatch(fetchClientsStats());
      return true;
    }
    return false;
  }, [dispatch]);

  /**
   * Aggiorna un cliente esistente
   */
  const updateClientData = useCallback(async (id: string, clientData: Partial<Client>) => {
    const result = await dispatch(updateClient({ id, data: clientData }));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'aggiornamento
      dispatch(fetchClients());
      dispatch(fetchClientsStats());
      return true;
    }
    return false;
  }, [dispatch]);

  /**
   * Elimina un cliente
   */
  const removeClient = useCallback(async (id: string) => {
    const result = await dispatch(removeClientAction(id));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'eliminazione
      dispatch(fetchClients());
      dispatch(fetchClientsStats());
      return true;
    }
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
    dispatch(setClientsFilters(filter));
    // Ricarica i dati con i nuovi filtri
    dispatch(fetchClients());
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
    return useAppSelector(state => selectClientById(id)(state));
  }, []);

  // Funzione per verificare se l'utente ha i permessi necessari
  const checkPermission = useCallback(() => {
    if (permissionDenied) {
      // Mostra un messaggio di errore più evidente per problemi di permessi
      return false;
    }
    return true;
  }, [permissionDenied]);

  return {
    // Stato
    clients,
    loading,
    error,
    pagination,
    filters,
    stats,
    permissionDenied,
    
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
    checkPermission
  };
};

export default useClients;