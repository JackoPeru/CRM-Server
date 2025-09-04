export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  isShared: boolean;
  sharedWith: string[]; // Array di ID degli operai con cui è condiviso
  priority: 'low' | 'medium' | 'high';
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ShareNoteRequest {
  noteId: string;
  workerIds: string[]; // Array vuoto significa condividi con tutti
  message?: string; // Messaggio opzionale per la condivisione
}

export interface Worker {
  id: string;
  name: string;
  username: string;
  email: string;
}