import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, Filter, X, Download, Send, Printer, FileCheck2, AlertTriangle, Clock } from 'lucide-react';

const InvoicesPage = ({ 
  invoices: initialInvoices, 
  setInvoices: setAppInvoices, 
  customers, 
  projects, 
  quotes, 
  onNavigate 
}) => {
  const [invoices, setInvoices] = useState(initialInvoices || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [invoiceToView, setInvoiceToView] = useState(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState(null);

  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: '',
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

  useEffect(() => {
    setInvoices(initialInvoices || []);
  }, [initialInvoices]);

  useEffect(() => {
    let invoicesToDisplay = invoices || [];
    if (searchTerm) {
      invoicesToDisplay = invoicesToDisplay.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customers.find(c => c.id === invoice.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredInvoices(invoicesToDisplay.sort((a, b) => new Date(b.date) - new Date(a.date)));
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
    const newId = invoices.length > 0 ? Math.max(...invoices.map(inv => inv.id)) + 1 : 1;
    const invoiceToAdd = {
      ...newInvoice,
      id: newId,
      total: calculateInvoiceTotal(newInvoice.items),
      customerId: parseInt(newInvoice.customerId),
      projectId: newInvoice.projectId ? parseInt(newInvoice.projectId) : null,
      quoteId: newInvoice.quoteId ? parseInt(newInvoice.quoteId) : null,
    };
    setAppInvoices((prevInvoices) => [...(prevInvoices || []), invoiceToAdd]);
    setIsModalOpen(false);
    setNewInvoice({
      invoiceNumber: '',
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
    setIsEditModalOpen(true);
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
    setAppInvoices((prevInvoices) =>
      (prevInvoices || []).map((inv) =>
        inv.id === currentInvoice.id ? { ...currentInvoice, total: calculateInvoiceTotal(currentInvoice.items) } : inv
      )
    );
    setIsEditModalOpen(false);
    setCurrentInvoice(null);
  };

  const openConfirmDeleteModal = (invoiceId) => {
    setInvoiceToDeleteId(invoiceId);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleDeleteInvoice = () => {
    if (invoiceToDeleteId) {
      setAppInvoices((prevInvoices) =>
        (prevInvoices || []).filter((invoice) => invoice.id !== invoiceToDeleteId)
      );
      setIsConfirmDeleteModalOpen(false);
      setInvoiceToDeleteId(null);
    }
  };

  const handleViewInvoice = (invoice) => {
    setInvoiceToView(invoice);
    setIsViewModalOpen(true);
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
    <div className="p-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Fatture</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuova Fattura
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca per numero, cliente, stato..."
              className="w-full pl-10 pr-4 py-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-bg dark:bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Numero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scadenza</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Totale</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(invoice.date).toLocaleDateString('it-IT')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('it-IT') : 'N/D'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customers.find(c => c.id === invoice.customerId)?.name || 'N/D'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">€ {invoice.total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nessuna fattura trovata. {searchTerm && 'Modifica i filtri o il termine di ricerca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Aggiungi Fattura */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Nuova Fattura</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddInvoice}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Numero Fattura *</label>
                  <input type="text" name="invoiceNumber" id="invoiceNumber" value={newInvoice.invoiceNumber} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input dark:text-dark-text dark:placeholder-gray-400" />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Data Fattura *</label>
                  <input type="date" name="date" id="date" value={newInvoice.date} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input" />
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Data Scadenza *</label>
                  <input type="date" name="dueDate" id="dueDate" value={newInvoice.dueDate} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input" />
                </div>
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Cliente *</label>
                  <select name="customerId" id="customerId" value={newInvoice.customerId} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input dark:text-dark-text">
                    <option value="">Seleziona Cliente</option>
                    {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="projectId" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Progetto (Opzionale)</label>
                  <select name="projectId" id="projectId" value={newInvoice.projectId} onChange={handleInputChange} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="">Nessun Progetto</option>
                    {projects.filter(p => !newInvoice.customerId || p.clientId === parseInt(newInvoice.customerId)).map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="quoteId" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Preventivo Collegato (Opzionale)</label>
                  <select name="quoteId" id="quoteId" value={newInvoice.quoteId} onChange={handleInputChange} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="">Nessun Preventivo</option>
                    {quotes.filter(q => !newInvoice.customerId || q.customerId === parseInt(newInvoice.customerId)).map(quote => <option key={quote.id} value={quote.id}>{quote.quoteNumber} - {customers.find(c=>c.id === quote.customerId)?.name}</option>)}
                  </select>
                </div>
              </div>

              <h3 class="text-md font-semibold mb-2 mt-4 dark:text-dark-text">Voci della Fattura</h3>
              {newInvoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <div class="col-span-4">
                    {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">Descrizione *</label>}
                    <input type="text" placeholder="Descrizione Voce" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input dark:text-dark-text dark:placeholder-gray-400 text-sm" />
                  </div>
                  <div class="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">Quantità *</label>}
                    <input type="number" placeholder="Qtà" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} required min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div class="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">Prezzo Un. *</label>}
                    <input type="number" placeholder="Prezzo" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} required step="0.01" min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div class="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">IVA % *</label>}
                    <input type="number" placeholder="IVA" value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value))} required min="0" max="100" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div class="col-span-1">
                    {index === 0 && <label className="block text-xs font-medium mb-1 dark:text-dark-text-medium">Tot.</label>}
                    <span className="block p-2 text-sm">€ {calculateItemTotal(item).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div class="col-span-1 flex items-end">
                    {newInvoice.items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(index)} className="p-1 text-red-500 hover:text-red-700">
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddItem} className="mt-1 mb-4 text-sm text-light-primary dark:text-dark-primary hover:underline">+ Aggiungi Voce</button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="total" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Totale Fattura</label>
                    <p className="text-xl font-semibold p-2">€ {calculateInvoiceTotal(newInvoice.items).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                 <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Stato *</label>
                  <select name="status" id="status" value={newInvoice.status} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="Non Pagata">Non Pagata</option>
                    <option value="Pagata Parzialmente">Pagata Parzialmente</option>
                    <option value="Pagata">Pagata</option>
                    <option value="Scaduta">Scaduta</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="paymentDetails" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Dettagli Pagamento</label>
                <textarea name="paymentDetails" id="paymentDetails" value={newInvoice.paymentDetails} onChange={handleInputChange} rows="2" placeholder="Es. IBAN: IT..., Bonifico Bancario" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input"></textarea>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1 mt-2 dark:text-dark-text-medium">Note Aggiuntive</label>
                <textarea name="notes" id="notes" value={newInvoice.notes} onChange={handleInputChange} rows="2" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input"></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md">Crea Fattura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifica Fattura */}
      {isEditModalOpen && currentInvoice && (
         <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Modifica Fattura: {currentInvoice.invoiceNumber}</h2>
              <button onClick={() => { setIsEditModalOpen(false); setCurrentInvoice(null); }} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateInvoice}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                  <label htmlFor="edit-invoiceNumber" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Numero Fattura *</label>
                  <input type="text" name="invoiceNumber" id="edit-invoiceNumber" value={currentInvoice.invoiceNumber} onChange={(e) => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input" />
                </div>
                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Data Fattura *</label>
                  <input type="date" name="date" id="edit-date" value={currentInvoice.date} onChange={(e) => setCurrentInvoice({...currentInvoice, date: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input" />
                </div>
                <div>
                  <label htmlFor="edit-dueDate" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Data Scadenza *</label>
                  <input type="date" name="dueDate" id="edit-dueDate" value={currentInvoice.dueDate} onChange={(e) => setCurrentInvoice({...currentInvoice, dueDate: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input" />
                </div>
                <div>
                  <label htmlFor="edit-customerId" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Cliente *</label>
                  <select name="customerId" id="edit-customerId" value={currentInvoice.customerId} onChange={(e) => setCurrentInvoice({...currentInvoice, customerId: parseInt(e.target.value)})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="">Seleziona Cliente</option>
                    {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-projectId" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Progetto (Opzionale)</label>
                  <select name="projectId" id="edit-projectId" value={currentInvoice.projectId || ''} onChange={(e) => setCurrentInvoice({...currentInvoice, projectId: e.target.value ? parseInt(e.target.value) : null})} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="">Nessun Progetto</option>
                     {projects.filter(p => !currentInvoice.customerId || p.clientId === parseInt(currentInvoice.customerId)).map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
                 <div>
                  <label htmlFor="edit-quoteId" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Preventivo Collegato (Opzionale)</label>
                  <select name="quoteId" id="edit-quoteId" value={currentInvoice.quoteId || ''} onChange={(e) => setCurrentInvoice({...currentInvoice, quoteId: e.target.value ? parseInt(e.target.value) : null})} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="">Nessun Preventivo</option>
                    {quotes.filter(q => !currentInvoice.customerId || q.customerId === parseInt(currentInvoice.customerId)).map(quote => <option key={quote.id} value={quote.id}>{quote.quoteNumber} - {customers.find(c=>c.id === quote.customerId)?.name}</option>)}
                  </select>
                </div>
              </div>

              <h3 class="text-md font-semibold mb-2 mt-4">Voci della Fattura</h3>
              {currentInvoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <div class="col-span-4">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Descrizione *</label>}
                    <input type="text" placeholder="Descrizione Voce" value={item.description} onChange={(e) => handleCurrentInvoiceItemChange(index, 'description', e.target.value)} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div class="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Quantità *</label>}
                    <input type="number" placeholder="Qtà" value={item.quantity} onChange={(e) => handleCurrentInvoiceItemChange(index, 'quantity', parseFloat(e.target.value))} required min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div class="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Prezzo Un. *</label>}
                    <input type="number" placeholder="Prezzo" value={item.unitPrice} onChange={(e) => handleCurrentInvoiceItemChange(index, 'unitPrice', parseFloat(e.target.value))} required step="0.01" min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div class="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1">IVA % *</label>}
                    <input type="number" placeholder="IVA" value={item.taxRate} onChange={(e) => handleCurrentInvoiceItemChange(index, 'taxRate', parseFloat(e.target.value))} required min="0" max="100" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div class="col-span-1">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Tot.</label>}
                    <span className="block p-2 text-sm">€ {calculateItemTotal(item).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div class="col-span-1 flex items-end">
                    {currentInvoice.items.length > 1 && (
                      <button type="button" onClick={() => handleCurrentInvoiceRemoveItem(index)} className="p-1 text-red-500 hover:text-red-700">
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleCurrentInvoiceAddItem} className="mt-1 mb-4 text-sm text-light-primary dark:text-dark-primary hover:underline">+ Aggiungi Voce</button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="edit-total" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Totale Fattura</label>
                    <p className="text-xl font-semibold p-2">€ {calculateInvoiceTotal(currentInvoice.items).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Stato *</label>
                  <select name="status" id="edit-status" value={currentInvoice.status} onChange={(e) => setCurrentInvoice({...currentInvoice, status: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="Non Pagata">Non Pagata</option>
                    <option value="Pagata Parzialmente">Pagata Parzialmente</option>
                    <option value="Pagata">Pagata</option>
                    <option value="Scaduta">Scaduta</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="edit-paymentDetails" className="block text-sm font-medium mb-1 dark:text-dark-text-medium">Dettagli Pagamento</label>
                <textarea name="paymentDetails" id="edit-paymentDetails" value={currentInvoice.paymentDetails || ''} onChange={(e) => setCurrentInvoice({...currentInvoice, paymentDetails: e.target.value})} rows="2" placeholder="Es. IBAN: IT..., Bonifico Bancario" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input"></textarea>
              </div>
              <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium mb-1 mt-2 dark:text-dark-text-medium">Note Aggiuntive</label>
                <textarea name="notes" id="edit-notes" value={currentInvoice.notes || ''} onChange={(e) => setCurrentInvoice({...currentInvoice, notes: e.target.value})} rows="2" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input"></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setCurrentInvoice(null); }} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md">Salva Modifiche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizza Fattura */}
      {isViewModalOpen && invoiceToView && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 w-full max-w-3xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-light-primary dark:text-dark-primary">Fattura #{invoiceToView.invoiceNumber}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data: {new Date(invoiceToView.date).toLocaleDateString('it-IT')} - Scadenza: {invoiceToView.dueDate ? new Date(invoiceToView.dueDate).toLocaleDateString('it-IT') : 'N/D'}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
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
            
            <h3 className="text-md font-semibold mb-2 dark:text-dark-text">Dettaglio Voci</h3>
            <div className="overflow-x-auto mb-4 border border-light-border dark:border-dark-border rounded-md">
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

            <div className="flex justify-between items-center">
                <div>{getStatusPill(invoiceToView.status)}</div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center gap-1.5"><Printer size={16}/> Stampa</button>
                    <button className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center gap-1.5"><Download size={16}/> Scarica PDF</button>
                    <button className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center gap-1.5"><Send size={16}/> Invia Email</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione Fattura */}
      {isConfirmDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Conferma Eliminazione</h2>
              <button onClick={() => setIsConfirmDeleteModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="mb-6 text-light-text dark:text-dark-text">
              Sei sicuro di voler eliminare questa fattura? L'azione è irreversibile.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsConfirmDeleteModalOpen(false)} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text">Annulla</button>
              <button onClick={handleDeleteInvoice} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
