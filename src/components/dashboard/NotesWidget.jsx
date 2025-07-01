import { useMemo, useState } from 'react';
import { AlignLeft, FilePlus, Trash2 } from 'lucide-react';
import Card from '../common/Card';
import Icon from '../common/Icon';
import ConfirmationModal from '../common/ConfirmationModal';
import useLocalStorage from '../../hooks/useLocalStorage';

const NotesWidget = () => {
  const { data: notes, addItem, deleteItem, isLoading } = useLocalStorage('dashboard_notes');
  const [newNote, setNewNote] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const sortedNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notes]);

  const displayed = showAll ? sortedNotes : sortedNotes.slice(0, 5);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    await addItem({ text: newNote });
    setNewNote('');
  };

  const confirmDelete = async () => {
    await deleteItem(noteToDelete);
    setNoteToDelete(null);
  };

  if (isLoading) return <Card title="Appunti Rapidi"><p className="text-gray-500 dark:text-gray-400">Caricamento …</p></Card>;

  return (
    <Card title="Appunti Rapidi" icon={<Icon name={AlignLeft} />}>
      <textarea
        rows={3}
        className="w-full p-2 border dark:bg-gray-700 rounded-md mb-2"
        placeholder="Scrivi un nuovo appunto."
        value={newNote}
        onChange={e => setNewNote(e.target.value)}
      />
      <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center mb-4">
        <Icon name={FilePlus} size={16} className="mr-1" /> Aggiungi
      </button>

      {displayed.map(n => (
        <div key={n.id} className="p-3 bg-yellow-50 dark:bg-yellow-800 rounded-md flex justify-between items-start group mb-2">
          <p className="text-sm break-words flex-1 mr-2">{n.text}</p>
          <button
            onClick={() => setNoteToDelete(n.id)}
            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
          >
            <Icon name={Trash2} size={16} />
          </button>
        </div>
      ))}

      {sortedNotes.length > 5 && (
        <button onClick={() => setShowAll(!showAll)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          {showAll ? 'Mostra meno' : `Mostra tutti (${sortedNotes.length})`}
        </button>
      )}

      <ConfirmationModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDelete}
        title="Conferma Eliminazione"
        message="Eliminare questo appunto?"
      />
    </Card>
  );
};

export default NotesWidget;
