import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const WelcomeHeader = () => {
  const { currentUser } = useAuth();
  const userName = currentUser ? currentUser.name : 'Utente';
  const formattedName = userName || 'Utente';
  const currentHour = new Date().getHours();
  
  let greeting = 'Buongiorno';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Buon pomeriggio';
  } else if (currentHour >= 18) {
    greeting = 'Buonasera';
  }

  return (
    <header className="mb-8" role="banner">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
        {greeting}, {formattedName} 👋
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Benvenuto nella tua dashboard di CRM Marmeria.
      </p>
    </header>
  );
};

export default WelcomeHeader;
