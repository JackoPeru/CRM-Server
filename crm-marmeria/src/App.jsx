import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { cacheService } from './services/cache';

console.log('🚨🚨🚨 [App] MODULO APP CARICATO - DEBUG ATTIVO 🚨🚨🚨');
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  FileText,
  DollarSign,
  Settings as Cog,
} from 'lucide-react';

import { store } from './store';
import { NetworkStatusProvider } from './contexts/NetworkStatusProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
  },
];

const AppContent = () => {
  console.log('🚀 [App] AppContent rendering iniziato');
  
  // IMPORTANTE: Tutti gli hooks devono essere chiamati prima di qualsiasi return condizionale
  // per rispettare le regole dei hooks di React
  const {
    theme,
    sidebar: { isOpen: isSidebarOpen },
    userPreferences,
    updatePreferences,
    toggleSidebar,
  } = useUI();
  
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  
  console.log('📊 [App] Stato autenticazione:', {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    userId: user?.id,
    userRole: user?.role
  });

  // Inizializza il cache service all'avvio dell'applicazione
  useEffect(() => {
    const initializeCache = async () => {
      try {
        await cacheService.init();
        console.log('Cache service inizializzato con successo');
      } catch (error) {
        console.error('Errore nell\'inizializzazione del cache service:', error);
      }
    };

    initializeCache();
  }, []);

  // Calcola i valori necessari per il rendering (solo se autenticato)
  const allowedNavItems = isAuthenticated && user ? navItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  ) : [];

  const currentPageItem = allowedNavItems.find(item => item.id === userPreferences.currentPage);
  const currentPage = currentPageItem ? userPreferences.currentPage : allowedNavItems[0]?.id || 'dashboard';
  
  // Usa useEffect per evitare loop infiniti
  useEffect(() => {
    if (user && userPreferences.currentPage && !allowedNavItems.find(item => item.id === userPreferences.currentPage)) {
      // Solo se la pagina corrente non è permessa, cambia alla prima disponibile
      const defaultPage = allowedNavItems[0]?.id || 'dashboard';
      updatePreferences({ currentPage: defaultPage });
    }
  }, [user, userPreferences.currentPage, allowedNavItems.length]); // Rimuovi updatePreferences dalle dipendenze per evitare loop

  const CurrentPageComponent = allowedNavItems.find(item => item.id === currentPage)?.component || DashboardPage;
  const currentPagePermission = allowedNavItems.find(item => item.id === currentPage)?.permission;

  // DOPO aver chiamato tutti gli hooks, ora possiamo fare i return condizionali
  
  // Mostra loading durante l'inizializzazione
  if (isLoading) {
    console.log('⏳ [App] Mostrando schermata di caricamento');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Mostra login se non autenticato
  if (!isAuthenticated || !user) {
    console.log('🔐 [App] Utente non autenticato, mostrando LoginForm');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoginForm />
      </div>
    );
  }
  
  console.log('✅ [App] Utente autenticato, rendering app principale');

  return (
    <div className={`app ${theme} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar
        navItems={allowedNavItems}
        isSidebarOpen={isSidebarOpen}
        currentPage={currentPage}
        handleNavigation={(pageId) => updatePreferences({ currentPage: pageId })}
        currentUser={user}
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
    </div>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <NetworkStatusProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NetworkStatusProvider>
    </Provider>
  );
};

export default App;
