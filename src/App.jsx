import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { cacheService } from './services/cache';
import { ErrorProvider } from './context/ErrorContext.jsx';
import { ChakraProvider } from '@chakra-ui/react';


import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  FileText,
  DollarSign,
  Settings as Cog,
} from 'lucide-react';

import { store } from './store/index';
import { NetworkStatusProvider } from './contexts/NetworkStatusProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoginForm from './components/auth/LoginForm.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute';

import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ProjectsPage from './pages/ProjectsPage';
import MaterialsPage from './pages/MaterialsPage';
import QuotesPage from './pages/QuotesPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';


import useUI from './hooks/useUI';
import AIAssistantOverlay from './components/AIAssistant/AIAssistantOverlay';
import { AIAssistantProvider } from './contexts/AIAssistantContext';

const navItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    component: DashboardPage,
    permission: 'dashboard.view'
  },
  { 
    id: 'customers', 
    label: 'Clienti', 
    icon: Users, 
    component: CustomersPage,
    permission: 'clients.view'
  },
  { 
    id: 'projects', 
    label: 'Progetti', 
    icon: Briefcase, 
    component: ProjectsPage,
    permission: 'projects.view'
  },
  { 
    id: 'materials', 
    label: 'Materiali', 
    icon: Layers, 
    component: MaterialsPage,
    permission: 'materials.view'
  },
  { 
    id: 'quotes', 
    label: 'Preventivi', 
    icon: FileText, 
    component: QuotesPage,
    permission: 'quotes.view'
  },
  { 
    id: 'invoices', 
    label: 'Fatture', 
    icon: DollarSign, 
    component: InvoicesPage,
    permission: 'invoices.view'
  },
  { 
    id: 'settings', 
    label: 'Impostazioni', 
    icon: Cog, 
    component: SettingsPage,
    permission: 'settings.view'
  }
];

const AppContent = () => {
  // IMPORTANTE: Tutti gli hooks devono essere chiamati prima di qualsiasi return condizionale
  // per rispettare le regole dei hooks di React
  const {
    theme,
    sidebar: { isOpen: isSidebarOpen },
    userPreferences,
    updatePreferences,
    toggleSidebar,
  } = useUI();
  
  const { isAuthenticated, isLoading, currentUser, hasPermission } = useAuth();
  console.log('[App.jsx] AppContent - Stato:', { isAuthenticated, isLoading });

  // Inizializza il cache service all'avvio dell'applicazione
  // Utilizziamo un ref per tenere traccia dell'inizializzazione
  const cacheInitialized = React.useRef(false);
  
  useEffect(() => {
    const initializeCache = async () => {
      if (cacheInitialized.current) return;
      
      try {
        await cacheService.init();
        cacheInitialized.current = true;
      } catch (error) {
        console.error('Errore nell\'inizializzazione del cache service:', error);
      }
    };

    initializeCache();
  }, []);

  // Calcola i valori necessari per il rendering (solo se autenticato)
  const allowedNavItems = isAuthenticated && currentUser ? navItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  ) : [];

  const currentPageItem = allowedNavItems.find(item => item.id === userPreferences.currentPage);
  const currentPage = currentPageItem ? userPreferences.currentPage : allowedNavItems[0]?.id || 'dashboard';
  
  // Forza il re-rendering quando cambia la pagina corrente
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  React.useEffect(() => {
    forceUpdate();
  }, [userPreferences.currentPage]);
  
  // Usa useEffect per evitare loop infiniti
  useEffect(() => {
    if (currentUser && userPreferences.currentPage && !allowedNavItems.find(item => item.id === userPreferences.currentPage)) {
      // Solo se la pagina corrente non è permessa, cambia alla prima disponibile
      const defaultPage = allowedNavItems[0]?.id || 'dashboard';
      updatePreferences({ currentPage: defaultPage });
    }
  }, [currentUser, userPreferences.currentPage, allowedNavItems.length]); // Rimuovi updatePreferences dalle dipendenze per evitare loop

  // Listener per navigazione dall'assistente IA
  useEffect(() => {
    const handleNavigateToPage = (event) => {
      const { page } = event.detail;
      if (allowedNavItems.find(item => item.id === page)) {
        updatePreferences({ currentPage: page });
      }
    };

    window.addEventListener('navigate-to-page', handleNavigateToPage);
    return () => window.removeEventListener('navigate-to-page', handleNavigateToPage);
  }, [allowedNavItems, updatePreferences]);

  const CurrentPageComponent = allowedNavItems.find(item => item.id === currentPage)?.component || DashboardPage;
  const currentPagePermission = allowedNavItems.find(item => item.id === currentPage)?.permission;

  // DOPO aver chiamato tutti gli hooks, ora possiamo fare i return condizionali
  
  // Mostra loading durante l'inizializzazione
  if (isLoading) {
    console.log('[App.jsx] AppContent - Mostra schermata di caricamento');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifica autenticazione in corso...</p>
        </div>
      </div>
    );
  }

  // Mostra login se non autenticato
  if (!isAuthenticated || !currentUser) {
    console.log('[App.jsx] AppContent - Mostra LoginForm');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoginForm />
      </div>
    );
  }

  console.log('[App.jsx] AppContent - Mostra layout principale');
  return (
    <div className={`app ${theme} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar
        navItems={allowedNavItems}
        isSidebarOpen={isSidebarOpen}
        currentPage={currentPage}
        handleNavigation={(pageId) => updatePreferences({ currentPage: pageId })}
        currentUser={currentUser}
        appId="crm-marmeria"
        onClose={toggleSidebar}
      />
      <div className="main-content">
        <Header />
        <main>
          <ProtectedRoute permission={currentPagePermission}>
            <CurrentPageComponent />
          </ProtectedRoute>
        </main>
      </div>
      <Toaster position="bottom-right" />
      <AIAssistantOverlay />
    </div>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <ChakraProvider>
        <NetworkStatusProvider>
          <ErrorProvider>
            <AuthProvider>
              <AIAssistantProvider>
                <AppContent />
              </AIAssistantProvider>
            </AuthProvider>
          </ErrorProvider>
        </NetworkStatusProvider>
      </ChakraProvider>
    </Provider>
  );
};



export default App;
