import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, Filter, X, Upload, Image as ImageIcon } from 'lucide-react';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import ProjectStatusButtons from '../components/entities/ProjectStatusButtons';
import ProjectImages from '../components/entities/ProjectImages';

// Configurazione centralizzata degli URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const ProjectsPage = () => {
  const { 
    isModalOpen, 
    showModal, 
    hideModal, 
    tableFilters, 
    setTableFilter, 
    setBreadcrumbs 
  } = useUI();
  const { projects, customers, addProject, updateProject, updateProjectStatus, deleteProject } = useData();
  const { hasRole } = useAuth();
  const isWorker = hasRole('worker');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Progetti' }]);
  }, [setBreadcrumbs]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [projectToView, setProjectToView] = useState(null);
  const [projectToDeleteId, setProjectToDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [newProject, setNewProject] = useState({
    name: '',
    clientId: '',
    startDate: '',
    deadline: '',
    budget: '',
    status: 'In Attesa',
  });
  const [newProjectImages, setNewProjectImages] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };

  const uploadProjectImages = async (projectId, images) => {
    const { token } = useAuth();
    const formData = new FormData();
    images.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'upload delle immagini');
      }
    } catch (error) {
      console.error('Errore nell\'upload delle immagini:', error);
      throw error;
    }
  };

  const handleNewProjectImagesChange = (event) => {
    const files = Array.from(event.target.files);
    setNewProjectImages(prev => [...prev, ...files]);
  };

  const removeNewProjectImage = (index) => {
    setNewProjectImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    const selectedCustomer = customers.find(c => c.id === newProject.clientId);
    const projectToAdd = {
      ...newProject,
      type: 'project', // Specifica il tipo come progetto
      client: selectedCustomer ? selectedCustomer.name : 'Cliente non specificato',
      budget: `€ ${parseFloat(newProject.budget).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
    
    try {
      const createdProject = await addProject(projectToAdd);
      
      // Se ci sono immagini da caricare, caricale dopo la creazione del progetto
      if (newProjectImages.length > 0 && createdProject?.id) {
        await uploadProjectImages(createdProject.id, newProjectImages);
      }
      
      hideModal('addProject');
      setNewProject({
        name: '',
        clientId: '',
        startDate: '',
        deadline: '',
        budget: '',
        status: 'In Attesa',
      });
      setNewProjectImages([]);
    } catch (error) {
      console.error('Errore nella creazione del progetto:', error);
    }
  };

  const handleEditProject = (project) => {
    // Pre-popola il form di modifica con i dati del progetto, convertendo il budget in numero
    const budgetValue = project.budget ? parseFloat(project.budget.replace('€', '').replace(/\./g, '').replace(',', '.')) : '';
    setCurrentProject({ ...project, budget: budgetValue });
    showModal({ id: 'editProject', type: 'edit' });
  };

  const handleUpdateProject = (e) => {
    e.preventDefault();
    const updatedProject = { ...currentProject, type: 'project', budget: `€ ${parseFloat(currentProject.budget).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` };
    updateProject(currentProject.id, updatedProject);
    hideModal('editProject');
    setCurrentProject(null);
  };

  const openConfirmDeleteModal = (projectId) => {
    setProjectToDeleteId(projectId);
    showModal({ id: 'confirmDelete', type: 'delete' });
  };

  const handleDeleteProject = () => {
    if (projectToDeleteId) {
      deleteProject(projectToDeleteId);
      hideModal('confirmDelete');
      setProjectToDeleteId(null);
    }
  };

  const handleViewProject = (project) => {
    if (!project || !project.id) {
      console.error('Progetto non valido:', project);
      return;
    }
    console.log('ProjectsPage: Progetto selezionato per visualizzazione:', {
      id: project.id,
      name: project.name,
      tipo: typeof project.id,
      progetto_completo: project
    });
    setProjectToView(project);
    showModal({ id: 'viewProject', type: 'view' });
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      const success = await updateProjectStatus(projectId, newStatus);
      if (success) {
        console.log(`Stato progetto ${projectId} aggiornato a: ${newStatus}`);
        // I dati vengono ricaricati automaticamente dall'hook useOrders
      } else {
        console.error('Aggiornamento stato fallito');
      }
    } catch (error) {
      console.error('Errore nel cambio di stato:', error);
    }
  };

  // Funzione helper per risolvere il nome del cliente dal clientId
  const getClientName = React.useCallback((clientId) => {
    if (!clientId) return 'Cliente non specificato';
    const client = customers.find(c => c.id === clientId);
    return client ? client.name : 'Cliente non specificato';
  }, [customers]);

  // Calcola i progetti filtrati con risoluzione dinamica del cliente
  const currentFilteredProjects = React.useMemo(() => {
    let projectsToDisplay = (projects || []).map(project => ({
      ...project,
      client: getClientName(project.clientId)
    }));

    if (statusFilter) {
      projectsToDisplay = projectsToDisplay.filter(p => p.status === statusFilter);
    }

    if (startDateFilter) {
      projectsToDisplay = projectsToDisplay.filter(p => new Date(p.startDate) >= new Date(startDateFilter));
    }

    if (endDateFilter) {
      projectsToDisplay = projectsToDisplay.filter(p => new Date(p.deadline) <= new Date(endDateFilter));
    }

    if (searchTerm) {
      projectsToDisplay = projectsToDisplay.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.client && project.client.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return projectsToDisplay;
  }, [searchTerm, projects, statusFilter, startDateFilter, endDateFilter, getClientName]);

  const resetFilters = () => {
    setStatusFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchTerm('');
  };

  return (
    <div className="p-3 md:p-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-semibold mobile-friendly-text">Progetti</h1>
        {useAuth().hasRole('admin') && (
          <button 
            onClick={() => showModal({ id: 'addProject', type: 'add' })}
            className="w-full sm:w-auto touch-target px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="mobile-friendly-text">Nuovo Progetto</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-6">
        <div className="p-3 md:p-4 border-b border-light-border dark:border-dark-border">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca progetto..."
                className="w-full pl-10 pr-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="touch-target px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md flex items-center justify-center gap-2 hover:bg-light-bg dark:hover:bg-dark-bg">
              <Filter className="w-5 h-5" />
              <span className="mobile-friendly-text">{showFilters ? 'Nascondi' : 'Mostra'} Filtri</span>
            </button>
          </div>
          {showFilters && (
            <div className="p-3 md:p-4 border-t border-light-border dark:border-dark-border">
              <div className="form-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Stato</label>
                  <select 
                    id="statusFilter" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text"
                  >
                    <option value="">Tutti</option>
                    <option value="In Attesa">In Attesa</option>
                    <option value="In Corso">In Corso</option>
                    <option value="Completato">Completato</option>
                    <option value="Annullato">Annullato</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="startDateFilter" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Da Data Inizio</label>
                  <input 
                    type="date" 
                    id="startDateFilter" 
                    value={startDateFilter} 
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text"
                  />
                </div>
                <div>
                  <label htmlFor="endDateFilter" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">A Data Scadenza</label>
                  <input 
                    type="date" 
                    id="endDateFilter" 
                    value={endDateFilter} 
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text"
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium mb-2 invisible mobile-friendly-text">Reset</label>
                  <button 
                    onClick={resetFilters}
                    className="w-full touch-target px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg flex items-center justify-center gap-2"
                  >
                    <span className="mobile-friendly-text">Resetta Filtri</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="desktop-table overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-bg dark:bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                {!isWorker && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Inizio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scadenza</th>
                {!isWorker && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Budget</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Operaio Assegnato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {currentFilteredProjects.length > 0 ? currentFilteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50">
                  <td className="px-6 py-4 whitespace-nowrap">{project.name}</td>
                  {!isWorker && (
                    <td className="px-6 py-4 whitespace-nowrap">{project.client}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">{project.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.deadline}</td>
                  {!isWorker && (
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{project.budget}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ 
                      project.status === 'Completato'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : project.status === 'In Corso'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : project.status === 'In Attesa'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {project.assignedWorker ? (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {(project.assignedWorker.name || project.assignedWorker.username)?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {project.assignedWorker.name || project.assignedWorker.username || 'Operaio'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(project.assignedWorker.assignedAt).toLocaleDateString('it-IT')}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button onClick={() => handleViewProject(project)} className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded">
                        <Eye className="w-5 h-5" />
                      </button>
                      {isWorker ? (
                        <ProjectStatusButtons 
                          currentStatus={project.status} 
                          onStatusChange={(newStatus) => handleStatusChange(project.id, newStatus)}
                        />
                      ) : (
                        <>
                          <button onClick={() => handleEditProject(project)} className="p-1 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => openConfirmDeleteModal(project.id)} className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded">
                            <Trash className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isWorker ? "6" : "8"} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nessun progetto trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-cards p-3">
          {currentFilteredProjects.length > 0 ? currentFilteredProjects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 mb-3 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg mobile-friendly-text truncate flex-1 mr-2">{project.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium shrink-0 ${ 
                  project.status === 'Completato'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : project.status === 'In Corso'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : project.status === 'In Attesa'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                {!isWorker && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 mobile-friendly-text">Cliente:</span>
                    <span className="font-medium mobile-friendly-text">{project.client}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 mobile-friendly-text">Inizio:</span>
                  <span className="mobile-friendly-text">{project.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 mobile-friendly-text">Scadenza:</span>
                  <span className="mobile-friendly-text">{project.deadline}</span>
                </div>
                {!isWorker && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 mobile-friendly-text">Budget:</span>
                    <span className="font-medium mobile-friendly-text">{project.budget}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 mobile-friendly-text">Operaio:</span>
                  {project.assignedWorker ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {(project.assignedWorker.name || project.assignedWorker.username)?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <span className="mobile-friendly-text font-medium">
                        {project.assignedWorker.name || project.assignedWorker.username || 'Operaio'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 mobile-friendly-text">-</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end">
                <button 
                  onClick={() => handleViewProject(project)} 
                  className="touch-target px-3 py-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span className="mobile-friendly-text">Visualizza</span>
                </button>
                {isWorker ? (
                  <div className="flex-1">
                    <ProjectStatusButtons 
                      currentStatus={project.status} 
                      onStatusChange={(newStatus) => handleStatusChange(project.id, newStatus)}
                    />
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleEditProject(project)} 
                      className="touch-target px-3 py-2 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded-md flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="mobile-friendly-text">Modifica</span>
                    </button>
                    <button 
                      onClick={() => openConfirmDeleteModal(project.id)} 
                      className="touch-target px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2"
                    >
                      <Trash className="w-4 h-4" />
                      <span className="mobile-friendly-text">Elimina</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mobile-friendly-text">Nessun progetto trovato.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen('addProject') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 md:p-4 z-50">
          <div className="modal-content bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Nuovo Progetto</h2>
              <button onClick={() => hideModal('addProject')} className="touch-target p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddProject}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Nome Progetto *</label>
                  <input type="text" name="name" id="name" value={newProject.name} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                {!isWorker && (
                  <div>
                    <label htmlFor="clientId" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Cliente *</label>
                    <select name="clientId" id="clientId" value={newProject.clientId} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target">
                      <option value="">Seleziona Cliente</option>
                      {customers?.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="startDate" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Data Inizio *</label>
                  <input type="date" name="startDate" id="startDate" value={newProject.startDate} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="deadline" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Scadenza *</label>
                  <input type="date" name="deadline" id="deadline" value={newProject.deadline} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                {!isWorker && (
                  <div>
                    <label htmlFor="budget" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Budget (€) *</label>
                    <input type="number" name="budget" id="budget" step="0.01" value={newProject.budget} onChange={handleInputChange} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                  </div>
                )}
                <div>
                  <label htmlFor="status" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Stato</label>
                  <select name="status" id="status" value={newProject.status} onChange={handleInputChange} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target">
                    <option value="In Attesa">In Attesa</option>
                    <option value="In Corso">In Corso</option>
                    <option value="Completato">Completato</option>
                    <option value="Annullato">Annullato</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 mb-4">
                <label className="block text-sm font-medium mb-2">Immagini del Progetto</label>
                <div className="flex items-center gap-2 mb-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleNewProjectImagesChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">
                      <Upload className="w-4 h-4" />
                      Seleziona Immagini
                    </div>
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {newProjectImages.length} immagini selezionate
                  </span>
                </div>
                
                {newProjectImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {newProjectImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeNewProjectImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
                          title="Rimuovi immagine"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => hideModal('addProject')} className="touch-target px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text">
                  Annulla
                </button>
                <button type="submit" className="touch-target px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text">
                  Aggiungi Progetto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen('viewProject') && projectToView && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 md:p-4 z-50">
          <div className="modal-content bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Dettagli Progetto</h2>
              <button onClick={() => hideModal('viewProject')} className="touch-target p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Nome Progetto</p>
                <p className="text-lg mobile-friendly-text">{projectToView.name}</p>
              </div>
              {!isWorker && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Cliente</p>
                  <p className="text-lg mobile-friendly-text">{projectToView.client}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Data Inizio</p>
                <p className="text-lg mobile-friendly-text">{projectToView.startDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Scadenza</p>
                <p className="text-lg mobile-friendly-text">{projectToView.deadline}</p>
              </div>
              {!isWorker && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Budget</p>
                  <p className="text-lg font-medium mobile-friendly-text">{projectToView.budget}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile-friendly-text">Stato</p>
                <p className="text-lg mobile-friendly-text">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ 
                    projectToView.status === 'Completato'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : projectToView.status === 'In Corso'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : projectToView.status === 'In Attesa'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {projectToView.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
              {isWorker && (
                <ProjectStatusButtons
                  currentStatus={projectToView.status}
                  onStatusChange={(newStatus) => handleStatusChange(projectToView.id, newStatus)}
                />
              )}
              <div className={`flex gap-3 ${isWorker ? '' : 'ml-auto'}`}>
                <button
                  type="button"
                  onClick={() => hideModal('viewProject')}
                  className="touch-target px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text"
                >
                  Chiudi
                </button>
              </div>
            </div>
            
            {/* Sezione immagini del progetto */}
            <ProjectImages projectId={projectToView.id} />
          </div>
        </div>
      )}

      {isModalOpen('editProject') && projectToEdit && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 md:p-4 z-50">
          <div className="modal-content bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text">Modifica Progetto</h2>
              <button onClick={() => hideModal('editProject')} className="touch-target p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="edit-project-name" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Nome Progetto *</label>
                  <input type="text" name="name" id="edit-project-name" value={currentProject.name} onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                {!isWorker && (
                  <div>
                    <label htmlFor="edit-project-clientId" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Cliente *</label>
                    <select name="clientId" id="edit-project-clientId" value={currentProject.clientId} onChange={(e) => setCurrentProject({...currentProject, clientId: e.target.value, client: customers.find(c => c.id === parseInt(e.target.value))?.name || ''})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target">
                      <option value="">Seleziona Cliente</option>
                      {customers?.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="edit-project-startDate" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Data Inizio *</label>
                  <input type="date" name="startDate" id="edit-project-startDate" value={currentProject.startDate} onChange={(e) => setCurrentProject({...currentProject, startDate: e.target.value})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                <div>
                  <label htmlFor="edit-project-deadline" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Scadenza *</label>
                  <input type="date" name="deadline" id="edit-project-deadline" value={currentProject.deadline} onChange={(e) => setCurrentProject({...currentProject, deadline: e.target.value})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                </div>
                {!isWorker && (
                  <div>
                    <label htmlFor="edit-project-budget" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Budget (€) *</label>
                    <input type="number" name="budget" id="edit-project-budget" step="0.01" value={currentProject.budget} onChange={(e) => setCurrentProject({...currentProject, budget: e.target.value})} required className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target" />
                  </div>
                )}
                <div>
                  <label htmlFor="edit-project-status" className="block text-sm md:text-base font-medium mb-2 mobile-friendly-text">Stato</label>
                  <select name="status" id="edit-project-status" value={currentProject.status} onChange={(e) => setCurrentProject({...currentProject, status: e.target.value})} className="w-full p-3 md:p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary mobile-friendly-text touch-target">
                    <option value="In Attesa">In Attesa</option>
                    <option value="In Corso">In Corso</option>
                    <option value="Completato">Completato</option>
                    <option value="Annullato">Annullato</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => { hideModal('editProject'); setCurrentProject(null); }} className="touch-target px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg mobile-friendly-text">
                  Annulla
                </button>
                <button type="submit" className="touch-target px-4 py-3 md:py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md mobile-friendly-text">
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Conferma Eliminazione Progetto */}
      {isModalOpen('confirmDelete') && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 md:p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold mobile-friendly-text touch-target">Conferma Eliminazione</h2>
              <button onClick={() => hideModal('confirmDelete')} className="touch-target p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="mb-6 text-light-text dark:text-dark-text mobile-friendly-text">
              Sei sicuro di voler eliminare questo progetto? L'azione è irreversibile.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => hideModal('confirmDelete')} 
                className="touch-target px-4 py-3 md:py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text mobile-friendly-text"
              >
                Annulla
              </button>
              <button 
                onClick={handleDeleteProject} 
                className="touch-target px-4 py-3 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-md mobile-friendly-text"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
