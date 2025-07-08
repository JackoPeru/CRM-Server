import { Users, Briefcase, Layers, DollarSign } from 'lucide-react';
import Icon from '../common/Icon';
import StatCard from './StatCard';
import { useAuth } from '../../hooks/useAuth';

const DashboardStats = ({ projects, customers, invoices, materials, onNavigate }) => {
  const { currentUser } = useAuth();
  
  const allStatCardsData = [
    { title: 'Clienti', value: customers.length, icon: <Icon name={Users} size={24} />, color: 'indigo', navigateTo: 'customers' },
    { title: 'Progetti', value: projects.length, icon: <Icon name={Briefcase} size={24} />, color: 'blue', navigateTo: 'projects' },
    { title: 'Materiali', value: materials.length, icon: <Icon name={Layers} size={24} />, color: 'amber', navigateTo: 'materials' },
    { title: 'Fatturato', value: '€ …', icon: <Icon name={DollarSign} size={24} />, color: 'purple', navigateTo: 'projects', filter: { status: 'Completato', year: new Date().getFullYear() } }
  ];
  
  // Filtra le card in base al ruolo dell'utente
  // Gli operai (worker) non possono vedere le card Clienti e Fatturato
  const statCardsData = currentUser?.role === 'worker' 
    ? allStatCardsData.filter(card => card.title !== 'Clienti' && card.title !== 'Fatturato')
    : allStatCardsData;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 ${
      currentUser?.role === 'worker' 
        ? 'lg:grid-cols-2 justify-center max-w-4xl mx-auto' 
        : 'lg:grid-cols-4'
    }`}>
      {statCardsData.map(card => (
        <StatCard key={card.title} {...card} onClick={() => onNavigate(card.navigateTo, card.filter)} />
      ))}
    </div>
  );
};

export default DashboardStats;
