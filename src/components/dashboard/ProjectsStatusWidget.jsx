import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { BarChart2 } from 'lucide-react';
import Card from '../common/Card';
import Icon from '../common/Icon';
import { useData } from '../../hooks/useData';

const STATUS_COLORS = {
  'In Attesa': '#FCD34D', // yellow-400 per corrispondere a bg-yellow-100
  'In Corso': '#60A5FA', // blue-400 per corrispondere a bg-blue-100
  'Completato': '#34D399', // green-400 per corrispondere a bg-green-100
  'Annullato': '#F87171' // red-400 per corrispondere a bg-red-100
};
const DEFAULT_COLOR = '#CBD5E0';

const ProjectsStatusWidget = () => {
  const { projects, projectsLoading } = useData();

  const projectStatusData = useMemo(() => {
    if (!projects) return [];
    const counts = projects.reduce((acc, p) => ((acc[p.status] = (acc[p.status] || 0) + 1), acc), {});
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || DEFAULT_COLOR
    }));
  }, [projects]);

  if (projectsLoading) return <Card title="Stato Progetti"><p className="text-gray-500 dark:text-gray-400">Caricamento …</p></Card>;

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
