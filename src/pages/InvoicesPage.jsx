import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, Filter, X, Download, Send, Printer, FileCheck2, AlertTriangle, Clock } from 'lucide-react';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';

const InvoicesPage = () => {
  const { 
    isModalOpen, 
    showModal, 
    hideModal, 
    setBreadcrumbs 
  } = useUI();
  const { invoices, customers, projects, quotes, addInvoice, updateInvoice, deleteInvoice } = useData();
  const { hasRole } = useAuth();
  const isWorker = hasRole('worker');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Fatture' }]);
  }, [setBreadcrumbs]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [invoiceToView, setInvoiceToView] = useState(null);

  const [newInvoice, setNewInvoice] = useState({
    // invoiceNumber: '', // Removed: Will be auto-generated
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    projectId: '', // Opzionale
    quoteId: '', // Opzionale, per collegare a un preventivo
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 22 }],
    notes: '',
    status: 'Non Pagata', // Non Pagata, Pagata Parzialmente, Pagata, Scaduta
    paymentDetails: '',
  });

  // Nessun useEffect necessario per inizializzare le fatture
  // Le fatture vengono già caricate dal hook useData

  const generateInvoiceNumber = (date) => {
    const year = new Date(date).getFullYear();
    const invoicesThisYear = invoices.filter(inv => inv.invoiceNumber && new Date(inv.date).getFullYear() === year);
    const highestNumThisYear = invoicesThisYear.reduce((max, inv) => {
        const numPart = parseInt(inv.invoiceNumber.split('-').pop());
        return numPart > max ? numPart : max;
    }, 0);
    const nextNum = highestNumThisYear + 1;
    return `FATT-${year}-${String(nextNum).padStart(3, '0')}`;
  };

  const filteredInvoices = React.useMemo(() => {
    let invoicesToDisplay = invoices || [];
    if (searchTerm) {
      invoicesToDisplay = invoicesToDisplay.filter(
        (invoice) =>
          // (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) || // Temporarily removed for safety
          (customers.find(c => c.id === invoice.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          invoice.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice.invoiceNumber && typeof invoice.invoiceNumber === 'string' && invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return invoicesToDisplay.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [searchTerm, invoices, customers]);

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = subtotal * (item.taxRate / 100);
    return subtotal + taxAmount;
  };

  const calculateInvoiceTotal = (items) => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewInvoice((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleAddItem = () => {
    setNewInvoice((prev) => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 22 }] }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = newInvoice.items.filter((_, i) => i !== index);
    setNewInvoice((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleAddInvoice = (e) => {
    e.preventDefault();
    const generatedInvoiceNumber = generateInvoiceNumber(newInvoice.date);
    const invoiceToAdd = {
      ...newInvoice,
      type: 'invoice', // Specifica il tipo come fattura
      invoiceNumber: generatedInvoiceNumber, // Added auto-generated number
      total: calculateInvoiceTotal(newInvoice.items),
      customerId: parseInt(newInvoice.customerId),
      projectId: newInvoice.projectId ? parseInt(newInvoice.projectId) : null,
      quoteId: newInvoice.quoteId ? parseInt(newInvoice.quoteId) : null,
    };
    addInvoice(invoiceToAdd);
    hideModal('addInvoice');
    setNewInvoice({
      // invoiceNumber: '', // Removed
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      customerId: '',
      projectId: '',
      quoteId: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 22 }],
      notes: '',
      status: 'Non Pagata',
      paymentDetails: '',
    });
  };

  const handleEditInvoice = (invoice) => {
    setCurrentInvoice({ 
      ...invoice, 
      date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : '',
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    });
    showModal({ id: 'editInvoice', type: 'edit' });
  };

  const handleCurrentInvoiceItemChange = (index, field, value) => {
    const updatedItems = [...currentInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setCurrentInvoice((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleCurrentInvoiceAddItem = () => {
    setCurrentInvoice((prev) => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 22 }] }));
  };

  const handleCurrentInvoiceRemoveItem = (index) => {
    const updatedItems = currentInvoice.items.filter((_, i) => i !== index);
    setCurrentInvoice((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleUpdateInvoice = (e) => {
    e.preventDefault();
    const updatedInvoice = { ...currentInvoice, type: 'invoice', total: calculateInvoiceTotal(currentInvoice.items) };
    updateInvoice(currentInvoice.id, updatedInvoice);
    hideModal('editInvoice');
    setCurrentInvoice(null);
  };

  const openConfirmDeleteModal = (invoiceId) => {
    setCurrentInvoice({ id: invoiceId });
    showModal({ id: 'deleteInvoice', type: 'delete' });
  };

  const handleDeleteInvoice = () => {
    if (currentInvoice?.id) {
      deleteInvoice(currentInvoice.id);
      hideModal('deleteInvoice');
      setCurrentInvoice(null);
    }
  };

  const handleViewInvoice = (invoice) => {
    setInvoiceToView(invoice);
    showModal({ id: 'viewInvoice', type: 'view' });
  };

  const handlePrintInvoice = (invoice) => {
    // Implementazione stampa fattura
    window.print();
  };

  const handleDownloadPDF = (invoice) => {
    const client = customers.find(c => c.id === invoice.customerId);
    const clientName = client ? client.name : 'Cliente';
    const clientAddress = client ? client.address : '';
    
    // Crea il contenuto HTML per il PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Fattura ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          .client-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FATTURA</h1>
          <h2>N. ${invoice.invoiceNumber}</h2>
        </div>
        
        <div class="invoice-details">
          <p><strong>Data:</strong> ${new Date(invoice.date).toLocaleDateString('it-IT')}</p>
          <p><strong>Scadenza:</strong> ${new Date(invoice.dueDate).toLocaleDateString('it-IT')}</p>
        </div>
        
        <div class="client-info">
          <h3>Cliente:</h3>
          <p><strong>${clientName}</strong></p>
          <p>${clientAddress}</p>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Descrizione</th>
              <th>Quantità</th>
              <th>Prezzo Unitario</th>
              <th>IVA %</th>
              <th>Subtotale</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => {
              const subtotal = item.quantity * item.unitPrice;
              const taxAmount = subtotal * ((item.taxRate || 0) / 100);
              const total = subtotal + taxAmount;
              return `
              <tr>
                <td>${item.description || ''}</td>
                <td>${item.quantity || 0}</td>
                <td>€${(item.unitPrice || 0).toFixed(2)}</td>
                <td>${item.taxRate || 0}%</td>
                <td>€${total.toFixed(2)}</td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <p>Totale Fattura: €${(invoice.total || 0).toFixed(2)}</p>
        </div>
        
        ${invoice.paymentDetails ? `<div><h3>Dettagli Pagamento:</h3><p>${invoice.paymentDetails}</p></div>` : ''}
        ${invoice.notes ? `<div><h3>Note:</h3><p>${invoice.notes}</p></div>` : ''}
      </body>
      </html>
    `;
    
    // Crea un data URL per il download diretto
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Fattura_${invoice.invoiceNumber || 'N-A'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendEmail = (invoice) => {
    const client = customers.find(c => c.id === invoice.customerId);
    const clientName = client ? client.name : 'Cliente';
    const clientEmail = client ? client.email : '';
    
    const subject = `Fattura ${invoice.invoiceNumber} - ${clientName}`;
    const body = `Gentile ${clientName},\n\nIn allegato trova la fattura ${invoice.invoiceNumber} del ${new Date(invoice.date).toLocaleDateString('it-IT')}.\n\nImporto totale: €${(invoice.total || 0).toFixed(2)}\n\nCordiali saluti,\nIl Team`;
    
    const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;
  };
  
  const getStatusPill = (status) => {
    switch (status) {
      case 'Pagata':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><FileCheck2 size={14}/> {status}</span>;
      case 'Non Pagata':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle size={14}/> {status}</span>;
      case 'Pagata Parzialmente':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock size={14}/> {status}</span>;
      case 'Scaduta':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><AlertTriangle size={14}/> {status}</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{status}</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold mobile-friendly-text">Fatture</h1>
        <button 
          onClick={() => showModal({ id: 'addInvoice', type: 'add' })}
          className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md flex items-center justify-center gap-2 mobile-friendly-text touch-target"
        >
          <Plus className="w-5 h-5" />
          Nuova Fattura
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-6 h-6 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Cerca per cliente, stato..."
              className="w-full pl-12 md:pl-10 pr-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-bg dark:bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scadenza</th>
                {!isWorker && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Totale</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-light-border dark:divide-dark-border">
              {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-light-hover dark:hover:bg-dark-hover">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">{new Date(invoice.date).toLocaleDateString('it-IT')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('it-IT') : 'N/D'}</td>
                  {!isWorker && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">
                      {customers.find(c => c.id === invoice.customerId)?.name || 'N/D'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">€{invoice.total?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusPill(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleViewInvoice(invoice)} className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded" title="Visualizza">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleEditInvoice(invoice)} className="p-1 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded" title="Modifica">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => openConfirmDeleteModal(invoice.id)} className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded" title="Elimina">
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isWorker ? "5" : "6"} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nessuna fattura trovata. {searchTerm && 'Modifica i filtri o il termine di ricerca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4">
          {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Data:</span>
                    <span className="text-sm text-light-text dark:text-dark-text mobile-friendly-text">{new Date(invoice.date).toLocaleDateString('it-IT')}</span>
                  </div>
                  {!isWorker && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente:</span>
                      <span className="text-sm text-light-text dark:text-dark-text mobile-friendly-text">{customers.find(c => c.id === invoice.customerId)?.name || 'N/D'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Scadenza:</span>
                    <span className="text-sm text-light-text dark:text-dark-text mobile-friendly-text">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('it-IT') : 'N/D'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Totale:</span>
                    <span className="text-lg font-semibold text-light-text dark:text-dark-text mobile-friendly-text">€{invoice.total?.toFixed(2)}</span>
                  </div>
                  <div className="mb-3">
                    {getStatusPill(invoice.status)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-light-border dark:border-dark-border">
                <button onClick={() => handleViewInvoice(invoice)} className="flex-1 py-2 px-3 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md flex items-center justify-center gap-2 mobile-friendly-text touch-target">
                  <Eye className="w-4 h-4" />
                  Visualizza
                </button>
                <button onClick={() => handleEditInvoice(invoice)} className="flex-1 py-2 px-3 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded-md flex items-center justify-center gap-2 mobile-friendly-text touch-target">
                  <Edit className="w-4 h-4" />
                  Modifica
                </button>
                <button onClick={() => openConfirmDeleteModal(invoice.id)} className="flex-1 py-2 px-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md flex items-center justify-center gap-2 mobile-friendly-text touch-target">
                  <Trash className="w-4 h-4" />
                  Elimina
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 mobile-friendly-text">
              Nessuna fattura trovata. {searchTerm && 'Modifica i filtri o il termine di ricerca.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal Aggiungi Fattura */}
      {isModalOpen('addInvoice') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Nuova Fattura</h2>
              <button onClick={() => hideModal('addInvoice')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddInvoice}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Numero Fattura</label>
                  <p className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg/50 dark:bg-dark-input/50 text-light-text-medium dark:text-dark-text-medium italic mobile-friendly-text">Generato automaticamente</p>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Data Fattura *</label>
                  <input type="date" name="date" id="date" value={newInvoice.date} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Data Scadenza *</label>
                  <input type="date" name="dueDate" id="dueDate" value={newInvoice.dueDate} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Cliente *</label>
                  <select name="customerId" id="customerId" value={newInvoice.customerId} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input dark:text-dark-text mobile-friendly-text touch-target">
                    <option value="">Seleziona Cliente</option>
                    {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="projectId" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Progetto (Opzionale)</label>
                  <select name="projectId" id="projectId" value={newInvoice.projectId} onChange={handleInputChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target">
                    <option value="">Nessun Progetto</option>
                    {projects.filter(p => !newInvoice.customerId || p.clientId === newInvoice.customerId).map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="quoteId" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Preventivo Collegato (Opzionale)</label>
                  <select name="quoteId" id="quoteId" value={newInvoice.quoteId} onChange={handleInputChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target">
                    <option value="">Nessun Preventivo</option>
                    {quotes.filter(q => !newInvoice.customerId || q.customerId === newInvoice.customerId).map(quote => <option key={quote.id} value={quote.id}>{quote.quoteNumber} - {customers.find(c=>c.id === quote.customerId)?.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                  <h3 className="text-md font-semibold dark:text-dark-text mobile-friendly-text">Voci della Fattura</h3>
                  <button type="button" onClick={handleAddItem} className="bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white px-4 py-2 rounded-md mobile-friendly-text touch-target">+ Aggiungi Voce</button>
                </div>
                
                {/* Desktop View */}
                <div className="hidden md:block">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                      <div className="col-span-4">
                        {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">Descrizione *</label>}
                        <input type="text" placeholder="Descrizione Voce" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input dark:text-dark-text dark:placeholder-gray-400 text-sm" />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">Quantità *</label>}
                        <input type="number" placeholder="Qtà" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} required min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">Prezzo Un. *</label>}
                        <input type="number" placeholder="Prezzo" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} required step="0.01" min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">IVA % *</label>}
                        <input type="number" placeholder="IVA" value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value))} required min="0" max="100" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                      </div>
                      <div className="col-span-1">
                        {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">Tot.</label>}
                        <span className="block p-2 text-sm">€ {calculateItemTotal(item).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="col-span-1 flex items-end">
                        {newInvoice.items.length > 1 && (
                          <button type="button" onClick={() => handleRemoveItem(index)} className="p-1 text-red-500 hover:text-red-700">
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="border border-light-border dark:border-dark-border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Voce {index + 1}</span>
                        {newInvoice.items.length > 1 && (
                          <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:text-red-700 touch-target">
                            <Trash className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Descrizione *</label>
                          <input type="text" placeholder="Descrizione Voce" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required className="w-full p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input dark:text-dark-text dark:placeholder-gray-400 mobile-friendly-text touch-target" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Quantità *</label>
                            <input type="number" placeholder="Qtà" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} required min="0" className="w-full p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Prezzo Un. *</label>
                            <input type="number" placeholder="Prezzo" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} required step="0.01" min="0" className="w-full p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">IVA % *</label>
                            <input type="number" placeholder="IVA" value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value))} required min="0" max="100" className="w-full p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Totale</label>
                            <div className="p-3 bg-light-bg dark:bg-dark-input rounded-md">
                              <span className="text-lg font-semibold mobile-friendly-text">€ {calculateItemTotal(item).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-light-bg/50 dark:bg-dark-input/50 p-4 rounded-md">
                    <label htmlFor="total" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Totale Fattura</label>
                    <p className="text-xl font-semibold mobile-friendly-text">€ {calculateInvoiceTotal(newInvoice.items).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                 <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Stato *</label>
                  <select name="status" id="status" value={newInvoice.status} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target">
                    <option value="Non Pagata">Non Pagata</option>
                    <option value="Pagata Parzialmente">Pagata Parzialmente</option>
                    <option value="Pagata">Pagata</option>
                    <option value="Scaduta">Scaduta</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="paymentDetails" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Dettagli Pagamento</label>
                <textarea name="paymentDetails" id="paymentDetails" value={newInvoice.paymentDetails} onChange={handleInputChange} rows="2" placeholder="Es. IBAN: IT..., Bonifico Bancario" className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target"></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Note Aggiuntive</label>
                <textarea name="notes" id="notes" value={newInvoice.notes} onChange={handleInputChange} rows="2" className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target"></textarea>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button type="button" onClick={() => hideModal('addInvoice')} className="px-4 py-3 sm:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text touch-target">Annulla</button>
                <button type="submit" className="px-4 py-3 sm:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text touch-target">Crea Fattura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifica Fattura */}
      {isModalOpen('editInvoice') && currentInvoice && (
         <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Modifica Fattura: {currentInvoice.invoiceNumber}</h2>
              <button onClick={() => { hideModal('editInvoice'); setCurrentInvoice(null); }} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateInvoice}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Numero Fattura</label>
                  <p className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg/50 dark:bg-dark-input/50 text-light-text-medium dark:text-dark-text-medium mobile-friendly-text">{currentInvoice?.invoiceNumber}</p>
                </div>
                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Data Fattura *</label>
                  <input type="date" name="date" id="edit-date" value={currentInvoice?.date} onChange={(e) => setCurrentInvoice({...currentInvoice, date: e.target.value})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="edit-dueDate" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Data Scadenza *</label>
                  <input type="date" name="dueDate" id="edit-dueDate" value={currentInvoice?.dueDate} onChange={(e) => setCurrentInvoice({...currentInvoice, dueDate: e.target.value})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="edit-customerId" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Cliente *</label>
                  <select name="customerId" id="edit-customerId" value={currentInvoice.customerId} onChange={(e) => setCurrentInvoice({...currentInvoice, customerId: parseInt(e.target.value)})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target">
                    <option value="">Seleziona Cliente</option>
                    {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-projectId" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Progetto (Opzionale)</label>
                  <select name="projectId" id="edit-projectId" value={currentInvoice.projectId || ''} onChange={(e) => setCurrentInvoice({...currentInvoice, projectId: e.target.value ? parseInt(e.target.value) : null})} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target">
                    <option value="">Nessun Progetto</option>
                     {projects.filter(p => !currentInvoice.customerId || p.clientId === currentInvoice.customerId).map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
                 <div>
                  <label htmlFor="edit-quoteId" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Preventivo Collegato (Opzionale)</label>
                  <select name="quoteId" id="edit-quoteId" value={currentInvoice.quoteId || ''} onChange={(e) => setCurrentInvoice({...currentInvoice, quoteId: e.target.value ? parseInt(e.target.value) : null})} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target">
                    <option value="">Nessun Preventivo</option>
                    {quotes.filter(q => !currentInvoice.customerId || q.customerId === currentInvoice.customerId).map(quote => <option key={quote.id} value={quote.id}>{quote.quoteNumber} - {customers.find(c=>c.id === quote.customerId)?.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                  <h3 className="text-md font-semibold dark:text-dark-text mobile-friendly-text">Voci della Fattura</h3>
                  <button type="button" onClick={handleCurrentInvoiceAddItem} className="bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white px-4 py-2 rounded-md mobile-friendly-text touch-target">+ Aggiungi Voce</button>
                </div>
                
                {/* Desktop View */}
                <div className="hidden md:block">
                  {currentInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                      <div className="col-span-4">
                        {index === 0 && <label className="block text-xs font-medium mb-1">Descrizione *</label>}
                        <input type="text" placeholder="Descrizione Voce" value={item.description} onChange={(e) => handleCurrentInvoiceItemChange(index, 'description', e.target.value)} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <label className="block text-xs font-medium mb-1">Quantità *</label>}
                        <input type="number" placeholder="Qtà" value={item.quantity} onChange={(e) => handleCurrentInvoiceItemChange(index, 'quantity', parseFloat(e.target.value))} required min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <label className="block text-xs font-medium mb-1">Prezzo Un. *</label>}
                        <input type="number" placeholder="Prezzo" value={item.unitPrice} onChange={(e) => handleCurrentInvoiceItemChange(index, 'unitPrice', parseFloat(e.target.value))} required step="0.01" min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <label className="block text-xs font-medium mb-1">IVA % *</label>}
                        <input type="number" placeholder="IVA" value={item.taxRate} onChange={(e) => handleCurrentInvoiceItemChange(index, 'taxRate', parseFloat(e.target.value))} required min="0" max="100" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                      </div>
                      <div className="col-span-1">
                        {index === 0 && <label className="block text-xs font-medium mb-1">Tot.</label>}
                        <span className="block p-2 text-sm">€ {calculateItemTotal(item).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="col-span-1 flex items-end">
                        {currentInvoice.items.length > 1 && (
                          <button type="button" onClick={() => handleCurrentInvoiceRemoveItem(index)} className="p-1 text-red-500 hover:text-red-700">
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {currentInvoice.items.map((item, index) => (
                    <div key={index} className="border border-light-border dark:border-dark-border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Voce {index + 1}</span>
                        {currentInvoice.items.length > 1 && (
                          <button type="button" onClick={() => handleCurrentInvoiceRemoveItem(index)} className="p-2 text-red-500 hover:text-red-700 touch-target">
                            <Trash className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Descrizione *</label>
                          <input type="text" placeholder="Descrizione Voce" value={item.description} onChange={(e) => handleCurrentInvoiceItemChange(index, 'description', e.target.value)} required className="w-full p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Quantità *</label>
                            <input type="number" placeholder="Qtà" value={item.quantity} onChange={(e) => handleCurrentInvoiceItemChange(index, 'quantity', parseFloat(e.target.value))} required min="0" className="w-full p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Prezzo Un. *</label>
                            <input type="number" placeholder="Prezzo" value={item.unitPrice} onChange={(e) => handleCurrentInvoiceItemChange(index, 'unitPrice', parseFloat(e.target.value))} required step="0.01" min="0" className="w-full p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">IVA % *</label>
                            <input type="number" placeholder="IVA" value={item.taxRate} onChange={(e) => handleCurrentInvoiceItemChange(index, 'taxRate', parseFloat(e.target.value))} required min="0" max="100" className="w-full p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Totale</label>
                            <div className="p-3 bg-light-bg dark:bg-dark-input rounded-md">
                              <span className="text-lg font-semibold mobile-friendly-text">€ {calculateItemTotal(item).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="edit-total" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Totale Fattura</label>
                    <p className="text-xl font-semibold p-3 md:p-2 mobile-friendly-text">€ {calculateInvoiceTotal(currentInvoice.items).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Stato *</label>
                  <select name="status" id="edit-status" value={currentInvoice.status} onChange={(e) => setCurrentInvoice({...currentInvoice, status: e.target.value})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target">
                    <option value="Non Pagata">Non Pagata</option>
                    <option value="Pagata Parzialmente">Pagata Parzialmente</option>
                    <option value="Pagata">Pagata</option>
                    <option value="Scaduta">Scaduta</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="edit-paymentDetails" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Dettagli Pagamento</label>
                <textarea name="paymentDetails" id="edit-paymentDetails" value={currentInvoice.paymentDetails || ''} onChange={(e) => setCurrentInvoice({...currentInvoice, paymentDetails: e.target.value})} rows="2" placeholder="Es. IBAN: IT..., Bonifico Bancario" className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target"></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="edit-notes" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Note Aggiuntive</label>
                <textarea name="notes" id="edit-notes" value={currentInvoice.notes || ''} onChange={(e) => setCurrentInvoice({...currentInvoice, notes: e.target.value})} rows="2" className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input mobile-friendly-text touch-target"></textarea>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button type="button" onClick={() => { hideModal('editInvoice'); setCurrentInvoice(null); }} className="px-4 py-3 sm:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text touch-target">Annulla</button>
                <button type="submit" className="px-4 py-3 sm:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text touch-target">Salva Modifiche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizza Fattura */}
      {isModalOpen('viewInvoice') && invoiceToView && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-4xl my-8">
            <div className="flex justify-between items-center mb-4 border-b border-light-border dark:border-dark-border pb-4">
              <h2 className="text-xl md:text-2xl font-bold mobile-friendly-text">Fattura #{invoiceToView.invoiceNumber}</h2>
              <button onClick={() => hideModal('viewInvoice')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Cliente</h3>
                <p className="font-medium dark:text-dark-text">{customers.find(c => c.id === invoiceToView.customerId)?.name || 'N/D'}</p>
                <p className="text-sm dark:text-dark-text-light">{customers.find(c => c.id === invoiceToView.customerId)?.address || ''}</p>
                <p className="text-sm dark:text-dark-text-light">{customers.find(c => c.id === invoiceToView.customerId)?.email || ''}</p>
                
              </div>
              {(invoiceToView.projectId || invoiceToView.quoteId) && (
                <div>
                  {invoiceToView.projectId && projects.find(p => p.id === invoiceToView.projectId) && (
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Progetto</h3>
                      <p className="font-medium dark:text-dark-text">{projects.find(p => p.id === invoiceToView.projectId)?.name}</p>
                    </div>
                  )}
                  {invoiceToView.quoteId && quotes.find(q => q.id === invoiceToView.quoteId) && (
                     <div>
                      <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Rif. Preventivo</h3>
                      <p className="font-medium dark:text-dark-text">{quotes.find(q => q.id === invoiceToView.quoteId)?.quoteNumber}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <h3 className="text-md font-semibold mb-2 dark:text-dark-text mobile-friendly-text">Dettaglio Voci</h3>
            
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto mb-4 border border-light-border dark:border-dark-border rounded-md">
                <table className="w-full text-sm">
                    <thead className="bg-light-bg dark:bg-dark-bg">
                        <tr>
                            <th className="p-2 text-left font-semibold dark:text-dark-text-medium">Descrizione</th>
                            <th className="p-2 text-right font-semibold dark:text-dark-text-medium">Qtà</th>
                            <th className="p-2 text-right font-semibold dark:text-dark-text-medium">Prezzo Un.</th>
                            <th className="p-2 text-right font-semibold dark:text-dark-text-medium">IVA %</th>
                            <th className="p-2 text-right font-semibold dark:text-dark-text-medium">Subtotale</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceToView.items.map((item, index) => (
                            <tr key={index} className="border-b border-light-border dark:border-dark-border last:border-b-0">
                                <td className="p-2 dark:text-dark-text-light">{item.description}</td>
                                <td className="p-2 text-right dark:text-dark-text-light">{item.quantity}</td>
                                <td className="p-2 text-right dark:text-dark-text-light">€ {item.unitPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="p-2 text-right dark:text-dark-text-light">{item.taxRate}%</td>
                                <td className="p-2 text-right dark:text-dark-text-light">€ {calculateItemTotal(item).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden mb-4 space-y-3">
                {invoiceToView.items.map((item, index) => (
                    <div key={index} className="border border-light-border dark:border-dark-border rounded-lg p-4">
                        <div className="mb-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Voce {index + 1}</span>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Descrizione:</span>
                                <p className="text-sm dark:text-dark-text-light mobile-friendly-text">{item.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantità:</span>
                                    <p className="text-sm dark:text-dark-text-light mobile-friendly-text">{item.quantity}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Prezzo Un.:</span>
                                    <p className="text-sm dark:text-dark-text-light mobile-friendly-text">€ {item.unitPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">IVA %:</span>
                                    <p className="text-sm dark:text-dark-text-light mobile-friendly-text">{item.taxRate}%</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Subtotale:</span>
                                    <p className="text-lg font-semibold dark:text-dark-text mobile-friendly-text">€ {calculateItemTotal(item).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end mb-6">
                <div className="text-right">
                    {/* <p className="text-sm text-gray-500 dark:text-gray-400">Imponibile: € ...</p> */}
                    {/* <p className="text-sm text-gray-500 dark:text-gray-400">IVA Totale: € ...</p> */}
                    <p className="text-xl font-bold dark:text-dark-text">Totale Fattura: € {invoiceToView.total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>

            {invoiceToView.paymentDetails && (
              <div className="mb-6 p-3 bg-light-bg dark:bg-dark-input rounded-md">
                <h4 className="font-semibold text-sm mb-1 dark:text-dark-text-medium">Dettagli Pagamento:</h4>
                <p className="text-sm whitespace-pre-wrap dark:text-dark-text-light">{invoiceToView.paymentDetails}</p>
              </div>
            )}

            {invoiceToView.notes && (
              <div className="mb-6 p-3 bg-light-bg dark:bg-dark-input rounded-md">
                <h4 className="font-semibold text-sm mb-1 dark:text-dark-text-medium">Note:</h4>
                <p className="text-sm whitespace-pre-wrap dark:text-dark-text-light">{invoiceToView.notes}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>{getStatusPill(invoiceToView.status)}</div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button onClick={() => handlePrintInvoice(invoiceToView)} className="px-3 py-3 sm:py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center justify-center gap-1.5 mobile-friendly-text touch-target"><Printer size={16}/> Stampa</button>
                    <button onClick={() => handleDownloadPDF(invoiceToView)} className="px-3 py-3 sm:py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center justify-center gap-1.5 mobile-friendly-text touch-target"><Download size={16}/> Scarica PDF</button>
                    <button onClick={() => handleSendEmail(invoiceToView)} className="px-3 py-3 sm:py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center justify-center gap-1.5 mobile-friendly-text touch-target"><Send size={16}/> Invia Email</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {isModalOpen('deleteInvoice') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-sm">
            <h2 className="text-lg md:text-xl font-semibold mb-4 mobile-friendly-text">Conferma Eliminazione</h2>
            <p className="mb-6 mobile-friendly-text">Sei sicuro di voler eliminare questa fattura? L'azione è irreversibile.</p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => hideModal('deleteInvoice')} className="px-4 py-3 sm:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text touch-target">Annulla</button>
              <button onClick={handleDeleteInvoice} className="px-4 py-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-md mobile-friendly-text touch-target">Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
