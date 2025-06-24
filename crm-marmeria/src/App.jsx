import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  FileText,
  DollarSign,
  Settings as Cog,
} from 'lucide-react';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import DashboardPage from './pages/DashboardPage';
import CustomersPage  from './pages/CustomersPage';
import ProjectsPage   from './pages/ProjectsPage';
import MaterialsPage  from './pages/MaterialsPage';
import QuotesPage     from './pages/QuotesPage'; // Aggiunto import
import InvoicesPage   from './pages/InvoicesPage'; // Aggiunto import
import SettingsPage   from './pages/SettingsPage';
import useNetworkStorage from './hooks/useNetworkStorage';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: DashboardPage },
  { id: 'customers', label: 'Clienti',   icon: Users, component: CustomersPage },
  { id: 'projects',  label: 'Progetti',  icon: Briefcase, component: ProjectsPage },
  { id: 'materials', label: 'Materiali', icon: Layers, component: MaterialsPage },
  { id: 'quotes',    label: 'Preventivi',icon: FileText, component: QuotesPage },
  { id: 'invoices',  label: 'Fatture',   icon: DollarSign, component: InvoicesPage },
  { id: 'settings',  label: 'Impostazioni', icon: Cog, component: SettingsPage },
];

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      const isDark = JSON.parse(savedMode);
      if (isDark) document.documentElement.classList.add('dark');
      return isDark;
    }
    return document.documentElement.classList.contains('dark');
  });
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const savedPrefs = localStorage.getItem('notificationPrefs');
    return savedPrefs ? JSON.parse(savedPrefs) : {
      emailNewProjects: true,
      inAppDeadlines: true,
    };
  });
  const [dataPrefs, setDataPrefs] = useState(() => {
    const savedDataPrefs = localStorage.getItem('dataPrefs');
    return savedDataPrefs ? JSON.parse(savedDataPrefs) : {
      customerCodePrefix: 'CLI-',
      projectCodePrefix: 'PRJ-',
    };
  });
  const [formattingPrefs, setFormattingPrefs] = useState(() => {
    const savedFormattingPrefs = localStorage.getItem('formattingPrefs');
    return savedFormattingPrefs ? JSON.parse(savedFormattingPrefs) : {
      dateFormat: 'dd/MM/yyyy',
      currencySymbol: '€',
    };
  });
  const [fiscalPrefs, setFiscalPrefs] = useState(() => {
    const savedFiscalPrefs = localStorage.getItem('fiscalPrefs');
    return savedFiscalPrefs ? JSON.parse(savedFiscalPrefs) : {
      vatNumber: '',
      taxCode: '',
      defaultTaxRate: '22',
    };
  });
  const [printPrefs, setPrintPrefs] = useState(() => {
    const savedPrintPrefs = localStorage.getItem('printPrefs');
    return savedPrintPrefs ? JSON.parse(savedPrintPrefs) : {
      printHeader: '',
      printFooter: '',
      logoUrl: '',
    };
  });
  const [networkPrefs, setNetworkPrefs] = useState(() => {
    const savedNetworkPrefs = localStorage.getItem('networkPrefs');
    return savedNetworkPrefs ? JSON.parse(savedNetworkPrefs) : {
      mode: 'standalone', // 'standalone', 'master', 'client'
      serverAddress: '',
      serverPort: '3001',
      masterPort: '3001',
      connectionStatus: 'disconnected', // 'connected', 'disconnected'
      lastSync: null,
      autoSync: true,
      syncInterval: 30000, // 30 secondi
    };
  });
  // Utilizzo useNetworkStorage per la gestione dei dati
  const {
    data: materials,
    addItem: addMaterial,
    updateItem: updateMaterial,
    deleteItem: deleteMaterial,
  } = useNetworkStorage('materials');
  
  const {
    data: customers,
    addItem: addCustomer,
    updateItem: updateCustomer,
    deleteItem: deleteCustomer,
  } = useNetworkStorage('customers');
  
  const {
    data: projects,
    addItem: addProject,
    updateItem: updateProject,
    deleteItem: deleteProject,
  } = useNetworkStorage('projects');
  
  const {
    data: invoices,
    addItem: addInvoice,
    updateItem: updateInvoice,
    deleteItem: deleteInvoice,
  } = useNetworkStorage('invoices');
  
  // Setter functions per compatibilità con i componenti esistenti
  const setMaterials = (newMaterials) => {
    // Non necessario con useNetworkStorage, ma mantenuto per compatibilità
  };
  const setCustomers = (newCustomers) => {
    // Non necessario con useNetworkStorage, ma mantenuto per compatibilità
  };
  const setProjects = (newProjects) => {
    // Non necessario con useNetworkStorage, ma mantenuto per compatibilità
  };
  const setInvoices = (newInvoices) => {
    // Non necessario con useNetworkStorage, ma mantenuto per compatibilità
  };
  // Aggiungo uno stato per i filtri da applicare alla pagina dei progetti
  const [projectFilters, setProjectFilters] = useState({});

  const {
    data: quotes,
    addItem: addQuote,
    updateItem: updateQuote,
    deleteItem: deleteQuote,
  } = useNetworkStorage('quotes');
  
  const setQuotes = (newQuotes) => {
    // Non necessario con useNetworkStorage, ma mantenuto per compatibilità
  };

  // Le definizioni di invoices, customers, projects e quotes sono ora gestite da useNetworkStorage sopra



  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('darkMode', JSON.stringify(isDark));
  };

  const toggleNotificationPref = (prefKey) => {
    setNotificationPrefs(prevPrefs => {
      const newPrefs = {
        ...prevPrefs,
        [prefKey]: !prevPrefs[prefKey],
      };
      localStorage.setItem('notificationPrefs', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };

  const updateDataPref = (prefKey, value) => {
    setDataPrefs(prevPrefs => {
      const newDataPrefs = {
        ...prevPrefs,
        [prefKey]: value,
      };
      localStorage.setItem('dataPrefs', JSON.stringify(newDataPrefs));
      return newDataPrefs;
    });
  };

  const updateFormattingPref = (prefKey, value) => {
    setFormattingPrefs(prevPrefs => {
      const newFormattingPrefs = {
        ...prevPrefs,
        [prefKey]: value,
      };
      localStorage.setItem('formattingPrefs', JSON.stringify(newFormattingPrefs));
      return newFormattingPrefs;
    });
  };

  const updateFiscalPref = (prefKey, value) => {
    setFiscalPrefs(prevPrefs => {
      const newFiscalPrefs = {
        ...prevPrefs,
        [prefKey]: value,
      };
      localStorage.setItem('fiscalPrefs', JSON.stringify(newFiscalPrefs));
      return newFiscalPrefs;
    });
  };

  const updatePrintPref = (prefKey, value) => {
    setPrintPrefs(prevPrefs => {
      const newPrintPrefs = {
        ...prevPrefs,
        [prefKey]: value,
      };
      localStorage.setItem('printPrefs', JSON.stringify(newPrintPrefs));
      return newPrintPrefs;
    });
  };

  const updateNetworkPref = (prefKey, value) => {
    setNetworkPrefs(prevPrefs => {
      const newNetworkPrefs = {
        ...prevPrefs,
        [prefKey]: value,
      };
      localStorage.setItem('networkPrefs', JSON.stringify(newNetworkPrefs));
      return newNetworkPrefs;
    });
  };

  // Modifico handleNavigation per accettare anche i filtri
  const handleNavigation = (pageId, filters = {}) => {
    setCurrentPage(pageId);
    setProjectFilters(filters); // Imposto i filtri per la pagina progetti
    setIsSidebarOpen(false);
  };

  const renderPage = () => {
    const pageToRender = navItems.find(item => item.id === currentPage);
    const CurrentPageComponent = pageToRender ? pageToRender.component : DashboardPage;

    // Passa i dati e le funzioni necessarie ai componenti pagina
    const pageProps = {
      onNavigate: handleNavigation,
      currentUser: { displayName: 'Utente' }, // Esempio, da rendere dinamico
      customers,
      setCustomers: (newCustomers) => {
        // Compatibilità: se viene passato un array, sostituisce tutti i dati
        // Altrimenti usa le funzioni specifiche di useNetworkStorage
      },
      addCustomer,
      updateCustomer,
      deleteCustomer,
      projects,
      setProjects: (newProjects) => {
        // Compatibilità per progetti
      },
      addProject,
      updateProject,
      deleteProject,
      materials,
      setMaterials: (newMaterials) => {
        // Compatibilità per materiali
      },
      addMaterial,
      updateMaterial,
      deleteMaterial,
      quotes,
      setQuotes: (newQuotes) => {
        // Compatibilità per preventivi
      },
      addQuote,
      updateQuote,
      deleteQuote,
      invoices,
      setInvoices: (newInvoices) => {
        // Compatibilità per fatture
      },
      addInvoice,
      updateInvoice,
      deleteInvoice,
      darkMode,
      toggleDarkMode,
      notificationPrefs,
      toggleNotificationPref,
      dataPrefs,
      updateDataPref,
      formattingPrefs,
      updateFormattingPref,
      fiscalPrefs,
      updateFiscalPref,
      printPrefs,
      updatePrintPref,
      networkPrefs,
      updateNetworkPref,
    };

    if (currentPage === 'dashboard') {
      return <CurrentPageComponent {...pageProps} />;
    }
    if (currentPage === 'projects') {
      return <CurrentPageComponent {...pageProps} filters={projectFilters} />;
    }
    if (currentPage === 'customers') {
      return <CurrentPageComponent {...pageProps} />;
    }
    if (currentPage === 'settings') {
      return <CurrentPageComponent {...pageProps} />;
    }
    if (currentPage === 'materials') { // Aggiunta condizione per MaterialsPage
      return <CurrentPageComponent {...pageProps} />;
    }
    if (currentPage === 'quotes') { // Aggiunta condizione per QuotesPage
      return <CurrentPageComponent {...pageProps} />;
    }
    if (currentPage === 'invoices') { // Aggiunta condizione per InvoicesPage
      return <CurrentPageComponent {...pageProps} />;
    }
    // Per le altre pagine, passare comunque le props di base se necessario
    return <CurrentPageComponent {...pageProps} />;
  };

  return (
    <div className="flex h-screen bg-light-bg dark:bg-dark-bg overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        navItems={navItems}
        currentPage={currentPage}
        handleNavigation={handleNavigation}
        currentUser={{ uid: '123456' }}
        appId="crm-marmeria"
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Aggiunto ml-0 lg:ml-64 per fare spazio alla sidebar su schermi grandi */}
      <div className="flex flex-col flex-1 overflow-hidden ml-0 lg:ml-64">
        <Header
          toggleDarkMode={toggleDarkMode}
          darkMode={darkMode}
          currentPage={currentPage}
          navItems={navItems}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 text-light-text dark:text-dark-text">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
