import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import Card from '../common/Card';
import Icon from '../common/Icon';
import useLocalStorage from '../../hooks/useLocalStorage';

const ExpiringProjectsWidget = ({ onNavigate }) => {
  const { data: projects, isLoading } = useLocalStorage('projects');
  const [showAll, setShowAll] = useState(false);

  const expiringProjects = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter(p => p.status !== 'Completato' && p.status !== 'Annullato' && p.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 15);
  }, [projects]);

  const displayed = showAll ? expiringProjects : expiringProjects.slice(0, 5);

  if (isLoading) return <Card title="Progetti in Scadenza"><p className="text-gray-500 dark:text-gray-400">Caricamento …</p></Card>;

  return (
    <Card title="Progetti in Scadenza" icon={<Icon name={CalendarDays} />}>
      {expiringProjects.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nessun progetto in scadenza.</p>
      ) : (
        <div className={`space-y-3 ${expiringProjects.length > 5 && !showAll ? 'max-h-[20rem] overflow-y-auto pr-2' : ''}`}>
          {displayed.map(p => (
            <div
              key={p.id}
              onClick={() => onNavigate('projects', { viewId: p.id })}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:shadow-md cursor-pointer"
            >
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">{p.name}</h4>
              <p className="text-sm text-red-500 dark:text-red-400">Scadenza: {new Date(p.dueDate).toLocaleDateString('it-IT')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Stato: {p.status}</p>
            </div>
          ))}
        </div>
      )}
      {expiringProjects.length > 5 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          {showAll ? 'Mostra meno' : `Mostra tutti (${expiringProjects.length})`}
        </button>
      )}
    </Card>
  );
};

export default ExpiringProjectsWidget;
