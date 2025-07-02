import React, { useState, useEffect } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, FileText, Database } from 'lucide-react';

const DataManager = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [availableBackups, setAvailableBackups] = useState([]);
  
  // Ottieni le preferenze di rete per verificare se c'è una cartella condivisa
  const getNetworkPrefs = () => {
    try {
      return JSON.parse(localStorage.getItem('networkPrefs') || '{}');
    } catch {
      return {};
    }
  };

  // Funzione per caricare i backup disponibili dalla cartella condivisa
  const loadAvailableBackups = async () => {
    const networkPrefs = getNetworkPrefs();
    
    if (window.electronAPI && networkPrefs.sharedPath) {
      try {
        const result = await window.electronAPI.network.listBackupsInSharedFolder();
        if (result.success) {
          setAvailableBackups(result.files);
        }
      } catch (error) {
        console.error('Errore nel caricamento dei backup:', error);
      }
    }
  };
  
  // Carica i backup disponibili all'avvio
  useEffect(() => {
    loadAvailableBackups();
  }, []);
  
  // Funzione per esportare tutti i dati
  const exportData = async () => {
    setIsExporting(true);
    setExportStatus(null);
    
    try {
      // Raccoglie tutti i dati dal localStorage
      const allData = {
        customers: JSON.parse(localStorage.getItem('customers') || '[]'),
        projects: JSON.parse(localStorage.getItem('projects') || '[]'),
        materials: JSON.parse(localStorage.getItem('materials') || '[]'),
        invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
        quotes: JSON.parse(localStorage.getItem('quotes') || '[]'),
        settings: {
          companyInfo: JSON.parse(localStorage.getItem('companyInfo') || '{}'),
          invoiceSettings: JSON.parse(localStorage.getItem('invoiceSettings') || '{}'),
          quoteSettings: JSON.parse(localStorage.getItem('quoteSettings') || '{}'),
          materialCategories: JSON.parse(localStorage.getItem('materialCategories') || '[]'),
          workCategories: JSON.parse(localStorage.getItem('workCategories') || '[]'),
          networkPrefs: JSON.parse(localStorage.getItem('networkPrefs') || '{}')
        },
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const filename = `crm-marmeria-backup-${new Date().toISOString().split('T')[0]}.json`;
      const networkPrefs = getNetworkPrefs();
      
      // Se c'è una cartella condivisa configurata e siamo in Electron, salva lì
      if (window.electronAPI && networkPrefs.sharedPath) {
        const result = await window.electronAPI.network.saveBackupToSharedFolder(allData, filename);
        if (result.success) {
          setExportStatus({ type: 'success', message: `Backup salvato nella cartella condivisa: ${result.path}` });
          loadAvailableBackups(); // Ricarica la lista dei backup
          return;
        } else {
          console.warn('Fallback al download del browser:', result.error);
        }
      }
      
      // Fallback: download del browser
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      setExportStatus({ type: 'success', message: 'Backup esportato con successo!' });
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
      setExportStatus({ type: 'error', message: 'Errore durante l\'esportazione dei dati' });
    } finally {
      setIsExporting(false);
    }
  };

  // Funzione per importare backup dalla cartella condivisa
  const importFromSharedFolder = async (filename) => {
    setIsImporting(true);
    setImportStatus(null);
    
    try {
      const result = await window.electronAPI.network.loadBackupFromSharedFolder(filename);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      await processImportedData(result.data);
      setImportStatus({ type: 'success', message: `Backup "${filename}" importato con successo dalla cartella condivisa!` });
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      setImportStatus({ type: 'error', message: 'Errore durante l\'importazione: ' + error.message });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Funzione per processare i dati importati
  const processImportedData = async (importedData, skipConfirm = false) => {
    // Verifica la struttura del file
    if (!importedData.version || !importedData.exportDate) {
      throw new Error('File di backup non valido o corrotto');
    }
    
    // Conferma prima di sovrascrivere (solo se non è stato saltato)
    if (!skipConfirm) {
      const confirmImport = window.confirm(
        `Sei sicuro di voler importare i dati dal backup del ${new Date(importedData.exportDate).toLocaleDateString()}?\n\n` +
        'ATTENZIONE: Questa operazione sovrascriverà tutti i dati attuali!\n\n' +
        'Si consiglia di fare un backup dei dati attuali prima di procedere.'
      );

      if (!confirmImport) {
        throw new Error('Importazione annullata dall\'utente');
      }
    }
    
    // Importa i dati principali
    if (importedData.customers) {
      localStorage.setItem('customers', JSON.stringify(importedData.customers));
    }
    if (importedData.projects) {
      localStorage.setItem('projects', JSON.stringify(importedData.projects));
    }
    if (importedData.materials) {
      localStorage.setItem('materials', JSON.stringify(importedData.materials));
    }
    if (importedData.invoices) {
      localStorage.setItem('invoices', JSON.stringify(importedData.invoices));
    }
    if (importedData.quotes) {
      localStorage.setItem('quotes', JSON.stringify(importedData.quotes));
    }
    
    // Importa le impostazioni
    if (importedData.settings) {
      Object.keys(importedData.settings).forEach(key => {
        if (importedData.settings[key] !== null && importedData.settings[key] !== undefined) {
          localStorage.setItem(key, JSON.stringify(importedData.settings[key]));
        }
      });
    }
    
    // Ricarica la pagina per applicare le modifiche
    window.location.reload();
  };

  // Funzione per importare i dati da file
  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent);
      
      await processImportedData(importedData);
      setImportStatus({ type: 'success', message: 'Dati importati con successo!' });
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      setImportStatus({ type: 'error', message: 'Errore durante l\'importazione: ' + error.message });
    } finally {
      setIsImporting(false);
    }
  };

  // Funzione per cancellare tutti i dati
  const clearAllData = () => {
    const confirmClear = window.confirm(
      'ATTENZIONE: Questa operazione cancellerà TUTTI i dati dell\'applicazione!\n\n' +
      'Questa azione è IRREVERSIBILE!\n\n' +
      'Si consiglia vivamente di esportare un backup prima di procedere.\n\n' +
      'Sei sicuro di voler continuare?'
    );

    if (confirmClear) {
      const secondConfirm = window.confirm(
        'ULTIMA CONFERMA:\n\n' +
        'Stai per cancellare TUTTI i dati. Questa azione NON può essere annullata.\n\n' +
        'Clicca OK solo se sei ASSOLUTAMENTE sicuro.'
      );

      if (secondConfirm) {
        // Cancella tutti i dati delle collezioni
        const collections = ['customers', 'projects', 'materials', 'invoices', 'quotes'];
        collections.forEach(collection => {
          localStorage.removeItem(collection);
        });

        alert('Tutti i dati sono stati cancellati.\n\nLa pagina verrà ricaricata.');
        window.location.reload();
      }
    }
  };

  return (
    <div className="mb-10 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
        <Database size={24} className="mr-3 text-blue-500" /> Gestione Dati
      </h3>
      
      <div className="space-y-6">
        {/* Sezione Esportazione */}
        <div className="border-b border-gray-200 dark:border-gray-600 pb-6">
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
            <Download size={20} className="mr-2 text-green-500" /> Esporta Dati
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Esporta tutti i dati dell'applicazione (clienti, progetti, materiali, fatture, preventivi e impostazioni) in un file JSON.
          </p>
          <button
            onClick={exportData}
            disabled={isExporting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm flex items-center transition-colors"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Esportazione...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Esporta Backup
              </>
            )}
          </button>
          
          {exportStatus && (
            <div className={`mt-3 p-3 rounded-md flex items-center ${
              exportStatus.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              {exportStatus.type === 'success' ? (
                <CheckCircle size={16} className="mr-2" />
              ) : (
                <AlertTriangle size={16} className="mr-2" />
              )}
              {exportStatus.message}
            </div>
          )}
        </div>

        {/* Sezione Importazione */}
        <div className="border-b border-gray-200 dark:border-gray-600 pb-6">
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
            <Upload size={20} className="mr-2 text-blue-500" /> Importa Dati
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Importa i dati da un file di backup precedentemente esportato. 
            <strong className="text-red-600 dark:text-red-400"> ATTENZIONE: Questa operazione sovrascriverà tutti i dati attuali!</strong>
          </p>
          <div className="flex items-center space-x-4">
            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm cursor-pointer flex items-center transition-colors">
              <Upload size={16} className="mr-2" />
              {isImporting ? 'Importazione...' : 'Seleziona File Backup'}
              <input
                type="file"
                accept=".json"
                onChange={importData}
                disabled={isImporting}
                className="hidden"
              />
            </label>
            {isImporting && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
          </div>
          
          {importStatus && (
            <div className={`mt-3 p-3 rounded-md flex items-start ${
              importStatus.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              )}
              <span className="whitespace-pre-line">{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Sezione Backup dalla Cartella Condivisa */}
        {getNetworkPrefs().sharedPath && window.electronAPI && (
          <div className="border-b border-gray-200 dark:border-gray-600 pb-6">
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
              <Database size={20} className="mr-2 text-green-500" /> Backup dalla Cartella Condivisa
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Backup disponibili nella cartella condivisa: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{getNetworkPrefs().sharedPath}</code>
            </p>
            
            <div className="space-y-2">
              {availableBackups.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Nessun backup trovato nella cartella condivisa
                </p>
              ) : (
                availableBackups.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{backup.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(backup.modified).toLocaleString()} • {(backup.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={() => importFromSharedFolder(backup.name)}
                      disabled={isImporting}
                      className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
                    >
                      {isImporting ? 'Importando...' : 'Importa'}
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <button
              onClick={loadAvailableBackups}
              className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              Aggiorna Lista
            </button>
          </div>
        )}

        {/* Sezione Cancellazione Dati */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
            <AlertTriangle size={20} className="mr-2 text-red-500" /> Cancella Tutti i Dati
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <strong className="text-red-600 dark:text-red-400">ATTENZIONE:</strong> Questa operazione cancellerà permanentemente tutti i dati dell'applicazione. 
            Si consiglia vivamente di esportare un backup prima di procedere.
          </p>
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm flex items-center transition-colors"
          >
            <AlertTriangle size={16} className="mr-2" />
            Cancella Tutti i Dati
          </button>
        </div>

        {/* Informazioni aggiuntive */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
            <FileText size={16} className="mr-2" /> Informazioni sui Backup
          </h5>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• I file di backup includono tutti i dati e le impostazioni dell'applicazione</li>
            <li>• I backup sono compatibili solo con la stessa versione dell'applicazione</li>
            <li>• Si consiglia di fare backup regolari, specialmente prima degli aggiornamenti</li>
            <li>• I file di backup sono in formato JSON e possono essere aperti con qualsiasi editor di testo</li>
            <li>• Per la massima sicurezza, conserva i backup in più posizioni (cloud, USB, ecc.)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataManager;