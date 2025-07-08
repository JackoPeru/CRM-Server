import React from 'react';
import { createRoot } from 'react-dom/client';

// Test minimo senza CSS per isolare il problema
const MinimalTest = () => {
  const [count, setCount] = React.useState(0);
  const [status, setStatus] = React.useState('Inizializzazione...');

  React.useEffect(() => {
    console.log('✅ React funziona!');
    setStatus('React caricato correttamente!');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>🔧 Test Minimo</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>{status}</p>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#333' }}>Contatore: {count}</p>
          <button
            onClick={() => setCount(c => c + 1)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Incrementa
          </button>
          <button
            onClick={() => setCount(0)}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Reset
          </button>
        </div>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ color: '#333', margin: '0 0 10px 0' }}>Test Completati:</h3>
          <ul style={{ textAlign: 'left', color: '#666', margin: 0, paddingLeft: '20px' }}>
            <li>✅ React rendering</li>
            <li>✅ State management</li>
            <li>✅ Event handling</li>
            <li>✅ useEffect hook</li>
            <li>✅ Inline styles</li>
          </ul>
        </div>
        
        <p style={{ color: '#28a745', marginTop: '20px', fontWeight: 'bold' }}>
          Se vedi questo messaggio, React funziona correttamente!
        </p>
      </div>
    </div>
  );
};

// Avvia il test
try {
  const container = document.getElementById('root');
  if (container) {
    console.log('🚀 Avvio test minimo...');
    const root = createRoot(container);
    root.render(<MinimalTest />);
    console.log('✅ Test minimo avviato con successo');
  } else {
    console.error('❌ Elemento root non trovato');
    document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">❌ Elemento root non trovato</h1>';
  }
} catch (error) {
  console.error('❌ Errore durante l\'avvio:', error);
  document.body.innerHTML = `<h1 style="color: red; text-align: center; margin-top: 50px;">❌ Errore: ${error.message}</h1>`;
}

export default MinimalTest;