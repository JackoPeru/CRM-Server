import React from 'react';
import { Menu, Sun, Moon, UserCircle } from 'lucide-react';
import Icon from '../common/Icon';

const Header = ({
  toggleDarkMode,
  darkMode = false,
  currentPage = 'dashboard',
  navItems = [],
  onOpenSidebar,
}) => {
  // Trova l'etichetta della pagina corrente con gestione fallback
  const currentPageLabel = React.useMemo(() => {
    const currentItem = navItems.find((n) => n.id === currentPage);
    return currentItem?.label || currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  }, [currentPage, navItems]);

  return (
    <header 
      className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-md shrink-0" 
      role="banner"
    >
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="md:hidden text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              aria-label="Apri menu laterale"
              type="button"
            >
              <Icon name={Menu} size={24} />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">
            {currentPageLabel}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {typeof toggleDarkMode === 'function' && (
            <button
              onClick={toggleDarkMode}
              className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              aria-label={darkMode ? 'Attiva modalità chiara' : 'Attiva modalità scura'}
              type="button"
            >
              <Icon name={darkMode ? Sun : Moon} size={22} />
            </button>
          )}
          <button 
            className="flex items-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            aria-label="Menu utente"
            type="button"
          >
            <Icon 
              name={UserCircle} 
              size={28} 
              className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300" 
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
