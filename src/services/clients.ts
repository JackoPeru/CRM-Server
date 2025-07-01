/**
 * Servizio per la gestione dei clienti
 * Implementa CRUD operations con API REST e fallback cache offline
 */
import api from './api';
import { cacheService } from './cache';
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
   * Recupera tutti i clienti
   */
  async getClients(): Promise<Client[]> {
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
        toast.error('Impossibile creare il cliente offline');
      }
      
      throw error;
    }
  }

  /**
   * Aggiorna un cliente esistente
   */
  async updateClient(id: string, clientData: Partial<CreateClientRequest>): Promise<Client> {
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
        toast.error('Impossibile aggiornare il cliente offline');
      }
      
      throw error;
    }
  }

  /**
   * Elimina un cliente
   */
  async deleteClient(id: string): Promise<void> {
    try {
      await api.delete(`/clients/${id}`);
      
      // Rimuove dal cache
      await cacheService.delete('customers', id);
      await this.invalidateCache(); // Invalida la lista completa
      
      toast.success('Cliente eliminato con successo');
    } catch (error: any) {
      console.error(`Errore nell'eliminazione cliente ${id}:`, error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Impossibile eliminare il cliente offline');
      }
      
      throw error;
    }
  }

  /**
   * Cerca clienti per nome o email
   */
  async searchClients(query: string): Promise<Client[]> {
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
}

// Istanza singleton del servizio clienti
export const clientsService = new ClientsService();
export default clientsService;