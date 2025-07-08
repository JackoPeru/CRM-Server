/**
 * Redux Slice per la gestione dei clienti
 * Sostituisce la gestione SQLite locale con chiamate API
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import clientsService from '../../services/clients';
import type { Client, CreateClientRequest } from '../../services/clients';

// Interfacce per lo stato
interface ClientsFilters {
  searchTerm: string;
  type: 'Azienda' | 'Privato' | '';
  sortBy: keyof Client | '';
  sortOrder: 'asc' | 'desc';
}

interface ClientsState {
  items: Client[];
  selectedClient: Client | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  filters: ClientsFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    byType: Record<string, number>;
    recentlyAdded: number;
  } | null;
  lastFetch: number | null;
}

// Stato iniziale
const initialState: ClientsState = {
  items: [],
  selectedClient: null,
  loading: false,
  error: null,
  permissionDenied: false,
  filters: {
    searchTerm: '',
    type: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
  stats: null,
  lastFetch: null,
};

// Async Thunks

/**
 * Carica tutti i clienti
 */
export const fetchClients = createAsyncThunk<
  Client[],
  void,
  { rejectValue: any }
>(
  'clients/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const clients = await clientsService.getClients();
      return clients;
    } catch (error: any) {
      // Gestione specifica per errori di permesso
      if (error.permissionDenied) {
        return rejectWithValue({
          message: error.permissionMessage || 'Non hai i permessi per visualizzare i clienti',
          permissionDenied: true
        });
      }
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento clienti';
      return rejectWithValue({ message });
    }
  }
);

/**
 * Carica un cliente specifico
 */
export const fetchClient = createAsyncThunk<
  Client,
  string,
  { rejectValue: any }
>(
  'clients/fetchClient',
  async (clientId, { rejectWithValue }) => {
    try {
      const client = await clientsService.getClient(clientId);
      return client;
    } catch (error: any) {
      // Gestione specifica per errori di permesso
      if (error.permissionDenied) {
        return rejectWithValue({
          message: error.permissionMessage || 'Non hai i permessi per visualizzare questo cliente',
          permissionDenied: true
        });
      }
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento cliente';
      return rejectWithValue({ message });
    }
  }
);

/**
 * Crea un nuovo cliente
 */
export const createClient = createAsyncThunk<
  Client,
  CreateClientRequest,
  { rejectValue: any }
>(
  'clients/createClient',
  async (clientData, { rejectWithValue }) => {
    try {
      const newClient = await clientsService.createClient(clientData);
      return newClient;
    } catch (error: any) {
      // Gestione specifica per errori di permesso
      if (error.permissionDenied) {
        return rejectWithValue({
          message: error.permissionMessage || 'Non hai i permessi per creare nuovi clienti',
          permissionDenied: true
        });
      }
      const message = error.response?.data?.message || error.message || 'Errore nella creazione cliente';
      return rejectWithValue({ message });
    }
  }
);

/**
 * Aggiorna un cliente esistente
 */
export const updateClient = createAsyncThunk<
  Client,
  { id: string; data: Partial<CreateClientRequest> },
  { rejectValue: any }
>(
  'clients/updateClient',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updatedClient = await clientsService.updateClient(id, data);
      return updatedClient;
    } catch (error: any) {
      // Gestione specifica per errori di permesso
      if (error.permissionDenied) {
        return rejectWithValue({
          message: error.permissionMessage || 'Non hai i permessi per modificare questo cliente',
          permissionDenied: true
        });
      }
      const message = error.response?.data?.message || error.message || 'Errore nell\'aggiornamento cliente';
      return rejectWithValue({ message });
    }
  }
);

/**
 * Elimina un cliente
 */
export const deleteClient = createAsyncThunk<
  string,
  string,
  { rejectValue: any }
>(
  'clients/deleteClient',
  async (clientId, { rejectWithValue }) => {
    try {
      await clientsService.deleteClient(clientId);
      return clientId;
    } catch (error: any) {
      // Gestione specifica per errori di permesso
      if (error.permissionDenied) {
        return rejectWithValue({
          message: error.permissionMessage || 'Non hai i permessi per eliminare questo cliente',
          permissionDenied: true
        });
      }
      const message = error.response?.data?.message || error.message || 'Errore nell\'eliminazione cliente';
      return rejectWithValue({ message });
    }
  }
);

/**
 * Cerca clienti
 */
export const searchClients = createAsyncThunk<
  Client[],
  string,
  { rejectValue: any }
>(
  'clients/searchClients',
  async (query, { rejectWithValue }) => {
    try {
      const clients = await clientsService.searchClients(query);
      return clients;
    } catch (error: any) {
      // Gestione specifica per errori di permesso
      if (error.permissionDenied) {
        return rejectWithValue({
          message: error.permissionMessage || 'Non hai i permessi per cercare clienti',
          permissionDenied: true
        });
      }
      const message = error.response?.data?.message || error.message || 'Errore nella ricerca clienti';
      return rejectWithValue({ message });
    }
  }
);

/**
 * Carica statistiche clienti
 */
export const fetchClientsStats = createAsyncThunk<
  { total: number; byType: Record<string, number>; recentlyAdded: number },
  void,
  { rejectValue: any }
>(
  'clients/fetchClientsStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await clientsService.getClientsStats();
      return stats;
    } catch (error: any) {
      // Gestione specifica per errori di permesso
      if (error.permissionDenied) {
        return rejectWithValue({
          message: error.permissionMessage || 'Non hai i permessi per visualizzare le statistiche clienti',
          permissionDenied: true
        });
      }
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento statistiche';
      return rejectWithValue({ message });
    }
  }
);

