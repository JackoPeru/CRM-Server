import React from 'react';
import { User, Bell, Globe, Palette, Sun, Moon, CalendarDays, Euro, DollarSign, PoundSterling, FileDigit, Printer, Network, Server, Wifi } from 'lucide-react'; // Icone per le sezioni

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

import { Database } from 'lucide-react'; // Importa l'icona per le preferenze dati
import { useState, useEffect } from 'react';

const SettingsPage = ({ darkMode, toggleDarkMode, notificationPrefs, toggleNotificationPref, dataPrefs, updateDataPref, formattingPrefs, updateFormattingPref, fiscalPrefs, updateFiscalPref, printPrefs, updatePrintPref, networkPrefs, updateNetworkPref }) => {
  const [serverStatus, setServerStatus] = useState({ isRunning: false, port: null });
  const [localIP, setLocalIP] = useState('');

  // Carica lo stato del server e l'IP locale all'avvio
  useEffect(() => {
    const loadServerInfo = async () => {
      try {
        // Verifica se electronAPI è disponibile
        if (window.electronAPI && window.electronAPI.network) {
          const status = await window.electronAPI.network.getServerStatus();
          setServerStatus(status);
          
          const ipResult = await window.electronAPI.network.getLocalIP();
          if (ipResult.success) {
            setLocalIP(ipResult.ip);
          }
        } else {
          console.log('ElectronAPI non disponibile - modalità browser');
        }
      } catch (error) {
        console.error('Errore caricamento info server:', error);
      }
    };
    
    loadServerInfo();
    
    // Controlla lo stato del server ogni 5 secondi se siamo in modalità master
    const interval = setInterval(() => {
      if (networkPrefs.mode === 'master' && window.electronAPI && window.electronAPI.network) {
        loadServerInfo();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [networkPrefs.mode]);

  const handleTestConnection = async () => {
    if (networkPrefs.mode !== 'client') return;
    
    try {
      // Verifica se electronAPI è disponibile
      if (!window.electronAPI || !window.electronAPI.network) {
        // Simulazione per il browser - solo per test UI
        console.log('🌐 Modalità browser: simulazione test connessione');
        updateNetworkPref('connectionStatus', 'connected');
        alert('✅ [SIMULAZIONE BROWSER] Connessione riuscita!\n\nNota: Questa è solo una simulazione per testare l\'interfaccia. Per funzionalità reali, usa l\'app Electron.');
        return;
      }
      
      const result = await window.electronAPI.network.testConnection(
        networkPrefs.serverAddress,
        networkPrefs.serverPort
      );
      
      if (result.success) {
        updateNetworkPref('connectionStatus', 'connected');
        alert('✅ Connessione riuscita!');
      } else {
        updateNetworkPref('connectionStatus', 'disconnected');
        alert('❌ Connessione fallita: ' + (result.error || 'Server non raggiungibile'));
      }
    } catch (error) {
      console.error('Errore test connessione:', error);
      alert('❌ Errore durante il test: ' + error.message);
    }
  };

  const handleSyncNow = async () => {
    if (networkPrefs.mode !== 'client') return;
    
    try {
      // Verifica se electronAPI è disponibile
      if (!window.electronAPI || !window.electronAPI.network) {
        // Simulazione per il browser - solo per test UI
        console.log('🌐 Modalità browser: simulazione sincronizzazione');
        updateNetworkPref('lastSync', new Date().toISOString());
        updateNetworkPref('connectionStatus', 'connected');
        alert('✅ [SIMULAZIONE BROWSER] Sincronizzazione completata!\n\nNota: Questa è solo una simulazione per testare l\'interfaccia. Per funzionalità reali, usa l\'app Electron.');
        return;
      }
      
      const collections = ['customers', 'projects', 'materials', 'invoices'];
      let syncSuccess = true;
      
      for (const collection of collections) {
        const result = await window.electronAPI.network.syncData(
          collection,
          networkPrefs.serverAddress,
          networkPrefs.serverPort
        );
        
        if (!result.success) {
          syncSuccess = false;
          break;
        }
      }
      
      if (syncSuccess) {
        updateNetworkPref('lastSync', new Date().toISOString());
        updateNetworkPref('connectionStatus', 'connected');
        alert('✅ Sincronizzazione completata!');
      } else {
        updateNetworkPref('connectionStatus', 'disconnected');
        alert('❌ Errore durante la sincronizzazione');
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      alert('❌ Errore durante la sincronizzazione: ' + error.message);
    }
  };

  const handleStartServer = async () => {
    try {
      // Verifica se electronAPI è disponibile
      if (!window.electronAPI || !window.electronAPI.network) {
        // Simulazione per il browser - solo per test UI
        console.log('🌐 Modalità browser: simulazione avvio server');
        const port = networkPrefs.masterPort || 3001;
        setServerStatus({ isRunning: true, port });
        updateNetworkPref('connectionStatus', 'connected');
        alert('✅ [SIMULAZIONE BROWSER] Server avviato sulla porta ' + port + '\n\nNota: Questa è solo una simulazione per testare l\'interfaccia. Per funzionalità reali, usa l\'app Electron.');
        return;
      }
      
      const port = networkPrefs.masterPort || 3001;
      const result = await window.electronAPI.network.startServer(port);
      
      if (result.success) {
        // Rileggi lo stato del server dal backend per assicurarsi che sia aggiornato
        const status = await window.electronAPI.network.getServerStatus();
        setServerStatus(status);
        updateNetworkPref('connectionStatus', 'connected');
        alert('✅ Server avviato sulla porta ' + port);
      } else {
        alert('❌ Errore avvio server: ' + (result.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Errore avvio server:', error);
      alert('❌ Errore durante l\'avvio del server: ' + error.message);
    }
  };

  const handleStopServer = async () => {
    try {
      // Verifica se electronAPI è disponibile
      if (!window.electronAPI || !window.electronAPI.network) {
        // Simulazione per il browser - solo per test UI
        console.log('🌐 Modalità browser: simulazione arresto server');
        setServerStatus({ isRunning: false, port: null });
        updateNetworkPref('connectionStatus', 'disconnected');
        alert('✅ [SIMULAZIONE BROWSER] Server fermato\n\nNota: Questa è solo una simulazione per testare l\'interfaccia. Per funzionalità reali, usa l\'app Electron.');
        return;
      }
      
      const result = await window.electronAPI.network.stopServer();
      
      if (result.success) {
        // Rileggi lo stato del server dal backend per assicurarsi che sia aggiornato
        const status = await window.electronAPI.network.getServerStatus();
        setServerStatus(status);
        updateNetworkPref('connectionStatus', 'disconnected');
        alert('✅ Server fermato');
      } else {
        alert('❌ Errore arresto server: ' + (result.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Errore arresto server:', error);
      alert('❌ Errore durante l\'arresto del server: ' + error.message);
    }
  };

  // Salva le preferenze di rete quando cambiano
  const handleNetworkPrefChange = async (key, value) => {
    updateNetworkPref(key, value);
    
    // Salva anche tramite Electron per gestire il server
    try {
      const updatedPrefs = { ...networkPrefs, [key]: value };
      await window.electronAPI.network.saveNetworkPrefs(updatedPrefs);
    } catch (error) {
      console.error('Errore salvataggio preferenze:', error);
    }
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
            <input type="text" id="username" defaultValue="Mario Rossi" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <input type="email" id="email" defaultValue="mario.rossi@example.com" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">Salva Modifiche Profilo</button>
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

      {/* Sezione Condivisione Dati */}
      <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <Network size={24} className="mr-3 text-blue-500" /> Condivisione Dati
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="networkMode" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Modalità di Funzionamento</label>
            <select 
              id="networkMode" 
              value={networkPrefs.mode}
              onChange={(e) => handleNetworkPrefChange('mode', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="standalone">🖥️ Standalone (Solo questo PC)</option>
              <option value="master">🏠 Master (Server - Condivide i dati)</option>
              <option value="client">📡 Client (Si connette al Master)</option>
            </select>
          </div>
          
          {networkPrefs.mode === 'client' && (
            <>
              <div>
                <label htmlFor="serverAddress" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Indirizzo IP Server Master</label>
                <input 
                  type="text" 
                  id="serverAddress" 
                  value={networkPrefs.serverAddress}
                  onChange={(e) => handleNetworkPrefChange('serverAddress', e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="serverPort" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Porta Server</label>
                <input 
                  type="number" 
                  id="serverPort" 
                  value={networkPrefs.serverPort}
                  onChange={(e) => handleNetworkPrefChange('serverPort', e.target.value)}
                  placeholder="3001"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}
          
          {networkPrefs.mode === 'master' && (
            <div>
              <label htmlFor="masterPort" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Porta Server (Master)</label>
              <input 
                type="number" 
                id="masterPort" 
                value={networkPrefs.masterPort}
                onChange={(e) => handleNetworkPrefChange('masterPort', e.target.value)}
                placeholder="3001"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Stato Connessione:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                networkPrefs.connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {networkPrefs.connectionStatus === 'connected' ? '🟢 Connesso' : '🔴 Disconnesso'}
              </span>
            </div>
            
            {networkPrefs.mode === 'master' && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Stato Server:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  serverStatus.isRunning
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {serverStatus.isRunning ? '🟣 Server Attivo' : '⚫ Server Inattivo'}
                </span>
              </div>
            )}
          </div>
          
          {networkPrefs.lastSync && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Ultima sincronizzazione: {new Date(networkPrefs.lastSync).toLocaleString('it-IT')}
            </div>
          )}
          
          <div className="flex space-x-3">
            <button 
              onClick={handleTestConnection}
              disabled={networkPrefs.mode !== 'client'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md text-sm"
            >
              🔍 Testa Connessione
            </button>
            <button 
              onClick={handleSyncNow}
              disabled={networkPrefs.mode !== 'client'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm"
            >
              🔄 Sincronizza Ora
            </button>
            {networkPrefs.mode === 'master' && (
              <div className="space-y-3">
                {localIP && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>IP Locale:</strong> {localIP}:{networkPrefs.masterPort || 3001}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Condividi questo indirizzo con i PC client
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!serverStatus.isRunning ? (
                    <button
                      onClick={handleStartServer}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm"
                    >
                      🚀 Avvia Server
                    </button>
                  ) : (
                    <button
                      onClick={handleStopServer}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                    >
                      🛑 Ferma Server
                    </button>
                  )}
                </div>
                
                {serverStatus.isRunning && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✅ Server attivo sulla porta {serverStatus.port}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">ℹ️ Informazioni Modalità:</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              {networkPrefs.mode === 'standalone' && (
                <li>• I dati sono salvati solo su questo PC</li>
              )}
              {networkPrefs.mode === 'master' && (
                <>
                  <li>• Questo PC condivide i suoi dati con altri PC Client</li>
                  <li>• Avvia automaticamente un server locale per la condivisione</li>
                  <li>• I dati principali risiedono su questo PC</li>
                </>
              )}
              {networkPrefs.mode === 'client' && (
                <>
                  <li>• Questo PC si connette a un PC Master per sincronizzare i dati</li>
                  <li>• I dati vengono scaricati dal server Master</li>
                  <li>• Funziona anche offline con cache locale</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

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
