import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash, Search, Plus, Filter, X } from 'lucide-react';

const ProjectsPage = ({ projects, setProjects, customers, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilteredProjects, setCurrentFilteredProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    const selectedCustomer = customers.find(c => c.id === parseInt(newProject.clientId));
    const projectToAdd = {
      ...newProject,
      id: newId,
      client: selectedCustomer ? selectedCustomer.name : 'Cliente non specificato',
      budget: `€ ${parseFloat(newProject.budget).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
    setProjects((prevProjects) => [...prevProjects, projectToAdd]);
    setIsModalOpen(false);
    setNewProject({
      name: '',
      clientId: '',
      startDate: '',
      deadline: '',
      budget: '',
      status: 'In Attesa',
    });
  };

  const handleEditProject = (project) => {
    // Pre-popola il form di modifica con i dati del progetto, convertendo il budget in numero
    const budgetValue = project.budget ? parseFloat(project.budget.replace('€', '').replace(/\./g, '').replace(',', '.')) : '';
    setCurrentProject({ ...project, budget: budgetValue });
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = (e) => {
    e.preventDefault();
    setProjects((prevProjects) =>
      prevProjects.map((proj) =>
        proj.id === currentProject.id ? { ...currentProject, budget: `€ ${parseFloat(currentProject.budget).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` } : proj
      )
    );
    setIsEditModalOpen(false);
    setCurrentProject(null);
  };

  const openConfirmDeleteModal = (projectId) => {
    setProjectToDeleteId(projectId);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleDeleteProject = () => {
    if (projectToDeleteId) {
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== projectToDeleteId)
      );
      setIsConfirmDeleteModalOpen(false);
      setProjectToDeleteId(null);
    }
  };

  const handleViewProject = (project) => {
    setProjectToView(project);
    setIsViewModalOpen(true);
  };

  useEffect(() => {
    let projectsToDisplay = projects || [];

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
    setCurrentFilteredProjects(projectsToDisplay);
  }, [searchTerm, projects, statusFilter, startDateFilter, endDateFilter]);

  const resetFilters = () => {
    setStatusFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchTerm('');
  };

  return (
    <div className="p-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Progetti</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuovo Progetto
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm">
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca progetto..."
                className="w-full pl-10 pr-4 py-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md flex items-center gap-2 hover:bg-light-bg dark:hover:bg-dark-bg">
              <Filter className="w-5 h-5" />
              {showFilters ? 'Nascondi' : 'Mostra'} Filtri
            </button>
          </div>
          {showFilters && (
            <div className="p-4 border-t border-light-border dark:border-dark-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium mb-1">Stato</label>
                  <select 
                    id="statusFilter" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                  >
                    <option value="">Tutti</option>
                    <option value="In Attesa">In Attesa</option>
                    <option value="In Corso">In Corso</option>
                    <option value="Completato">Completato</option>
                    <option value="Annullato">Annullato</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="startDateFilter" className="block text-sm font-medium mb-1">Da Data Inizio</label>
                  <input 
                    type="date" 
                    id="startDateFilter" 
                    value={startDateFilter} 
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                  />
                </div>
                <div>
                  <label htmlFor="endDateFilter" className="block text-sm font-medium mb-1">A Data Scadenza</label>
                  <input 
                    type="date" 
                    id="endDateFilter" 
                    value={endDateFilter} 
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 invisible">Reset</label>
                  <button 
                    onClick={resetFilters}
                    className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg flex items-center justify-center gap-2"
                  >
                    Resetta Filtri
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-bg dark:bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Inizio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scadenza</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {currentFilteredProjects.length > 0 ? currentFilteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50">
                  <td className="px-6 py-4 whitespace-nowrap">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.deadline}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{project.budget}</td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleViewProject(project)} className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleEditProject(project)} className="p-1 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => openConfirmDeleteModal(project.id)} className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded">
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nessun progetto trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nuovo Progetto</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddProject}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Nome Progetto *</label>
                  <input type="text" name="name" id="name" value={newProject.name} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium mb-1">Cliente *</label>
                  <select name="clientId" id="clientId" value={newProject.clientId} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary">
                    <option value="">Seleziona Cliente</option>
                    {customers?.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium mb-1">Data Inizio *</label>
                  <input type="date" name="startDate" id="startDate" value={newProject.startDate} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium mb-1">Scadenza *</label>
                  <input type="date" name="deadline" id="deadline" value={newProject.deadline} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium mb-1">Budget (€) *</label>
                  <input type="number" name="budget" id="budget" step="0.01" value={newProject.budget} onChange={handleInputChange} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-1">Stato</label>
                  <select name="status" id="status" value={newProject.status} onChange={handleInputChange} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary">
                    <option value="In Attesa">In Attesa</option>
                    <option value="In Corso">In Corso</option>
                    <option value="Completato">Completato</option>
                    <option value="Annullato">Annullato</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">
                  Annulla
                </button>
                <button type="submit" className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md">
                  Aggiungi Progetto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && projectToView && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Dettagli Progetto</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome Progetto</p>
                <p className="text-lg">{projectToView.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</p>
                <p className="text-lg">{projectToView.client}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Inizio</p>
                <p className="text-lg">{projectToView.startDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scadenza</p>
                <p className="text-lg">{projectToView.deadline}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget</p>
                <p className="text-lg font-medium">{projectToView.budget}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Stato</p>
                <p className="text-lg">
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
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && currentProject && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Modifica Progetto</h2>
              <button onClick={() => { setIsEditModalOpen(false); setCurrentProject(null); }} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="edit-project-name" className="block text-sm font-medium mb-1">Nome Progetto *</label>
                  <input type="text" name="name" id="edit-project-name" value={currentProject.name} onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="edit-project-clientId" className="block text-sm font-medium mb-1">Cliente *</label>
                  <select name="clientId" id="edit-project-clientId" value={currentProject.clientId} onChange={(e) => setCurrentProject({...currentProject, clientId: e.target.value, client: customers.find(c => c.id === parseInt(e.target.value))?.name || ''})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary">
                    <option value="">Seleziona Cliente</option>
                    {customers?.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-project-startDate" className="block text-sm font-medium mb-1">Data Inizio *</label>
                  <input type="date" name="startDate" id="edit-project-startDate" value={currentProject.startDate} onChange={(e) => setCurrentProject({...currentProject, startDate: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="edit-project-deadline" className="block text-sm font-medium mb-1">Scadenza *</label>
                  <input type="date" name="deadline" id="edit-project-deadline" value={currentProject.deadline} onChange={(e) => setCurrentProject({...currentProject, deadline: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="edit-project-budget" className="block text-sm font-medium mb-1">Budget (€) *</label>
                  <input type="number" name="budget" id="edit-project-budget" step="0.01" value={currentProject.budget} onChange={(e) => setCurrentProject({...currentProject, budget: e.target.value})} required className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary" />
                </div>
                <div>
                  <label htmlFor="edit-project-status" className="block text-sm font-medium mb-1">Stato</label>
                  <select name="status" id="edit-project-status" value={currentProject.status} onChange={(e) => setCurrentProject({...currentProject, status: e.target.value})} className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary">
                    <option value="In Attesa">In Attesa</option>
                    <option value="In Corso">In Corso</option>
                    <option value="Completato">Completato</option>
                    <option value="Annullato">Annullato</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setCurrentProject(null); }} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg">
                  Annulla
                </button>
                <button type="submit" className="px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md">
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Conferma Eliminazione Progetto */}
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
              Sei sicuro di voler eliminare questo progetto? L'azione è irreversibile.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsConfirmDeleteModalOpen(false)} 
                className="px-4 py-2 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text"
              >
                Annulla
              </button>
              <button 
                onClick={handleDeleteProject} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
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
