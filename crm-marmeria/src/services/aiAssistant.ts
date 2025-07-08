/**
 * Servizio per l'assistente IA con OpenRouter
 * Gestisce le comunicazioni con l'API di OpenRouter per fornire assistenza contestuale
 */
import api from './api';
import { authService } from './auth';
import toast from 'react-hot-toast';

// Interfacce TypeScript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface AIAssistantConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  maxTokens: number;
  temperature: number;
}

// Configurazione predefinita
const DEFAULT_CONFIG: Partial<AIAssistantConfig> = {
  baseUrl: 'https://openrouter.ai/api/v1',
  maxTokens: 4000,
  temperature: 0.7
};

// Tools disponibili per l'assistente
const AVAILABLE_TOOLS: AITool[] = [
  {
    name: 'get_projects',
    description: 'Recupera la lista dei progetti dell\'utente',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          description: 'Filtra per stato del progetto'
        },
        limit: {
          type: 'number',
          description: 'Numero massimo di progetti da recuperare'
        }
      },
      required: []
    }
  },
  {
    name: 'create_project',
    description: 'Crea un nuovo progetto',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome del progetto'
        },
        clientId: {
          type: 'string',
          description: 'ID del cliente'
        },
        budget: {
          type: 'string',
          description: 'Budget del progetto'
        },
        deadline: {
          type: 'string',
          description: 'Data di scadenza (formato ISO)'
        },
        description: {
          type: 'string',
          description: 'Descrizione del progetto'
        }
      },
      required: ['name', 'clientId', 'budget']
    }
  },
  {
    name: 'get_clients',
    description: 'Recupera la lista dei clienti',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Termine di ricerca per nome o email'
        },
        limit: {
          type: 'number',
          description: 'Numero massimo di clienti da recuperare'
        }
      },
      required: []
    }
  },
  {
    name: 'update_project_status',
    description: 'Aggiorna lo stato di un progetto',
    parameters: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'ID del progetto'
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          description: 'Nuovo stato del progetto'
        }
      },
      required: ['projectId', 'status']
    }
  },
  {
    name: 'navigate_to_page',
    description: 'Naviga a una specifica pagina dell\'applicazione',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: ['dashboard', 'projects', 'clients', 'materials', 'settings'],
          description: 'Pagina di destinazione'
        }
      },
      required: ['page']
    }
  },
  {
    name: 'create_client',
    description: 'Crea un nuovo cliente',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome completo del cliente'
        },
        email: {
          type: 'string',
          description: 'Email del cliente'
        },
        phone: {
          type: 'string',
          description: 'Numero di telefono del cliente'
        },
        address: {
          type: 'string',
          description: 'Indirizzo del cliente'
        },
        company: {
          type: 'string',
          description: 'Nome dell\'azienda (opzionale)'
        },
        type: {
          type: 'string',
          enum: ['individual', 'company'],
          description: 'Tipo di cliente'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'create_quote',
    description: 'Crea un nuovo preventivo/quote. Se il cliente non esiste, verrà creato automaticamente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID del cliente esistente'
        },
        clientName: {
          type: 'string',
          description: 'Nome del cliente (se non esiste, verrà creato automaticamente)'
        },
        clientEmail: {
          type: 'string',
          description: 'Email del cliente (per creazione automatica)'
        },
        clientPhone: {
          type: 'string',
          description: 'Telefono del cliente (per creazione automatica)'
        },
        title: {
          type: 'string',
          description: 'Titolo del preventivo'
        },
        description: {
          type: 'string',
          description: 'Descrizione del preventivo'
        },
        amount: {
          type: 'string',
          description: 'Importo del preventivo'
        },
        validUntil: {
          type: 'string',
          description: 'Data di validità (formato ISO)'
        }
      },
      required: ['title', 'amount']
    }
  },
  {
    name: 'update_project',
    description: 'Aggiorna un progetto esistente',
    parameters: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'ID del progetto da aggiornare'
        },
        name: {
          type: 'string',
          description: 'Nuovo nome del progetto'
        },
        description: {
          type: 'string',
          description: 'Nuova descrizione del progetto'
        },
        budget: {
          type: 'string',
          description: 'Nuovo budget del progetto'
        },
        deadline: {
          type: 'string',
          description: 'Nuova data di scadenza (formato ISO)'
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          description: 'Nuovo stato del progetto'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_invoices',
    description: 'Recupera la lista delle fatture',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
          description: 'Filtra per stato della fattura'
        },
        clientId: {
          type: 'string',
          description: 'Filtra per ID cliente'
        },
        limit: {
          type: 'number',
          description: 'Numero massimo di fatture da recuperare'
        }
      },
      required: []
    }
  },
  {
    name: 'create_invoice',
    description: 'Crea una nuova fattura. Se il cliente non esiste, verrà creato automaticamente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'ID del cliente esistente'
        },
        clientName: {
          type: 'string',
          description: 'Nome del cliente (se non esiste, verrà creato automaticamente)'
        },
        clientEmail: {
          type: 'string',
          description: 'Email del cliente (per creazione automatica)'
        },
        clientPhone: {
          type: 'string',
          description: 'Telefono del cliente (per creazione automatica)'
        },
        description: {
          type: 'string',
          description: 'Descrizione della fattura'
        },
        amount: {
          type: 'string',
          description: 'Importo della fattura'
        },
        dueDate: {
          type: 'string',
          description: 'Data di scadenza (formato ISO)'
        },
        items: {
          type: 'array',
          description: 'Lista degli articoli della fattura',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' }
            }
          }
        }
      },
      required: ['amount']
    }
  },
  {
    name: 'update_invoice',
    description: 'Aggiorna una fattura esistente',
    parameters: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          description: 'ID della fattura da aggiornare'
        },
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
          description: 'Nuovo stato della fattura'
        },
        amount: {
          type: 'string',
          description: 'Nuovo importo della fattura'
        },
        dueDate: {
          type: 'string',
          description: 'Nuova data di scadenza (formato ISO)'
        },
        description: {
          type: 'string',
          description: 'Nuova descrizione della fattura'
        }
      },
      required: ['invoiceId']
    }
  }
];

