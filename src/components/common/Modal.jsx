import { X } from 'lucide-react';
import Icon from './Icon';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div
        className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full ${
          sizeClasses[size]
        } my-auto transform transition-all`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Icon name={X} size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
