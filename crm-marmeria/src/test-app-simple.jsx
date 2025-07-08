import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Test App semplificata per identificare il problema
const TestApp = () => {
  const [step, setStep] = React.useState(1);
  const [error, setError] = React.useState(null);
  const [logs, setLogs] = React.useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message: `[${timestamp}] ${message}`, type }]);
    console.log(`[Test App] ${message}`);
  };

  React.useEffect(() => {
    const testStep = async () => {
      try {
        switch (step) {
          case 1:
            addLog('✅ React base funziona');
            setTimeout(() => setStep(2), 1000);
            break;
            
          case 2:
            addLog('🔄 Test import store...');
            const { store } = await import('./store/index');
            addLog('✅ Store importato');
            setTimeout(() => setStep(3), 1000);
            break;
            
          case 3:
            addLog('🔄 Test import AuthContext...');
            const AuthModule = await import('./contexts/AuthContext.tsx');
            addLog('✅ AuthContext importato');
            setTimeout(() => setStep(4), 1000);
            break;
            
          case 4:
            addLog('🔄 Test import ChakraProvider...');
            const { ChakraProvider } = await import('@chakra-ui/react');
            addLog('✅ ChakraProvider importato');
            setTimeout(() => setStep(5), 1000);
            break;
            
          case 5:
            addLog('🔄 Test import cache service...');
            const { cacheService } = await import('./services/cache');
            addLog('✅ Cache service importato');
            setTimeout(() => setStep(6), 1000);
            break;
            
          case 6:
            addLog('🚀 Tutti i test completati!');
            addLog('✅ L\'applicazione dovrebbe funzionare');
            break;
        }
      } catch (err) {
        addLog(`❌ Errore al step ${step}: ${err.message}`, 'error');
        addLog(`Stack: ${err.stack}`, 'error');
        setError(err);
      }
    };

    testStep();
  }, [step]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '30px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        maxWidth: '800px',
        width: '100%'
      }}>
        <h1>🔍 Test Diagnostico CRM</h1>
        <p>Step {step}/6 - {error ? 'ERRORE RILEVATO' : 'In corso...'}</p>
        
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '4px',
          margin: '20px 0',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(step / 6) * 100}%`,
            height: '100%',
            background: error ? '#ff6b6b' : 'linear-gradient(90deg, #4ecdc4, #44a08d)',
            borderRadius: '4px',
            transition: 'width 0.5s ease'
          }} />
        </div>
        
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '15px',
          borderRadius: '5px',
          maxHeight: '300px',
          overflow: 'auto',
          textAlign: 'left'
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ 
              color: log.type === 'error' ? '#ff6b6b' : '#4ecdc4',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              marginBottom: '2px'
            }}>
              {log.message}
            </div>
          ))}
        </div>
        
        {error && (
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            🔃 Ricarica
          </button>
        )}
      </div>
    </div>
  );
};

// Avvia il test
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<TestApp />);
  console.log('🔍 Test diagnostico avviato');
} else {
  console.error('❌ Elemento root non trovato');
}

export default TestApp;