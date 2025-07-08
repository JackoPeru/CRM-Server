import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, X } from 'lucide-react';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';
import { Material } from '../store/slices/materialsSlice';
import { useAuth } from '../hooks/useAuth';

const MaterialsPage: React.FC = () => {
  const { 
    isModalOpen, 
    showModal, 
    hideModal, 
    setBreadcrumbs 
  } = useUI();
  
  const { 
    materials, 
    addMaterial, 
    updateMaterial, 
    deleteMaterial 
  } = useData();

  const { hasRole } = useAuth();
  const isWorker = hasRole('worker');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Materiali' }]);
  }, [setBreadcrumbs]);

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    description: '',
    unit: '',
    unitPrice: '',
    supplier: '',
    category: ''
  });

  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [materialToView, setMaterialToView] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitMaterial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const materialData = {
      ...newMaterial,
      unitPrice: parseFloat(newMaterial.unitPrice) || 0,
      stockQuantity: 0,
      minStockLevel: 0
    };
    
    addMaterial(materialData);
    setNewMaterial({ name: '', description: '', unit: '', unitPrice: '', supplier: '', category: '' });
    hideModal('addMaterial');
  };

  const handleEditMaterial = (material: Material) => {
    setCurrentMaterial(material);
    showModal({ id: 'editMaterial', type: 'edit' });
  };

  const handleUpdateMaterial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentMaterial) return;
    updateMaterial(currentMaterial.id, currentMaterial);
    setCurrentMaterial(null);
    hideModal('editMaterial');
  };

  const openConfirmDeleteModal = (materialId: string) => {
    setMaterialToDelete(materialId);
    showModal({ id: 'deleteMaterial', type: 'delete' });
  };

  const confirmDeleteMaterial = () => {
    if (materialToDelete) {
      deleteMaterial(materialToDelete);
      setMaterialToDelete(null);
      hideModal('deleteMaterial');
    }
  };

  const handleViewMaterial = (material: Material) => {
    setMaterialToView(material);
    showModal({ id: 'viewMaterial', type: 'view' });
  };

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.supplier && material.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (material.category && material.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold mobile-friendly-text">Materiali</h1>
        <button 
          onClick={() => showModal({ id: 'addMaterial', type: 'add' })}
          className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md flex items-center justify-center gap-2 mobile-friendly-text touch-target"
        >
          <Plus className="w-5 h-5" />
          Nuovo Materiale
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-6 h-6 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Cerca materiale per nome, fornitore..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unità</th>
                {!isWorker && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prezzo Unitario</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fornitore</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {filteredMaterials.length > 0 ? filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-light-text dark:text-dark-text">{material.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-light-text dark:text-dark-text">{material.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-light-text dark:text-dark-text">{material.unit}</td>
                  {!isWorker && (
                    <td className="px-6 py-4 whitespace-nowrap text-light-text dark:text-dark-text">€ {(material.unitPrice || material.price || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-light-text dark:text-dark-text">{material.supplier || 'N/D'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleViewMaterial(material)} className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleEditMaterial(material)} className="p-1 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => openConfirmDeleteModal(material.id)} className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded">
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isWorker ? 5 : 6} className="px-6 py-12 text-center text-gray-500 dark:text-dark-text-light">
                    Nessun materiale trovato. {searchTerm && 'Modifica i filtri o il termine di ricerca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4">
          {filteredMaterials.length > 0 ? filteredMaterials.map((material) => (
            <div key={material.id} className="bg-light-bg dark:bg-dark-bg rounded-lg p-4 border border-light-border dark:border-dark-border">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-light-text dark:text-dark-text mobile-friendly-text">{material.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleViewMaterial(material)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded touch-target">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleEditMaterial(material)} className="p-2 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded touch-target">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => openConfirmDeleteModal(material.id)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded touch-target">
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm mobile-friendly-text">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Categoria:</span>
                  <span className="text-light-text dark:text-dark-text">{material.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Unità:</span>
                  <span className="text-light-text dark:text-dark-text">{material.unit}</span>
                </div>
                {!isWorker && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Prezzo:</span>
                    <span className="text-light-text dark:text-dark-text font-medium">€ {(material.unitPrice || material.price || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Fornitore:</span>
                  <span className="text-light-text dark:text-dark-text">{material.supplier || 'N/D'}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-gray-500 dark:text-dark-text-light mobile-friendly-text">
              Nessun materiale trovato. {searchTerm && 'Modifica i filtri o il termine di ricerca.'}
            </div>
          )}
        </div>
      </div>

      {isModalOpen('addMaterial') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold dark:text-dark-text mobile-friendly-text">Nuovo Materiale</h2>
              <button onClick={() => hideModal('addMaterial')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitMaterial}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label htmlFor="material-name" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Nome Materiale *</label>
                  <input 
                    type="text" 
                    name="name" 
                    id="material-name" 
                    value={newMaterial.name} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="material-description" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Descrizione</label>
                  <textarea 
                    name="description" 
                    id="material-description" 
                    value={newMaterial.description || ''} 
                    onChange={handleInputChange} 
                    rows={3} 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target"
                  />
                </div>
                <div>
                  <label htmlFor="material-unit" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Unità di Misura *</label>
                  <input 
                    type="text" 
                    name="unit" 
                    id="material-unit" 
                    value={newMaterial.unit} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Es. m², kg, pz" 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                  />
                </div>
                {!isWorker && (
                  <div>
                    <label htmlFor="material-price" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Prezzo Unitario (€) *</label>
                    <input 
                      type="number" 
                      name="unitPrice" 
                      id="material-price" 
                      step="0.01" 
                      value={newMaterial.unitPrice} 
                      onChange={handleInputChange} 
                      required 
                      className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="material-category" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Categoria</label>
                  <input 
                    type="text" 
                    name="category" 
                    id="material-category" 
                    value={newMaterial.category} 
                    onChange={handleInputChange} 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                  />
                </div>
                <div>
                  <label htmlFor="material-supplier" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Fornitore</label>
                  <input 
                    type="text" 
                    name="supplier" 
                    id="material-supplier" 
                    value={newMaterial.supplier || ''} 
                    onChange={handleInputChange} 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => hideModal('addMaterial')} className="w-full sm:w-auto px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text mobile-friendly-text touch-target">Annulla</button>
                <button type="submit" className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text touch-target">Aggiungi Materiale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen('editMaterial') && currentMaterial && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold dark:text-dark-text mobile-friendly-text">Modifica Materiale</h2>
              <button onClick={() => hideModal('editMaterial')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateMaterial}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label htmlFor="edit-material-name" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Nome Materiale *</label>
                  <input 
                    type="text" 
                    name="name" 
                    id="edit-material-name" 
                    value={currentMaterial.name} 
                    onChange={(e) => setCurrentMaterial({...currentMaterial, name: e.target.value})} 
                    required 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-material-description" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Descrizione</label>
                  <textarea 
                    name="description" 
                    id="edit-material-description" 
                    value={currentMaterial.description || ''} 
                    onChange={(e) => setCurrentMaterial({...currentMaterial, description: e.target.value})} 
                    rows={3} 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target"
                  />
                </div>
                <div>
                  <label htmlFor="edit-material-unit" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Unità di Misura *</label>
                  <input 
                    type="text" 
                    name="unit" 
                    id="edit-material-unit" 
                    value={currentMaterial.unit} 
                    onChange={(e) => setCurrentMaterial({...currentMaterial, unit: e.target.value})} 
                    required 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                  />
                </div>
                {!isWorker && (
                  <div>
                    <label htmlFor="edit-material-price" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Prezzo Unitario (€) *</label>
                    <input 
                      type="number" 
                      name="unitPrice" 
                      id="edit-material-price" 
                      step="0.01" 
                      value={currentMaterial.unitPrice || currentMaterial.price || 0} 
                      onChange={(e) => setCurrentMaterial({...currentMaterial, unitPrice: parseFloat(e.target.value) || 0})} 
                      required 
                      className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="edit-material-category" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Categoria</label>
                  <input 
                    type="text" 
                    name="category" 
                    id="edit-material-category" 
                    value={currentMaterial.category} 
                    onChange={(e) => setCurrentMaterial({...currentMaterial, category: e.target.value})} 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-material-supplier" className="block text-sm font-medium mb-2 dark:text-dark-text-medium mobile-friendly-text">Fornitore</label>
                  <input 
                    type="text" 
                    name="supplier" 
                    id="edit-material-supplier" 
                    value={currentMaterial.supplier || ''} 
                    onChange={(e) => setCurrentMaterial({...currentMaterial, supplier: e.target.value})} 
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" 
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => hideModal('editMaterial')} className="w-full sm:w-auto px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text mobile-friendly-text touch-target">Annulla</button>
                <button type="submit" className="w-full sm:w-auto px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text touch-target">Salva Modifiche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen('viewMaterial') && materialToView && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold dark:text-dark-text mobile-friendly-text">Dettagli Materiale</h2>
              <button onClick={() => hideModal('viewMaterial')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3 text-light-text dark:text-dark-text mobile-friendly-text">
              <p><strong className="dark:text-dark-text">Nome:</strong> {materialToView.name}</p>
              <p><strong className="dark:text-dark-text">Descrizione:</strong> {materialToView.description || 'N/D'}</p>
              <p><strong className="dark:text-dark-text">Categoria:</strong> {materialToView.category}</p>
              <p><strong className="dark:text-dark-text">Unità di Misura:</strong> {materialToView.unit}</p>
              {!isWorker && (
                <p><strong className="dark:text-dark-text">Prezzo Unitario:</strong> € {(materialToView.unitPrice || materialToView.price || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              )}
              <p><strong className="dark:text-dark-text">Fornitore:</strong> {materialToView.supplier || 'N/D'}</p>
              <p><strong className="dark:text-dark-text">Quantità in Stock:</strong> {materialToView.stockQuantity || materialToView.stock || 0}</p>
              <p><strong className="dark:text-dark-text">Livello Minimo:</strong> {materialToView.minStockLevel || 0}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => hideModal('viewMaterial')} className="w-full sm:w-auto px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text mobile-friendly-text touch-target">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen('deleteMaterial') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-red-600 dark:text-red-400 mobile-friendly-text">Conferma Eliminazione</h2>
              <button onClick={() => hideModal('deleteMaterial')} className="p-2 md:p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full touch-target">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="mb-6 dark:text-dark-text-light mobile-friendly-text">Sei sicuro di voler eliminare questo materiale? L'azione è irreversibile.</p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => hideModal('deleteMaterial')} className="w-full sm:w-auto px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text mobile-friendly-text touch-target">Annulla</button>
              <button onClick={confirmDeleteMaterial} className="w-full sm:w-auto px-4 py-3 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-md mobile-friendly-text touch-target">Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsPage;