class AIAssistantService {
  private config: AIAssistantConfig | null = null;
  private chatHistory: ChatMessage[] = [];
  private isInitialized = false;

  /**
   * Inizializza il servizio con la configurazione
   */
  initialize(config: AIAssistantConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isInitialized = true;
    
    // Aggiungi messaggio di sistema iniziale
    this.chatHistory = [{
      id: 'system-init',
      role: 'system',
      content: `Sei un assistente IA per un'applicazione CRM per marmerie. Hai accesso ai seguenti strumenti per aiutare gli utenti:

🔧 STRUMENTI DISPONIBILI:
- get_projects: Recupera la lista dei progetti
- create_project: Crea un nuovo progetto
- update_project: Aggiorna un progetto esistente
- get_clients: Recupera la lista dei clienti
- create_client: Crea un nuovo cliente
- create_quote: Crea un nuovo preventivo (può creare automaticamente il cliente se non esiste)
- get_invoices: Recupera la lista delle fatture
- create_invoice: Crea una nuova fattura (può creare automaticamente il cliente se non esiste)
- update_invoice: Aggiorna una fattura esistente
- update_project_status: Aggiorna lo stato di un progetto
- navigate_to_page: Naviga a una pagina specifica

📋 COMPORTAMENTO AUTONOMO:
- DEVI essere completamente autonomo e proattivo
- NON chiedere conferme o permessi all'utente
- Se l'utente chiede un preventivo per un cliente che non esiste, crealo automaticamente
- Se mancano informazioni, usa valori ragionevoli di default
- Completa sempre l'obiettivo richiesto senza fermarti a metà

🎯 QUANDO USARE GLI STRUMENTI:
- Se l'utente chiede di "creare un preventivo", usa create_quote (che gestisce automaticamente la creazione del cliente)
- Se l'utente chiede di "creare un progetto", usa create_project
- Se l'utente chiede di "creare un cliente", usa create_client
- Se l'utente chiede di "vedere i progetti", usa get_projects
- Se l'utente chiede di "vedere i clienti", usa get_clients
- Se l'utente chiede di navigare, usa navigate_to_page

⚠️ REGOLE FONDAMENTALI:
1. SEMPRE esegui l'azione richiesta, non limitarti a spiegare
2. Se un cliente non esiste, crealo automaticamente quando necessario
3. Non fermarti mai a metà processo per chiedere conferme
4. Usa informazioni ragionevoli di default se mancano dettagli
5. Completa sempre l'obiettivo finale dell'utente

Sei sempre cortese, professionale e fornisci risposte chiare. Quando usi uno strumento, spiega cosa stai facendo e mostra i risultati.`,
      timestamp: new Date()
    }];
  }

