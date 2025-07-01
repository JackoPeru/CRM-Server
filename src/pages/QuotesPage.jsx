import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, Filter, X, Download, Send, Copy } from 'lucide-react';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';

const QuotesPage = () => {
  const { 
    isModalOpen, 
    showModal, 
    hideModal, 
    setBreadcrumbs 
  } = useUI();
  const { quotes, customers, projects, materials, addQuote, updateQuote, deleteQuote } = useData();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Preventivi' }]);
  }, [setBreadcrumbs]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentQuote, setCurrentQuote] = useState(null);
  const [quoteToView, setQuoteToView] = useState(null);

  const [newQuote, setNewQuote] = useState({
    // quoteNumber: '', // Removed: Will be auto-generated
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    projectId: '', // Opzionale
    items: [{ description: '', quantity: 1, unitPrice: 0, materialId: '' }],
    notes: '',
    status: 'Bozza', // Bozza, Inviato, Accettato, Rifiutato
    validityDays: 30,
  });



  const generateQuoteNumber = (date) => {
    const year = new Date(date).getFullYear();
    const quotesThisYear = quotes.filter(q => q.quoteNumber && new Date(q.date).getFullYear() === year);
    const highestNumThisYear = quotesThisYear.reduce((max, q) => {
        const numPart = parseInt(q.quoteNumber.split('-').pop());
        return numPart > max ? numPart : max;
    }, 0);
    const nextNum = highestNumThisYear + 1;
    return `PREV-${year}-${String(nextNum).padStart(3, '0')}`;
  };

  const filteredQuotes = React.useMemo(() => {
    let quotesToDisplay = quotes || [];
    if (searchTerm) {
      quotesToDisplay = quotesToDisplay.filter((quote) => {
        const customer = customers.find(c => c.id === quote.customerId);
        const project = projects.find(p => p.id === quote.projectId);

        const searchTermLower = searchTerm.toLowerCase();

        const matchesCustomer = customer && customer.name && customer.name.toLowerCase().includes(searchTermLower);
        const matchesProject = project && project.name && project.name.toLowerCase().includes(searchTermLower);
        const matchesStatus = quote.status && quote.status.toLowerCase().includes(searchTermLower);
        const matchesQuoteNumber = quote.quoteNumber && typeof quote.quoteNumber === 'string' && quote.quoteNumber.toLowerCase().includes(searchTermLower);

        return matchesCustomer || matchesProject || matchesStatus || matchesQuoteNumber;
      });
    }
    return quotesToDisplay.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [searchTerm, quotes, customers, projects]);

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewQuote((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newQuote.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    if (field === 'materialId' && value) {
      const selectedMaterial = materials.find(m => m.id === parseInt(value));
      if (selectedMaterial) {
        const price = parseFloat(selectedMaterial.price.replace('€', '').replace(/\./g, '').replace(',', '.')) || 0;
        updatedItems[index].unitPrice = price;
        updatedItems[index].description = selectedMaterial.name;
      }
    } else if (field === 'materialId' && !value) {
        updatedItems[index].unitPrice = 0;
        updatedItems[index].description = '';
    }
    setNewQuote((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleAddItem = () => {
    setNewQuote((prev) => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, materialId: '' }] }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = newQuote.items.filter((_, i) => i !== index);
    setNewQuote((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleAddQuote = (e) => {
    e.preventDefault();
    const generatedQuoteNumber = generateQuoteNumber(newQuote.date);
    const quoteToAdd = {
      ...newQuote,
      quoteNumber: generatedQuoteNumber, // Added auto-generated number
      total: calculateTotal(newQuote.items),
      customerId: parseInt(newQuote.customerId),
      projectId: newQuote.projectId ? parseInt(newQuote.projectId) : null,
    };
    addQuote(quoteToAdd);
    hideModal('addQuote');
    setNewQuote({
      // quoteNumber: '', // Removed
      date: new Date().toISOString().split('T')[0],
      customerId: '',
      projectId: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, materialId: '' }],
      notes: '',
      status: 'Bozza',
      validityDays: 30,
    });
  };

  const handleEditQuote = (quote) => {
    setCurrentQuote({ 
      ...quote, 
      date: quote.date ? new Date(quote.date).toISOString().split('T')[0] : '',
      items: quote.items.map(item => ({...item, materialId: item.materialId || ''}))
    });
    showModal({ id: 'editQuote', type: 'edit' });
  };

  const handleCurrentQuoteItemChange = (index, field, value) => {
    const updatedItems = [...currentQuote.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
     if (field === 'materialId' && value) {
      const selectedMaterial = materials.find(m => m.id === parseInt(value));
      if (selectedMaterial) {
        const price = parseFloat(selectedMaterial.price.replace('€', '').replace(/\./g, '').replace(',', '.')) || 0;
        updatedItems[index].unitPrice = price;
        updatedItems[index].description = selectedMaterial.name;
      }
    } else if (field === 'materialId' && !value) {
        updatedItems[index].unitPrice = 0;
        updatedItems[index].description = '';
    }
    setCurrentQuote((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleCurrentQuoteAddItem = () => {
    setCurrentQuote((prev) => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, materialId: '' }] }));
  };

  const handleCurrentQuoteRemoveItem = (index) => {
    const updatedItems = currentQuote.items.filter((_, i) => i !== index);
    setCurrentQuote((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleUpdateQuote = (e) => {
    e.preventDefault();
    const updatedQuote = { ...currentQuote, total: calculateTotal(currentQuote.items) };
    updateQuote(currentQuote.id, updatedQuote);
    hideModal('editQuote');
    setCurrentQuote(null);
  };

  const openConfirmDeleteModal = (quoteId) => {
    setCurrentQuote({ id: quoteId });
    showModal({ id: 'deleteQuote', type: 'delete' });
  };

  const handleDeleteQuote = () => {
    if (currentQuote?.id) {
      deleteQuote(currentQuote.id);
      hideModal('deleteQuote');
      setCurrentQuote(null);
    }
  };

  const handleViewQuote = (quote) => {
    setQuoteToView(quote);
    showModal({ id: 'viewQuote', type: 'view' });
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Bozza': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'Inviato': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Accettato': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Rifiutato': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Scaduto': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusPill = (status) => {
    const colorClasses = getStatusColor(status);
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Preventivi</h1>
        <button onClick={() => showModal({ id: 'addQuote', type: 'add' })} className="mb-4 px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuovo Preventivo
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca per cliente, progetto, stato..."
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
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preventivo N.</th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progetto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Totale</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-light-border dark:divide-dark-border">
              {filteredQuotes.length > 0 ? filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-light-hover dark:hover:bg-dark-hover">
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light-text-strong dark:text-dark-text-strong">{quote.quoteNumber}</td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">{new Date(quote.date).toLocaleDateString('it-IT')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">
                    {customers.find(c => c.id === quote.customerId)?.name || 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">
                    {projects.find(p => p.id === quote.projectId)?.name || 'Nessun Progetto'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">€{quote.total?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusPill(quote.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleViewQuote(quote)} className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded" title="Visualizza">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleEditQuote(quote)} className="p-1 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded" title="Modifica">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => openConfirmDeleteModal(quote.id)} className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded" title="Elimina">
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nessun preventivo trovato. {searchTerm && 'Modifica i filtri o il termine di ricerca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Aggiungi Preventivo */}
      {isModalOpen('addQuote') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nuovo Preventivo</h2>
              <button onClick={() => hideModal('addQuote')} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddQuote}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Numero Preventivo</label>
                  <p className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg/50 dark:bg-dark-input/50 text-light-text-medium dark:text-dark-text-medium italic">Generato automaticamente</p>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium mb-1">Data *</label>
                  <input type="date" name="date" id="date" value={newQuote.date} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium mb-1">Cliente *</label>
                  <select name="customerId" id="customerId" value={newQuote.customerId} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary">
                    <option value="">Seleziona Cliente</option>
                    {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="projectId" className="block text-sm font-medium mb-1">Progetto (Opzionale)</label>
                  <select name="projectId" id="projectId" value={newQuote.projectId} onChange={handleInputChange} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary">
                    <option value="">Nessun Progetto Specifico</option>
                    {projects.filter(p => !newQuote.customerId || p.clientId === parseInt(newQuote.customerId)).map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
              </div>

              <h3 className="text-md font-semibold mb-2 mt-4">Voci del Preventivo</h3>
              {newQuote.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <div className="col-span-4">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Descrizione *</label>}
                    <input type="text" placeholder="Descrizione Voce" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div className="col-span-2">
                     {index === 0 && <label className="block text-xs font-medium mb-1">Materiale</label>}
                     <select value={item.materialId} onChange={(e) => handleItemChange(index, 'materialId', e.target.value)} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm">
                        <option value="">Manuale</option>
                        {materials.map(mat => <option key={mat.id} value={mat.id}>{mat.name} ({mat.unit})</option>)}
                     </select>
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Quantità *</label>}
                    <input type="number" placeholder="Qtà" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} required min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Prezzo Un. *</label>}
                    <input type="number" placeholder="Prezzo" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} required step="0.01" min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" disabled={!!item.materialId} />
                  </div>
                  <div className="col-span-1">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Tot.</label>}
                    <span className="block p-2 text-sm">€ {(item.quantity * item.unitPrice).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="col-span-1 flex items-end">
                    {newQuote.items.length > 1 && (
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
                    <label htmlFor="total" className="block text-sm font-medium mb-1">Totale Preventivo</label>
                    <p className="text-xl font-semibold p-2">€ {calculateTotal(newQuote.items).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                 <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-1">Stato *</label>
                  <select name="status" id="status" value={newQuote.status} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary">
                    <option value="Bozza">Bozza</option>
                    <option value="Inviato">Inviato</option>
                    <option value="Accettato">Accettato</option>
                    <option value="Rifiutato">Rifiutato</option>
                    <option value="Scaduto">Scaduto</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="validityDays" className="block text-sm font-medium mb-1">Validità (giorni) *</label>
                  <input type="number" name="validityDays" id="validityDays" value={newQuote.validityDays} onChange={handleInputChange} required min="1" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">Note Aggiuntive</label>
                <textarea name="notes" id="notes" value={newQuote.notes} onChange={handleInputChange} rows="3" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => hideModal('addQuote')} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md">Crea Preventivo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifica Preventivo */}
      {isModalOpen('editQuote') && currentQuote && (
         <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Modifica Preventivo: {currentQuote.quoteNumber}</h2>
              <button onClick={() => { hideModal('editQuote'); setCurrentQuote(null); }} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateQuote}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Numero Preventivo</label>
                  <p className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg/50 dark:bg-dark-input/50 text-light-text-medium dark:text-dark-text-medium">{currentQuote?.quoteNumber}</p>
                </div>
                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium mb-1">Data *</label>
                  <input type="date" name="date" id="edit-date" value={currentQuote?.date} onChange={(e) => setCurrentQuote({...currentQuote, date: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="edit-customerId" className="block text-sm font-medium mb-1">Cliente *</label>
                  <select name="customerId" id="edit-customerId" value={currentQuote.customerId} onChange={(e) => setCurrentQuote({...currentQuote, customerId: parseInt(e.target.value)})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="">Seleziona Cliente</option>
                    {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-projectId" className="block text-sm font-medium mb-1">Progetto (Opzionale)</label>
                  <select name="projectId" id="edit-projectId" value={currentQuote.projectId || ''} onChange={(e) => setCurrentQuote({...currentQuote, projectId: e.target.value ? parseInt(e.target.value) : null})} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="">Nessun Progetto Specifico</option>
                     {projects.filter(p => !currentQuote.customerId || p.clientId === parseInt(currentQuote.customerId)).map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
              </div>

              <h3 className="text-md font-semibold mb-2 mt-4">Voci del Preventivo</h3>
              {currentQuote.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <div className="col-span-4">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Descrizione *</label>}
                    <input type="text" placeholder="Descrizione Voce" value={item.description} onChange={(e) => handleCurrentQuoteItemChange(index, 'description', e.target.value)} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                   <div className="col-span-2">
                     {index === 0 && <label className="block text-xs font-medium mb-1">Materiale</label>}
                     <select value={item.materialId} onChange={(e) => handleCurrentQuoteItemChange(index, 'materialId', e.target.value)} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm">
                        <option value="">Manuale</option>
                        {materials.map(mat => <option key={mat.id} value={mat.id}>{mat.name} ({mat.unit})</option>)}
                     </select>
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Quantità *</label>}
                    <input type="number" placeholder="Qtà" value={item.quantity} onChange={(e) => handleCurrentQuoteItemChange(index, 'quantity', parseFloat(e.target.value))} required min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Prezzo Un. *</label>}
                    <input type="number" placeholder="Prezzo" value={item.unitPrice} onChange={(e) => handleCurrentQuoteItemChange(index, 'unitPrice', parseFloat(e.target.value))} required step="0.01" min="0" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-sm" disabled={!!item.materialId} />
                  </div>
                  <div className="col-span-1">
                    {index === 0 && <label className="block text-xs font-medium mb-1">Tot.</label>}
                    <span className="block p-2 text-sm">€ {(item.quantity * item.unitPrice).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="col-span-1 flex items-end">
                    {currentQuote.items.length > 1 && (
                      <button type="button" onClick={() => handleCurrentQuoteRemoveItem(index)} className="p-1 text-red-500 hover:text-red-700">
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleCurrentQuoteAddItem} className="mt-1 mb-4 text-sm text-light-primary dark:text-dark-primary hover:underline">+ Aggiungi Voce</button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="edit-total" className="block text-sm font-medium mb-1">Totale Preventivo</label>
                    <p className="text-xl font-semibold p-2">€ {calculateTotal(currentQuote.items).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium mb-1">Stato *</label>
                  <select name="status" id="edit-status" value={currentQuote.status} onChange={(e) => setCurrentQuote({...currentQuote, status: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input">
                    <option value="Bozza">Bozza</option>
                    <option value="Inviato">Inviato</option>
                    <option value="Accettato">Accettato</option>
                    <option value="Rifiutato">Rifiutato</option>
                    <option value="Scaduto">Scaduto</option>
                  </select>
                </div>
                 <div>
                  <label htmlFor="edit-validityDays" className="block text-sm font-medium mb-1">Validità (giorni) *</label>
                  <input type="number" name="validityDays" id="edit-validityDays" value={currentQuote.validityDays} onChange={(e) => setCurrentQuote({...currentQuote, validityDays: parseInt(e.target.value)})} required min="1" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input" />
                </div>
              </div>

              <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium mb-1">Note Aggiuntive</label>
                <textarea name="notes" id="edit-notes" value={currentQuote.notes || ''} onChange={(e) => setCurrentQuote({...currentQuote, notes: e.target.value})} rows="3" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input"></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { hideModal('editQuote'); setCurrentQuote(null); }} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md">Salva Modifiche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizza Preventivo */}
      {isModalOpen('viewQuote') && quoteToView && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 w-full max-w-2xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-light-primary dark:text-dark-primary">Preventivo #{quoteToView.quoteNumber}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data: {new Date(quoteToView.date).toLocaleDateString('it-IT')} - Validità: {quoteToView.validityDays} giorni</p>
              </div>
              <button onClick={() => hideModal('viewQuote')} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Cliente</h3>
                <p className="font-medium">{customers.find(c => c.id === quoteToView.customerId)?.name || 'N/D'}</p>
                <p className="text-sm">{customers.find(c => c.id === quoteToView.customerId)?.address || ''}</p>
                <p className="text-sm">{customers.find(c => c.id === quoteToView.customerId)?.email || ''}</p>
              </div>
              {quoteToView.projectId && projects.find(p => p.id === quoteToView.projectId) && (
                <div>
                  <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Progetto</h3>
                  <p className="font-medium">{projects.find(p => p.id === quoteToView.projectId)?.name}</p>
                </div>
              )}
            </div>
            
            <h3 className="text-md font-semibold mb-2">Dettaglio Voci</h3>
            <div className="overflow-x-auto mb-4 border border-light-border dark:border-dark-border rounded-md">
                <table className="w-full text-sm">
                    <thead className="bg-light-bg dark:bg-dark-bg">
                        <tr>
                            <th className="p-2 text-left font-semibold">Descrizione</th>
                            <th className="p-2 text-right font-semibold">Qtà</th>
                            <th className="p-2 text-right font-semibold">Prezzo Un.</th>
                            <th className="p-2 text-right font-semibold">Subtotale</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quoteToView.items.map((item, index) => (
                            <tr key={index} className="border-b border-light-border dark:border-dark-border last:border-b-0">
                                <td className="p-2">{item.description}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">€ {item.unitPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="p-2 text-right">€ {(item.quantity * item.unitPrice).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end mb-6">
                <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Subtotale: € {quoteToView.total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    {/* Qui si potrebbero aggiungere IVA, sconti etc. */} 
                    <p className="text-xl font-bold">Totale: € {quoteToView.total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>

            {quoteToView.notes && (
              <div className="mb-6 p-3 bg-light-bg dark:bg-dark-input rounded-md">
                <h4 className="font-semibold text-sm mb-1">Note:</h4>
                <p className="text-sm whitespace-pre-wrap">{quoteToView.notes}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(quoteToView.status)}`}>
                    {quoteToView.status}
                </span>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center gap-1.5"><Download size={16}/> Scarica PDF</button>
                    <button className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center gap-1.5"><Send size={16}/> Invia Email</button>
                    <button className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-md text-sm hover:bg-light-bg dark:hover:bg-dark-bg flex items-center gap-1.5"><Copy size={16}/> Duplica</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {isModalOpen('deleteQuote') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Conferma Eliminazione</h2>
              <button onClick={() => hideModal('deleteQuote')} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="mb-6 text-light-text dark:text-dark-text">
              Sei sicuro di voler eliminare questo preventivo? L'azione è irreversibile.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => hideModal('deleteQuote')} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text">Annulla</button>
              <button onClick={handleDeleteQuote} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesPage;
