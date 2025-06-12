import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { BarChart2 } from 'lucide-react';
import Card from '../common/Card';
import Icon from '../common/Icon';
import useLocalStorage from '../../hooks/useLocalStorage';

const STATUS_COLORS = {
  Preventivo: '#A0AEC0',
  'In Attesa': '#FFA500',
  'In Lavorazione': '#3182CE',
  Completato: '#48BB78',
  Annullato: '#F56565'
};
const DEFAULT_COLOR = '#CBD5E0';

const ProjectsStatusWidget = () => {
  const { data: projects, isLoading } = useLocalStorage('projects');

  const projectStatusData = useMemo(() => {
    if (!projects) return [];
    const counts = projects.reduce((acc, p) => ((acc[p.status] = (acc[p.status] || 0) + 1), acc), {});
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || DEFAULT_COLOR
    }));
  }, [projects]);

  if (isLoading) return <Card title="Stato Progetti"><p className="text-gray-500 dark:text-gray-400">Caricamento …</p></Card>;

  return (
    <Card title="Stato Progetti" icon={<Icon name={BarChart2} />} className="min-h-[380px] flex flex-col">
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={projectStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius="80%"
              innerRadius="30%"
              dataKey="value"
              paddingAngle={3}
            >
              {projectStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <RechartsTooltip formatter={(v, n) => [`${v} progetti`, n]} />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ProjectsStatusWidget;
