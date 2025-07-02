import React, { useState, useEffect } from 'react';
import { User, Bell, Globe, Palette, Sun, Moon, CalendarDays, Euro, DollarSign, PoundSterling, FileDigit, Printer, Database } from 'lucide-react'; // Icone per le sezioni

// Componente Switch personalizzato con animazione
const AnimatedSwitch = ({ id, checked, onChange, label }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <label htmlFor={id} className="text-gray-600 dark:text-gray-300 select-none cursor-pointer flex items-center">
        {label}
      </label>
      <button
        id={id}
        onClick={onChange}
        type="button"
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg ${checked ? 'bg-indigo-600 focus:ring-indigo-500' : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400'}`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
        <span
          className={`absolute inset-y-0 left-0 flex items-center justify-center w-5 h-full transition-opacity duration-300 ease-in-out ${checked ? 'opacity-0' : 'opacity-100'}`}
        >
          <Moon className="h-3 w-3 text-gray-500 ml-1" />
        </span>
        <span
          className={`absolute inset-y-0 right-0 flex items-center justify-center w-5 h-full transition-opacity duration-300 ease-in-out ${checked ? 'opacity-100' : 'opacity-0'}`}
        >
          <Sun className="h-3 w-3 text-yellow-400 mr-1" />
        </span>
      </button>
    </div>
  );
};


import DataManager from '../components/DataManager';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';

const SettingsPage = () => {
  const { theme, userPreferences, changeTheme, updatePreferences, showNotification } = useUI();
  const { dataState, updateUser } = useData();

  const { user } = dataState;
  
  // Stato locale per le preferenze UI
  const [uiPrefs, setUiPrefs] = useState({
    darkMode: theme === 'dark',
    notificationPrefs: userPreferences.notifications || {},
    formattingPrefs: userPreferences.formatting || { dateFormat: 'DD/MM/YYYY', currencySymbol: '€' },
    fiscalPrefs: userPreferences.fiscal || { vatNumber: '', taxCode: '', defaultTaxRate: 22 },
    printPrefs: userPreferences.print || { logoUrl: '', printHeader: true, printFooter: true }
  });
  
  const { darkMode, notificationPrefs, formattingPrefs, fiscalPrefs, printPrefs } = uiPrefs;

  // Stato locale per le preferenze dati
  const [dataPrefs, setDataPrefs] = useState({
    customerCodePrefix: 'CLI-',
    projectCodePrefix: 'PRJ-'
  });

  // Funzioni per aggiornare le preferenze
  const updateDataPref = (key, value) => {
    setDataPrefs(prev => ({ ...prev, [key]: value }));
  };

  const updateFormattingPref = (key, value) => {
    const newFormattingPrefs = { ...formattingPrefs, [key]: value };
    setUiPrefs(prev => ({ ...prev, formattingPrefs: newFormattingPrefs }));
    updatePreferences({ formatting: newFormattingPrefs });
  };

  const updateFiscalPref = (key, value) => {
    const newFiscalPrefs = { ...fiscalPrefs, [key]: value };
    setUiPrefs(prev => ({ ...prev, fiscalPrefs: newFiscalPrefs }));
    updatePreferences({ fiscal: newFiscalPrefs });
  };

  const updatePrintPref = (key, value) => {
    const newPrintPrefs = { ...printPrefs, [key]: value };
    setUiPrefs(prev => ({ ...prev, printPrefs: newPrintPrefs }));
    updatePreferences({ print: newPrintPrefs });
  };

  // Funzioni mancanti per l'interfaccia
  const toggleDarkMode = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    changeTheme(newTheme);
    setUiPrefs(prev => ({ ...prev, darkMode: !darkMode }));
  };

  const toggleNotificationPref = (key) => {
    const newNotificationPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setUiPrefs(prev => ({ ...prev, notificationPrefs: newNotificationPrefs }));
    updatePreferences({ notifications: newNotificationPrefs });
  };



  // Stato per i dati del profilo utente
  const [userProfile, setUserProfile] = useState({
    username: '',
    email: ''
  });

  // Carica i dati del profilo utente dallo stato Redux
  useEffect(() => {
    if (user) {
      setUserProfile({
        username: user.name || 'Mario Rossi',
        email: user.email || 'mario.rossi@example.com'
      });
    }
  }, [user]);

  // Sincronizza le preferenze UI con lo stato globale
  useEffect(() => {
    setUiPrefs(prev => ({
      ...prev,
      darkMode: theme === 'dark',
      notificationPrefs: userPreferences.notifications || {},
      formattingPrefs: userPreferences.formatting || { dateFormat: 'DD/MM/YYYY', currencySymbol: '€' },
      fiscalPrefs: userPreferences.fiscal || { vatNumber: '', taxCode: '', defaultTaxRate: 22 },
      printPrefs: userPreferences.print || { logoUrl: '', printHeader: true, printFooter: true }
    }));
  }, [theme, userPreferences]);



  // Funzione per salvare il profilo utente
  const saveUserProfile = () => {
    updateUser(userProfile);
    alert('Profilo utente salvato con successo!');
  };

  // Funzione per aggiornare i campi del profilo
  const updateUserProfile = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };



  return (
    <div className="p-4 md:p-8 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
      <h2 className="text-3xl font-semibold mb-8 text-gray-800 dark:text-gray-100">Impostazioni Applicazione</h2>

      {/* Sezione Aspetto */}
      <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <Palette size={24} className="mr-3 text-indigo-500" /> Aspetto
        </h3>
        <AnimatedSwitch 
          id="darkMode"
          checked={darkMode}
          onChange={toggleDarkMode}
          label="Tema Scuro"
        />
        <div className="border-b border-gray-200 dark:border-gray-700"></div>
        {/* Altre impostazioni di aspetto qui */}
      </div>

      {/* Sezione Profilo Utente */}
      <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <User size={24} className="mr-3 text-blue-500" /> Profilo Utente
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nome Utente</label>
            <input 
              type="text" 
              id="username" 
              value={userProfile.username}
              onChange={(e) => updateUserProfile('username', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              id="email" 
              value={userProfile.email}
              onChange={(e) => updateUserProfile('email', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          <button 
            onClick={saveUserProfile}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
          >
            Salva Modifiche Profilo
          </button>
        </div>
      </div>

      {/* Sezione Notifiche */}
      <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <Bell size={24} className="mr-3 text-green-500" /> Notifiche
        </h3>
        <AnimatedSwitch
          id="emailNotifications"
          checked={notificationPrefs.emailNewProjects}
          onChange={() => toggleNotificationPref('emailNewProjects')}
          label="Notifiche Email per Nuovi Progetti"
        />
        <div className="border-b border-gray-200 dark:border-gray-700"></div>
        <AnimatedSwitch
          id="inAppNotifications"
          checked={notificationPrefs.inAppDeadlines}
          onChange={() => toggleNotificationPref('inAppDeadlines')}
          label="Notifiche In-App per Scadenze"
        />
      </div>



      {/* Sezione Gestione Dati */}
      <DataManager />

      {/* Sezione Preferenze Dati */}
      <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <Database size={24} className="mr-3 text-purple-500" /> Preferenze Dati
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="customerCodePrefix" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Prefisso Codice Cliente</label>
            <input 
              type="text" 
              id="customerCodePrefix" 
              value={dataPrefs.customerCodePrefix}
              onChange={(e) => updateDataPref('customerCodePrefix', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="projectCodePrefix" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Prefisso Codice Progetto</label>
            <input 
              type="text" 
              id="projectCodePrefix" 
              value={dataPrefs.projectCodePrefix}
              onChange={(e) => updateDataPref('projectCodePrefix', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Sezione Preferenze di Formattazione */}
      <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <CalendarDays size={24} className="mr-3 text-teal-500" /> Preferenze di Formattazione
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Formato Data</label>
            <select 
              id="dateFormat" 
              value={formattingPrefs.dateFormat}
              onChange={(e) => updateFormattingPref('dateFormat', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="dd/MM/yyyy">GG/MM/AAAA (es. 31/12/2023)</option>
              <option value="MM/dd/yyyy">MM/GG/AAAA (es. 12/31/2023)</option>
              <option value="yyyy-MM-dd">AAAA-MM-GG (es. 2023-12-31)</option>
              <option value="dd MMM yyyy">GG MMM AAAA (es. 31 Dic 2023)</option>
            </select>
          </div>
          <div>
            <label htmlFor="currencySymbol" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Simbolo Valuta</label>
            <select 
              id="currencySymbol" 
              value={formattingPrefs.currencySymbol}
              onChange={(e) => updateFormattingPref('currencySymbol', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="€">Euro (€)</option>
              <option value="$">Dollaro ($)</option>
              <option value="£">Sterlina (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sezione Impostazioni Fiscali */}
      <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <FileDigit size={24} className="mr-3 text-orange-500" /> Impostazioni Fiscali
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Partita IVA</label>
            <input 
              type="text" 
              id="vatNumber" 
              value={fiscalPrefs.vatNumber}
              onChange={(e) => updateFiscalPref('vatNumber', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="taxCode" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Codice Fiscale</label>
            <input 
              type="text" 
              id="taxCode" 
              value={fiscalPrefs.taxCode}
              onChange={(e) => updateFiscalPref('taxCode', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Aliquota IVA Predefinita (%)</label>
            <input 
              type="number" 
              id="defaultTaxRate" 
              value={fiscalPrefs.defaultTaxRate}
              onChange={(e) => updateFiscalPref('defaultTaxRate', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Sezione Impostazioni di Stampa */}
      <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <Printer size={24} className="mr-3 text-cyan-500" /> Impostazioni di Stampa
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">URL Logo Aziendale (per stampe)</label>
            <input 
              type="text" 
              id="logoUrl" 
              value={printPrefs.logoUrl}
              onChange={(e) => updatePrintPref('logoUrl', e.target.value)}
              placeholder="https://esempio.com/logo.png"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="printHeader" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Intestazione Predefinita Stampe</label>
            <textarea 
              id="printHeader" 
              rows="3"
              value={printPrefs.printHeader}
              onChange={(e) => updatePrintPref('printHeader', e.target.value)}
              placeholder="Testo da visualizzare nell'intestazione dei documenti stampati..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="printFooter" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Piè di Pagina Predefinito Stampe</label>
            <textarea 
              id="printFooter" 
              rows="3"
              value={printPrefs.printFooter}
              onChange={(e) => updatePrintPref('printFooter', e.target.value)}
              placeholder="Testo da visualizzare nel piè di pagina dei documenti stampati (es. Ragione Sociale, P.IVA, Contatti)..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Sezione Lingua e Regione (Placeholder) */}
      <div className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <Globe size={24} className="mr-3 text-yellow-500" /> Lingua e Regione
        </h3>
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Lingua</label>
          <select id="language" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500">
            <option>Italiano</option>
            <option>English (Placeholder)</option>
          </select>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Altre impostazioni regionali e di lingua verranno aggiunte qui.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