// Slice
const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    /**
     * Pulisce gli errori
     */
    clearClientsError: (state) => {
      state.error = null;
      state.permissionDenied = false;
    },
    
    /**
     * Imposta il cliente selezionato
     */
    setSelectedClient: (state, action: PayloadAction<Client | null>) => {
      state.selectedClient = action.payload;
    },
    
    /**
     * Aggiorna i filtri
     */
    setClientsFilters: (state, action: PayloadAction<Partial<ClientsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    /**
     * Reset dei filtri
     */
    resetClientsFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    /**
     * Aggiorna la paginazione
     */
    setClientsPagination: (state, action: PayloadAction<Partial<ClientsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    /**
     * Aggiorna un cliente nello stato locale
     */
    updateClientInState: (state, action: PayloadAction<Client>) => {
      const index = state.items.findIndex(client => client.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      
      // Aggiorna anche il cliente selezionato se corrisponde
      if (state.selectedClient?.id === action.payload.id) {
        state.selectedClient = action.payload;
      }
    },
    
    /**
     * Rimuove un cliente dallo stato locale
     */
    removeClientFromState: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(client => client.id !== action.payload);
      
      // Pulisce il cliente selezionato se corrisponde
      if (state.selectedClient?.id === action.payload) {
        state.selectedClient = null;
      }
    },
    
    /**
     * Reset completo dello stato clienti
     */
    resetClientsState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Clients
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.pagination.total = action.payload.length;
        state.pagination.totalPages = Math.ceil(action.payload.length / state.pagination.limit);
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; permissionDenied?: boolean } || { message: 'Errore nel caricamento clienti' };
        state.error = payload.message;
        state.permissionDenied = !!payload.permissionDenied;
      });
    
    // Fetch Client
    builder
      .addCase(fetchClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClient.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClient = action.payload;
        
        // Aggiorna anche nella lista se presente
        const index = state.items.findIndex(client => client.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
        
        state.error = null;
      })
      .addCase(fetchClient.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; permissionDenied?: boolean } || { message: 'Errore nel caricamento cliente' };
        state.error = payload.message;
        state.permissionDenied = !!payload.permissionDenied;
      });
    
    // Create Client
    builder
      .addCase(createClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // Aggiunge in cima alla lista
        state.pagination.total += 1;
        state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
        state.error = null;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; permissionDenied?: boolean } || { message: 'Errore nella creazione cliente' };
        state.error = payload.message;
        state.permissionDenied = !!payload.permissionDenied;
      });
    
    // Update Client
    builder
      .addCase(updateClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.loading = false;
        
        // Aggiorna nella lista
        const index = state.items.findIndex(client => client.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        
        // Aggiorna il cliente selezionato se corrisponde
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
        
        state.error = null;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; permissionDenied?: boolean } || { message: 'Errore nell\'aggiornamento cliente' };
        state.error = payload.message;
        state.permissionDenied = !!payload.permissionDenied;
      });
    
    // Delete Client
    builder
      .addCase(deleteClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(client => client.id !== action.payload);
        state.pagination.total -= 1;
        state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
        
        // Pulisce il cliente selezionato se corrisponde
        if (state.selectedClient?.id === action.payload) {
          state.selectedClient = null;
        }
        
        state.error = null;
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; permissionDenied?: boolean } || { message: 'Errore nell\'eliminazione cliente' };
        state.error = payload.message;
        state.permissionDenied = !!payload.permissionDenied;
      });
    
    // Search Clients
    builder
      .addCase(searchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.loading = false;
        // Per la ricerca, sostituiamo temporaneamente la lista
        // In un'implementazione più complessa, potremmo avere uno stato separato per i risultati di ricerca
        state.items = action.payload;
        state.error = null;
      })
      .addCase(searchClients.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; permissionDenied?: boolean } || { message: 'Errore nella ricerca clienti' };
        state.error = payload.message;
        state.permissionDenied = !!payload.permissionDenied;
      });
    
    // Fetch Clients Stats
    builder
      .addCase(fetchClientsStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientsStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchClientsStats.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; permissionDenied?: boolean } || { message: 'Errore nel caricamento statistiche' };
        state.error = payload.message;
        // Non impostiamo permissionDenied per le statistiche, poiché è un errore meno critico
      });
  },
});

// Export actions
export const {
  clearClientsError,
  setSelectedClient,
  setClientsFilters,
  resetClientsFilters,
  setClientsPagination,
  updateClientInState,
  removeClientFromState,
  resetClientsState,
} = clientsSlice.actions;

// Export selectors
export const selectClients = (state: { clients: ClientsState }) => state.clients;
export const selectClientsItems = (state: { clients: ClientsState }) => state.clients.items;
export const selectSelectedClient = (state: { clients: ClientsState }) => state.clients.selectedClient;
export const selectClientsLoading = (state: { clients: ClientsState }) => state.clients.loading;
export const selectClientsError = (state: { clients: ClientsState }) => state.clients.error;
export const selectClientsFilters = (state: { clients: ClientsState }) => state.clients.filters;
export const selectClientsPagination = (state: { clients: ClientsState }) => state.clients.pagination;
export const selectClientsStats = (state: { clients: ClientsState }) => state.clients.stats;

// Export types
export type { ClientsFilters, ClientsState };
export type { Client } from '../../services/clients';

// Export reducer
export default clientsSlice.reducer;