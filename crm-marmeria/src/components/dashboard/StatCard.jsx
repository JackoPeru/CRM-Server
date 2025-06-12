import Icon from '../common/Icon';
import Card from '../common/Card';

const StatCard = ({ title, value, icon: IconComponent, color = 'indigo', onClick }) => {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700',
    blue: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
    amber: 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
    purple: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
    gray: 'from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700'
  };

  return (
    <Card
      onClick={onClick}
      className={`bg-gradient-to-br text-white ${colorClasses[color] || colorClasses.gray}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-opacity-80">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="p-3 bg-black bg-opacity-20 rounded-full">
          <Icon name={IconComponent} size={24} />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
