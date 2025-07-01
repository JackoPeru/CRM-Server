import React from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
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
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ProjectsPage from './pages/ProjectsPage';
import MaterialsPage from './pages/MaterialsPage';
import QuotesPage from './pages/QuotesPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';

import useUI from './hooks/useUI';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: DashboardPage },
  { id: 'customers', label: 'Clienti', icon: Users, component: CustomersPage },
  { id: 'projects', label: 'Progetti', icon: Briefcase, component: ProjectsPage },
  { id: 'materials', label: 'Materiali', icon: Layers, component: MaterialsPage },
  { id: 'quotes', label: 'Preventivi', icon: FileText, component: QuotesPage },
  { id: 'invoices', label: 'Fatture', icon: DollarSign, component: InvoicesPage },
  { id: 'settings', label: 'Impostazioni', icon: Cog, component: SettingsPage },
];

const AppContent = () => {
  const {
    theme,
    sidebar: { isOpen: isSidebarOpen },
    userPreferences,
    updatePreferences,
    toggleSidebar,
  } = useUI();

  const CurrentPage = navItems.find(item => item.id === userPreferences.currentPage)?.component || DashboardPage;

  return (
    <div className={`app ${theme} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar
        navItems={navItems}
        isSidebarOpen={isSidebarOpen}
        currentPage={userPreferences.currentPage}
        handleNavigation={(pageId) => updatePreferences({ currentPage: pageId })}
        currentUser={null}
        appId="crm-marmeria"
        onClose={toggleSidebar}
      />
      <div className="main-content">
        <Header />
        <main>
          <CurrentPage />
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
        <AppContent />
      </NetworkStatusProvider>
    </Provider>
  );
};

export default App;
