import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🎯 [Main] Inizializzazione React App');
console.log('🎯 [Main] DOM ready, creando root React');

const root = ReactDOM.createRoot(document.getElementById('root'));
console.log('🎯 [Main] Root creato, rendering App in StrictMode');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('🎯 [Main] App renderizzata');
