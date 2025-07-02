/**
 * Servizio per la gestione del caching offline con IndexedDB
 * Utilizzato come fallback quando le API non sono raggiungibili
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Interfacce per il database
interface CacheEntry<T = any> {
  id: string;
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

interface CrmCacheDB extends DBSchema {
  customers: {
    key: string;
    value: CacheEntry;
  };
  projects: {
    key: string;
    value: CacheEntry;
  };
  orders: {
    key: string;
    value: CacheEntry;
  };
  materials: {
    key: string;
    value: CacheEntry;
  };
  analytics: {
    key: string;
    value: CacheEntry;
  };
}

class CacheService {
  private db: IDBPDatabase<CrmCacheDB> | null = null;
  private readonly DB_NAME = 'crmCache';
  private readonly DB_VERSION = 1;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minuti

  /**
   * Inizializza il database IndexedDB
   */
  async init(): Promise<void> {
    try {
      this.db = await openDB<CrmCacheDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Crea gli store se non esistono
          if (!db.objectStoreNames.contains('customers')) {
            db.createObjectStore('customers', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('projects')) {
            db.createObjectStore('projects', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('orders')) {
            db.createObjectStore('orders', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('materials')) {
            db.createObjectStore('materials', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('analytics')) {
            db.createObjectStore('analytics', { keyPath: 'id' });
          }
        },
      });
      console.log('Cache IndexedDB inizializzato con successo');
    } catch (error) {
      console.error('Errore nell\'inizializzazione del cache:', error);
      throw error;
    }
  }

  /**
   * Verifica se il database è inizializzato
   */
  private ensureDB(): void {
    if (!this.db) {
      throw new Error('Database cache non inizializzato. Chiamare init() prima.');
    }
  }

  /**
   * Salva dati nel cache
   */
  async set<T>(
    store: keyof CrmCacheDB,
    key: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    this.ensureDB();
    
    const entry: CacheEntry<T> = {
      id: key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };

    try {
      await this.db!.put(store as 'customers' | 'projects' | 'orders' | 'materials' | 'analytics', entry);
      console.log(`Dati salvati nel cache: ${store}/${key}`);
    } catch (error) {
      console.error(`Errore nel salvataggio cache ${store}/${key}:`, error);
      throw error;
    }
  }

  /**
   * Recupera dati dal cache
   */
  async get<T>(
    store: keyof CrmCacheDB,
    key: string
  ): Promise<T | null> {
    this.ensureDB();

    try {
      const entry = await this.db!.get(store as 'customers' | 'projects' | 'orders' | 'materials' | 'analytics', key);
      
      if (!entry) {
        return null;
      }

      // Verifica se i dati sono scaduti
      if (this.isExpired(entry)) {
        await this.delete(store, key);
        return null;
      }

      console.log(`Dati recuperati dal cache: ${store}/${key}`);
      return entry.data as T;
    } catch (error) {
      console.error(`Errore nel recupero cache ${store}/${key}:`, error);
      return null;
    }
  }

  /**
   * Recupera tutti i dati di uno store
   */
  async getAll<T>(store: keyof CrmCacheDB): Promise<T[]> {
    this.ensureDB();

    try {
      const entries = await this.db!.getAll(store as 'customers' | 'projects' | 'orders' | 'materials' | 'analytics');
      const validEntries: T[] = [];

      for (const entry of entries) {
        if (this.isExpired(entry)) {
          await this.delete(store, entry.id);
        } else {
          validEntries.push(entry.data as T);
        }
      }

      console.log(`Recuperati ${validEntries.length} elementi dal cache: ${store}`);
      return validEntries;
    } catch (error) {
      console.error(`Errore nel recupero cache ${store}:`, error);
      return [];
    }
  }

  /**
   * Elimina un elemento dal cache
   */
  async delete(store: keyof CrmCacheDB, key: string): Promise<void> {
    this.ensureDB();

    try {
      await this.db!.delete(store as 'customers' | 'projects' | 'orders' | 'materials' | 'analytics', key);
      console.log(`Elemento eliminato dal cache: ${store}/${key}`);
    } catch (error) {
      console.error(`Errore nell'eliminazione cache ${store}/${key}:`, error);
    }
  }

  /**
   * Pulisce tutto il cache di uno store
   */
  async clear(store: keyof CrmCacheDB): Promise<void> {
    this.ensureDB();

    try {
      await this.db!.clear(store as 'customers' | 'projects' | 'orders' | 'materials' | 'analytics');
      console.log(`Cache pulito: ${store}`);
    } catch (error) {
      console.error(`Errore nella pulizia cache ${store}:`, error);
    }
  }

  /**
   * Pulisce tutto il database cache
   */
  async clearAll(): Promise<void> {
    this.ensureDB();

    const stores: (keyof CrmCacheDB)[] = [
      'customers',
      'projects', 
      'orders',
      'materials',
      'analytics'
    ];

    try {
      for (const store of stores) {
        await this.clear(store);
      }
      console.log('Tutto il cache è stato pulito');
    } catch (error) {
      console.error('Errore nella pulizia completa del cache:', error);
    }
  }

  /**
   * Verifica se un elemento del cache è scaduto
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) {
      return false;
    }
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Pulisce automaticamente gli elementi scaduti
   */
  async cleanExpired(): Promise<void> {
    this.ensureDB();

    const stores: (keyof CrmCacheDB)[] = [
      'customers',
      'projects',
      'orders', 
      'materials',
      'analytics'
    ];

    try {
      for (const store of stores) {
        const entries = await this.db!.getAll(store as 'customers' | 'projects' | 'orders' | 'materials' | 'analytics');
        for (const entry of entries) {
          if (this.isExpired(entry)) {
            await this.delete(store, entry.id);
          }
        }
      }
      console.log('Pulizia elementi scaduti completata');
    } catch (error) {
      console.error('Errore nella pulizia elementi scaduti:', error);
    }
  }

  /**
   * Ottiene statistiche del cache
   */
  async getStats(): Promise<{
    stores: Record<keyof CrmCacheDB, number>;
    totalSize: number;
  }> {
    this.ensureDB();

    const stats: Record<keyof CrmCacheDB, number> = {
      customers: 0,
      projects: 0,
      orders: 0,
      materials: 0,
      analytics: 0,
    };

    let totalSize = 0;

    try {
      const stores: (keyof CrmCacheDB)[] = ['customers', 'projects', 'orders', 'materials', 'analytics'];
      for (const store of stores) {
        const count = await this.db!.count(store as 'customers' | 'projects' | 'orders' | 'materials' | 'analytics');
        stats[store] = count;
        totalSize += count;
      }
    } catch (error) {
      console.error('Errore nel recupero statistiche cache:', error);
    }

    return { stores: stats, totalSize };
  }
}

// Istanza singleton del servizio cache
export const cacheService = new CacheService();
export default cacheService;