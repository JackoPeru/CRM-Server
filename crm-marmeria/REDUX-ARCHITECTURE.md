# Architettura Redux - CRM Marmeria

Questa documentazione descrive l'architettura Redux implementata per il CRM Marmeria, inclusi i servizi API, la gestione dello stato offline e l'integrazione con i componenti esistenti.

## 📁 Struttura del Progetto

```
src/
├── store/
│   ├── index.ts                 # Configurazione store Redux
│   └── slices/
│       ├── authSlice.ts         # Gestione autenticazione
│       ├── clientsSlice.ts      # Gestione clienti
│       ├── ordersSlice.ts       # Gestione ordini
│       ├── materialsSlice.ts    # Gestione materiali
│       ├── analyticsSlice.ts    # Gestione analytics
│       └── uiSlice.ts          # Gestione stato UI
├── services/
│   ├── api.ts                   # Configurazione Axios + JWT
│   ├── cache.ts                 # Cache IndexedDB offline
│   ├── clients.ts               # API clienti
│   ├── orders.ts                # API ordini
│   ├── materials.ts             # API materiali (placeholder)
│   └── analytics.ts             # API analytics
├── hooks/
│   ├── useAuth.ts               # Hook autenticazione
│   ├── useClients.ts            # Hook clienti
│   ├── useOrders.ts             # Hook ordini
│   ├── useMaterials.ts          # Hook materiali
│   ├── useAnalytics.ts          # Hook analytics
│   ├── useUI.ts                 # Hook UI
│   ├── useDashboard.ts          # Hook dashboard combinato
│   └── index.ts                 # Esportazioni
├── contexts/
│   └── NetworkStatusProvider.tsx # Provider stato di rete
└── components/
    └── examples/
        └── ReduxExample.tsx     # Esempio di utilizzo
```

## 🔧 Configurazione

### 1. Variabili d'Ambiente

Crea un file `.env` basato su `.env.example`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Development Settings
VITE_APP_ENV=development

# Cache Settings
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL=300000
```

### 2. Installazione Dipendenze

```bash
npm install @reduxjs/toolkit react-redux idb react-hot-toast
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## 🏗️ Architettura

### Store Redux

Il store è configurato con Redux Toolkit e include:

- **authSlice**: Gestione autenticazione e JWT
- **clientsSlice**: CRUD clienti con cache offline
- **ordersSlice**: CRUD ordini con funzioni voice-bot
- **materialsSlice**: CRUD materiali con categorie/fornitori
- **analyticsSlice**: Reportistica e metriche
- **uiSlice**: Stato UI (tema, notifiche, modali)

### Servizi API

#### `api.ts` - Configurazione Base
- Interceptor per JWT automatico
- Refresh token automatico
- Gestione errori centralizzata

#### `cache.ts` - Cache Offline
- IndexedDB per persistenza offline
- TTL configurabile per cache
- Gestione automatica scadenze

#### Servizi Specifici
Ogni servizio (`clients.ts`, `orders.ts`, etc.) implementa:
- CRUD operations con API REST
- Fallback automatico a cache offline
- Notifiche toast per feedback utente
- Gestione errori di rete

### Hook Personalizzati

Ogni modulo ha il proprio hook che:
- Gestisce lo stato Redux specifico
- Fornisce metodi CRUD semplificati
- Combina loading/error states
- Include utilità specifiche del dominio

## 🚀 Utilizzo

### 1. Setup nell'App

```tsx
import { Provider } from 'react-redux';
import { store } from './store';
import { NetworkStatusProvider } from './contexts/NetworkStatusProvider';

function App() {
  return (
    <Provider store={store}>
      <NetworkStatusProvider>
        {/* Your app components */}
      </NetworkStatusProvider>
    </Provider>
  );
}
```

### 2. Utilizzo negli Hook

```tsx
import { useClients, useOrders, useDashboard } from './hooks';

function MyComponent() {
  // Hook specifico per clienti
  const { clients, loading, addClient, updateClient } = useClients();
  
  // Hook combinato per dashboard
  const { mainMetrics, alerts, recentOrders } = useDashboard();
  
  // Aggiungere un cliente
  const handleAddClient = async () => {
    const success = await addClient({
      name: 'Nuovo Cliente',
      email: 'test@example.com',
      // ...
    });
    
    if (success) {
      console.log('Cliente aggiunto con successo!');
    }
  };
}
```

