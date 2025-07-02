/**
 * Redux Slice per la gestione delle analytics
 * Sostituisce la gestione SQLite locale con chiamate API
 * Include funzioni specifiche per il voice-bot
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import analyticsService, { DailySummary, WeeklySummary, MonthlySummary, PerformanceMetrics, TrendData } from '../../services/analytics';

// Interfacce per lo stato
interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  period: 'daily' | 'weekly' | 'monthly';
  clientId?: string;
  category?: string;
}

interface AnalyticsState {
  // Dati principali
  dailySummary: DailySummary | null;
  weeklySummary: WeeklySummary | null;
  monthlySummary: MonthlySummary | null;
  performanceMetrics: PerformanceMetrics | null;
  trendData: TrendData[];
  
  // Stato UI
  loading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  
  // Cache per voice-bot
  voiceBotCache: {
    todaySummary: DailySummary | null;
    lastUpdate: number;
  };
  
  // Timestamp ultimo aggiornamento
  lastFetch: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
    performance: number | null;
    trends: number | null;
  };
}

// Stato iniziale
const initialState: AnalyticsState = {
  dailySummary: null,
  weeklySummary: null,
  monthlySummary: null,
  performanceMetrics: null,
  trendData: [],
  loading: false,
  error: null,
  filters: {
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 giorni fa
    dateTo: new Date().toISOString().split('T')[0], // oggi
    period: 'daily',
  },
  voiceBotCache: {
    todaySummary: null,
    lastUpdate: 0,
  },
  lastFetch: {
    daily: null,
    weekly: null,
    monthly: null,
    performance: null,
    trends: null,
  },
};

// Async Thunks

/**
 * Carica il riepilogo giornaliero
 */
export const fetchDailySummary = createAsyncThunk<
  DailySummary,
  string,
  { rejectValue: string }
>(
  'analytics/fetchDailySummary',
  async (date, { rejectWithValue }) => {
    try {
      const summary = await analyticsService.getTodaySummary(date);
      return summary;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento riepilogo giornaliero';
      return rejectWithValue(message);
    }
  }
);

/**
 * Carica il riepilogo settimanale
 */
export const fetchWeeklySummary = createAsyncThunk<
  WeeklySummary,
  { weekStart: string; weekEnd: string },
  { rejectValue: string }
>(
  'analytics/fetchWeeklySummary',
  async ({ weekStart }, { rejectWithValue }) => {
    try {
      const summary = await analyticsService.getWeeklySummary(weekStart);
      return summary;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento riepilogo settimanale';
      return rejectWithValue(message);
    }
  }
);

/**
 * Carica il riepilogo mensile
 */
export const fetchMonthlySummary = createAsyncThunk<
  MonthlySummary,
  { month: number; year: number },
  { rejectValue: string }
>(
  'analytics/fetchMonthlySummary',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const summary = await analyticsService.getMonthlySummary(month, year);
      return summary;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento riepilogo mensile';
      return rejectWithValue(message);
    }
  }
);

/**
 * Carica le metriche di performance
 */
export const fetchPerformanceMetrics = createAsyncThunk<
  PerformanceMetrics,
  { dateFrom: string; dateTo: string },
  { rejectValue: string }
>(
  'analytics/fetchPerformanceMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const metrics = await analyticsService.getPerformanceMetrics('month');
      return metrics;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento metriche performance';
      return rejectWithValue(message);
    }
  }
);

/**
 * Carica i dati di trend
 */
export const fetchTrendData = createAsyncThunk<
  TrendData[],
  { dateFrom: string; dateTo: string; period: 'week' | 'month' | 'quarter'; metric?: 'orders' | 'revenue' | 'clients' | 'satisfaction' },
  { rejectValue: string }
>(
  'analytics/fetchTrendData',
  async ({ dateFrom, dateTo, period, metric = 'orders' }, { rejectWithValue }) => {
    try {
      const trends = await analyticsService.getTrendData(metric, period, dateFrom, dateTo);
      return trends;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento dati trend';
      return rejectWithValue(message);
    }
  }
);

/**
 * Carica il riepilogo di oggi per il voice-bot
 * Questa funzione è ottimizzata per l'uso da parte del voice-bot
 */
