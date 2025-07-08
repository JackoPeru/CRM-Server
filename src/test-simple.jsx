import React from 'react';
import ReactDOM from 'react-dom/client';

// Componente di test molto semplice
const SimpleTest = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'green' }}>✅ React Funziona!</h1>
      <p>Timestamp: {new Date().toLocaleString()}</p>
      <p>Se vedi questo messaggio, React si sta caricando correttamente.</p>
    </div>
  );
};

// Rendering diretto senza dipendenze esterne
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SimpleTest />);

console.log('🧪 Test semplice React caricato con successo');