### 3. Gestione Stato UI

```tsx
import { useUI } from './hooks';

function MyComponent() {
  const { theme, toggleTheme, showNotification, showModal } = useUI();
  
  const handleSuccess = () => {
    showNotification({
      id: Date.now().toString(),
      type: 'success',
      title: 'Operazione completata',
      message: 'L\'operazione è stata eseguita con successo',
      duration: 3000,
    });
  };
}
```

## 🔄 Migrazione dai Hook Legacy

### Prima (Hook Legacy)
```tsx
import useLocalStorage from './hooks/useLocalStorage';

function Component() {
  const { data: clients, addItem: addClient } = useLocalStorage('clients');
  // Gestione manuale dello stato locale
}
```

### Dopo (Redux + API)
```tsx
import { useClients } from './hooks';

function Component() {
  const { clients, addClient, loading, error } = useClients();
  // Gestione automatica di API, cache, loading, errori
}
```

## 🌐 Gestione Offline

### Strategia di Cache
1. **Online**: Dati da API con cache come backup
2. **Offline**: Dati da cache IndexedDB
3. **Sync**: Sincronizzazione automatica al ritorno online

### Implementazione
```tsx
import { useNetworkStatus } from './contexts/NetworkStatusProvider';

function Component() {
  const { isOnline, connectionInfo } = useNetworkStatus();
  
  if (!isOnline) {
    return <OfflineBanner />;
  }
}
```

## 🧪 Testing

### Setup Test
```tsx
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';

function renderWithRedux(component: React.ReactElement) {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
}
```

### Test Hook
```tsx
import { renderHook } from '@testing-library/react';
import { useClients } from '../hooks';

test('should load clients', () => {
  const { result } = renderHook(() => useClients(), {
    wrapper: ({ children }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });
  
  expect(result.current.clients).toEqual([]);
});
```

## 📊 Voice-Bot Integration

Speciali funzioni per l'integrazione voice-bot:

```tsx
import { useAnalytics, useOrders } from './hooks';

function VoiceBotComponent() {
  const { getTodaySummaryForVoiceBot, voiceBotTodaySummary } = useAnalytics();
  const { getOrderStatusForVoiceBot, voiceBotOrderStatus } = useOrders();
  
  // Ottieni riepilogo giornaliero per voice-bot
  useEffect(() => {
    getTodaySummaryForVoiceBot();
  }, []);
}
```

## 🔧 Configurazione Avanzata

### Personalizzazione Cache
```typescript
// In cache.ts
const CACHE_CONFIG = {
  ttl: parseInt(import.meta.env.VITE_CACHE_TTL) || 300000, // 5 minuti
  enabled: import.meta.env.VITE_CACHE_ENABLED === 'true',
};
```

### Interceptor Personalizzati
```typescript
// In api.ts
api.interceptors.request.use((config) => {
  // Logica personalizzata per le richieste
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gestione errori personalizzata
    return Promise.reject(error);
  }
);
```

## 🚨 Troubleshooting

### Problemi Comuni

1. **Store non configurato**: Assicurati che il Provider Redux avvolga l'app
2. **Cache non funziona**: Verifica che IndexedDB sia supportato
3. **API non risponde**: Controlla le variabili d'ambiente
4. **Hook non aggiornano**: Verifica che i componenti siano dentro il Provider

### Debug

```tsx
// Abilita Redux DevTools
const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});
```

## 📈 Performance

### Ottimizzazioni Implementate
- Memoizzazione con `useCallback` negli hook
- Selettori ottimizzati con `createSelector`
- Cache intelligente con TTL
- Lazy loading dei dati
- Debouncing per ricerche

### Monitoraggio
```tsx
// Utilizza i selettori per monitorare performance
const loadingStates = useAppSelector(state => ({
  clients: state.clients.loading,
  orders: state.orders.loading,
  materials: state.materials.loading,
}));
```

## 🔮 Roadmap

- [ ] Implementazione completa API backend
- [ ] Sincronizzazione real-time con WebSockets
- [ ] Ottimizzazione bundle con code splitting
- [ ] PWA con service workers
- [ ] Migrazione completa da hook legacy
- [ ] Test coverage al 100%
- [ ] Documentazione API completa

---

**Nota**: Questa architettura è progettata per essere scalabile e mantenibile. I hook legacy rimangono disponibili durante la fase di migrazione graduale.