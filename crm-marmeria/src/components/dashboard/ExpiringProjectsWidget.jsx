import React, { useState, useMemo } from 'react';
import { Eye, CheckSquare } from 'lucide-react';
import { useData } from '../../hooks/useData';
import Modal from '../common/Modal';

const ExpiringProjectsWidget = () => {
  const { projects, updateProjectStatus } = useData();
  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  // Filtra i progetti in scadenza o scaduti entro 7 giorni
  const expiringProjects = useMemo(() => {
    if (!projects) return [];
    
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return projects.filter(project => {
      // Escludi progetti completati o annullati
      if (project.status === 'Completato' || project.status === 'Annullato') {
        return false;
      }
      
      const deadline = new Date(project.deadline);
      // Includi progetti che scadono entro 7 giorni o sono già scaduti
      return deadline <= sevenDaysFromNow;
    }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [projects]);

  const handleViewProject = (project) => {
    setProjectToView(project);
    setIsViewProjectModalOpen(true);
  };

  const handleCompleteProject = async (projectId) => {
    try {
      await updateProjectStatus(projectId, 'Completato');
    } catch (error) {
      console.error('Errore nel completamento del progetto:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Corso': return 'text-blue-600 dark:text-blue-400';
      case 'In Attesa': return 'text-yellow-600 dark:text-yellow-400';
      case 'Preventivo': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Scaduto ${Math.abs(diffDays)} giorni fa`;
    } else if (diffDays === 0) {
      return 'Scade oggi';
    } else {
      return `Scade tra ${diffDays} giorni`;
    }
  };

  return (
    <>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
          Progetti in Scadenza (7 giorni)
        </h3>
        
        {expiringProjects.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Nessun progetto in scadenza
          </p>
        ) : (
          <div className="space-y-3">
            {expiringProjects.map((project) => {
              const deadline = new Date(project.deadline);
              const today = new Date();
              const isOverdue = deadline < today;
              
              return (
                <div 
                  key={project.id} 
                  className={`p-4 rounded-lg border ${
                    isOverdue 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30' 
                      : 'bg-light-bg/50 dark:bg-dark-input/50 border-light-border dark:border-dark-border'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-light-text dark:text-dark-text mb-1">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        Cliente: {project.client}
                      </p>
                      <p className={`text-sm ${
                        isOverdue ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {formatDate(project.deadline)}
                      </p>
                      <p className={`text-sm ${getStatusColor(project.status)}`}>
                        Stato: {project.status}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewProject(project)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
                        title="Visualizza dettagli"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleCompleteProject(project.id)}
                        className="p-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
                        title="Completa progetto"
                      >
                        <CheckSquare size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal per visualizzare i dettagli del progetto */}
      {isViewProjectModalOpen && projectToView && (
        <Modal
          isOpen={isViewProjectModalOpen}
          onClose={() => {
            setIsViewProjectModalOpen(false);
            setProjectToView(null);
          }}
          title={`Dettagli Progetto: ${projectToView.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome Progetto
              </label>
              <p className="text-gray-900 dark:text-gray-100">{projectToView.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <p className="text-gray-900 dark:text-gray-100">{projectToView.client}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data di Scadenza
              </label>
              <p className="text-gray-900 dark:text-gray-100">{new Date(projectToView.deadline).toLocaleDateString('it-IT')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stato
              </label>
              <p className={`font-medium ${getStatusColor(projectToView.status)}`}>{projectToView.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget
              </label>
              <p className="text-gray-900 dark:text-gray-100">{projectToView.budget}</p>
            </div>
            {projectToView.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrizione
                </label>
                <p className="text-gray-900 dark:text-gray-100">{projectToView.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ExpiringProjectsWidget;