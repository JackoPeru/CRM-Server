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
  },
  {
    name: 'get_quotes',
    description: 'Recupera SOLO la lista dei preventivi senza informazioni sui clienti (usa includeClientInfo: true per includere info clienti)',
    parameters: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Filtra per ID cliente'
        },
        status: {
          type: 'string',
          description: 'Filtra per stato del preventivo'
        },
        search: {
          type: 'string',
          description: 'Termine di ricerca per titolo o descrizione'
        },
        limit: {
          type: 'number',
          description: 'Numero massimo di preventivi da recuperare'
        },
        includeClientInfo: {
          type: 'boolean',
          description: 'Include informazioni sui clienti (default: false)',
          default: false
        }
      },
      required: []
    }
  },
  {
    name: 'get_orders',
    description: 'Recupera tutti gli ordini (preventivi, fatture, progetti) con dettagli completi',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['quote', 'invoice', 'order', 'project'],
          description: 'Tipo di ordine da recuperare'
        },
        clientId: {
          type: 'string',
          description: 'Filtra per ID cliente'
        },
        status: {
          type: 'string',
          description: 'Filtra per stato'
        },
        search: {
          type: 'string',
          description: 'Termine di ricerca'
        },
        limit: {
          type: 'number',
          description: 'Numero massimo di risultati'
        }
      },
      required: []
    }
  },
  {
    name: 'get_materials',
    description: 'Recupera la lista dei materiali disponibili',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Termine di ricerca per nome o descrizione'
        },
        category: {
          type: 'string',
          description: 'Filtra per categoria'
        },
        limit: {
          type: 'number',
          description: 'Numero massimo di materiali da recuperare'
        }
      },
      required: []
    }
  },
  {
    name: 'get_full_data_context',
    description: 'SOLO per analisi approfondite che richiedono TUTTI i tipi di dati insieme. NON usare per richieste specifiche di un solo tipo (usa get_quotes, get_projects, etc.)',
    parameters: {
      type: 'object',
      properties: {
        includeProjects: {
          type: 'boolean',
          description: 'Include i progetti',
          default: true
        },
        includeClients: {
          type: 'boolean',
          description: 'Include i clienti',
          default: true
        },
        includeQuotes: {
          type: 'boolean',
          description: 'Include i preventivi',
          default: true
        },
        includeInvoices: {
          type: 'boolean',
          description: 'Include le fatture',
          default: true
        },
        includeMaterials: {
          type: 'boolean',
          description: 'Include i materiali',
          default: true
        }
      },
      required: []
    }
  },
  {
    name: 'auto_create_project_and_invoice',
    description: 'Crea automaticamente progetto e fattura quando viene trovato un solo cliente corrispondente',
    parameters: {
      type: 'object',
      properties: {
        clientName: {
          type: 'string',
          description: 'Nome del cliente da cercare'
        },
        projectName: {
          type: 'string',
          description: 'Nome del progetto da creare'
        },
        projectBudget: {
          type: 'string',
          description: 'Budget del progetto'
        },
        invoiceAmount: {
          type: 'string',
          description: 'Importo della fattura'
        },
        description: {
          type: 'string',
          description: 'Descrizione per progetto e fattura'
        }
      },
      required: ['clientName']
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
- get_clients: Recupera la lista dei clienti
- create_client: Crea un nuovo cliente
- get_quotes: Recupera SOLO i preventivi senza informazioni sui clienti (usa includeClientInfo: true SOLO se esplicitamente richiesto)
- get_orders: Recupera tutti gli ordini (preventivi, fatture, progetti) con dettagli completi
- get_materials: Recupera la lista dei materiali disponibili
- get_full_data_context: Recupera un contesto completo di tutti i dati dell'applicazione
- create_quote: Crea un nuovo preventivo (può creare automaticamente il cliente se non esiste)
- get_invoices: Recupera la lista delle fatture
- create_invoice: Crea una nuova fattura (può creare automaticamente il cliente se non esiste)
- update_invoice: Aggiorna una fattura esistente
- update_project_status: Aggiorna lo stato di un progetto
- navigate_to_page: Naviga a una pagina specifica
- auto_create_project_and_invoice: Crea automaticamente progetto e fattura quando viene trovato un solo cliente corrispondente

📋 COMPORTAMENTO AUTONOMO:
- DEVI essere completamente autonomo e proattivo
- NON chiedere conferme o permessi all'utente
- Se l'utente chiede un preventivo per un cliente che non esiste, crealo automaticamente
- Se mancano informazioni, usa valori ragionevoli di default
- Completa sempre l'obiettivo richiesto senza fermarti a metà
- Se trovi UN SOLO cliente corrispondente alla ricerca, procedi automaticamente senza chiedere conferma
- Quando l'utente chiede di creare progetto e fattura per un cliente specifico, fallo automaticamente se il cliente è unico
- ESEMPI DI FRASI CHE RICHIEDONO auto_create_project_and_invoice:
  * "luigino ha approvato il preventivo, crea il progetto e la fattura"
  * "[nome cliente] ha approvato, crea progetto e fattura"
  * "crea progetto e fattura per [nome cliente]"
  * "[nome cliente] vuole procedere, crea tutto"

📅 GESTIONE DATE:
- USA SEMPRE la data odierna (${new Date().toISOString().split('T')[0]}) per nuovi progetti, preventivi e fatture
- Per le scadenze, usa date future ragionevoli (es. +30 giorni dalla data odierna)
- NON usare mai date del 2023 o anni passati

👥 RICERCA CLIENTI:
- Quando cerchi un cliente, usa ricerca case-insensitive ("luigino" deve trovare "Luigino")
- Se trovi un cliente con nome simile, usalo automaticamente senza chiedere conferma
- Esempio: se l'utente dice "luigino" e trovi "Luigino", usalo direttamente

📝 NOMI PROGETTI:
- Quando crei un progetto basato su un preventivo esistente, usa un nome descrittivo
- Prendi il nome dal contenuto del preventivo (es. "vasca in marmo", "piano cucina", "scala in travertino")
- NON usare nomi generici come "progetto per [cliente]" se hai informazioni più specifiche
- Se l'utente menziona un preventivo specifico, recupera i dettagli e usa quelli per il nome del progetto

🎯 QUANDO USARE GLI STRUMENTI - REGOLE SPECIFICHE:
- "vedere i preventivi" → usa SOLO get_quotes con includeClientInfo: false (NON get_full_data_context)
- "vedere i progetti" → usa SOLO get_projects (NON get_full_data_context)
- "vedere i clienti" → usa SOLO get_clients (NON get_full_data_context)
- "vedere i materiali" → usa SOLO get_materials (NON get_full_data_context)
- "vedere le fatture" / "mostra fatture" / "cerca fatture" / "fatture" → usa SOLO get_invoices (NON get_projects, NON get_full_data_context)
- "fattura" / "invoice" / "fatturazione" → SEMPRE get_invoices, MAI get_projects
- get_quotes con includeClientInfo: true → SOLO se l'utente chiede esplicitamente "preventivi con clienti" o simile
- get_full_data_context → SOLO per analisi che richiedono TUTTI i tipi di dati insieme
- "creare un preventivo" → usa create_quote
- "creare un progetto" → usa create_project
- "creare un cliente" → usa create_client
- navigare → usa navigate_to_page
- PRIMA di creare un progetto basato su un preventivo esistente, usa get_quotes per trovare i dettagli del preventivo
- Quando cerchi un cliente per nome, usa get_clients con il parametro search per ricerca case-insensitive
- Se l'utente chiede di creare PROGETTO E FATTURA per un cliente specifico, usa auto_create_project_and_invoice per gestire tutto automaticamente
- Se l'utente dice che un cliente "ha approvato il preventivo" e chiede di "creare progetto e fattura", usa SEMPRE auto_create_project_and_invoice
- Frasi come "[cliente] ha approvato, crea progetto e fattura" devono SEMPRE usare auto_create_project_and_invoice

🚨 DISTINZIONE CRITICA PROGETTI vs FATTURE:
- PROGETTI = lavori da fare, cantieri, commesse (get_projects)
- FATTURE = documenti di pagamento, bollette, invoices (get_invoices)
- NON confondere MAI progetti con fatture!
- Se l'utente dice "fatture" NON mostrare progetti!
- Se l'utente dice "progetti" NON mostrare fatture!

⚠️ REGOLE FONDAMENTALI:
1. SEMPRE esegui l'azione richiesta, non limitarti a spiegare
2. Se un cliente non esiste, crealo automaticamente quando necessario
3. Non fermarti mai a metà processo per chiedere conferme
4. Usa informazioni ragionevoli di default se mancano dettagli
5. Completa sempre l'obiettivo finale dell'utente
6. RISPETTA SEMPRE la distinzione tra progetti e fatture

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

    console.log('AI Assistant: Chiave API utilizzata:', this.config.apiKey?.substring(0, 20) + '...');
    
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
    // Aggiungi un timestamp per rendere ogni richiesta unica e evitare cache
    const requestId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enhancedArgs = { ...args, _requestId: requestId, _timestamp: new Date().toISOString() };
    
    console.log(`AI Assistant: Esecuzione tool ${toolName} con ID richiesta: ${requestId}`);
    
    switch (toolName) {
      case 'get_projects':
        return this.getProjects(enhancedArgs);
      case 'create_project':
        return this.createProject(enhancedArgs);
      case 'update_project':
        return this.updateProject(enhancedArgs);
      case 'get_clients':
        return this.getClients(enhancedArgs);
      case 'create_client':
        return this.createClient(enhancedArgs);
      case 'get_quotes':
        // Assicurati che includeClientInfo sia false per default se non specificato
        const quotesArgs = { ...enhancedArgs, includeClientInfo: enhancedArgs.includeClientInfo === true };
        return this.getQuotes(quotesArgs);
      case 'get_orders':
        return await this.getOrders(enhancedArgs);
      case 'get_invoices':
        return await this.getInvoices(enhancedArgs);
      case 'get_materials':
        return await this.getMaterials(enhancedArgs);
      case 'get_full_data_context':
        return await this.getFullDataContext(enhancedArgs);
      case 'create_quote':
        return this.createQuote(enhancedArgs);
      case 'create_invoice':
        return this.createInvoice(enhancedArgs);
      case 'update_invoice':
        return this.updateInvoice(enhancedArgs);
      case 'update_project_status':
        return this.updateProjectStatus(enhancedArgs);
      case 'navigate_to_page':
        return this.navigateToPage(enhancedArgs);
      case 'auto_create_project_and_invoice':
        return this.autoCreateProjectAndInvoice(enhancedArgs);
      default:
        throw new Error(`Tool non riconosciuto: ${toolName}`);
    }
  }

  // Implementazioni dei tool
  private async getProjects(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Recupero progetti con filtri:', args);
      const response = await api.get('/projects', { params: args });
      console.log('AI Assistant: Progetti recuperati:', response.data);
      
      if (!response.data || response.data.length === 0) {
        return 'Nessun progetto trovato.';
      }
      
      // Se c'è un termine di ricerca, implementa ricerca case-insensitive
      let projects = response.data;
      if (args.search) {
        const searchTerm = args.search.toLowerCase();
        projects = projects.filter((p: any) => 
          (p.name && p.name.toLowerCase().includes(searchTerm)) ||
          (p.description && p.description.toLowerCase().includes(searchTerm)) ||
          (p.clientName && p.clientName.toLowerCase().includes(searchTerm))
        );
      }
      
      const projectsList = projects.map((project: any) => {
        const clientInfo = project.clientName ? `Cliente: ${project.clientName}` : `Cliente ID: ${project.customerId || 'N/A'}`;
        return `**ID Progetto**: ${project.id}\n**Nome**: ${project.name || 'N/A'}\n**${clientInfo}**\n**Budget**: €${project.budget || 0}\n**Stato**: ${project.status || 'N/A'}\n**Scadenza**: ${project.deadline || 'N/A'}\n**Descrizione**: ${project.description || 'N/A'}`;
      }).join('\n\n');
      
      return `🏗️ **PROGETTI TROVATI** (${projects.length}):\n\n${projectsList}\n\nSe hai bisogno di ulteriori dettagli o vuoi modificare qualcosa, fammelo sapere!`;
    } catch (error: any) {
      console.error('AI Assistant: Errore recupero progetti:', error);
      throw new Error(`Impossibile recuperare i progetti: ${error.response?.data?.message || error.message}`);
    }
  }

  private async createProject(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Creazione progetto con dati:', args);
      
      // Assicurati di usare sempre la data odierna
      const today = new Date().toISOString().split('T')[0];
      const projectData = { 
        ...args, 
        type: 'project',
        status: 'pending',
        startDate: args.startDate || today,
        deadline: args.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      
      console.log('AI Assistant: Data progetto - Inizio:', projectData.startDate, 'Scadenza:', projectData.deadline);
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
      console.log('AI Assistant: Recupero clienti con filtri:', args);
      const response = await api.get('/clients', { params: args });
      console.log('AI Assistant: Clienti recuperati:', response.data);
      
      if (!response.data || response.data.length === 0) {
        return 'Nessun cliente trovato.';
      }
      
      let clients = response.data;
      
      // Se c'è un termine di ricerca, implementa ricerca case-insensitive
      if (args.search) {
        const searchTerm = args.search.toLowerCase();
        clients = clients.filter((c: any) => 
          (c.name && c.name.toLowerCase().includes(searchTerm)) ||
          (c.email && c.email.toLowerCase().includes(searchTerm)) ||
          (c.phone && c.phone.toLowerCase().includes(searchTerm)) ||
          (c.company && c.company.toLowerCase().includes(searchTerm))
        );
      }
      
      const clientsList = clients.map((client: any) => {
        const contactInfo = [];
        if (client.email) contactInfo.push(`Email: ${client.email}`);
        if (client.phone) contactInfo.push(`Tel: ${client.phone}`);
        if (client.company) contactInfo.push(`Azienda: ${client.company}`);
        
        return `**ID Cliente**: ${client.id}\n**Nome**: ${client.name || 'N/A'}\n**Contatti**: ${contactInfo.length > 0 ? contactInfo.join(', ') : 'N/A'}\n**Indirizzo**: ${client.address || 'N/A'}\n**Tipo**: ${client.type || 'N/A'}`;
      }).join('\n\n');
      
      return `👥 **CLIENTI TROVATI** (${clients.length}):\n\n${clientsList}\n\nSe hai bisogno di ulteriori dettagli o vuoi modificare qualcosa, fammelo sapere!`;
    } catch (error: any) {
      console.error('AI Assistant: Errore recupero clienti:', error);
      throw new Error(`Impossibile recuperare i clienti: ${error.response?.data?.message || error.message}`);
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

  private async getQuotes(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Recupero preventivi con filtri:', args);
      
      // Usa l'endpoint orders con filtro per type=quote
      const params = { ...args, type: 'quote' };
      const response = await api.get('/orders', { params });
      console.log('AI Assistant: Preventivi recuperati:', response.data);
      
      if (!response.data || response.data.length === 0) {
        return 'Nessun preventivo trovato.';
      }
      
      // Filtra solo i veri preventivi (type=quote e non collegati a progetti)
      let quotes = response.data.filter((q: any) => 
        q.type === 'quote' && (q.projectId === null || q.projectId === undefined)
      );
      
      // Se c'è un termine di ricerca, implementa ricerca case-insensitive
      if (args.search) {
        const searchTerm = args.search.toLowerCase();
        quotes = quotes.filter((q: any) => 
          (q.items && q.items.some((item: any) => 
            item.description && item.description.toLowerCase().includes(searchTerm)
          )) ||
          (q.notes && q.notes.toLowerCase().includes(searchTerm)) ||
          (q.quoteNumber && q.quoteNumber.toLowerCase().includes(searchTerm))
        );
      }
      
      const quotesList = quotes.map((quote: any) => {
        const itemsDesc = quote.items && quote.items.length > 0 
          ? quote.items.map((item: any) => `${item.description} (Qtà: ${item.quantity}, Prezzo: €${item.unitPrice})`).join('; ')
          : 'N/A';
        // Include informazioni cliente solo se esplicitamente richiesto
        // Assicurati che il default sia false se il parametro non è specificato
        const includeClient = args.includeClientInfo === true;
        const clientInfo = includeClient 
          ? (quote.clientName ? `, Cliente: ${quote.clientName}` : `, Cliente ID: ${quote.customerId || 'N/A'}`)
          : '';
        return `ID: ${quote.id}, Numero: ${quote.quoteNumber || 'N/A'}${clientInfo}, Totale: €${quote.total || 0}, Stato: ${quote.status || 'N/A'}, Data: ${quote.date || 'N/A'}, Articoli: ${itemsDesc}, Note: ${quote.notes || 'N/A'}`;
      }).join('\n\n');
      
      return `💰 **PREVENTIVI TROVATI** (${quotes.length}):\n\n${quotesList}\n\nSe hai bisogno di ulteriori dettagli o vuoi modificare qualcosa, fammelo sapere!`;
    } catch (error: any) {
      console.error('AI Assistant: Errore recupero preventivi:', error);
      throw new Error(`Impossibile recuperare i preventivi: ${error.response?.data?.message || error.message}`);
    }
  }

  private async getOrders(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Recupero ordini con filtri:', args);
      
      const response = await api.get('/orders', { params: args });
      console.log('AI Assistant: Ordini recuperati:', response.data);
      
      if (!response.data || response.data.length === 0) {
        return 'Nessun ordine trovato.';
      }
      
      // Se c'è un termine di ricerca, implementa ricerca case-insensitive
      let orders = response.data;
      if (args.search) {
        const searchTerm = args.search.toLowerCase();
        orders = orders.filter((o: any) => 
          (o.items && o.items.some((item: any) => 
            item.description && item.description.toLowerCase().includes(searchTerm)
          )) ||
          (o.notes && o.notes.toLowerCase().includes(searchTerm)) ||
          (o.quoteNumber && o.quoteNumber.toLowerCase().includes(searchTerm)) ||
          (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(searchTerm)) ||
          (o.clientName && o.clientName.toLowerCase().includes(searchTerm))
        );
      }
      
      const ordersList = orders.map((order: any) => {
        const itemsDesc = order.items && order.items.length > 0 
          ? order.items.map((item: any) => `${item.description} (Qtà: ${item.quantity}, Prezzo: €${item.unitPrice})`).join('; ')
          : 'N/A';
        const clientInfo = order.clientName ? `Cliente: ${order.clientName}` : `Cliente ID: ${order.customerId || 'N/A'}`;
        const orderNumber = order.quoteNumber || order.invoiceNumber || order.orderNumber || 'N/A';
        return `ID: ${order.id}, Tipo: ${order.type || 'N/A'}, Numero: ${orderNumber}, ${clientInfo}, Totale: €${order.total || 0}, Stato: ${order.status || 'N/A'}, Data: ${order.date || 'N/A'}, Articoli: ${itemsDesc}, Note: ${order.notes || 'N/A'}`;
      }).join('\n\n');
      
      return `Ordini trovati (${orders.length}):\n\n${ordersList}`;
    } catch (error: any) {
      console.error('AI Assistant: Errore recupero ordini:', error);
      throw new Error(`Impossibile recuperare gli ordini: ${error.response?.data?.message || error.message}`);
    }
  }

  private async getMaterials(args: any): Promise<string> {
    try {
      // Aggiungi identificatori unici per evitare cache
      const requestId = `materials_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const enhancedArgs = { ...args, requestId, _timestamp: Date.now() };
      
      console.log(`AI Assistant: [${requestId}] Recupero materiali con filtri:`, enhancedArgs);
      
      const response = await api.get('/materials', { params: enhancedArgs });
      console.log(`AI Assistant: [${requestId}] Materiali recuperati:`, response.data?.length || 0, 'elementi');
      
      if (!response.data || response.data.length === 0) {
        return '🔍 Nessun materiale trovato con i criteri specificati.';
      }
      
      // Se c'è un termine di ricerca, implementa ricerca case-insensitive avanzata
      let materials = response.data;
      if (args.search) {
        const searchTerm = args.search.toLowerCase();
        console.log(`AI Assistant: [${requestId}] Applicazione filtro ricerca:`, searchTerm);
        materials = materials.filter((m: any) => 
          (m.name && m.name.toLowerCase().includes(searchTerm)) ||
          (m.description && m.description.toLowerCase().includes(searchTerm)) ||
          (m.category && m.category.toLowerCase().includes(searchTerm)) ||
          (m.supplier && m.supplier.toLowerCase().includes(searchTerm)) ||
          (m.code && m.code.toLowerCase().includes(searchTerm))
        );
        console.log(`AI Assistant: [${requestId}] Materiali dopo filtro:`, materials.length);
      }
      
      const materialsList = materials.map((material: any, index: number) => {
        const availability = material.stock !== undefined ? 
          (material.stock > 0 ? `✅ Disponibile (${material.stock})` : '❌ Esaurito') : 
          '❓ Non specificata';
        
        const priceInfo = material.price ? `€${material.price}` : 'Prezzo non specificato';
        const supplierInfo = material.supplier ? `Fornitore: ${material.supplier}` : 'Fornitore: N/A';
        const codeInfo = material.code ? `Codice: ${material.code}` : 'Codice: N/A';
        
        return `${index + 1}. **${material.name || 'Nome non specificato'}**\n` +
               `   • ID: ${material.id}\n` +
               `   • Categoria: ${material.category || 'N/A'}\n` +
               `   • ${codeInfo}\n` +
               `   • Prezzo: ${priceInfo}/${material.unit || 'unità'}\n` +
               `   • Disponibilità: ${availability}\n` +
               `   • ${supplierInfo}\n` +
               `   • Descrizione: ${material.description || 'Nessuna descrizione disponibile'}`;
      }).join('\n\n');
      
      return `🧱 **MATERIALI TROVATI** (${materials.length}):\n\n${materialsList}\n\nSe hai bisogno di ulteriori dettagli o vuoi modificare qualcosa, fammelo sapere!`;
    } catch (error: any) {
      console.error('AI Assistant: Errore recupero materiali:', error);
      throw new Error(`Impossibile recuperare i materiali: ${error.response?.data?.message || error.message}`);
    }
  }

  private async getInvoices(args: any): Promise<string> {
    try {
      // Aggiungi identificatori unici per evitare cache
      const requestId = `invoices_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const enhancedArgs = { ...args, type: 'invoice', requestId, _timestamp: Date.now() };
      
      console.log(`AI Assistant: [${requestId}] Recupero fatture con filtri:`, enhancedArgs);
      
      // Usa l'endpoint orders con filtro per type=invoice
      const response = await api.get('/orders', { params: enhancedArgs });
      console.log(`AI Assistant: [${requestId}] Fatture recuperate:`, response.data?.length || 0, 'elementi');
      
      if (!response.data || response.data.length === 0) {
        return '🔍 Nessuna fattura trovata con i criteri specificati.';
      }
      
      // Se c'è un termine di ricerca, implementa ricerca case-insensitive avanzata
      let invoices = response.data;
      if (args.search) {
        const searchTerm = args.search.toLowerCase();
        console.log(`AI Assistant: [${requestId}] Applicazione filtro ricerca:`, searchTerm);
        invoices = invoices.filter((i: any) => 
          (i.items && i.items.some((item: any) => 
            item.description && item.description.toLowerCase().includes(searchTerm)
          )) ||
          (i.notes && i.notes.toLowerCase().includes(searchTerm)) ||
          (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(searchTerm)) ||
          (i.clientName && i.clientName.toLowerCase().includes(searchTerm)) ||
          (i.status && i.status.toLowerCase().includes(searchTerm))
        );
        console.log(`AI Assistant: [${requestId}] Fatture dopo filtro:`, invoices.length);
      }
      
      const invoicesList = invoices.map((invoice: any, index: number) => {
        const itemsDesc = invoice.items && invoice.items.length > 0 
          ? invoice.items.map((item: any) => `${item.description} (Qtà: ${item.quantity}, €${item.unitPrice})`).join(', ')
          : 'Nessun articolo specificato';
        
        const clientInfo = invoice.clientName ? invoice.clientName : `Cliente ID: ${invoice.customerId || 'N/A'}`;
        const statusIcon = invoice.status === 'paid' ? '✅' : invoice.status === 'pending' ? '⏳' : invoice.status === 'overdue' ? '❌' : '❓';
        const totalAmount = invoice.total ? `€${invoice.total}` : 'Totale non specificato';
        const invoiceDate = invoice.date ? new Date(invoice.date).toLocaleDateString('it-IT') : 'Data non specificata';
        
        return `${index + 1}. **Fattura ${invoice.invoiceNumber || `#${invoice.id}`}**\n` +
               `   • Cliente: ${clientInfo}\n` +
               `   • Totale: ${totalAmount}\n` +
               `   • Stato: ${statusIcon} ${invoice.status || 'N/A'}\n` +
               `   • Data: ${invoiceDate}\n` +
               `   • Articoli: ${itemsDesc}\n` +
               `   • Note: ${invoice.notes || 'Nessuna nota'}`;
      }).join('\n\n');
      
      return `🧾 **FATTURE TROVATE** (${invoices.length}):\n\n${invoicesList}\n\nSe hai bisogno di ulteriori dettagli o vuoi modificare qualcosa, fammelo sapere!`;
    } catch (error: any) {
      console.error('AI Assistant: Errore recupero fatture:', error);
      throw new Error(`Impossibile recuperare le fatture: ${error.response?.data?.message || error.message}`);
    }
  }

  private async getFullDataContext(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Recupero contesto completo dati:', args);
      
      const results: string[] = [];
      
      // Recupera progetti se richiesto
      if (args.includeProjects !== false) {
        try {
          const projectsResult = await this.getProjects({ limit: 50 });
          results.push(`📋 PROGETTI:\n${projectsResult}`);
        } catch (error) {
          results.push('📋 PROGETTI: Errore nel recupero');
        }
      }
      
      // Recupera clienti se richiesto
      if (args.includeClients !== false) {
        try {
          const clientsResult = await this.getClients({ limit: 50 });
          results.push(`👥 CLIENTI:\n${clientsResult}`);
        } catch (error) {
          results.push('👥 CLIENTI: Errore nel recupero');
        }
      }
      
      // Recupera preventivi se richiesto
      if (args.includeQuotes !== false) {
        try {
          const quotesResult = await this.getQuotes({ limit: 50, includeClientInfo: false });
          results.push(`💰 PREVENTIVI:\n${quotesResult}`);
        } catch (error) {
          results.push('💰 PREVENTIVI: Errore nel recupero');
        }
      }
      
      // Recupera fatture se richiesto
      if (args.includeInvoices !== false) {
        try {
          const invoicesResult = await this.getInvoices({ limit: 50 });
          results.push(`🧾 FATTURE:\n${invoicesResult}`);
        } catch (error) {
          results.push('🧾 FATTURE: Errore nel recupero');
        }
      }
      
      // Recupera materiali se richiesto
      if (args.includeMaterials !== false) {
        try {
          const materialsResult = await this.getMaterials({ limit: 50 });
          results.push(`🧱 MATERIALI:\n${materialsResult}`);
        } catch (error) {
          results.push('🧱 MATERIALI: Errore nel recupero');
        }
      }
      
      return `🔍 CONTESTO COMPLETO DATI APPLICAZIONE:\n\n${results.join('\n\n===================\n\n')}`;
    } catch (error: any) {
      console.error('AI Assistant: Errore recupero contesto completo:', error);
      throw new Error(`Impossibile recuperare il contesto completo: ${error.message}`);
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

  /**
   * Gestisce automaticamente la creazione di progetti e fatture per un cliente specifico
   * Se trova un solo cliente corrispondente, procede automaticamente senza chiedere conferma
   */
  private async autoCreateProjectAndInvoice(args: any): Promise<string> {
    try {
      console.log('AI Assistant: Creazione automatica progetto e fattura per:', args);
      
      // Prima cerca il cliente
      const clientSearch = args.clientName || args.customerName;
      if (!clientSearch) {
        throw new Error('Nome cliente richiesto per la creazione automatica');
      }
      
      const response = await api.get('/clients', { params: { search: clientSearch } });
      const clients = response.data;
      
      const searchTerm = clientSearch.toLowerCase();
      const filteredClients = clients.filter((c: any) => 
        c.name.toLowerCase().includes(searchTerm) || 
        (c.email && c.email.toLowerCase().includes(searchTerm))
      );
      
      if (filteredClients.length === 0) {
        throw new Error(`Nessun cliente trovato per "${clientSearch}"`);
      }
      
      if (filteredClients.length > 1) {
        const clientsList = filteredClients.map((c: any) => 
          `ID: ${c.id}, Nome: ${c.name}, Email: ${c.email || 'N/A'}`
        ).join('\n');
        return `Trovati ${filteredClients.length} clienti corrispondenti a "${clientSearch}". Specifica quale:\n${clientsList}`;
      }
      
      // Un solo cliente trovato - procedi automaticamente
      const client = filteredClients[0];
      console.log('AI Assistant: Cliente unico trovato, procedo automaticamente:', client);
      
      const results = [];
      
      // Crea il progetto
      if (args.createProject !== false) {
        try {
          const projectData = {
            name: args.projectName || `Progetto per ${client.name}`,
            clientId: client.id,
            budget: args.budget || args.amount || 5000,
            description: args.description || `Progetto creato automaticamente per ${client.name}`,
            startDate: new Date().toISOString().split('T')[0],
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          };
          
          const projectResult = await this.createProject(projectData);
          results.push(`✅ ${projectResult}`);
        } catch (projectError: any) {
          results.push(`❌ Errore creazione progetto: ${projectError.message}`);
        }
      }
      
      // Crea la fattura
      if (args.createInvoice !== false) {
        try {
          const invoiceData = {
            clientName: client.name,
            customerId: client.id,
            description: args.description || `Fattura per ${client.name}`,
            amount: args.amount || args.budget || 5000,
            quantity: args.quantity || 1,
            unitPrice: args.unitPrice || args.amount || args.budget || 5000
          };
          
          const invoiceResult = await this.createInvoice(invoiceData);
          results.push(`✅ ${invoiceResult}`);
        } catch (invoiceError: any) {
          results.push(`❌ Errore creazione fattura: ${invoiceError.message}`);
        }
      }
      
      return `🎯 Operazioni completate automaticamente per il cliente "${client.name}":\n\n${results.join('\n')}`;
      
    } catch (error: any) {
      console.error('AI Assistant: Errore creazione automatica:', error);
      throw new Error(`Impossibile completare la creazione automatica: ${error.message}`);
    }
  }
}

// Esporta istanza singleton
export const aiAssistantService = new AIAssistantService();
export default aiAssistantService;