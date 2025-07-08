import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, Filter, X } from 'lucide-react';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';

const MaterialsPage = () => {
  const { 
    isModalOpen, 
    showModal, 
    hideModal, 
    setBreadcrumbs,
    showAlert
  } = useUI();
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useData();
  const { hasRole } = useAuth();
  const isWorker = hasRole('worker');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Materiali' }]);
  }, [setBreadcrumbs]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [materialToView, setMaterialToView] = useState(null);
  const [materialToDeleteId, setMaterialToDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: '',
    price: '',
    unit: '',
    supplier: '',
    description: '',
    stock: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    const materialToAdd = {
      ...newMaterial,
      price: parseFloat(newMaterial.price) || 0,
      stock: parseInt(newMaterial.stock) || 0
    };
    
    try {
      await addMaterial(materialToAdd);
      hideModal('addMaterial');
      setNewMaterial({
        name: '',
        category: '',
        price: '',
        unit: '',
        supplier: '',
        description: '',
        stock: ''
      });
      showAlert('Materiale aggiunto con successo', 'success');
    } catch (error) {
      console.error('Errore nella creazione del materiale:', error);
      showAlert('Errore nella creazione del materiale', 'error');
    }
  };

  const handleEditMaterial = (material) => {
    setCurrentMaterial({ ...material });
    showModal({ id: 'editMaterial', type: 'edit' });
  };

  const handleUpdateMaterial = (e) => {
    e.preventDefault();
    const updatedMaterial = {
      ...currentMaterial,
      price: parseFloat(currentMaterial.price) || 0,
      stock: parseInt(currentMaterial.stock) || 0
    };
    updateMaterial(currentMaterial.id, updatedMaterial);
    hideModal('editMaterial');
    setCurrentMaterial(null);
    showAlert('Materiale aggiornato con successo', 'success');
  };

  const openConfirmDeleteModal = (materialId) => {
    setMaterialToDeleteId(materialId);
    showModal({ id: 'confirmDelete', type: 'delete' });
  };

  const handleDeleteMaterial = () => {
    if (materialToDeleteId) {
      deleteMaterial(materialToDeleteId);
      hideModal('confirmDelete');
      setMaterialToDeleteId(null);
      showAlert('Materiale eliminato con successo', 'success');
    }
  };

  const handleViewMaterial = (material) => {
    setMaterialToView(material);
    showModal({ id: 'viewMaterial', type: 'view' });
  };

  // Filtra i materiali
  const filteredMaterials = React.useMemo(() => {
    let filtered = materials || [];

    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(material => material.category === categoryFilter);
    }

    return filtered;
  }, [materials, searchTerm, categoryFilter]);

  // Ottieni categorie uniche per il filtro
  const categories = React.useMemo(() => {
    const cats = materials?.map(m => m.category).filter(Boolean) || [];
    return [...new Set(cats)];
  }, [materials]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Materiali</h1>
        {!isWorker && (
          <button
            onClick={() => showModal({ id: 'addMaterial', type: 'add' })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Materiale
          </button>
        )}
      </div>

      {/* Barra di ricerca e filtri */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca materiali..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <Filter className="w-4 h-4" />
            Filtri
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Tutte le categorie</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancella filtri
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabella materiali */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Prezzo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Scorta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fornitore
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {material.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {material.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{material.price?.toFixed(2)} / {material.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {material.stock} {material.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {material.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewMaterial(material)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Visualizza"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!isWorker && (
                        <>
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            title="Modifica"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openConfirmDeleteModal(material.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Elimina"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nessun materiale trovato</p>
          </div>
        )}
      </div>

      {/* Modal Aggiungi Materiale */}
      {isModalOpen('addMaterial') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Aggiungi Materiale</h2>
              <button
                onClick={() => hideModal('addMaterial')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newMaterial.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria *
                </label>
                <input
                  type="text"
                  name="category"
                  value={newMaterial.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prezzo *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={newMaterial.price}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unità *
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={newMaterial.unit}
                    onChange={handleInputChange}
                    required
                    placeholder="es. mq, kg, pz"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fornitore
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={newMaterial.supplier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scorta
                </label>
                <input
                  type="number"
                  name="stock"
                  value={newMaterial.stock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrizione
                </label>
                <textarea
                  name="description"
                  value={newMaterial.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => hideModal('addMaterial')}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aggiungi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Altri modali simili per edit, view e delete... */}
    </div>
  );
};

export default MaterialsPage;