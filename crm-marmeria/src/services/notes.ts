import { apiClient } from './api';
import { cacheService } from './cache';
import type { Note, CreateNoteRequest, UpdateNoteRequest, ShareNoteRequest, Worker } from '../types/notes';

class NotesService {
  private cache = cacheService;
  private cacheKey = 'notes';
  private workersCacheKey = 'workers';
  private cacheInitialized = false;

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    if (this.cacheInitialized) return;
    
    try {
      await this.cache.init();
      this.cacheInitialized = true;
      console.log('Cache NotesService inizializzato con successo');
    } catch (error) {
      console.warn('Errore nell\'inizializzazione cache NotesService:', error);
      // Non bloccare l'applicazione se la cache non funziona
    }
  }

  private async ensureCache(): Promise<void> {
    if (!this.cacheInitialized) {
      await this.initializeCache();
    }
  }



  async getNotes(): Promise<Note[]> {
    try {
      // Prova prima dalla cache
      try {
        await this.ensureCache();
        const cachedNotes = await this.cache.get<Note[]>('notes', this.cacheKey);
        if (cachedNotes && cachedNotes.length > 0) {
          return cachedNotes;
        }
      } catch (cacheError) {
        console.warn('Errore nel recupero cache, continuo con API:', cacheError);
      }

      const response = await apiClient.get('/notes');
      const notes = response.data;
      
      // Salva in cache
      try {
        await this.ensureCache();
        await this.cache.set('notes', this.cacheKey, notes);
      } catch (cacheError) {
        console.warn('Errore nel salvataggio cache:', cacheError);
      }
      
      return notes;
    } catch (error) {
      console.error('Errore nel recupero degli appunti:', error);
      throw error;
    }
  }

  async createNote(noteData: CreateNoteRequest): Promise<Note> {
    try {
      const response = await apiClient.post('/notes', noteData);
      const newNote = response.data;
      
      // Aggiorna la cache
      try {
        await this.invalidateCache();
      } catch (cacheError) {
        console.warn('Errore nell\'invalidazione cache dopo creazione:', cacheError);
      }
      
      return newNote;
    } catch (error) {
      console.error('Errore nella creazione dell\'appunto:', error);
      throw error;
    }
  }

  async updateNote(id: string, updates: UpdateNoteRequest): Promise<Note> {
    try {
      const response = await apiClient.put(`/notes/${id}`, updates);
      const updatedNote = response.data;
      
      // Aggiorna la cache
      try {
        await this.invalidateCache();
      } catch (cacheError) {
        console.warn('Errore nell\'invalidazione cache dopo aggiornamento:', cacheError);
      }
      
      return updatedNote;
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'appunto:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      await apiClient.delete(`/notes/${id}`);

      // Aggiorna la cache
      try {
        await this.invalidateCache();
      } catch (cacheError) {
        console.warn('Errore nell\'invalidazione cache dopo eliminazione:', cacheError);
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'appunto:', error);
      throw error;
    }
  }

  async shareNote(shareData: ShareNoteRequest): Promise<void> {
    try {
      await apiClient.post(`/notes/${shareData.noteId}/share`, {
        workerIds: shareData.workerIds,
        message: shareData.message
      });

      // Aggiorna la cache
      try {
        await this.invalidateCache();
      } catch (cacheError) {
        console.warn('Errore nell\'invalidazione cache dopo condivisione:', cacheError);
      }
    } catch (error) {
      console.error('Errore nella condivisione dell\'appunto:', error);
      throw error;
    }
  }

  async getWorkers(): Promise<Worker[]> {
    try {
      // Prova prima dalla cache
      try {
        await this.ensureCache();
        const cachedWorkers = await this.cache.get<Worker[]>('workers', this.workersCacheKey);
        if (cachedWorkers && cachedWorkers.length > 0) {
          return cachedWorkers;
        }
      } catch (cacheError) {
        console.warn('Errore nel recupero cache workers, continuo con API:', cacheError);
      }

      const response = await apiClient.get('/workers');
      const workers = response.data;
      
      // Salva in cache
      try {
        await this.ensureCache();
        await this.cache.set('workers', this.workersCacheKey, workers);
      } catch (cacheError) {
        console.warn('Errore nel salvataggio cache workers:', cacheError);
      }
      
      return workers;
    } catch (error) {
      console.error('Errore nel recupero degli operai:', error);
      throw error;
    }
  }

  async getSharedWithMe(): Promise<any[]> {
    try {
      const response = await apiClient.get('/notes/shared-with-me');
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero delle condivisioni:', error);
      throw error;
    }
  }

  async invalidateCache(): Promise<void> {
    try {
      await this.ensureCache();
      await this.cache.delete('notes', this.cacheKey);
    } catch (error) {
      console.warn('Errore nell\'invalidazione della cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.ensureCache();
      await this.cache.delete('notes', this.cacheKey);
      await this.cache.delete('workers', this.workersCacheKey);
    } catch (error) {
      console.warn('Errore nella pulizia della cache:', error);
    }
  }
}

export const notesService = new NotesService();