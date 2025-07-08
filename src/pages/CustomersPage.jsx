import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, Filter, X } from 'lucide-react';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';

const CustomersPage = () => {
  const { 
    isModalOpen, 
    showModal, 
    hideModal, 
    tableFilters, 
    setTableFilter, 
    setBreadcrumbs,
    showAlert,
    showPermissionError,
    showNetworkError,
    showError
  } = useUI();
  const { 
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer,
    loading,
    errors,
    permissionDenied,
    clearAllErrors 
  } = useData();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Clienti' }]);
    
    // Inizializza i filtri della tabella se non esistono
    if (!tableFilters.customers) {
      setTableFilter('customers', { type: '', hasVat: '' });
    }
  }, [setBreadcrumbs, setTableFilter, tableFilters.customers]);

  // Debug: Log per verificare i dati dei clienti
  useEffect(() => {
    console.log('🔍 [CustomersPage] Dati clienti ricevuti:', customers);
    console.log('🔍 [CustomersPage] Numero clienti:', customers?.length || 0);
  }, [customers]);
  
  // Effetto per mostrare errori di permesso
  useEffect(() => {
    if (permissionDenied?.clients && errors?.clients) {
      showPermissionError(errors.clients || 'Non hai i permessi necessari per questa operazione');
    }
  }, [permissionDenied, errors, showPermissionError]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerToView, setCustomerToView] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'Privato',
  });

  // Filtra i clienti in base al termine di ricerca
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      // Pulisci eventuali errori precedenti
      clearAllErrors && clearAllErrors();
      
      const result = await addCustomer(newCustomer);
      if (result) {
        hideModal('addCustomer');
        setNewCustomer({
          name: '',
          email: '',
          phone: '',
          address: '',
          type: 'Privato',
        });
      } else if (permissionDenied?.clients) {
        // L'errore di permesso è già gestito dall'effetto
      } else if (errors?.clients) {
        showError({
          type: 'error',
          message: errors.clients,
          autoClose: true
        });
      }
    } catch (error) {
      console.error('Errore nella creazione cliente:', error);
      showError({
        type: 'error',
        message: error.message || 'Si è verificato un errore durante la creazione del cliente',
        autoClose: true
      });
    }
  };

  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    showModal({ id: 'editCustomer', type: 'edit' });
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      // Pulisci eventuali errori precedenti
      clearAllErrors && clearAllErrors();
      
      const result = await updateCustomer(currentCustomer.id, currentCustomer);
      if (result) {
        hideModal('editCustomer');
        setCurrentCustomer(null);
      } else if (permissionDenied?.clients) {
        // L'errore di permesso è già gestito dall'effetto
      } else if (errors?.clients) {
        showError({
          type: 'error',
          message: errors.clients,
          autoClose: true
        });
      }
    } catch (error) {
      console.error('Errore nella modifica cliente:', error);
      showError({
        type: 'error',
        message: error.message || 'Si è verificato un errore durante la modifica del cliente',
        autoClose: true
      });
    }
  };

  const [customerToDelete, setCustomerToDelete] = useState(null);

  const openConfirmDeleteModal = (customerId) => {
    setCustomerToDelete(customerId);
    showModal({ id: 'confirmDelete', type: 'delete' });
  };

  const handleDeleteCustomer = async () => {
    if (customerToDelete !== null) {
      try {
        // Pulisci eventuali errori precedenti
        clearAllErrors && clearAllErrors();
        
        const result = await deleteCustomer(customerToDelete);
        if (result || !errors?.customers) {
          setCustomerToDelete(null);
          hideModal('confirmDelete');
        }
        
        // Verifica se ci sono stati errori
        if (permissionDenied?.clients) {
          // L'errore di permesso è già gestito dall'effetto
        } else if (errors?.clients) {
          showError({
            type: 'error',
            message: errors.clients,
            autoClose: true
          });
        }
      } catch (error) {
        console.error('Errore nell\'eliminazione cliente:', error);
        showError({
          type: 'error',
          message: error.message || 'Si è verificato un errore durante l\'eliminazione del cliente',
          autoClose: true
        });
      }
    }
  };

  const handleViewCustomer = (customer) => {
    setCustomerToView(customer);
    showModal({ id: 'viewCustomer', type: 'view' });
  };

  const filteredCustomers = customers?.filter(
    (customer) => {
      // Filtro per termine di ricerca
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro per tipo cliente - se non è definito o è vuoto, mostra tutti
      const typeFilter = tableFilters.customers?.type;
      const matchesType = !typeFilter || typeFilter === '' || customer.type === typeFilter;
      
      // Filtro per partita IVA - se non è definito o è vuoto, mostra tutti
      const vatFilter = tableFilters.customers?.hasVat;
      const matchesVat = !vatFilter || vatFilter === '' || 
                        (vatFilter === 'si' && customer.vatNumber) || 
                        (vatFilter === 'no' && !customer.vatNumber);
      
      return matchesSearch && matchesType && matchesVat;
    }
  ) || [];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTableFilter('customers', { ...tableFilters.customers, [name]: value });
  };

  const applyFilters = () => {
    hideModal('filterCustomers');
  };

  const resetFilters = () => {
    setTableFilter('customers', { type: '', hasVat: '' });
    hideModal('filterCustomers');
  };

  return (
    <>
    <div className="p-4 md:p-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold mobile-friendly-text">Clienti</h1>
        <button 
          onClick={() => showModal({ id: 'addCustomer', type: 'add' })}
          className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md flex items-center justify-center gap-2 touch-target mobile-friendly-text"
        >
          <Plus className="w-6 h-6 md:w-5 md:h-5" />
          Nuovo Cliente
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm">
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-6 h-6 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="Cerca cliente..."
                className="w-full pl-12 md:pl-10 pr-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => showModal({ id: 'filterCustomers', type: 'filter' })} className="px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md flex items-center justify-center gap-2 hover:bg-light-bg dark:hover:bg-dark-bg touch-target mobile-friendly-text">
              <Filter className="w-6 h-6 md:w-5 md:h-5" />
              Filtri
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto desktop-table">
          <table className="w-full">
            <thead className="bg-light-bg dark:bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Telefono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Indirizzo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50">
                    <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.type === 'Privato'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                      }`}>
                        {customer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleViewCustomer(customer)} className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleEditCustomer(customer)} className="p-1 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => openConfirmDeleteModal(customer.id)} className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded">
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {customers?.length === 0 ? 'Nessun cliente trovato.' : 'Nessun cliente corrisponde ai filtri applicati.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mobile-cards">
          {filteredCustomers.length > 0 ? (
            <div className="space-y-4 p-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-light-bg dark:bg-dark-bg rounded-lg p-4 border border-light-border dark:border-dark-border">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mobile-friendly-text">{customer.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mobile-friendly-text">{customer.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.type === 'Privato'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                    }`}>
                      {customer.type}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm mobile-friendly-text">
                      <span className="font-medium w-20">Telefono:</span>
                      <span className="text-gray-600 dark:text-gray-400">{customer.phone || '-'}</span>
                    </div>
                    <div className="flex items-center text-sm mobile-friendly-text">
                      <span className="font-medium w-20">Indirizzo:</span>
                      <span className="text-gray-600 dark:text-gray-400">{customer.address || '-'}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleViewCustomer(customer)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded touch-target">
                      <Eye className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleEditCustomer(customer)} className="p-2 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded touch-target">
                      <Edit className="w-6 h-6" />
                    </button>
                    <button onClick={() => openConfirmDeleteModal(customer.id)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded touch-target">
                      <Trash className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 mobile-friendly-text">
              {customers?.length === 0 ? 'Nessun cliente trovato.' : 'Nessun cliente corrisponde ai filtri applicati.'}
            </div>
          )}
        </div>
      </div>

      {isModalOpen('addCustomer') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Nuovo Cliente</h2>
              <button onClick={() => hideModal('addCustomer')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer}>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2 mobile-friendly-text">Nome Completo *</label>
                  <input type="text" name="name" id="name" value={newCustomer.name} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 mobile-friendly-text">Email</label>
                  <input type="email" name="email" id="email" value={newCustomer.email} onChange={handleInputChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2 mobile-friendly-text">Telefono</label>
                  <input type="tel" name="phone" id="phone" value={newCustomer.phone} onChange={handleInputChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-2 mobile-friendly-text">Indirizzo</label>
                  <input type="text" name="address" id="address" value={newCustomer.address} onChange={handleInputChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-2 mobile-friendly-text">Tipo Cliente</label>
                  <select name="type" id="type" value={newCustomer.type} onChange={handleInputChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target">
                    <option value="Privato">Privato</option>
                    <option value="Azienda">Azienda</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="vatNumber" className="block text-sm font-medium mb-2 mobile-friendly-text">Partita IVA (se Azienda)</label>
                  <input type="text" name="vatNumber" id="vatNumber" value={newCustomer.vatNumber || ''} onChange={handleInputChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => hideModal('addCustomer')} className="w-full sm:w-auto px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text touch-target">
                  Annulla
                </button>
                <button type="submit" className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text touch-target">
                  Aggiungi Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen('viewCustomer') && customerToView && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Dettagli Cliente</h2>
              <button onClick={() => hideModal('viewCustomer')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Nome Completo</p>
                <p className="text-base md:text-lg mobile-friendly-text">{customerToView.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Email</p>
                <p className="text-base md:text-lg mobile-friendly-text">{customerToView.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Telefono</p>
                <p className="text-base md:text-lg mobile-friendly-text">{customerToView.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Indirizzo</p>
                <p className="text-base md:text-lg mobile-friendly-text">{customerToView.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Tipo Cliente</p>
                <p className="text-base md:text-lg mobile-friendly-text">{customerToView.type}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => hideModal('viewCustomer')}
                className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text touch-target"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen('editCustomer') && currentCustomer && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Modifica Cliente</h2>
              <button onClick={() => { hideModal('editCustomer'); setCurrentCustomer(null); }} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer}>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium mb-2 mobile-friendly-text">Nome Completo *</label>
                  <input type="text" name="name" id="edit-name" value={currentCustomer.name} onChange={(e) => setCurrentCustomer({...currentCustomer, name: e.target.value})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium mb-2 mobile-friendly-text">Email</label>
                  <input type="email" name="email" id="edit-email" value={currentCustomer.email} onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="edit-phone" className="block text-sm font-medium mb-2 mobile-friendly-text">Telefono</label>
                  <input type="tel" name="phone" id="edit-phone" value={currentCustomer.phone} onChange={(e) => setCurrentCustomer({...currentCustomer, phone: e.target.value})} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="edit-address" className="block text-sm font-medium mb-2 mobile-friendly-text">Indirizzo</label>
                  <input type="text" name="address" id="edit-address" value={currentCustomer.address} onChange={(e) => setCurrentCustomer({...currentCustomer, address: e.target.value})} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="edit-type" className="block text-sm font-medium mb-2 mobile-friendly-text">Tipo Cliente</label>
                  <select name="type" id="edit-type" value={currentCustomer.type} onChange={(e) => setCurrentCustomer({...currentCustomer, type: e.target.value})} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target">
                    <option value="Privato">Privato</option>
                    <option value="Azienda">Azienda</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-vatNumber" className="block text-sm font-medium mb-2 mobile-friendly-text">Partita IVA (se Azienda)</label>
                  <input type="text" name="vatNumber" id="edit-vatNumber" value={currentCustomer.vatNumber || ''} onChange={(e) => setCurrentCustomer({...currentCustomer, vatNumber: e.target.value})} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => { hideModal('editCustomer'); setCurrentCustomer(null); }} className="w-full sm:w-auto px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text touch-target">
                  Annulla
                </button>
                <button type="submit" className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text touch-target">
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione Cliente */}
      {isModalOpen('confirmDelete') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 mobile-friendly-text">Conferma Eliminazione</h2>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-300 mobile-friendly-text">Sei sicuro di voler eliminare questo cliente? L'azione è irreversibile.</p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => hideModal('confirmDelete')} 
                className="w-full sm:w-auto px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text touch-target"
              >
                Annulla
              </button>
              <button 
                onClick={handleDeleteCustomer} 
                className="w-full sm:w-auto px-4 py-3 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-md mobile-friendly-text touch-target"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Filtri Cliente */}
      {isModalOpen('filterCustomers') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Filtra Clienti</h2>
              <button onClick={() => hideModal('filterCustomers')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="filter-type" className="block text-sm font-medium mb-2 mobile-friendly-text">Tipo Cliente</label>
                <select name="type" id="filter-type" value={tableFilters.customers?.type || ''} onChange={handleFilterChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target">
                  <option value="">Tutti</option>
                  <option value="Privato">Privato</option>
                  <option value="Azienda">Azienda</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-hasVat" className="block text-sm font-medium mb-2 mobile-friendly-text">Partita IVA</label>
                <select name="hasVat" id="filter-hasVat" value={tableFilters.customers?.hasVat || ''} onChange={handleFilterChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target">
                  <option value="">Tutti</option>
                  <option value="si">Con Partita IVA</option>
                  <option value="no">Senza Partita IVA</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={resetFilters} className="w-full sm:w-auto px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text touch-target">
                Resetta Filtri
              </button>
              <button type="button" onClick={applyFilters} className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text touch-target">
                Applica Filtri
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default CustomersPage;
