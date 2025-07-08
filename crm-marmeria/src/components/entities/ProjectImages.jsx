import React, { useState, useEffect } from 'react';
import { Upload, X, Eye, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';

// Configurazione centralizzata degli URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const SERVER_BASE_URL = API_BASE_URL.replace('/api', '');

const ProjectImages = ({ projectId, onImagesChange }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin') || hasRole('worker');
  
  // Ottieni il token direttamente da authService per garantire che sia sempre aggiornato
  const getAuthToken = () => authService.getToken();

  // Validazione iniziale dei props
  if (!projectId) {
    console.warn('ProjectImages: componente renderizzato senza projectId');
    return (
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">Errore: ID progetto non disponibile</p>
      </div>
    );
  }

  // Debug: mostra l'ID del progetto ricevuto
  console.log('ProjectImages: ID progetto ricevuto:', projectId, 'tipo:', typeof projectId);

  useEffect(() => {
    fetchImages();
  }, [projectId]);

  const fetchImages = async () => {
    if (!projectId) {
      console.warn('ProjectImages: ID progetto mancante');
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      console.warn('ProjectImages: token di autenticazione mancante');
      return;
    }
    
    try {
      // Prova prima l'endpoint dei progetti (silenziosamente)
      let url = `${API_BASE_URL}/projects/${projectId}/images`;
      // Utilizziamo un log di debug invece di un log normale
      if (process.env.NODE_ENV === 'development') {
        console.debug('ProjectImages: Tentativo con endpoint progetti:', url);
      }
      
      let response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Se il progetto non è trovato, prova l'endpoint degli ordini senza mostrare errori
      if (response.status === 404) {
        url = `${API_BASE_URL}/orders/${projectId}/images`;
        if (process.env.NODE_ENV === 'development') {
          console.debug('ProjectImages: Tentativo con endpoint ordini:', url);
        }
        
        response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      } else if (response.status === 403) {
        console.warn('Accesso negato: verifica i permessi per l\'elemento', projectId);
      } else if (response.status === 404) {
        // Nessun errore in console, solo un log di debug
        if (process.env.NODE_ENV === 'development') {
          console.debug('Elemento non trovato:', projectId);
        }
      } else {
        const errorText = await response.text();
        console.warn('Errore nella risposta del server:', response.status, errorText);
      }
    } catch (error) {
      console.warn('Errore nel caricamento delle immagini:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Debug: log dettagli sui file selezionati
    console.log('ProjectImages Upload: File selezionati:', files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified
    })));

    if (!projectId) {
      console.error('ProjectImages: ID progetto mancante');
      alert('Errore: ID progetto non valido. Riprova a selezionare il progetto.');
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      console.error('ProjectImages: token di autenticazione mancante');
      alert('Errore: Non sei autenticato. Riprova ad accedere.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((file, index) => {
      console.log(`ProjectImages Upload: Aggiungendo file ${index + 1}:`, file.name, file.type, file.size);
      formData.append('images', file);
    });

    try {
      // Prova prima l'endpoint dei progetti
      let url = `${API_BASE_URL}/projects/${projectId}/images`;
      console.log('ProjectImages Upload: Tentativo con endpoint progetti:', url);
      
      // Aggiungi timeout per richieste che potrebbero impiegare più tempo
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondi timeout
      
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('ProjectImages Upload: Risposta progetti status:', response.status, response.statusText);
      
      // Se il progetto non è trovato, prova l'endpoint degli ordini
      if (response.status === 404) {
        url = `${API_BASE_URL}/orders/${projectId}/images`;
        console.log('ProjectImages Upload: Tentativo con endpoint ordini:', url);
        
        // Nuovo timeout per il secondo tentativo
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 30000);
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
          signal: controller2.signal
        });
        
        clearTimeout(timeoutId2);
        console.log('ProjectImages Upload: Risposta ordini status:', response.status, response.statusText);
      }

      if (response.ok) {
        const data = await response.json();
        setImages(prev => [...prev, ...data.images]);
        if (onImagesChange) {
          onImagesChange([...images, ...data.images]);
        }
        alert('Immagini caricate con successo!');
      } else if (response.status === 403) {
        console.warn('Accesso negato: verifica i permessi per caricare immagini', projectId);
        alert('Non hai i permessi per caricare immagini in questo elemento.');
      } else if (response.status === 404) {
        // Mostra errore solo se entrambi gli endpoint hanno fallito
        if (process.env.NODE_ENV === 'development') {
          console.debug('Elemento non trovato per upload:', projectId);
        }
        alert('Elemento non trovato. Verifica che l\'elemento esista.');
      } else {
        const errorText = await response.text();
        console.warn('Errore nell\'upload delle immagini:', response.status, errorText);
        alert('Errore nel caricamento delle immagini. Riprova più tardi.');
      }
    } catch (error) {
      console.warn('Errore nell\'upload delle immagini:', error);
      
      if (error.name === 'AbortError') {
        alert('Timeout durante il caricamento. Le immagini potrebbero essere troppo grandi o la connessione lenta. Riprova con immagini più piccole.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert('Errore di connessione. Verifica la connessione al server e riprova.');
      } else {
        alert('Errore durante il caricamento delle immagini. Riprova più tardi.');
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa immagine?')) {
      return;
    }

    if (!projectId) {
      console.error('ProjectImages: ID progetto mancante per eliminazione');
      alert('Errore: ID progetto non valido.');
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      console.error('ProjectImages: token di autenticazione mancante per eliminazione');
      alert('Errore: Non sei autenticato.');
      return;
    }

    try {
      // Prova prima l'endpoint dei progetti
      let url = `${API_BASE_URL}/projects/${projectId}/images/${imageId}`;
      console.log('ProjectImages Delete: Tentativo con endpoint progetti:', url);
      
      let response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('ProjectImages Delete: Risposta progetti status:', response.status, response.statusText);
      
      // Se il progetto non è trovato, prova l'endpoint degli ordini
      if (response.status === 404) {
        url = `${API_BASE_URL}/orders/${projectId}/images/${imageId}`;
        console.log('ProjectImages Delete: Tentativo con endpoint ordini:', url);
        
        response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('ProjectImages Delete: Risposta ordini status:', response.status, response.statusText);
      }

      if (response.ok) {
        const updatedImages = images.filter(img => img.id !== imageId);
        setImages(updatedImages);
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
        alert('Immagine eliminata con successo!');
      } else {
        // Solo log di debug per errori 404, warning per altri errori
        if (response.status === 404) {
          if (process.env.NODE_ENV === 'development') {
            console.debug('Errore 404 nell\'eliminazione dell\'immagine:', response.status);
          }
          alert('Immagine non trovata.');
        } else {
          console.warn('Errore nell\'eliminazione dell\'immagine:', response.status);
          alert('Errore nell\'eliminazione dell\'immagine.');
        }
      }
    } catch (error) {
      console.warn('Errore nell\'eliminazione dell\'immagine:', error);
      alert('Errore di connessione nell\'eliminazione dell\'immagine.');
    }
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Immagini Progetto ({images.length})
        </h3>
        {canEdit && (
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">
              <Upload className="w-4 h-4" />
              {uploading ? 'Caricamento...' : 'Aggiungi Immagini'}
            </div>
          </label>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nessuna immagine caricata per questo progetto</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={`${SERVER_BASE_URL}${image.path}`}
                  alt={image.originalName}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => openImageModal(image)}
                />
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => openImageModal(image)}
                  className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                  title="Visualizza immagine"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
                    title="Elimina immagine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 truncate" title={image.originalName}>
                {image.originalName}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modale per visualizzare l'immagine ingrandita */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={`${SERVER_BASE_URL}${selectedImage.path}`}
              alt={selectedImage.originalName}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded-md">
              <p className="text-sm font-medium">{selectedImage.originalName}</p>
              <p className="text-xs opacity-75">
                Caricata il {new Date(selectedImage.uploadedAt).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectImages;