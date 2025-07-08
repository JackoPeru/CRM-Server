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
        className={`relative inline-flex items-center h-6 rounded-full w-11 sm:h-5 sm:w-9 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg ${checked ? 'bg-indigo-600 focus:ring-indigo-500' : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400'}`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`relative w-5 h-5 sm:w-4 sm:h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${checked ? 'translate-x-5 sm:translate-x-4' : 'translate-x-0.5'}`}
        >
          <Moon className={`h-3 w-3 sm:h-2.5 sm:w-2.5 text-gray-600 transition-opacity duration-300 ease-in-out ${checked ? 'opacity-0' : 'opacity-100'}`} />
          <Sun className={`h-3 w-3 sm:h-2.5 sm:w-2.5 text-yellow-500 absolute transition-opacity duration-300 ease-in-out ${checked ? 'opacity-100' : 'opacity-0'}`} />
        </span>
      </button>
    </div>
  );
};


import DataManager from '../components/DataManager';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';
import useAuth from '../hooks/useAuth';

const SettingsPage = () => {
  const { theme, userPreferences, changeTheme, updatePreferences, showNotification } = useUI();
  const { dataState } = useData();
  const { updateProfile, hasRole, currentUser } = useAuth();

  const { user } = dataState;
  const isWorker = hasRole('worker');
  
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
    name: '',
    password: '',
    currentPassword: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Ottieni changePassword da useAuth
  const { changePassword } = useAuth();

  // Carica i dati del profilo utente dallo stato Redux e da currentUser
  useEffect(() => {
    // Ottieni i dati sia da user che da currentUser per garantire la coerenza
    const userData = user || {};
    
    // Usa i dati disponibili, dando priorità a currentUser che è più aggiornato
    const finalName = currentUser?.name || userData.name || '';
    
    // Se il nome è ancora vuoto, prova a recuperarlo dal localStorage direttamente
    if (!finalName) {
      const savedUserProfile = localStorage.getItem('crm_user_profile');
      if (savedUserProfile) {
        try {
          const parsedProfile = JSON.parse(savedUserProfile);
          if (parsedProfile.name) {
            setUserProfile({
              name: parsedProfile.name,
              password: '',
              currentPassword: ''
            });
            return;
          }
        } catch (e) {
          console.error('Errore parsing localStorage:', e);
        }
      }
    }
    
    setUserProfile({
      name: finalName,
      password: '', // Il campo password rimane sempre vuoto per sicurezza
      currentPassword: ''
    });
  }, [user, currentUser]);

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
  const saveUserProfile = async () => {
    try {
      // Assicurati che il nome non sia vuoto
      if (!userProfile.name.trim()) {
        showNotification({
          type: 'error',
          message: 'Il nome è un campo obbligatorio!'
        });
        return;
      }

      let profileSuccess = true;
      let passwordSuccess = true;

      // Aggiorna il profilo (nome)
      if (userProfile.name !== user?.name) {
        profileSuccess = await updateProfile({ name: userProfile.name });
        if (!profileSuccess) {
          showNotification({
            type: 'error',
            message: 'Errore durante l\'aggiornamento del nome'
          });
          return;
        }
      }

      // Se c'è una password, gestisci il cambio password separatamente
      if (userProfile.password) {
        if (userProfile.password.length < 6) {
          showNotification({
            type: 'error',
            message: 'La password deve essere di almeno 6 caratteri!'
          });
          return;
        }

        if (!userProfile.currentPassword) {
          showNotification({
            type: 'error',
            message: 'Inserisci la password corrente per cambiarla'
          });
          return;
        }

        passwordSuccess = await changePassword(userProfile.currentPassword, userProfile.password);
        
        if (!passwordSuccess) {
          showNotification({
            type: 'error',
            message: 'Errore durante l\'aggiornamento della password. Verifica che la password corrente sia corretta.'
          });
          return;
        }
      }

      if (profileSuccess && passwordSuccess) {
        showNotification({
          type: 'success',
          message: userProfile.password ? 'Profilo e password aggiornati con successo!' : 'Profilo aggiornato con successo!'
        });
        
        // Pulisci i campi password dopo il salvataggio
        if (userProfile.password) {
          setUserProfile(prev => ({ ...prev, password: '', currentPassword: '' }));
          setShowPasswordFields(false);
        }
      }
    } catch (error) {
      console.error('Errore durante il salvataggio del profilo:', error);
      showNotification({
        type: 'error',
        message: 'Errore durante l\'aggiornamento del profilo'
      });
    }
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
      <h2 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8 text-gray-800 dark:text-gray-100 mobile-friendly-text">Impostazioni Applicazione</h2>

      {/* Sezione Aspetto */}
      <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center mobile-friendly-text">
          <Palette size={20} className="mr-2 md:mr-3 text-indigo-500" /> Aspetto
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
      <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center mobile-friendly-text">
          <User size={20} className="mr-2 md:mr-3 text-blue-500" /> Profilo Utente
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Nome Utente</label>
            <input 
              type="text" 
              id="name" 
              value={userProfile.name}
              onChange={(e) => updateUserProfile('name', e.target.value)}
              className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target" 
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Password</label>
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 mobile-friendly-text"
              >
                {showPasswordFields ? 'Annulla cambio password' : 'Cambia password'}
              </button>
            </div>
            {showPasswordFields && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Password Corrente</label>
                  <input 
                    type="password" 
                    id="currentPassword" 
                    value={userProfile.currentPassword}
                    onChange={(e) => updateUserProfile('currentPassword', e.target.value)}
                    placeholder="Inserisci la password corrente"
                    className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target" 
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Nuova Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    value={userProfile.password}
                    onChange={(e) => updateUserProfile('password', e.target.value)}
                    placeholder="Inserisci la nuova password (min 6 caratteri)"
                    className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target" 
                  />
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={saveUserProfile}
            className="w-full md:w-auto px-4 py-3 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md mobile-friendly-text touch-target"
          >
            Salva Modifiche Profilo
          </button>
        </div>
        </div>
      

      {/* Sezione Notifiche */}
      <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center mobile-friendly-text">
          <Bell size={20} className="mr-2 md:mr-3 text-green-500" /> Notifiche
        </h3>

        <AnimatedSwitch
          id="inAppNotifications"
          checked={notificationPrefs.inAppDeadlines}
          onChange={() => toggleNotificationPref('inAppDeadlines')}
          label="Notifiche In-App per Scadenze"
        />
      </div>



      {/* Sezione Gestione Dati - Solo per Admin */}
      {!isWorker && <DataManager />}

      {/* Sezione Preferenze Dati - Solo per Admin */}
      {!isWorker && (
        <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center mobile-friendly-text">
          <Database size={20} className="mr-2 md:mr-3 text-purple-500" /> Preferenze Dati
        </h3>
        <div className="space-y-4">
           <div>
             <label htmlFor="customerCodePrefix" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Prefisso Codice Cliente</label>
             <input 
               type="text" 
               id="customerCodePrefix" 
               value={dataPrefs.customerCodePrefix}
               onChange={(e) => updateDataPref('customerCodePrefix', e.target.value)}
               className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
             />
           </div>
           <div>
             <label htmlFor="projectCodePrefix" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Prefisso Codice Progetto</label>
             <input 
               type="text" 
               id="projectCodePrefix" 
               value={dataPrefs.projectCodePrefix}
               onChange={(e) => updateDataPref('projectCodePrefix', e.target.value)}
               className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
             />
           </div>
           <div className="flex items-center justify-between">
             <div>
               <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Modalità Sviluppatore</label>
               <p className="text-xs text-gray-400 dark:text-gray-500 mobile-friendly-text">Abilita funzionalità avanzate per sviluppatori</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={dataPrefs.developerMode}
                 onChange={(e) => updateDataPref('developerMode', e.target.checked)}
                 className="sr-only peer"
               />
               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
             </label>
           </div>
           <div className="flex items-center justify-between">
             <div>
               <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Debug Mode</label>
               <p className="text-xs text-gray-400 dark:text-gray-500 mobile-friendly-text">Mostra informazioni di debug nell'interfaccia</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={dataPrefs.debugMode}
                 onChange={(e) => updateDataPref('debugMode', e.target.checked)}
                 className="sr-only peer"
               />
               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
             </label>
           </div>
         </div>
        </div>
      )}

      {/* Sezione Preferenze di Formattazione */}
      <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center mobile-friendly-text">
          <CalendarDays size={20} className="mr-2 md:mr-3 text-teal-500" /> Preferenze di Formattazione
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Formato Data</label>
            <select 
              id="dateFormat" 
              value={formattingPrefs.dateFormat}
              onChange={(e) => updateFormattingPref('dateFormat', e.target.value)}
              className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
            >
              <option value="dd/MM/yyyy">GG/MM/AAAA (es. 31/12/2023)</option>
              <option value="MM/dd/yyyy">MM/GG/AAAA (es. 12/31/2023)</option>
              <option value="yyyy-MM-dd">AAAA-MM-GG (es. 2023-12-31)</option>
              <option value="dd MMM yyyy">GG MMM AAAA (es. 31 Dic 2023)</option>
            </select>
          </div>
          <div>
            <label htmlFor="currencySymbol" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Simbolo Valuta</label>
            <select 
              id="currencySymbol" 
              value={formattingPrefs.currencySymbol}
              onChange={(e) => updateFormattingPref('currencySymbol', e.target.value)}
              className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
            >
              <option value="€">Euro (€)</option>
              <option value="$">Dollaro ($)</option>
              <option value="£">Sterlina (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sezione Impostazioni Fiscali - Solo per Admin */}
       {!isWorker && (
         <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center mobile-friendly-text">
            <FileDigit size={20} className="mr-2 md:mr-3 text-orange-500" /> Impostazioni Fiscali
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Partita IVA</label>
              <input 
                type="text" 
                id="vatNumber" 
                value={fiscalPrefs.vatNumber}
                onChange={(e) => updateFiscalPref('vatNumber', e.target.value)}
                className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
              />
            </div>
            <div>
              <label htmlFor="taxCode" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Codice Fiscale</label>
              <input 
                type="text" 
                id="taxCode" 
                value={fiscalPrefs.taxCode}
                onChange={(e) => updateFiscalPref('taxCode', e.target.value)}
                className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
              />
            </div>
            <div>
              <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Aliquota IVA Predefinita (%)</label>
              <input 
                type="number" 
                id="defaultTaxRate" 
                value={fiscalPrefs.defaultTaxRate}
                onChange={(e) => updateFiscalPref('defaultTaxRate', e.target.value)}
                className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
              />
            </div>
          </div>
        </div>
       )}

      {/* Sezione Impostazioni di Stampa - Solo per Admin */}
       {!isWorker && (
         <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center mobile-friendly-text">
            <Printer size={20} className="mr-2 md:mr-3 text-cyan-500" /> Impostazioni di Stampa
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">URL Logo Aziendale (per stampe)</label>
              <input 
                type="text" 
                id="logoUrl" 
                value={printPrefs.logoUrl}
                onChange={(e) => updatePrintPref('logoUrl', e.target.value)}
                placeholder="https://esempio.com/logo.png"
                className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
              />
            </div>
            <div>
              <label htmlFor="printHeader" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Intestazione Predefinita Stampe</label>
              <textarea 
                id="printHeader" 
                rows="3"
                value={printPrefs.printHeader}
                onChange={(e) => updatePrintPref('printHeader', e.target.value)}
                placeholder="Testo da visualizzare nell'intestazione dei documenti stampati..."
                className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
              />
            </div>
            <div>
              <label htmlFor="printFooter" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Piè di Pagina Predefinito Stampe</label>
              <textarea 
                id="printFooter" 
                rows="3"
                value={printPrefs.printFooter}
                onChange={(e) => updatePrintPref('printFooter', e.target.value)}
                placeholder="Testo da visualizzare nel piè di pagina dei documenti stampati (es. Ragione Sociale, P.IVA, Contatti)..."
                className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target"
              />
            </div>
          </div>
        </div>
       )}

      {/* Sezione Lingua e Regione (Placeholder) */}
      <div className="p-4 md:p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center mobile-friendly-text">
          <Globe size={20} className="mr-2 md:mr-3 text-yellow-500" /> Lingua e Regione
        </h3>
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mobile-friendly-text">Lingua</label>
          <select id="language" className="w-full p-3 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 mobile-friendly-text touch-target">
            <option>Italiano</option>
            <option>English (Placeholder)</option>
          </select>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 mobile-friendly-text">
          Altre impostazioni regionali e di lingua verranno aggiunte qui.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
