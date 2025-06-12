import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, Filter, X } from 'lucide-react';

const MaterialsPage = ({ materials: initialMaterials, setMaterials: setAppMaterials, onNavigate }) => {
  const [materials, setMaterials] = useState(initialMaterials || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [materialToView, setMaterialToView] = useState(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [materialToDeleteId, setMaterialToDeleteId] = useState(null);

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    description: '',
    unit: '', // e.g., m², kg, pz
    price: '', // Prezzo unitario
    supplier: '',
    supplier: '',
  });

  useEffect(() => {
    setMaterials(initialMaterials || []);
  }, [initialMaterials]);

  useEffect(() => {
    let materialsToDisplay = materials || [];
    if (searchTerm) {
      materialsToDisplay = materialsToDisplay.filter(
        (material) =>
          material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (material.supplier && material.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredMaterials(materialsToDisplay);
  }, [searchTerm, materials]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    const newId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
    const materialToAdd = {
      ...newMaterial,
      id: newId,
      price: newMaterial.price ? `€ ${parseFloat(newMaterial.price).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '€ 0,00'
    };
    setAppMaterials((prevMaterials) => [...(prevMaterials || []), materialToAdd]);
    setIsModalOpen(false);
    setNewMaterial({
      name: '',
      description: '',
      unit: '',
      price: '',
      supplier: '',
    });
  };

  const handleEditMaterial = (material) => {
    const priceValue = material.price ? parseFloat(material.price.replace('€', '').replace(/\./g, '').replace(',', '.')) : '';
    setCurrentMaterial({ ...material, price: priceValue });
    setIsEditModalOpen(true);
  };

  const handleUpdateMaterial = (e) => {
    e.preventDefault();
    setAppMaterials((prevMaterials) =>
      (prevMaterials || []).map((mat) =>
        mat.id === currentMaterial.id ? { ...currentMaterial, price: currentMaterial.price ? `€ ${parseFloat(currentMaterial.price).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '€ 0,00' } : mat
      )
    );
    setIsEditModalOpen(false);
    setCurrentMaterial(null);
  };

  const openConfirmDeleteModal = (materialId) => {
    setMaterialToDeleteId(materialId);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleDeleteMaterial = () => {
    if (materialToDeleteId) {
      setAppMaterials((prevMaterials) =>
        (prevMaterials || []).filter((material) => material.id !== materialToDeleteId)
      );
      setIsConfirmDeleteModalOpen(false);
      setMaterialToDeleteId(null);
    }
  };

  const handleViewMaterial = (material) => {
    setMaterialToView(material);
    setIsViewModalOpen(true);
  };

  return (
    <div className="p-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Materiali</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuovo Materiale
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca materiale per nome, fornitore..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unità</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prezzo Unitario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fornitore</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {filteredMaterials.length > 0 ? filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{material.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{material.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{material.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{material.supplier || 'N/D'}</td>
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
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nessun materiale trovato. {searchTerm && 'Modifica i filtri o il termine di ricerca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Aggiungi Materiale */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-lg my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nuovo Materiale</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddMaterial}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label htmlFor="material-name" className="block text-sm font-medium mb-1">Nome Materiale *</label>
                  <input type="text" name="name" id="material-name" value={newMaterial.name} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="material-description" className="block text-sm font-medium mb-1">Descrizione</label>
                  <textarea name="description" id="material-description" value={newMaterial.description} onChange={handleInputChange} rows="3" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"></textarea>
                </div>
                <div>
                  <label htmlFor="material-unit" className="block text-sm font-medium mb-1">Unità di Misura *</label>
                  <input type="text" name="unit" id="material-unit" value={newMaterial.unit} onChange={handleInputChange} required placeholder="Es. m², kg, pz" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="material-price" className="block text-sm font-medium mb-1">Prezzo Unitario (€) *</label>
                  <input type="number" name="price" id="material-price" step="0.01" value={newMaterial.price} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="material-supplier" className="block text-sm font-medium mb-1">Fornitore</label>
                  <input type="text" name="supplier" id="material-supplier" value={newMaterial.supplier} onChange={handleInputChange} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md">Aggiungi Materiale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifica Materiale */}
      {isEditModalOpen && currentMaterial && (
         <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-lg my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Modifica Materiale</h2>
              <button onClick={() => { setIsEditModalOpen(false); setCurrentMaterial(null); }} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateMaterial}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label htmlFor="edit-material-name" className="block text-sm font-medium mb-1">Nome Materiale *</label>
                  <input type="text" name="name" id="edit-material-name" value={currentMaterial.name} onChange={(e) => setCurrentMaterial({...currentMaterial, name: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-material-description" className="block text-sm font-medium mb-1">Descrizione</label>
                  <textarea name="description" id="edit-material-description" value={currentMaterial.description || ''} onChange={(e) => setCurrentMaterial({...currentMaterial, description: e.target.value})} rows="3" className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"></textarea>
                </div>
                <div>
                  <label htmlFor="edit-material-unit" className="block text-sm font-medium mb-1">Unità di Misura *</label>
                  <input type="text" name="unit" id="edit-material-unit" value={currentMaterial.unit} onChange={(e) => setCurrentMaterial({...currentMaterial, unit: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="edit-material-price" className="block text-sm font-medium mb-1">Prezzo Unitario (€) *</label>
                  <input type="number" name="price" id="edit-material-price" step="0.01" value={currentMaterial.price} onChange={(e) => setCurrentMaterial({...currentMaterial, price: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-material-supplier" className="block text-sm font-medium mb-1">Fornitore</label>
                  <input type="text" name="supplier" id="edit-material-supplier" value={currentMaterial.supplier || ''} onChange={(e) => setCurrentMaterial({...currentMaterial, supplier: e.target.value})} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setCurrentMaterial(null); }} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md">Salva Modifiche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizza Materiale */}
      {isViewModalOpen && materialToView && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-lg my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Dettagli Materiale</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2 text-light-text dark:text-dark-text">
              <p><strong>Nome:</strong> {materialToView.name}</p>
              <p><strong>Descrizione:</strong> {materialToView.description || 'N/D'}</p>
              <p><strong>Unità di Misura:</strong> {materialToView.unit}</p>
              <p><strong>Prezzo Unitario:</strong> {materialToView.price}</p>
              <p><strong>Fornitore:</strong> {materialToView.supplier || 'N/D'}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione Materiale */}
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
              Sei sicuro di voler eliminare questo materiale? L'azione è irreversibile.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsConfirmDeleteModalOpen(false)} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text">Annulla</button>
              <button onClick={handleDeleteMaterial} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsPage;
