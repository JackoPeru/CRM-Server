import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Settings, Trash2, Bot, User, Loader } from 'lucide-react';
import { aiAssistantService } from '../../services/aiAssistant';
import toast from 'react-hot-toast';
import { useAIAssistant } from '../../contexts/AIAssistantContext';
import './AIAssistant.css';

const AIAssistantOverlay = () => {
  const {
    isOpen,
    messages,
    setMessages,
    closeAssistant,
    toggleAssistant,
    addMessage,
    clearMessages
  } = useAIAssistant();
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    apiKey: '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',
    model: 'deepseek/deepseek-chat-v3-0324:free'
  });
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scroll automatico ai nuovi messaggi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Carica configurazione salvata
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai-assistant-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        
        // Inizializza il servizio se la configurazione è completa
        if (parsedConfig.apiKey && parsedConfig.model) {
          aiAssistantService.initialize({
            apiKey: parsedConfig.apiKey,
            model: parsedConfig.model,
            baseUrl: 'https://openrouter.ai/api/v1',
            maxTokens: 4000,
            temperature: 0.7
          });
          setIsConfigured(true);
          setMessages(aiAssistantService.getChatHistory().filter(msg => msg.role !== 'system'));
        }
      } catch (error) {
        console.error('Errore nel caricamento della configurazione:', error);
      }
    } else {
      // Se non c'è configurazione salvata, usa quella di default e salvala
      const defaultConfig = {
        apiKey: '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',
        model: 'deepseek/deepseek-chat-v3-0324:free'
      };
      
      localStorage.setItem('ai-assistant-config', JSON.stringify(defaultConfig));
      
      aiAssistantService.initialize({
        apiKey: defaultConfig.apiKey,
        model: defaultConfig.model,
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: 4000,
        temperature: 0.7
      });
      
      setIsConfigured(true);
      setMessages(aiAssistantService.getChatHistory().filter(msg => msg.role !== 'system'));
    }
  }, [setMessages]);

  // Listener per navigazione da AI
  useEffect(() => {
    const handleAINavigate = (event) => {
      const { page } = event.detail;
      // Usa il sistema di navigazione dell'app invece di react-router
      window.dispatchEvent(new CustomEvent('navigate-to-page', { detail: { page } }));
      toast.success(`Navigazione completata`);
    };

    window.addEventListener('ai-navigate', handleAINavigate);
    return () => window.removeEventListener('ai-navigate', handleAINavigate);
  }, []);

  // Salva configurazione
  const saveConfig = () => {
    if (!config.apiKey || !config.model) {
      toast.error('Inserisci API Key e modello');
      return;
    }

    try {
      localStorage.setItem('ai-assistant-config', JSON.stringify(config));
      
      aiAssistantService.initialize({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: 4000,
        temperature: 0.7
      });
      
      setIsConfigured(true);
      setShowConfig(false);
      setMessages(aiAssistantService.getChatHistory().filter(msg => msg.role !== 'system'));
      toast.success('Configurazione salvata!');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      toast.error('Errore nel salvataggio della configurazione');
    }
  };

  // Invia messaggio
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isConfigured) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      // Gestione streaming
      const onStreamChunk = (chunk) => {
        setStreamingMessage(prev => prev + chunk);
      };

      const response = await aiAssistantService.sendMessage(
        userMessage.content,
        onStreamChunk
      );

      // Aggiungi messaggio completo
      addMessage({
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp
      });

    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
        timestamp: new Date(),
        isError: true
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const adjustTextareaHeight = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleMessageChange = (e) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight(e.target);
  };

  // Pulisci chat
  const clearChat = () => {
    aiAssistantService.clearChatHistory();
    clearMessages();
    toast.success('Chat pulita');
  };

  // Gestione invio con Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Formatta timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Pulsante floating per aprire l'assistente */}
      {!isOpen && (
        <button
          onClick={toggleAssistant}
          className="ai-assistant-fab"
          title="Assistente IA"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Overlay dell'assistente */}
      {isOpen && (
        <div className="ai-assistant-overlay">
          <div className="ai-assistant-container">
            {/* Header */}
            <div className="ai-assistant-header">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <h3 className="ai-assistant-title">Assistente IA</h3>
                {isConfigured && (
                  <div className="w-2 h-2 bg-green-400 rounded-full" title="Configurato" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="ai-assistant-close"
                  title="Configurazione"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={clearChat}
                  className="ai-assistant-close"
                  title="Pulisci chat"
                  disabled={messages.length === 0}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={closeAssistant}
                  className="ai-assistant-close"
                  title="Chiudi"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Configurazione */}
          {showConfig && (
            <div className="ai-assistant-config">
              <div className="space-y-3">
                <div>
                  <label className="config-label">
                    API Key OpenRouter
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="config-input"
                    placeholder="sk-or-..."
                  />
                </div>
                <div>
                  <label className="config-label">
                    Modello
                  </label>
                  <select
                    value={config.model}
                    onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="config-input"
                  >
                    <option value="deepseek/deepseek-chat-v3-0324:free">DeepSeek Chat V3 (Free)</option>
                    <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                    <option value="openai/gpt-4o">GPT-4o</option>
                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="google/gemini-pro">Gemini Pro</option>
                  </select>
                </div>
                <div className="config-actions">
                  <button
                    onClick={saveConfig}
                    className="config-btn config-btn-primary"
                  >
                    Salva Configurazione
                  </button>
                  <button
                    onClick={() => setShowConfig(false)}
                    className="config-btn config-btn-secondary"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          )}

            {/* Area messaggi */}
          <div className="ai-assistant-messages">
            {!isConfigured ? (
              <div className="text-center text-gray-500 mt-8">
                <Bot size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Configura l'assistente IA per iniziare</p>
                <button
                  onClick={() => setShowConfig(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Apri Configurazione
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <Bot size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Ciao! Sono il tuo assistente IA.</p>
                <p className="text-xs mt-2">Posso aiutarti a gestire progetti, clienti e navigare nell'app.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.role} ${message.isError ? 'error' : ''}`}
                >
                  <div className="message-avatar">
                    {message.role === 'assistant' ? (
                      <Bot size={16} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div className="message-content">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="message-time">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Messaggio in streaming */}
            {isStreaming && streamingMessage && (
              <div className="message assistant streaming">
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
                <div className="message-content">
                  <p className="whitespace-pre-wrap">{streamingMessage}</p>
                  <div className="streaming-indicator">
                    <Loader size={12} className="animate-spin" />
                    <span>Scrivendo...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

            {/* Input area */}
            {isConfigured && (
            <div className="ai-assistant-input">
              <div className="input-container">
                <textarea
                  value={inputMessage}
                  onChange={handleMessageChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrivi un messaggio..."
                  className="message-input"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="send-button"
                >
                  {isLoading ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
              <p className="input-hint">
                Premi Invio per inviare, Shift+Invio per andare a capo
              </p>
            </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantOverlay;