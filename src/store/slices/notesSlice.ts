import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notesService } from '../../services/notes';
import type { Note, CreateNoteRequest, UpdateNoteRequest, ShareNoteRequest, Worker } from '../../types/notes';
import type { RootState } from '../index';

// Stato iniziale
interface NotesState {
  notes: Note[];
  workers: Worker[];
  sharedWithMe: any[];
  loading: boolean;
  workersLoading: boolean;
  sharedWithMeLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: NotesState = {
  notes: [],
  workers: [],
  sharedWithMe: [],
  loading: false,
  workersLoading: false,
  sharedWithMeLoading: false,
  error: null,
  lastFetch: null,
};

// Thunk asincroni
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (_, { rejectWithValue }) => {
    try {
      const notes = await notesService.getNotes();
      return notes;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Errore nel caricamento degli appunti');
    }
  }
);

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (noteData: CreateNoteRequest, { rejectWithValue }) => {
    try {
      const newNote = await notesService.createNote(noteData);
      return newNote;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Errore nella creazione dell\'appunto'
      );
    }
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ id, updates }: { id: string; updates: UpdateNoteRequest }, { rejectWithValue }) => {
    try {
      const updatedNote = await notesService.updateNote(id, updates);
      return updatedNote;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Errore nell\'aggiornamento dell\'appunto'
      );
    }
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id: string, { rejectWithValue }) => {
    try {
      await notesService.deleteNote(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Errore nell\'eliminazione dell\'appunto'
      );
    }
  }
);

export const shareNote = createAsyncThunk(
  'notes/shareNote',
  async (shareData: ShareNoteRequest, { rejectWithValue }) => {
    try {
      await notesService.shareNote(shareData);
      return shareData;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Errore nella condivisione dell\'appunto'
      );
    }
  }
);

export const fetchWorkers = createAsyncThunk(
  'notes/fetchWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const workers = await notesService.getWorkers();
      return workers;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Errore nel caricamento degli operai'
      );
    }
  }
);

export const fetchSharedWithMe = createAsyncThunk(
  'notes/fetchSharedWithMe',
  async (_, { rejectWithValue }) => {
    try {
      const sharedNotes = await notesService.getSharedWithMe();
      return sharedNotes;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Errore nel caricamento delle condivisioni'
      );
    }
  }
);

// Slice
const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearNotesError: (state) => {
      state.error = null;
    },
    clearNotes: (state) => {
      state.notes = [];
      state.workers = [];
      state.sharedWithMe = [];
      state.lastFetch = null;
      notesService.clearCache();
    },
    addNoteOptimistic: (state, action: PayloadAction<Note>) => {
      state.notes.unshift(action.payload);
    },
    removeNoteOptimistic: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(note => note.id !== action.payload);
    },
    updateNoteOptimistic: (state, action: PayloadAction<Note>) => {
      const index = state.notes.findIndex(note => note.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch Notes
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Note
      .addCase(createNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes.unshift(action.payload);
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Note
      .addCase(updateNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex(note => note.id === action.payload.id);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Note
      .addCase(deleteNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter(note => note.id !== action.payload);
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Share Note
      .addCase(shareNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shareNote.fulfilled, (state) => {
        state.loading = false;
        // Ricarica gli appunti per ottenere lo stato aggiornato
      })
      .addCase(shareNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Workers
      .addCase(fetchWorkers.pending, (state) => {
        state.workersLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.workersLoading = false;
        state.workers = action.payload;
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.workersLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Shared With Me
      .addCase(fetchSharedWithMe.pending, (state) => {
        state.sharedWithMeLoading = true;
        state.error = null;
      })
      .addCase(fetchSharedWithMe.fulfilled, (state, action) => {
        state.sharedWithMeLoading = false;
        state.sharedWithMe = action.payload;
      })
      .addCase(fetchSharedWithMe.rejected, (state, action) => {
        state.sharedWithMeLoading = false;
        state.error = action.payload as string;
      });
  }
});

// Actions
export const {
  clearNotesError,
  clearNotes,
  addNoteOptimistic,
  removeNoteOptimistic,
  updateNoteOptimistic
} = notesSlice.actions;

// Selectors
export const selectAllNotes = (state: RootState) => state.notes.notes;
export const selectNotesLoading = (state: RootState) => state.notes.loading;
export const selectNotesError = (state: RootState) => state.notes.error;
export const selectWorkers = (state: RootState) => state.notes.workers;
export const selectWorkersLoading = (state: RootState) => state.notes.workersLoading;
export const selectSharedWithMe = (state: RootState) => state.notes.sharedWithMe;
export const selectSharedWithMeLoading = (state: RootState) => state.notes.sharedWithMeLoading;
export const selectNotesLastFetch = (state: RootState) => state.notes.lastFetch;

// Selectors derivati
export const selectNotesCount = (state: RootState) => state.notes.notes.length;
export const selectRecentNotes = (state: RootState) => 
  state.notes.notes.slice(0, 3);
export const selectNotesByPriority = (state: RootState, priority: 'low' | 'medium' | 'high') =>
  state.notes.notes.filter(note => note.priority === priority);

export default notesSlice.reducer;