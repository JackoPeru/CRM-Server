import React from 'react';
import { Bot, MessageCircle } from 'lucide-react';
import { useAIAssistant } from '../../contexts/AIAssistantContext';

const AIAssistantButton = ({ 
  variant = 'fab', // 'fab', 'button', 'icon'
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  children,
  showBadge = true
}) => {
  const { toggleAssistant, hasUnreadMessages } = useAIAssistant();

  const baseClasses = {
    fab: 'fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50',
    button: 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200',
    icon: 'text-gray-600 hover:text-blue-600 transition-colors duration-200'
  };

  const sizeClasses = {
    fab: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5'
    },
    button: {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    },
    icon: {
      sm: 'p-1',
      md: 'p-2',
      lg: 'p-3'
    }
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const classes = `${baseClasses[variant]} ${sizeClasses[variant][size]} ${className} relative`;

  return (
    <button
      onClick={toggleAssistant}
      className={classes}
      title="Assistente IA"
    >
      {children || (
        variant === 'fab' ? (
          <Bot size={iconSizes[size]} />
        ) : variant === 'button' ? (
          <>
            <MessageCircle size={iconSizes[size]} className="mr-2" />
            Assistente IA
          </>
        ) : (
          <Bot size={iconSizes[size]} />
        )
      )}
      
      {showBadge && hasUnreadMessages && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          !
        </span>
      )}
    </button>
  );
};

export default AIAssistantButton;