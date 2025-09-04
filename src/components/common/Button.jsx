import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Componente Button riutilizzabile
 * 
 * @param {Object} props - Proprietà del componente
 * @param {React.ReactNode} props.children - Contenuto del bottone
 * @param {string} props.variant - Variante del bottone ('primary', 'secondary', 'danger', 'ghost')
 * @param {string} props.size - Dimensione del bottone ('sm', 'md', 'lg')
 * @param {boolean} props.loading - Se il bottone è in stato di caricamento
 * @param {boolean} props.disabled - Se il bottone è disabilitato
 * @param {string} props.className - Classi CSS aggiuntive
 * @param {Function} props.onClick - Funzione chiamata al click
 * @param {string} props.type - Tipo del bottone ('button', 'submit', 'reset')
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:hover:bg-gray-800 dark:text-gray-300'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;