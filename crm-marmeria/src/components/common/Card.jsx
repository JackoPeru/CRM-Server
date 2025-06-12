import React from 'react';

const Card = ({
  title,
  children,
  icon,
  className = '',
  titleClassName = '',
  onClick,
}) => {
  // Previeni il rendering se non ci sono contenuti
  if (!children && !title) {
    console.warn('Card rendered without content');
    return null;
  }

  const baseClasses = 'bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6';
  const hoverClasses = onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : '';
  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`.trim();

  const CardContent = (
    <div className={combinedClasses}>
      {title && (
        <div
          className={`flex items-center text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 ${titleClassName}`}
        >
          {icon && (
            <span className="mr-2 flex items-center justify-center">{icon}</span>
          )}
          <span className="truncate">{title}</span>
        </div>
      )}
      <div className="w-full">{children}</div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 rounded-xl"
      >
        {CardContent}
      </button>
    );
  }

  return CardContent;
};

export default Card;
  