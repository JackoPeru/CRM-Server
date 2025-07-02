import { Users, Briefcase, Layers, DollarSign } from 'lucide-react';
import Icon from '../common/Icon';
import StatCard from './StatCard';

const DashboardStats = ({ projects, customers, invoices, materials, onNavigate }) => {
  const statCardsData = [
    { title: 'Clienti', value: customers.length, icon: <Icon name={Users} size={24} />, color: 'indigo', navigateTo: 'customers' },
    { title: 'Progetti', value: projects.length, icon: <Icon name={Briefcase} size={24} />, color: 'blue', navigateTo: 'projects' },
    { title: 'Materiali', value: materials.length, icon: <Icon name={Layers} size={24} />, color: 'amber', navigateTo: 'materials' },
    { title: 'Fatturato', value: '€ …', icon: <Icon name={DollarSign} size={24} />, color: 'purple', navigateTo: 'projects', filter: { status: 'Completato', year: new Date().getFullYear() } }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statCardsData.map(card => (
        <StatCard key={card.title} {...card} onClick={() => onNavigate(card.navigateTo, card.filter)} />
      ))}
    </div>
  );
};

export default DashboardStats;
