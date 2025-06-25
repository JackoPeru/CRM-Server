import React, { useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, FileText, Database } from 'lucide-react';

const DataManager = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

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
        // Includi anche le impostazioni
        settings: {
          darkMode: localStorage.getItem('darkMode'),
          notificationPrefs: localStorage.getItem('notificationPrefs'),
          dataPrefs: localStorage.getItem('dataPrefs'),
          formattingPrefs: localStorage.getItem('formattingPrefs'),
          fiscalPrefs: localStorage.getItem('fiscalPrefs'),
          printPrefs: localStorage.getItem('printPrefs'),
          networkPrefs: localStorage.getItem('networkPrefs')
        },
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      // Crea il file JSON
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Crea il link per il download
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crm-marmeria-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Simula il click per scaricare
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Pulisce l'URL
      URL.revokeObjectURL(url);
      
      setExportStatus({ type: 'success', message: 'Dati esportati con successo!' });
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
      setExportStatus({ type: 'error', message: 'Errore durante l\'esportazione: ' + error.message });
    } finally {
      setIsExporting(false);
    }
  };

  // Funzione per importare i dati
  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent);

      // Verifica la struttura del file
      if (!importedData.version || !importedData.exportDate) {
        throw new Error('File di backup non valido o corrotto');
      }

      // Conferma prima di sovrascrivere
      const confirmImport = window.confirm(
        `Sei sicuro di voler importare i dati dal backup del ${new Date(importedData.exportDate).toLocaleDateString()}?\n\n` +
        'ATTENZIONE: Questa operazione sovrascriverà tutti i dati attuali!\n\n' +
        'Si consiglia di fare un backup dei dati attuali prima di procedere.'
      );

      if (!confirmImport) {
        setIsImporting(false);
        return;
      }

      // Importa i dati delle collezioni
      const collections = ['customers', 'projects', 'materials', 'invoices', 'quotes'];
      let importedCount = 0;

      collections.forEach(collection => {
        if (importedData[collection] && Array.isArray(importedData[collection])) {
          localStorage.setItem(collection, JSON.stringify(importedData[collection]));
          importedCount += importedData[collection].length;
        }
      });

      // Importa le impostazioni se presenti
      if (importedData.settings) {
        Object.entries(importedData.settings).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            localStorage.setItem(key, value);
          }
        });
      }

      setImportStatus({ 
        type: 'success', 
        message: `Dati importati con successo! ${importedCount} elementi ripristinati.\n\nRicarica la pagina per vedere i cambiamenti.` 
      });

      // Ricarica la pagina dopo 3 secondi
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      setImportStatus({ type: 'error', message: 'Errore durante l\'importazione: ' + error.message });
    } finally {
      setIsImporting(false);
      // Reset del file input
      event.target.value = '';
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