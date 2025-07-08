import React, { useState } from 'react';
import { Menu, User, Settings, LogOut, Wifi, WifiOff, RefreshCw, UserCircle, ChevronDown } from 'lucide-react';
import Icon from '../common/Icon';
import useUI from '../../hooks/useUI';
import { useAuth } from '../../hooks/useAuth';
import AIAssistantButton from '../AIAssistant/AIAssistantButton';

const Header = () => {
  const { theme, toggleTheme, userPreferences, toggleSidebar } = useUI();
  const { currentUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const darkMode = theme === 'dark';
  
  // Trova l'etichetta della pagina corrente con gestione fallback
  const currentPageLabel = React.useMemo(() => {
    const currentPage = userPreferences.currentPage || 'dashboard';
    return currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  }, [userPreferences.currentPage]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Errore logout:', error);
    }
  };

  return (
    <header 
      className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-md shrink-0" 
      role="banner"
    >
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-3 md:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-target"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-7 h-7 md:w-5 md:h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">
            {currentPageLabel}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Pulsante Assistente IA */}
          <AIAssistantButton 
            variant="icon" 
            size="md" 
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          
          <button
            onClick={toggleTheme}
            type="button"
            className={`relative inline-flex items-center h-8 md:h-6 rounded-full w-14 md:w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 touch-target ${darkMode ? 'bg-indigo-600 focus:ring-indigo-500' : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400'}`}
            aria-label={darkMode ? 'Attiva modalità chiara' : 'Attiva modalità scura'}
          >
            <span className="sr-only">{darkMode ? 'Attiva modalità chiara' : 'Attiva modalità scura'}</span>
            <span
              className={`inline-block w-6 h-6 md:w-4 md:h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${darkMode ? 'translate-x-7 md:translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          {/* Menu Utente */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-3 md:p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 touch-target"
              aria-label="Menu utente"
              type="button"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {currentUser?.name ? currentUser.name.charAt(0) : ''}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {currentUser?.role}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 md:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser?.email}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 capitalize mt-1">
                    {currentUser?.role}
                  </p>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-3 md:py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-target mobile-friendly-text"
                  >
                    <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