export const fetchTodaySummaryForVoiceBot = createAsyncThunk<
  { ordersCompleted: number; deliveriesDue: number; delays: number },
  void,
  { rejectValue: string }
>(
  'analytics/fetchTodaySummaryForVoiceBot',
  async (_, { rejectWithValue }) => {
    try {
      const summary = await analyticsService.getTodaySummary();
      return summary;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento riepilogo per voice-bot';
      return rejectWithValue(message);
    }
  }
);

/**
 * Carica tutti i dati analytics per il dashboard
 */
export const fetchAllAnalytics = createAsyncThunk<
  {
    daily: DailySummary;
    weekly: WeeklySummary;
    monthly: MonthlySummary;
    performance: PerformanceMetrics;
    trends: TrendData[];
  },
  { dateFrom: string; dateTo: string },
  { rejectValue: string }
>(
  'analytics/fetchAllAnalytics',
  async ({ dateFrom, dateTo }, { rejectWithValue }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Esegui tutte le chiamate in parallelo
      const [daily, weekly, monthly, performance, trends] = await Promise.all([
        analyticsService.getTodaySummary(today),
        analyticsService.getWeeklySummary(weekStart),
        analyticsService.getMonthlySummary(currentMonth, currentYear),
        analyticsService.getPerformanceMetrics('week'),
        analyticsService.getTrendData('orders', 'week', dateFrom, dateTo),
      ]);

      return {
        daily,
        weekly,
        monthly,
        performance,
        trends,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Errore nel caricamento analytics';
      return rejectWithValue(message);
    }
  }
);

// Slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    /**
     * Pulisce gli errori
     */
    clearAnalyticsError: (state) => {
      state.error = null;
    },
    
    /**
     * Aggiorna i filtri
     */
    setAnalyticsFilters: (state, action: PayloadAction<Partial<AnalyticsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    /**
     * Reset dei filtri
     */
    resetAnalyticsFilters: (state) => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      state.filters = {
        dateFrom: thirtyDaysAgo,
        dateTo: today,
        period: 'daily',
      };
    },
    
    /**
     * Aggiorna la cache del voice-bot
     */
    updateVoiceBotTodaySummary: (state, action: PayloadAction<DailySummary>) => {
      state.voiceBotCache.todaySummary = action.payload;
      state.voiceBotCache.lastUpdate = Date.now();
    },
    
    /**
     * Pulisce la cache del voice-bot
     */
    clearVoiceBotCache: (state) => {
      state.voiceBotCache = {
        todaySummary: null,
        lastUpdate: 0,
      };
    },
    
    /**
     * Aggiorna manualmente i dati di trend
     */
    updateTrendData: (state, action: PayloadAction<TrendData[]>) => {
      state.trendData = action.payload;
      state.lastFetch.trends = Date.now();
    },
    
    /**
     * Reset completo dello stato analytics
     */
    resetAnalyticsState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Daily Summary
    builder
      .addCase(fetchDailySummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailySummary.fulfilled, (state, action) => {
        state.loading = false;
        state.dailySummary = action.payload;
        state.lastFetch.daily = Date.now();
        state.error = null;
      })
      .addCase(fetchDailySummary.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Errore nel caricamento riepilogo giornaliero';
      });
    
    // Fetch Weekly Summary
    builder
      .addCase(fetchWeeklySummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeeklySummary.fulfilled, (state, action) => {
        state.loading = false;
        state.weeklySummary = action.payload;
        state.lastFetch.weekly = Date.now();
        state.error = null;
      })
      .addCase(fetchWeeklySummary.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Errore nel caricamento riepilogo settimanale';
      });
    
    // Fetch Monthly Summary
    builder
      .addCase(fetchMonthlySummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlySummary.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlySummary = action.payload;
        state.lastFetch.monthly = Date.now();
        state.error = null;
      })
      .addCase(fetchMonthlySummary.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Errore nel caricamento riepilogo mensile';
      });
    
    // Fetch Performance Metrics
    builder
      .addCase(fetchPerformanceMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.performanceMetrics = action.payload;
        state.lastFetch.performance = Date.now();
        state.error = null;
      })
      .addCase(fetchPerformanceMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Errore nel caricamento metriche performance';
      });
    
    // Fetch Trend Data
    builder
      .addCase(fetchTrendData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendData.fulfilled, (state, action) => {
        state.loading = false;
        state.trendData = action.payload;
        state.lastFetch.trends = Date.now();
        state.error = null;
      })
      .addCase(fetchTrendData.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Errore nel caricamento dati trend';
      });
    
    // Fetch Today Summary for Voice Bot
    builder
      .addCase(fetchTodaySummaryForVoiceBot.pending, (state) => {
        // Non impostiamo loading globale per le richieste del voice-bot
        state.error = null;
      })
      .addCase(fetchTodaySummaryForVoiceBot.fulfilled, (state, action) => {
        // Aggiorna la cache del voice-bot
        const todaySummary: DailySummary = {
          date: new Date().toISOString().split('T')[0],
          ordersCompleted: action.payload.ordersCompleted,
          deliveriesDue: action.payload.deliveriesDue,
          delays: action.payload.delays,
          revenue: 0, // Non fornito dall'API voice-bot
          clientsContacted: 0, // Non fornito dall'API voice-bot
          activeProjects: 0, // Non fornito dall'API voice-bot
          newOrders: 0, // Non fornito dall'API voice-bot
          urgentTasks: 0, // Non fornito dall'API voice-bot
          materials: { lowStock: 0, outOfStock: 0 }, // Non fornito dall'API voice-bot
        };
        
        state.voiceBotCache.todaySummary = todaySummary;
        state.voiceBotCache.lastUpdate = Date.now();
        state.error = null;
      })
      .addCase(fetchTodaySummaryForVoiceBot.rejected, (state, action) => {
        state.error = action.payload || 'Errore nel caricamento riepilogo per voice-bot';
      });
    
    // Fetch All Analytics
    builder
      .addCase(fetchAllAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.dailySummary = action.payload.daily;
        state.weeklySummary = action.payload.weekly;
        state.monthlySummary = action.payload.monthly;
        state.performanceMetrics = action.payload.performance;
        state.trendData = action.payload.trends;
        
        const now = Date.now();
        state.lastFetch = {
          daily: now,
          weekly: now,
          monthly: now,
          performance: now,
          trends: now,
        };
        
        state.error = null;
      })
      .addCase(fetchAllAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nel caricamento analytics';
      });
  },
});

