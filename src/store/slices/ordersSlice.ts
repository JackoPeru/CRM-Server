/**
 * Redux Slice per la gestione degli ordini
 * Sostituisce la gestione SQLite locale con chiamate API
 * Include funzioni specifiche per il voice-bot
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ordersService, Order, CreateOrderRequest, OrderStatus } from '../../services/orders';

// Interfacce per lo stato
interface OrdersFilters {
  searchTerm: string;
  status: OrderStatus | '';
  clientId: string;
  dateFrom: string;
  dateTo: string;
  sortBy: keyof Order | '';
  sortOrder: 'asc' | 'desc';
}

interface OrdersState {
  items: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  filters: OrdersFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    byStatus: Record<Order['status'], number>;
    totalValue: number;
    pendingDeliveries: number;
  } | null;
  lastFetch: number | null;
  // Stato specifico per voice-bot
  voiceBotCache: {
    orderStatus: Record<string, any>;
    lastUpdate: number;
  };
}

// Stato iniziale
const initialState: OrdersState = {
  items: [],
  selectedOrder: null,
  loading: false,
  error: null,
  filters: {
    searchTerm: '',
    status: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
  stats: null,
  lastFetch: null,
  voiceBotCache: {
    orderStatus: {},
    lastUpdate: 0,
  },
};

// Async Thunks

/**
 * Carica tutti gli ordini
 */
export const fetchOrders = createAsyncThunk<
  Order[],
  void,
  { rejectValue: string }
>(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const orders = await ordersService.getOrders();
      return orders;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento ordini';
      return rejectWithValue(message);
    }
  }
);

/**
 * Carica un ordine specifico
 */
export const fetchOrder = createAsyncThunk<
  Order,
  string,
  { rejectValue: string }
>(
  'orders/fetchOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const order = await ordersService.getOrder(orderId);
      return order;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento ordine';
      return rejectWithValue(message);
    }
  }
);

/**
 * Crea un nuovo ordine
 */
export const createOrder = createAsyncThunk<
  Order,
  CreateOrderRequest,
  { rejectValue: string }
>(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const newOrder = await ordersService.createOrder(orderData);
      return newOrder;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nella creazione ordine';
      return rejectWithValue(message);
    }
  }
);

/**
 * Aggiorna un ordine esistente
 */
export const updateOrder = createAsyncThunk<
  Order,
  { id: string; data: Partial<CreateOrderRequest> },
  { rejectValue: string }
>(
  'orders/updateOrder',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updatedOrder = await ordersService.updateOrder(id, data);
      return updatedOrder;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nell\'aggiornamento ordine';
      return rejectWithValue(message);
    }
  }
);

/**
 * Aggiorna lo stato di un ordine
 */
export const updateOrderStatus = createAsyncThunk<
  Order,
  { id: string; status: Order['status'] },
  { rejectValue: string }
>(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const updatedOrder = await ordersService.updateOrderStatus(id, status);
      return updatedOrder;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nell\'aggiornamento stato ordine';
      return rejectWithValue(message);
    }
  }
);

/**
 * Elimina un ordine
 */
export const deleteOrder = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'orders/deleteOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      await ordersService.deleteOrder(orderId);
      return orderId;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nell\'eliminazione ordine';
      return rejectWithValue(message);
    }
  }
);

/**
 * Cerca ordini
 */
export const searchOrders = createAsyncThunk<
  Order[],
  string,
  { rejectValue: string }
>(
  'orders/searchOrders',
  async (query, { rejectWithValue }) => {
    try {
      const orders = await ordersService.searchOrders(query);
      return orders;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nella ricerca ordini';
      return rejectWithValue(message);
    }
  }
);

/**
 * Carica statistiche ordini
 */
export const fetchOrdersStats = createAsyncThunk<
  { total: number; byStatus: Record<Order['status'], number>; totalValue: number; pendingDeliveries: number },
  void,
  { rejectValue: string }
>(
  'orders/fetchOrdersStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await ordersService.getOrdersStats();
      return stats;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento statistiche';
      return rejectWithValue(message);
    }
  }
);

/**
 * Ottiene lo stato di un ordine specifico per il voice-bot
 * @param orderId ID dell'ordine
 */
export const fetchOrderStatusForVoiceBot = createAsyncThunk<
  OrderStatus,
  string,
  { rejectValue: string }
