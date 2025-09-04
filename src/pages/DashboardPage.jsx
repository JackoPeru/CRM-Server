import React, { useState, useEffect } from 'react';

import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import DashboardStats from '../components/DashboardStats';
import ExpiringProjectsWidget from '../components/dashboard/ExpiringProjectsWidget';
import NotesWidget from '../components/widgets/NotesWidget';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import useUI from '../hooks/useUI';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';


ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardPage = () => {
  const { setBreadcrumbs } = useUI();
  const { customers, projects, updateProject, deleteProject } = useData();
  const { hasRole } = useAuth();
  const { mainMetrics } = useDashboard();
  const isWorker = hasRole('worker');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard' }]);
  }, [setBreadcrumbs]);








  const stats = {
    customers: customers?.length || 0,
    projects: projects?.length || 0,
    projectsInProgress: projects?.filter(p => p.status === 'In Corso').length || 0,
    materials: mainMetrics?.totalMaterials || 0,
    revenue: '€ 0.00', // Placeholder
  };



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



      {/* Sezione Widget e Grafico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget Progetti in Scadenza */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
          <ExpiringProjectsWidget />
        </div>
        
        {/* Widget Appunti */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
          <NotesWidget />
        </div>
        
        {/* Colonna Grafico a Torta */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Stato Lavori</h2>
          <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-700 rounded-md">
            {/* Grafico a Torta Effettivo */}
            {projects && projects.length > 0 ? (
              <div style={{ height: '200px', width: '100%' }}>
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Nessun dato disponibile per il grafico.</p>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default DashboardPage;
