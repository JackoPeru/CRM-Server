import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Caricamento diretto dell'applicazione
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
  console.log('🚀 CRM Marmeria avviato');
} else {
  console.error('❌ Elemento root non trovato');
}