// Export actions
export const {
  clearAnalyticsError,
  setAnalyticsFilters,
  resetAnalyticsFilters,
  updateVoiceBotTodaySummary,
  clearVoiceBotCache,
  updateTrendData,
  resetAnalyticsState,
} = analyticsSlice.actions;

// Export selectors
export const selectAnalytics = (state: { analytics: AnalyticsState }) => state.analytics;
export const selectDailySummary = (state: { analytics: AnalyticsState }) => state.analytics.dailySummary;
export const selectWeeklySummary = (state: { analytics: AnalyticsState }) => state.analytics.weeklySummary;
export const selectMonthlySummary = (state: { analytics: AnalyticsState }) => state.analytics.monthlySummary;
export const selectPerformanceMetrics = (state: { analytics: AnalyticsState }) => state.analytics.performanceMetrics;
export const selectTrendData = (state: { analytics: AnalyticsState }) => state.analytics.trendData;
export const selectAnalyticsLoading = (state: { analytics: AnalyticsState }) => state.analytics.loading;
export const selectAnalyticsError = (state: { analytics: AnalyticsState }) => state.analytics.error;
export const selectAnalyticsFilters = (state: { analytics: AnalyticsState }) => state.analytics.filters;
export const selectVoiceBotCache = (state: { analytics: AnalyticsState }) => state.analytics.voiceBotCache;
export const selectLastFetch = (state: { analytics: AnalyticsState }) => state.analytics.lastFetch;

// Selettori specifici per voice-bot
export const selectTodaySummaryFromCache = (state: { analytics: AnalyticsState }) => 
  state.analytics.voiceBotCache.todaySummary;

export const selectIsVoiceBotCacheValid = (maxAge: number = 5 * 60 * 1000) => // 5 minuti default
  (state: { analytics: AnalyticsState }) => {
    const { lastUpdate } = state.analytics.voiceBotCache;
    return lastUpdate > 0 && (Date.now() - lastUpdate) < maxAge;
  };

// Export additional types
export type { AnalyticsFilters, AnalyticsState };

// Export reducer
export default analyticsSlice.reducer;