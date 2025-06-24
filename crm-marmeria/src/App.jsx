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
  const [materials, setMaterials] = useState([
    {
      id: 1,
      code: 'MAT-001',
      name: 'Marmo Carrara Classico',
      description: 'Lastre di marmo di Carrara, prima scelta.',
      unit: 'm²',
      price: '€ 180,00',
      supplier: 'Rossi Marmi Srl',
    },
    {
      id: 2,
      code: 'MAT-002',
      name: 'Granito Nero Assoluto',
      description: 'Granito nero lucido per top cucina e pavimenti.',
      unit: 'm²',
      price: '€ 220,00',
      supplier: 'Grandi Pietre Spa',
    },
    {
      id: 3,
      code: 'MAT-003',
      name: 'Colla per Piastrelle H40',
      description: 'Colla cementizia ad alte prestazioni.',
      unit: 'sacco 25kg',
      price: '€ 15,50',
      supplier: 'EdilFor Snc',
    },
  ]);
  // Aggiungo uno stato per i filtri da applicare alla pagina dei progetti
  const [projectFilters, setProjectFilters] = useState({});

  const [quotes, setQuotes] = useState([
    {
      id: 1,
      quoteNumber: 'PREV-2024-001',
      date: '2024-07-15',
      customerId: 1, // Mario Rossi
      projectId: 1, // Ristrutturazione Villa
      items: [
        { description: 'Fornitura e posa Marmo Carrara', quantity: 20, unitPrice: 180, materialId: 1 },
        { description: 'Lavorazione speciale taglio', quantity: 1, unitPrice: 500, materialId: '' },
      ],
      total: 4100,
      notes: 'Sconto 5% applicato sul totale.',
      status: 'Inviato', // Bozza, Inviato, Accettato, Rifiutato, Scaduto
      validityDays: 30,
    },
    {
      id: 2,
      quoteNumber: 'PREV-2024-002',
      date: '2024-07-20',
      customerId: 2, // Azienda ABC S.r.l.
      projectId: 2, // Pavimentazione Uffici
      items: [
        { description: 'Granito Nero Assoluto per top', quantity: 15, unitPrice: 220, materialId: 2 },
        { description: 'Colla H40', quantity: 5, unitPrice: 15.50, materialId: 3 },
      ],
      total: 3377.50,
      notes: '',
      status: 'Accettato',
      validityDays: 15,
    },
  ]);

  const [invoices, setInvoices] = useState([
    {
      id: 1,
      invoiceNumber: 'FATT-2024-001',
      date: '2024-07-25',
      customerId: 2, // Azienda ABC S.r.l.
      quoteId: 2, // PREV-2024-002
      items: [
        { description: 'Granito Nero Assoluto per top', quantity: 15, unitPrice: 220, materialId: 2 },
        { description: 'Colla H40', quantity: 5, unitPrice: 15.50, materialId: 3 },
      ],
      total: 3377.50,
      taxRate: 22,
      taxAmount: 743.05,
      grandTotal: 4120.55,
      paymentTerms: 'Bonifico bancario a 30 giorni',
      notes: 'Fattura relativa al preventivo PREV-2024-002.',
      status: 'Emessa', // Bozza, Emessa, Pagata, Scaduta, Annullata
    },
  ]);

  // Dati centralizzati per l'applicazione
  const [customers, setCustomers] = useState([
    {
      id: 1,
      code: 'CLI-001',
      name: 'Mario Rossi',
      email: 'mario.rossi@email.com',
      phone: '+39 123 456 7890',
      address: 'Via Roma 123, Milano',
      type: 'Privato',
    },
    {
      id: 2,
      code: 'CLI-002',
      name: 'Azienda ABC S.r.l.',
      email: 'info@aziendaabc.it',
      phone: '+39 098 765 4321',
      address: 'Via Milano 456, Roma',
      type: 'Azienda',
    },
  ]);

  const [projects, setProjects] = useState([
    {
      id: 1,
      code: 'PRJ-001',
      name: 'Ristrutturazione Villa',
      client: 'Mario Rossi', // Collegato a customers[0]
      clientId: 1,
      startDate: '2024-01-10',
      deadline: '2024-03-15',
      budget: '€ 25.000,00',
      status: 'In Corso',
    },
    {
      id: 2,
      code: 'PRJ-002',
      name: 'Pavimentazione Uffici',
      client: 'Azienda ABC S.r.l.', // Collegato a customers[1]
      clientId: 2,
      startDate: '2024-02-01',
      deadline: '2024-04-30',
      budget: '€ 45.000,00',
      status: 'In Attesa',
    },
    {
      id: 3,
      code: 'PRJ-003',
      name: 'Nuova Costruzione Residenziale',
      client: 'Luigi Verdi',
      clientId: null, // Cliente non ancora in lista o da creare
      startDate: '2024-03-01',
      deadline: '2024-09-30',
      budget: '€ 150.000,00',
      status: 'Completato',
    },
    {
      id: 4,
      code: 'PRJ-004',
      name: 'Manutenzione Condominiale',
      client: 'Condominio Centrale',
      clientId: null, // Cliente non ancora in lista o da creare
      startDate: '2024-05-15',
      deadline: '2024-06-15',
      budget: '€ 5.000,00',
      status: 'In Corso',
    },
  ]);

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
      setCustomers,
      projects,
      setProjects,
      materials, // Aggiunto materials
      setMaterials, // Aggiunto setMaterials
      quotes, // Aggiunto quotes
      setQuotes, // Aggiunto setQuotes
      invoices, // Aggiunto invoices
      setInvoices, // Aggiunto setInvoices
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
