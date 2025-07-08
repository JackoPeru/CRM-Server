/**
 * Servizio per la gestione dei clienti
 * Implementa CRUD operations con API REST e fallback cache offline
 */
import api from './api';
import { cacheService } from './cache';
import { authService } from './auth';
import toast from 'react-hot-toast';

// Interfacce TypeScript
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Azienda' | 'Privato';
  vatNumber?: string;
  fiscalCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Azienda' | 'Privato';
  vatNumber?: string;
  fiscalCode?: string;
  notes?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: string;
}

class ClientsService {

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minuti
  
  /**
   * Verifica se l'utente ha i permessi per accedere ai clienti
   * @private
   */
  private checkClientPermission(): void {
    if (!authService.hasPermission('clients.view')) {
      const error = new Error('Permessi insufficienti');
      (error as any).permissionDenied = true;
      (error as any).permissionMessage = 'Non hai i permessi per accedere ai dati dei clienti';
      throw error;
    }
  }

  /**
   * Recupera tutti i clienti
   */
  async getClients(): Promise<Client[]> {
    // Verifica permessi prima di procedere
    this.checkClientPermission();
    
    try {
      const response = await api.get<Client[]>('/clients');
      const clients = response.data;
      
      // Salva nel cache per uso offline
      await cacheService.set('customers', 'all', clients, this.CACHE_TTL);
      
      return clients;
    } catch (error: any) {
      console.error('Errore nel recupero clienti:', error);
      
      // Fallback al cache per uso offline
      if (error.code === 'ERR_NETWORK') {
        const cachedClients = await cacheService.get<Client[]>('clients', 'all');
        if (cachedClients) {
          // Usa la stessa logica di throttling per le notifiche
          const lastOfflineToast = localStorage.getItem('lastOfflineToast');
          const now = Date.now();
          
          if (!lastOfflineToast || (now - parseInt(lastOfflineToast)) > 30000) {
            toast.error('Sei offline – dati in sola lettura', {
              duration: 5000,
              id: 'offline-mode'
            });
            localStorage.setItem('lastOfflineToast', now.toString());
          }
          return cachedClients;
        }
      }
      
      throw error;
    }
  }

  /**
   * Recupera un cliente specifico per ID
   */
  async getClient(id: string): Promise<Client> {
    // Verifica permessi prima di procedere
    this.checkClientPermission();
    
    try {
      const response = await api.get<Client>(`/clients/${id}`);
      const client = response.data;
      
      // Salva nel cache
      await cacheService.set('customers', id, client, this.CACHE_TTL);
      
      return client;
    } catch (error: any) {
      console.error(`Errore nel recupero cliente ${id}:`, error);
      
      // Fallback al cache
      if (error.code === 'ERR_NETWORK') {
        const cachedClient = await cacheService.get<Client>('clients', id);
        if (cachedClient) {
          // Usa la stessa logica di throttling per le notifiche
          const lastOfflineToast = localStorage.getItem('lastOfflineToast');
          const now = Date.now();
          
          if (!lastOfflineToast || (now - parseInt(lastOfflineToast)) > 30000) {
            toast.error('Sei offline – dati in sola lettura', {
              duration: 5000,
              id: 'offline-mode'
            });
            localStorage.setItem('lastOfflineToast', now.toString());
          }
          return cachedClient;
        }
      }
      
      throw error;
    }
  }

  /**
   * Crea un nuovo cliente
   */
  async createClient(clientData: CreateClientRequest): Promise<Client> {
    // Verifica permessi prima di procedere
    this.checkClientPermission();
    
    try {
      const response = await api.post<Client>('/clients', clientData);
      const newClient = response.data;
      
      // Aggiorna il cache
      await this.invalidateCache();
      
      toast.success('Cliente creato con successo');
      return newClient;
    } catch (error: any) {
      console.error('Errore nella creazione cliente:', error);
      
      if (error.code === 'ERR_NETWORK') {
        // Salva l'operazione in sospeso per un tentativo futuro
        await this.saveOfflineOperation('create', null, clientData);
        toast.error('Impossibile creare il cliente offline. L\'operazione verrà ritentata quando sarai online.');
      } else if (error.permissionDenied) {
        toast.error(error.permissionMessage || 'Non hai i permessi per creare questo cliente');
      } else if (error.response?.status === 400) {
        // Errore di validazione
        const errorMessage = error.response.data?.message || 'Dati cliente non validi';
        toast.error(`Errore: ${errorMessage}`);
      }
      
      throw error;
    }
  }