>(
  'orders/fetchOrderStatusForVoiceBot',
  async (orderId, { rejectWithValue }) => {
    try {
      const order = await ordersService.getOrder(orderId);
      return {
        id: order.id,
        status: order.status,
        eta: order.deliveryDate || null,
        clientName: order.clientName,
        title: order.title,
        priority: order.priority,
        completionPercentage: order.status === 'Completato' ? 100 : (order.status === 'In Lavorazione' ? 50 : 0),
        delaysCount: 0, // Calcolo semplificato
        lastUpdate: new Date().toISOString()
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento stato ordine';
      return rejectWithValue(message);
    }
  }
);

// Slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    /**
     * Pulisce gli errori
     */
    clearOrdersError: (state) => {
      state.error = null;
    },
    
    /**
     * Imposta l'ordine selezionato
     */
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
    
    /**
     * Aggiorna i filtri
     */
    setOrdersFilters: (state, action: PayloadAction<Partial<OrdersFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    /**
     * Reset dei filtri
     */
    resetOrdersFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    /**
     * Aggiorna la paginazione
     */
    setOrdersPagination: (state, action: PayloadAction<Partial<OrdersState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    /**
     * Aggiorna un ordine nello stato locale
     */
    updateOrderInState: (state, action: PayloadAction<Order>) => {
      const index = state.items.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      
      // Aggiorna anche l'ordine selezionato se corrisponde
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = action.payload;
      }
    },
    
    /**
     * Rimuove un ordine dallo stato locale
     */
    removeOrderFromState: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(order => order.id !== action.payload);
      
      // Pulisce l'ordine selezionato se corrisponde
      if (state.selectedOrder?.id === action.payload) {
        state.selectedOrder = null;
      }
    },
    
    /**
     * Aggiorna la cache del voice-bot per lo stato ordine
     */
    updateVoiceBotOrderStatus: (state, action: PayloadAction<{ orderId: string; data: any }>) => {
      state.voiceBotCache.orderStatus[action.payload.orderId] = action.payload.data;
      state.voiceBotCache.lastUpdate = Date.now();
    },
    
    /**
     * Pulisce la cache del voice-bot
     */
    clearVoiceBotCache: (state) => {
      state.voiceBotCache = {
        orderStatus: {},
        lastUpdate: 0,
      };
    },
    
    /**
     * Reset completo dello stato ordini
     */
    resetOrdersState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.pagination.total = action.payload.length;
        state.pagination.totalPages = Math.ceil(action.payload.length / state.pagination.limit);
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nel caricamento ordini';
      });
    
    // Fetch Order
    builder
      .addCase(fetchOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
        
        // Aggiorna anche nella lista se presente
        const index = state.items.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
        
        state.error = null;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nel caricamento ordine';
      });
    
    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // Aggiunge in cima alla lista
        state.pagination.total += 1;
        state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nella creazione ordine';
      });
    
    // Update Order
    builder
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false;
        
        // Aggiorna nella lista
        const index = state.items.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        
        // Aggiorna l'ordine selezionato se corrisponde
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
        
        state.error = null;
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nell\'aggiornamento ordine';
      });
    
    // Update Order Status
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        // Aggiorna nella lista
        const index = state.items.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        
        // Aggiorna l'ordine selezionato se corrisponde
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
        
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nell\'aggiornamento stato ordine';
      });
    
    // Delete Order
    builder
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(order => order.id !== action.payload);
        state.pagination.total -= 1;
        state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
        
        // Pulisce l'ordine selezionato se corrisponde
        if (state.selectedOrder?.id === action.payload) {
          state.selectedOrder = null;
        }
        
        state.error = null;
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nell\'eliminazione ordine';
      });
    
    // Search Orders
    builder
      .addCase(searchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(searchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nella ricerca ordini';
      });
    
    // Fetch Orders Stats
    builder
      .addCase(fetchOrdersStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchOrdersStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nel caricamento statistiche';
      });
    
    // Fetch Order Status for Voice Bot
    builder
      .addCase(fetchOrderStatusForVoiceBot.pending, (state) => {
        // Non impostiamo loading globale per le richieste del voice-bot
        state.error = null;
      })
      .addCase(fetchOrderStatusForVoiceBot.fulfilled, (state, action) => {
        // Aggiorna la cache del voice-bot
        state.voiceBotCache.orderStatus[action.payload.id] = action.payload;
        state.voiceBotCache.lastUpdate = Date.now();
        state.error = null;
      })
      .addCase(fetchOrderStatusForVoiceBot.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Errore nel caricamento stato ordine per voice-bot';
      });
  },
});

// Export actions
export const {
  clearOrdersError,
  setSelectedOrder,
  setOrdersFilters,
  resetOrdersFilters,
  setOrdersPagination,
  updateOrderInState,
  removeOrderFromState,
  updateVoiceBotOrderStatus,
  clearVoiceBotCache,
  resetOrdersState,
} = ordersSlice.actions;

// Export selectors
export const selectOrders = (state: { orders: OrdersState }) => state.orders;
export const selectOrdersItems = (state: { orders: OrdersState }) => state.orders.items;
export const selectSelectedOrder = (state: { orders: OrdersState }) => state.orders.selectedOrder;
export const selectOrdersLoading = (state: { orders: OrdersState }) => state.orders.loading;
export const selectOrdersError = (state: { orders: OrdersState }) => state.orders.error;
export const selectOrdersFilters = (state: { orders: OrdersState }) => state.orders.filters;
export const selectOrdersPagination = (state: { orders: OrdersState }) => state.orders.pagination;
export const selectOrdersStats = (state: { orders: OrdersState }) => state.orders.stats;
export const selectVoiceBotCache = (state: { orders: OrdersState }) => state.orders.voiceBotCache;

// Selettori specifici per voice-bot
export const selectOrderStatusFromCache = (orderId: string) => 
  (state: { orders: OrdersState }) => state.orders.voiceBotCache.orderStatus[orderId];

// Export types
export type { OrdersFilters, OrdersState };
export type { Order, OrderStatus } from '../../services/orders';

// Export reducer
export default ordersSlice.reducer;