import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, CheckSquare, Eye } from 'lucide-react';
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import DashboardStats from '../components/DashboardStats';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';

ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardPage = () => {
  const { setBreadcrumbs } = useUI();
  const { customers, projects, updateProject, deleteProject } = useData();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard' }]);
  }, [setBreadcrumbs]);

  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null); // Contiene l'ID della nota in modifica o null
  const [editText, setEditText] = useState(''); // Testo della nota in modifica

  // Carica le note da localStorage all'avvio
  useEffect(() => {
    const storedNotes = localStorage.getItem('dashboardNotes');
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  }, []);

  // Salva le note su localStorage ogni volta che cambiano
  useEffect(() => {
    localStorage.setItem('dashboardNotes', JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    if (newNote.trim() === '') return;
    setNotes([...notes, { id: Date.now(), text: newNote }]);
    setNewNote('');
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setEditText(note.text);
  };

  const handleSaveEdit = (id) => {
    setNotes(notes.map(note => note.id === id ? { ...note, text: editText } : note));
    setEditingNote(null);
    setEditText('');
  };

  const stats = {
    customers: customers?.length || 0,
    projects: projects?.length || 0,
    projectsInProgress: projects?.filter(p => p.status === 'In Corso').length || 0,
    materials: 0, // Placeholder
    revenue: '€ 0.00', // Placeholder
  };

  const handleViewProject = (project) => {
    setProjectToView(project);
    setIsViewProjectModalOpen(true);
  };

  const handleCompleteProject = (projectId) => {
    updateProject(projectId, { status: 'Completato' });
  };

  const expiringProjects = projects?.filter(p => p.status !== 'Completato') || [];

  // Prepara i dati per il grafico a torta dagli stati dei progetti reali
  const projectStatusCounts = projects?.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const pieChartData = {
    labels: Object.keys(projectStatusCounts),
    datasets: [
      {
        label: 'Stato Lavori',
        data: Object.values(projectStatusCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)', // Rosso
          'rgba(54, 162, 235, 0.7)', // Blu
          'rgba(255, 206, 86, 0.7)', // Giallo
          'rgba(75, 192, 192, 0.7)', // Verde Acqua
          'rgba(153, 102, 255, 0.7)', // Viola
          'rgba(255, 159, 64, 0.7)', // Arancione
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: function(context) {
            // Determina il colore del testo della legenda in base al tema
            // Questo approccio è più robusto della manipolazione diretta del DOM
            const isDarkMode = document.documentElement.classList.contains('dark');
            return isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
          }
        },
        onClick: (e, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          const meta = ci.getDatasetMeta(index);

          // Nasconde o mostra l'intero dataset (se ce n'è solo uno, nasconde/mostra la fetta)
          // Per grafici a torta con un solo dataset, si agisce sulla visibilità dei dati specifici
          // Per i grafici a torta, di solito si interagisce con gli indici dei dati (fette)
          const dataIndex = legendItem.index;
          if (ci.isDatasetVisible(legendItem.datasetIndex)) { // Controlla se il dataset è visibile
            if (ci.getDataVisibility(dataIndex)) {
              ci.hide(dataIndex); // Nasconde la fetta specifica
              legendItem.hidden = true;
            } else {
              ci.show(dataIndex); // Mostra la fetta specifica
              legendItem.hidden = false;
            }
          } else { // Se il dataset intero è nascosto, questo clic non dovrebbe fare nulla sulla singola fetta
            // O, alternativamente, si potrebbe voler mostrare l'intero dataset e poi la fetta specifica
            // Per ora, manteniamo semplice: se il dataset è nascosto, non fare nulla con le singole fette.
          }
          ci.update();
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <WelcomeHeader userName={'Utente'} />

      {/* Sezione Statistiche Interattive */}
      <DashboardStats stats={stats} />

      {/* Colonna Appunti Rapidi - Spostata in alto e a larghezza piena */}
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm col-span-1 lg:col-span-3">
        <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Appunti Rapidi</h2>
        <div className="mb-4">
          <textarea
            className="w-full h-24 p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-light-text dark:text-dark-text focus:ring-light-primary dark:focus:ring-dark-primary focus:border-light-primary dark:focus:border-dark-primary"
            placeholder="Scrivi un nuovo appunto..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          ></textarea>
          <button 
            onClick={handleAddNote}
            className="mt-2 px-4 py-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-md w-full"
          >
            Aggiungi Appunto
          </button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {notes.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Nessun appunto salvato.</p>}
          {notes.map((note) => (
            <div key={note.id} className="p-3 border border-light-border dark:border-dark-border rounded-md bg-light-bg/50 dark:bg-dark-input/50">
              {editingNote === note.id ? (
                <div>
                  <textarea 
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 border border-light-border dark:border-dark-border rounded-md bg-light-bg dark:bg-dark-input text-light-text dark:text-dark-text mb-2"
                  />
                  <button onClick={() => handleSaveEdit(note.id)} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs mr-2">Salva</button>
                  <button onClick={() => setEditingNote(null)} className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-xs">Annulla</button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <p className="text-sm text-light-text dark:text-dark-text whitespace-pre-wrap break-words flex-grow mr-2">{note.text}</p>
                  <div className="flex-shrink-0 flex gap-2">
                    <button onClick={() => handleEditNote(note)} className="p-1 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-500">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteNote(note.id)} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sezione Grafico a Torta e Progetti in Scadenza */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna Grafico a Torta (placeholder) */}
        <div className="lg:col-span-1 bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Stato Lavori</h2>
          <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-700 rounded-md">
            {/* Grafico a Torta Effettivo */}
            {expiringProjects.length > 0 ? (
              <div style={{ height: '200px', width: '100%' }}> {/* Aggiunto contenitore con altezza definita */} 
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Nessun dato disponibile per il grafico.</p>
            )}
          </div>
        </div>

        {/* Colonna Progetti in Scadenza */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Progetti in Scadenza (7 giorni)</h2>
          {expiringProjects.length > 0 ? (
            <ul className="space-y-4">
              {expiringProjects.map((project) => (
                <li key={project.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Cliente: {project.client}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Data: {project.date}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Stato: {project.status}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleViewProject(project)} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs flex items-center gap-1"><Eye size={14}/> Vedi</button>
                      <button onClick={() => handleCompleteProject(project.id)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs flex items-center gap-1"><CheckSquare size={14}/> Completa</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Nessun progetto in scadenza.</p>
          )}
        </div>
      </div>

      {/* Modal Visualizzazione Progetto */}
      {isViewProjectModalOpen && projectToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-light-text dark:text-dark-text">Dettagli Progetto</h3>
              <button 
                onClick={() => setIsViewProjectModalOpen(false)}
                className="text-light-text dark:text-dark-text hover:text-gray-700 dark:hover:text-gray-300"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3 text-sm text-light-text dark:text-dark-text">
              <p><strong>ID:</strong> {projectToView.id}</p>
              <p><strong>Cliente:</strong> {projectToView.client}</p>
              <p><strong>Data Inizio:</strong> {projectToView.date}</p>
              <p><strong>Descrizione:</strong> {projectToView.description || 'N/D'}</p>
              <p><strong>Stato:</strong> {projectToView.status}</p>
              <p><strong>Materiali:</strong> {projectToView.materials?.join(', ') || 'N/D'}</p>
              <p><strong>Prezzo:</strong> {projectToView.price ? `€ ${projectToView.price.toFixed(2)}` : 'N/D'}</p>
              {/* Aggiungere altri dettagli del progetto se necessario */}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsViewProjectModalOpen(false)} 
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-light-text dark:text-dark-text rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