  /**
   * Aggiorna un cliente esistente
   */
  async updateClient(id: string, clientData: Partial<CreateClientRequest>): Promise<Client> {
    // Verifica permessi prima di procedere
    this.checkClientPermission();
    
    try {
      const response = await api.patch<Client>(`/clients/${id}`, clientData);
      const updatedClient = response.data;
      
      // Aggiorna il cache
      await cacheService.set('customers', id, updatedClient, this.CACHE_TTL);
      await this.invalidateCache(); // Invalida la lista completa
      
      toast.success('Cliente aggiornato con successo');
      return updatedClient;
    } catch (error: any) {
      console.error(`Errore nell'aggiornamento cliente ${id}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        // Salva l'operazione in sospeso per un tentativo futuro
        await this.saveOfflineOperation('update', id, clientData);
        toast.error('Impossibile aggiornare il cliente offline. L\'operazione verrà ritentata quando sarai online.');
      } else if (error.permissionDenied) {
        toast.error(error.permissionMessage || 'Non hai i permessi per modificare questo cliente');
      } else if (error.response?.status === 400) {
        // Errore di validazione
        const errorMessage = error.response.data?.message || 'Dati cliente non validi';
        toast.error(`Errore: ${errorMessage}`);
      } else if (error.response?.status === 404) {
        toast.error('Cliente non trovato');
      }
      
      throw error;
    }
  }

  /**
   * Elimina un cliente
   */
  async deleteClient(id: string): Promise<void> {
    // Verifica permessi prima di procedere
    this.checkClientPermission();
    
    try {
      await api.delete(`/clients/${id}`);
      
      // Rimuove dal cache
      await cacheService.delete('customers', id);
      await this.invalidateCache(); // Invalida la lista completa
      
      toast.success('Cliente eliminato con successo');
    } catch (error: any) {
      console.error(`Errore nell'eliminazione cliente ${id}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        // Salva l'operazione in sospeso per un tentativo futuro
        await this.saveOfflineOperation('delete', id, null);
        toast.error('Impossibile eliminare il cliente offline. L\'operazione verrà ritentata quando sarai online.');
      } else if (error.permissionDenied) {
        toast.error(error.permissionMessage || 'Non hai i permessi per eliminare questo cliente');
      } else if (error.response?.status === 404) {
        toast.error('Cliente non trovato');
      } else if (error.response?.status === 409) {
        toast.error('Impossibile eliminare il cliente: è collegato ad altri dati nel sistema');
      }
      
      throw error;
    }
  }