  /**
   * Verifica se il servizio è configurato
   */
  isConfigured(): boolean {
    return this.isInitialized && this.config !== null;
  }

  /**
   * Ottieni la cronologia della chat
   */
  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  /**
   * Pulisci la cronologia della chat
   */
  clearChatHistory(): void {
    this.chatHistory = this.chatHistory.filter(msg => msg.role === 'system');
  }

  /**
   * Invia un messaggio all'assistente IA
   */
  async sendMessage(content: string, onStreamChunk?: (chunk: string) => void): Promise<ChatMessage> {
    if (!this.isConfigured()) {
      throw new Error('Assistente IA non configurato');
    }

    console.log('AI Assistant: Invio messaggio:', {
      message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      useStreaming: !!onStreamChunk,
      model: this.config?.model
    });

    // Aggiungi messaggio utente alla cronologia
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    this.chatHistory.push(userMessage);

    try {
      // Prepara i messaggi per l'API (escludi messaggi di sistema interni)
      const messages = this.chatHistory
        .filter(msg => msg.role !== 'system' || msg.id === 'system-init')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      if (onStreamChunk) {
        console.log('AI Assistant: Usando modalità streaming');
      } else {
        console.log('AI Assistant: Usando modalità normale');
      }

      const response = await this.callOpenRouter(messages, onStreamChunk);
      
      // Aggiungi risposta alla cronologia
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      this.chatHistory.push(assistantMessage);

      return assistantMessage;
    } catch (error: any) {
      console.error('Errore nell\'invio del messaggio:', error);
      const errorMessage = error.message || 'Errore nella comunicazione con l\'assistente IA';
      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Chiamata all'API di OpenRouter
   */
  private async callOpenRouter(messages: any[], onStreamChunk?: (chunk: string) => void): Promise<string> {
    if (!this.config) {
      throw new Error('Configurazione mancante');
    }

    const requestBody = {
      model: this.config.model,
      messages,
      tools: AVAILABLE_TOOLS.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      })),
      // Rimuovi tool_choice per compatibilità con DeepSeek
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: !!onStreamChunk
    };

    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'CRM Marmeria Assistant'
    };

    if (onStreamChunk) {
      return this.handleStreamingResponse(requestBody, headers, onStreamChunk);
    } else {
      return this.handleNormalResponse(requestBody, headers);
    }
  }

  /**
   * Gestisce risposta normale (non streaming)
   */
  private async handleNormalResponse(requestBody: any, headers: any): Promise<string> {
    console.log('AI Assistant: Invio richiesta a OpenRouter:', {
      model: requestBody.model,
      hasTools: !!requestBody.tools,
      toolsCount: requestBody.tools?.length || 0
    });

    const response = await fetch(`${this.config!.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI Assistant: Errore API:', errorData);
      throw new Error(errorData.error?.message || `Errore HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Assistant: Risposta ricevuta:', {
      hasToolCalls: !!data.choices[0].message.tool_calls,
      toolCallsCount: data.choices[0].message.tool_calls?.length || 0,
      hasContent: !!data.choices[0].message.content
    });
    
    // Gestisci tool calls se presenti
    if (data.choices[0].message.tool_calls && data.choices[0].message.tool_calls.length > 0) {
      console.log('AI Assistant: Esecuzione tool calls:', data.choices[0].message.tool_calls);
      const toolResults = await this.handleToolCalls(data.choices[0].message.tool_calls);
      return toolResults;
    }

    return data.choices[0].message.content || 'Nessuna risposta ricevuta';
  }

  /**
   * Gestisce risposta streaming
   */
  private async handleStreamingResponse(requestBody: any, headers: any, onStreamChunk: (chunk: string) => void): Promise<string> {
    const response = await fetch(`${this.config!.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Errore HTTP: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Impossibile leggere la risposta streaming');
    }

    let fullContent = '';
    let toolCalls: any[] = [];
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Processa le linee complete
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Mantieni l'ultima linea incompleta

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Se ci sono tool calls, filtra quelli validi ed eseguili
              if (toolCalls.length > 0) {
                const validToolCalls = toolCalls.filter(tc => 
                  tc && 
                  tc.function && 
                  tc.function.name && 
                  tc.function.name.trim() !== ''
                );
                
                console.log('AI Assistant: Tool calls trovati nello streaming:', toolCalls);
                console.log('AI Assistant: Tool calls validi filtrati:', validToolCalls);
                
                if (validToolCalls.length > 0) {
                  return await this.handleToolCalls(validToolCalls);
                }
              }
              return fullContent;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              // Gestisci contenuto testuale
              if (delta?.content) {
                fullContent += delta.content;
                onStreamChunk(delta.content);
              }
              
              // Gestisci tool calls
              if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                  if (toolCall.index !== undefined && toolCall.index >= 0) {
                    // Inizializza o aggiorna il tool call
                    if (!toolCalls[toolCall.index]) {
                      toolCalls[toolCall.index] = {
                        id: toolCall.id || '',
                        type: 'function',
                        function: {
                          name: '',
                          arguments: ''
                        }
                      };
                    }
                    
                    // Assicurati che la struttura function esista
                    if (!toolCalls[toolCall.index].function) {
                      toolCalls[toolCall.index].function = {
                        name: '',
                        arguments: ''
                      };
                    }
                    
                    if (toolCall.function?.name) {
                      toolCalls[toolCall.index].function.name += toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                      toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                    }
                  }
                }
              }
            } catch (e) {
              // Ignora errori di parsing per commenti SSE
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Se ci sono tool calls, filtra quelli validi ed eseguili
    if (toolCalls.length > 0) {
      const validToolCalls = toolCalls.filter(tc => 
        tc && 
        tc.function && 
        tc.function.name && 
        tc.function.name.trim() !== ''
      );
      
      console.log('AI Assistant: Tool calls trovati alla fine dello streaming:', toolCalls);
      console.log('AI Assistant: Tool calls validi filtrati:', validToolCalls);
      
      if (validToolCalls.length > 0) {
        return await this.handleToolCalls(validToolCalls);
      }
    }

    return fullContent;
  }

  /**
   * Gestisce le chiamate ai tool
   */
  private async handleToolCalls(toolCalls: any[]): Promise<string> {
    const results: string[] = [];
    console.log('AI Assistant: Gestione tool calls:', toolCalls);

    for (const toolCall of toolCalls) {
      // Controllo di sicurezza per toolCall e toolCall.function
      if (!toolCall || !toolCall.function) {
        console.error('AI Assistant: Tool call non valido:', toolCall);
        results.push('❌ Tool call non valido ricevuto');
        continue;
      }

      const { name, arguments: args } = toolCall.function;
      
      // Controllo di sicurezza per name e args
      if (!name) {
        console.error('AI Assistant: Nome tool mancante:', toolCall);
        results.push('❌ Nome tool mancante');
        continue;
      }

      console.log(`AI Assistant: Esecuzione tool ${name} con argomenti:`, args);
      
      try {
        const parsedArgs = args ? JSON.parse(args) : {};
        const result = await this.executeToolCall(name, parsedArgs);
        console.log(`AI Assistant: Tool ${name} completato:`, result);
        results.push(`✅ ${result}`);
      } catch (error: any) {
        console.error(`AI Assistant: Errore tool ${name}:`, error);
        results.push(`❌ Errore nell'esecuzione di ${name}: ${error.message}`);
      }
    }

    const finalResult = results.join('\n');
    console.log('AI Assistant: Risultati finali tool calls:', finalResult);
    return finalResult;
  }

  /**
   * Esegue una chiamata a un tool specifico
   */
  private async executeToolCall(toolName: string, args: any): Promise<string> {
    switch (toolName) {
      case 'get_projects':
        return this.getProjects(args);
      case 'create_project':
        return this.createProject(args);
      case 'update_project':
        return this.updateProject(args);
      case 'get_clients':
        return this.getClients(args);
      case 'create_client':
        return this.createClient(args);
      case 'create_quote':
        return this.createQuote(args);
      case 'get_invoices':
        return this.getInvoices(args);
      case 'create_invoice':
        return this.createInvoice(args);
      case 'update_invoice':
        return this.updateInvoice(args);
      case 'update_project_status':
        return this.updateProjectStatus(args);
      case 'navigate_to_page':
        return this.navigateToPage(args);
      default:
        throw new Error(`Tool non riconosciuto: ${toolName}`);
    }
  }

  // Implementazioni dei tool
  private async getProjects(args: any): Promise<string> {
    try {
      const response = await api.get('/projects', { params: args });
      const projects = response.data;
      return `Trovati ${projects.length} progetti: ${projects.map((p: any) => p.name).join(', ')}`;
    } catch (error) {
      throw new Error('Impossibile recuperare i progetti');
    }
  }

  private async createProject(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Creazione progetto con dati:', args);
      const projectData = { 
        ...args, 
        type: 'project',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const response = await api.post('/projects', projectData);
      console.log('AI Assistant: Progetto creato:', response.data);
      
      // Notifica al frontend che i dati dei progetti sono cambiati
      window.dispatchEvent(new CustomEvent('ai-data-updated', { 
        detail: { 
          type: 'projects', 
          action: 'created',
          data: response.data 
        } 
      }));
      
      return `Progetto "${args.name}" creato con successo con ID: ${response.data.id || 'N/A'}`;
    } catch (error: any) {
      console.error('AI Assistant: Errore creazione progetto:', error);
      throw new Error(`Impossibile creare il progetto: ${error.response?.data?.message || error.message}`);
    }
  }

  private async updateProject(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Aggiornamento progetto con dati:', args);
      const { projectId, ...updateData } = args;
      
      // Rimuovi campi undefined
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      const response = await api.patch(`/projects/${projectId}`, cleanUpdateData);
      console.log('AI Assistant: Progetto aggiornato:', response.data);
      
      // Notifica al frontend che i dati dei progetti sono cambiati
      window.dispatchEvent(new CustomEvent('ai-data-updated', { 
        detail: { 
          type: 'projects', 
          action: 'updated',
          data: response.data 
        } 
      }));
      
      return `Progetto con ID "${projectId}" aggiornato con successo`;
    } catch (error: any) {
      console.error('AI Assistant: Errore aggiornamento progetto:', error);
      throw new Error(`Impossibile aggiornare il progetto: ${error.response?.data?.message || error.message}`);
    }
  }

  private async getClients(args: any): Promise<string> {
    try {
      const response = await api.get('/clients', { params: args });
      const clients = response.data;
      return `Trovati ${clients.length} clienti: ${clients.map((c: any) => c.name).join(', ')}`;
    } catch (error) {
      throw new Error('Impossibile recuperare i clienti');
    }
  }

  private async updateProjectStatus(args: any): Promise<string> {
    try {
      await api.patch(`/projects/${args.projectId}/status`, { status: args.status });
      return `Stato del progetto aggiornato a: ${args.status}`;
    } catch (error) {
      throw new Error('Impossibile aggiornare lo stato del progetto');
    }
  }

  private async navigateToPage(args: any): Promise<string> {
    const validPages = ['dashboard', 'projects', 'clients', 'materials', 'settings'];
    const pageLabels = {
      dashboard: 'Dashboard',
      projects: 'Progetti',
      clients: 'Clienti',
      materials: 'Materiali',
      settings: 'Impostazioni'
    };
    
    if (!validPages.includes(args.page)) {
      return `Pagina "${args.page}" non valida. Pagine disponibili: ${Object.entries(pageLabels).map(([key, label]) => `${key} (${label})`).join(', ')}`;
    }

    // Questo sarà gestito dal componente React
    window.dispatchEvent(new CustomEvent('ai-navigate', { detail: { page: args.page } }));
    
    return `Navigazione alla pagina "${pageLabels[args.page as keyof typeof pageLabels]}" completata.`;
  }

  private async createClient(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Creazione cliente con dati:', args);
      const clientData = {
        name: args.name,
        email: args.email || '',
        phone: args.phone || '',
        address: args.address || '',
        company: args.company || '',
        type: args.type || 'individual',
        createdAt: new Date().toISOString()
      };
      
      const response = await api.post('/clients', clientData);
      console.log('AI Assistant: Cliente creato:', response.data);
      
      // Notifica al frontend che i dati dei clienti sono cambiati
      window.dispatchEvent(new CustomEvent('ai-data-updated', { 
        detail: { 
          type: 'clients', 
          action: 'created',
          data: response.data 
        } 
      }));
      
      return `Cliente "${args.name}" creato con successo con ID: ${response.data.id || 'N/A'}`;
    } catch (error: any) {
      console.error('AI Assistant: Errore creazione cliente:', error);
      throw new Error(`Impossibile creare il cliente: ${error.response?.data?.message || error.message}`);
    }
  }

  private async createQuote(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Creazione preventivo con dati:', args);
      
      let customerId = args.customerId || args.clientId;
      
      // Se non c'è un clientId ma c'è un clientName, prova a creare il cliente automaticamente
      if (!customerId && args.clientName) {
        try {
          const clientData = {
            name: args.clientName,
            email: args.clientEmail || '',
            phone: args.clientPhone || '',
            type: 'individual'
          };
          
          const clientResponse = await api.post('/clients', clientData);
          customerId = clientResponse.data.id;
          console.log('AI Assistant: Cliente creato automaticamente:', clientResponse.data);
          
          // Notifica al frontend che i dati dei clienti sono cambiati
          window.dispatchEvent(new CustomEvent('ai-data-updated', { 
            detail: { 
              type: 'clients', 
              action: 'created',
              data: clientResponse.data 
            } 
          }));
        } catch (clientError: any) {
          console.error('AI Assistant: Errore creazione automatica cliente:', clientError);
          // Continua comunque con la creazione del preventivo senza cliente
        }
      }
      
      // Genera numero preventivo automatico
      const year = new Date().getFullYear();
      const quoteNumber = `PREV-${year}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
      
      const quoteData = {
        date: new Date().toISOString().split('T')[0],
        customerId: customerId || '',
        projectId: args.projectId || null,
        items: args.items || [{ 
          description: args.description || args.title || 'Preventivo creato da AI', 
          quantity: args.quantity || 1, 
          unitPrice: parseFloat(args.unitPrice || args.amount || '0'), 
          materialId: '' 
        }],
        notes: args.notes || '',
        status: 'Bozza',
        validityDays: args.validityDays || 30,
        type: 'quote',
        quoteNumber: quoteNumber,
        total: 0, // Sarà calcolato dal server
        createdAt: new Date().toISOString()
      };
      
      // Calcola il totale
      quoteData.total = quoteData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      
      const response = await api.post('/orders', quoteData);
      console.log('AI Assistant: Preventivo creato:', response.data);
      
      // Notifica al frontend che i dati dei preventivi sono cambiati
      window.dispatchEvent(new CustomEvent('ai-data-updated', { 
        detail: { 
          type: 'quotes', 
          action: 'created',
          data: response.data 
        } 
      }));
      
      let resultMessage = `Preventivo "${quoteNumber}" creato con successo con ID: ${response.data.id || 'N/A'}. Totale: €${quoteData.total.toFixed(2)}`;
      
      if (customerId && args.clientName) {
        resultMessage += ` per il cliente "${args.clientName}"`;
      }
      
      return resultMessage;
    } catch (error: any) {
      console.error('AI Assistant: Errore creazione preventivo:', error);
      throw new Error(`Impossibile creare il preventivo: ${error.response?.data?.message || error.message}`);
    }
  }

  private async getInvoices(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Recupero fatture con filtri:', args);
      const response = await api.get('/invoices', { params: args });
      console.log('AI Assistant: Fatture recuperate:', response.data);
      
      if (!response.data || response.data.length === 0) {
        return 'Nessuna fattura trovata.';
      }
      
      const invoices = response.data.map((invoice: any) => 
        `ID: ${invoice.id}, Numero: ${invoice.number || 'N/A'}, Cliente: ${invoice.clientName || 'N/A'}, Importo: €${invoice.amount || 0}, Stato: ${invoice.status || 'N/A'}, Data: ${invoice.date || 'N/A'}`
      ).join('\n');
      
      return `Fatture trovate (${response.data.length}):\n${invoices}`;
    } catch (error: any) {
      console.error('AI Assistant: Errore recupero fatture:', error);
      throw new Error(`Impossibile recuperare le fatture: ${error.response?.data?.message || error.message}`);
    }
  }

  private async createInvoice(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Creazione fattura con dati:', args);
      
      let customerId = args.customerId || args.clientId;
      
      // Se non c'è un clientId ma c'è un clientName, prova a creare il cliente automaticamente
      if (!customerId && args.clientName) {
        try {
          const clientData = {
            name: args.clientName,
            email: args.clientEmail || '',
            phone: args.clientPhone || '',
            type: 'individual'
          };
          
          const clientResponse = await api.post('/clients', clientData);
          customerId = clientResponse.data.id;
          console.log('AI Assistant: Cliente creato automaticamente:', clientResponse.data);
          
          // Notifica al frontend che i dati dei clienti sono cambiati
          window.dispatchEvent(new CustomEvent('ai-data-updated', { 
            detail: { 
              type: 'clients', 
              action: 'created',
              data: clientResponse.data 
            } 
          }));
        } catch (clientError: any) {
          console.error('AI Assistant: Errore creazione automatica cliente:', clientError);
          // Continua comunque con la creazione della fattura senza cliente
        }
      }
      
      // Genera numero fattura automatico
      const year = new Date().getFullYear();
      const invoiceNumber = `FATT-${year}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
      
      const invoiceData = {
        date: new Date().toISOString().split('T')[0],
        customerId: customerId || '',
        items: args.items || [{ 
          description: args.description || 'Fattura creata da AI', 
          quantity: args.quantity || 1, 
          unitPrice: parseFloat(args.unitPrice || args.amount || '0'), 
          materialId: '' 
        }],
        notes: args.notes || '',
        status: 'draft',
        dueDate: args.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'invoice',
        invoiceNumber: invoiceNumber,
        total: 0, // Sarà calcolato dal server
        createdAt: new Date().toISOString()
      };
      
      // Calcola il totale
      invoiceData.total = invoiceData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      
      const response = await api.post('/invoices', invoiceData);
      console.log('AI Assistant: Fattura creata:', response.data);
      
      // Notifica al frontend che i dati delle fatture sono cambiati
      window.dispatchEvent(new CustomEvent('ai-data-updated', { 
        detail: { 
          type: 'invoices', 
          action: 'created',
          data: response.data 
        } 
      }));
      
      let resultMessage = `Fattura "${invoiceNumber}" creata con successo con ID: ${response.data.id || 'N/A'}. Totale: €${invoiceData.total.toFixed(2)}`;
      
      if (customerId && args.clientName) {
        resultMessage += ` per il cliente "${args.clientName}"`;
      }
      
      return resultMessage;
    } catch (error: any) {
      console.error('AI Assistant: Errore creazione fattura:', error);
      throw new Error(`Impossibile creare la fattura: ${error.response?.data?.message || error.message}`);
    }
  }

  private async updateInvoice(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Aggiornamento fattura con dati:', args);
      const { invoiceId, ...updateData } = args;
      
      // Rimuovi campi undefined
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      const response = await api.patch(`/invoices/${invoiceId}`, cleanUpdateData);
      console.log('AI Assistant: Fattura aggiornata:', response.data);
      
      // Notifica al frontend che i dati delle fatture sono cambiati
      window.dispatchEvent(new CustomEvent('ai-data-updated', { 
        detail: { 
          type: 'invoices', 
          action: 'updated',
          data: response.data 
        } 
      }));
      
      return `Fattura con ID "${invoiceId}" aggiornata con successo`;
    } catch (error: any) {
      console.error('AI Assistant: Errore aggiornamento fattura:', error);
      throw new Error(`Impossibile aggiornare la fattura: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Esporta istanza singleton
export const aiAssistantService = new AIAssistantService();
export default aiAssistantService;