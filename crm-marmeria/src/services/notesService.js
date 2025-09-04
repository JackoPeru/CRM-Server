import { notesService as notesApi } from './notes';

export const notesService = {
  async getNotes() {
    return await notesApi.getNotes();
  },

  async createNote(noteData) {
    return await notesApi.createNote(noteData);
  },

  async updateNote(id, updates) {
    return await notesApi.updateNote(id, updates);
  },

  async deleteNote(id) {
    return await notesApi.deleteNote(id);
  },

  async shareNote(shareData) {
    return await notesApi.shareNote(shareData);
  },

  async getWorkers() {
    return await notesApi.getWorkers();
  }
};