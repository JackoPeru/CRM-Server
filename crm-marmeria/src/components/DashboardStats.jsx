import React from 'react';
import { Users, Briefcase, Layers, DollarSign, TrendingUp } from 'lucide-react';
import useUI from '../hooks/useUI';
import { useAuth } from '../hooks/useAuth';

const StatCard = ({ title, value, icon: Icon, bgColor, textColor, targetPage, filters }) => {
  const { updatePreferences } = useUI();

  const handleClick = () => {
    if (filters) {
      // TODO: Implementare filtri se necessario
    }
    updatePreferences({ currentPage: targetPage });
  };

  return (
    <div
      className={`p-6 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md ${bgColor} ${textColor}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        {Icon && <Icon className="w-7 h-7 opacity-80" />}
      </div>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
};

const DashboardStats = ({ stats }) => {
  const { currentUser } = useAuth();
  if (!stats) return null;

  const allStatItems = [
    {
      title: 'Clienti Attivi',
      value: stats.customers,
      icon: Users,
      bgColor: 'bg-blue-500 dark:bg-blue-600',
      textColor: 'text-white',
      targetPage: 'customers',
    },
    {
      title: 'Progetti Totali',
      value: stats.projects,
      icon: Briefcase,
      bgColor: 'bg-purple-500 dark:bg-purple-600',
      textColor: 'text-white',
      targetPage: 'projects',
    },
    {
      title: 'Progetti in Corso',
      value: stats.projectsInProgress,
      icon: TrendingUp, // Icona diversa per i progetti in corso
      bgColor: 'bg-yellow-500 dark:bg-yellow-600',
      textColor: 'text-white',
      targetPage: 'projects',
      filters: { status: 'In Corso' }, // Filtro per stato
    },
    {
      title: 'Materiali Registrati',
      value: stats.materials,
      icon: Layers,
      bgColor: 'bg-green-500 dark:bg-green-600',
      textColor: 'text-white',
      targetPage: 'materials',
    },
    {
      title: 'Fatturato (Mese)',
      value: stats.revenue,
      icon: DollarSign,
      bgColor: 'bg-pink-500 dark:bg-pink-600',
      textColor: 'text-white',
      targetPage: 'invoices', // Esempio, potrebbe non avere filtri specifici
    },
  ];

  // Filtra le card in base al ruolo dell'utente
  // Gli operai (worker) non possono vedere le card Clienti e Fatturato
  const statItems = currentUser?.role === 'worker' 
    ? allStatItems.filter(item => item.title !== 'Clienti Attivi' && item.title !== 'Fatturato (Mese)')
    : allStatItems;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 ${
      currentUser?.role === 'worker' 
        ? 'lg:grid-cols-3 justify-center max-w-5xl mx-auto' 
        : 'lg:grid-cols-3 xl:grid-cols-5'
    }`}>
      {statItems.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          icon={item.icon}
          bgColor={item.bgColor}
          textColor={item.textColor}
          targetPage={item.targetPage}
          filters={item.filters}
        />
      ))}
    </div>
  );
};

export default DashboardStats;