  /**
   * Cerca clienti per nome o email
   */
  async searchClients(query: string): Promise<Client[]> {
    // Verifica permessi prima di procedere
    this.checkClientPermission();
    
    try {
      const response = await api.get<Client[]>(`/clients/search`, {
        params: { q: query }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Errore nella ricerca clienti:', error);
      
      // Fallback al cache per ricerca offline
      if (error.code === 'ERR_NETWORK') {
        const cachedClients = await cacheService.get<Client[]>('customers', 'all');
        if (cachedClients) {
          // Ricerca locale nel cache
          const filteredClients = cachedClients.filter(client => 
            client.name.toLowerCase().includes(query.toLowerCase()) ||
            client.email.toLowerCase().includes(query.toLowerCase())
          );
          toast.error('Sei offline – ricerca limitata ai dati locali');
          return filteredClients;
        }
      }
      
      throw error;
    }
  }

  /**
   * Ottiene statistiche sui clienti
   */
  async getClientsStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    recentlyAdded: number;
  }> {
    // Verifica permessi prima di procedere
    this.checkClientPermission();
    
    try {
      const response = await api.get('/clients/stats');
      return response.data;
    } catch (error: any) {
      console.error('Errore nel recupero statistiche clienti:', error);
      
      // Fallback al cache per statistiche offline
      if (error.code === 'ERR_NETWORK') {
        const cachedClients = await cacheService.get<Client[]>('customers', 'all');
        if (cachedClients) {
          const stats = this.calculateStatsFromCache(cachedClients);
          toast.error('Sei offline – statistiche calcolate dai dati locali');
          return stats;
        }
      }
      
      throw error;
    }
  }

  /**
   * Calcola statistiche dai dati in cache
   */
  private calculateStatsFromCache(clients: Client[]): {
    total: number;
    byType: Record<string, number>;
    recentlyAdded: number;
  } {
    const total = clients.length;
    const byType: Record<string, number> = {};
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let recentlyAdded = 0;

    clients.forEach(client => {
      // Conta per tipo
      byType[client.type] = (byType[client.type] || 0) + 1;
      
      // Conta quelli aggiunti di recente
      if (new Date(client.createdAt) > oneWeekAgo) {
        recentlyAdded++;
      }
    });

    return { total, byType, recentlyAdded };
  }

  /**
   * Invalida il cache della lista clienti
   */
  private async invalidateCache(): Promise<void> {
    try {
      await cacheService.delete('customers', 'all');
    } catch (error) {
      console.error('Errore nell\'invalidazione cache clienti:', error);
    }
  }

  /**
   * Pulisce tutto il cache dei clienti
   */
  async clearCache(): Promise<void> {
    try {
      await cacheService.clear('customers');
      console.log('Cache clienti pulito');
    } catch (error) {
      console.error('Errore nella pulizia cache clienti:', error);
    }
  }

  /**
   * Salva un'operazione offline per ritentarla in seguito
   */
  private async saveOfflineOperation(operation: 'create' | 'update' | 'delete', id: string | null, data: any): Promise<void> {
    try {
      // Recupera le operazioni in sospeso dal localStorage
      const pendingOpsString = localStorage.getItem('pendingClientOperations');
      const pendingOps = pendingOpsString ? JSON.parse(pendingOpsString) : [];
      
      // Aggiungi la nuova operazione
      pendingOps.push({
        operation,
        id,
        data,
        timestamp: Date.now()
      });
      
      // Salva nel localStorage
      localStorage.setItem('pendingClientOperations', JSON.stringify(pendingOps));
      console.log(`Operazione ${operation} cliente salvata per retry futuro`);
    } catch (error) {
      console.error('Errore nel salvataggio operazione offline:', error);
    }
  }

  /**
   * Ritenta le operazioni offline in sospeso
   * Da chiamare quando l'app torna online
   */
  async retryPendingOperations(): Promise<void> {
    try {
      const pendingOpsString = localStorage.getItem('pendingClientOperations');
      if (!pendingOpsString) return;
      
      const pendingOps = JSON.parse(pendingOpsString);
      if (pendingOps.length === 0) return;
      
      console.log(`Ritentativo di ${pendingOps.length} operazioni cliente in sospeso`);
      
      // Crea una copia dell'array per poter rimuovere elementi durante l'iterazione
      const remainingOps = [];
      
      for (const op of pendingOps) {
        try {
          if (op.operation === 'create') {
            await api.post<Client>('/clients', op.data);
          } else if (op.operation === 'update' && op.id) {
            await api.patch<Client>(`/clients/${op.id}`, op.data);
          } else if (op.operation === 'delete' && op.id) {
            await api.delete(`/clients/${op.id}`);
          }
          
          console.log(`Operazione ${op.operation} cliente completata con successo`);
        } catch (error) {
          console.error(`Errore nel ritentativo operazione ${op.operation} cliente:`, error);
          
          // Se l'errore non è di rete, non ritentare più questa operazione
          if ((error as any).code !== 'ERR_NETWORK') {
            console.log(`Operazione ${op.operation} cliente rimossa dalla coda di retry`);
          } else {
            // Mantieni l'operazione per un futuro ritentativo
            remainingOps.push(op);
          }
        }
      }
      
      // Aggiorna il localStorage con le operazioni rimanenti
      if (remainingOps.length > 0) {
        localStorage.setItem('pendingClientOperations', JSON.stringify(remainingOps));
        console.log(`${remainingOps.length} operazioni cliente rimaste in sospeso`);
      } else {
        localStorage.removeItem('pendingClientOperations');
        console.log('Tutte le operazioni cliente in sospeso completate');
        toast.success('Operazioni in sospeso completate con successo');
      }
      
      // Ricarica i dati aggiornati
      await this.invalidateCache();
    } catch (error) {
      console.error('Errore nel ritentativo operazioni offline:', error);
    }
  }
}

// Istanza singleton del servizio clienti
export const clientsService = new ClientsService();
export default clientsService;