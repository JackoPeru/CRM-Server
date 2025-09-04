import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  VStack,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  Input,
  Select,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Text,
  Spinner,
  useToast,
  Divider,
  Checkbox
} from '@chakra-ui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  StickyNoteIcon,
} from 'lucide-react';
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  fetchWorkers,
  fetchSharedWithMe,
  selectAllNotes,
  selectNotesLoading,
  selectNotesError,
  selectWorkers,
  selectSharedWithMe,
  selectSharedWithMeLoading,
} from '@/store';
import { useAuth } from '@/contexts/AuthContext';
// toast is now imported from @chakra-ui/react as useToast

const NotesWidget = () => {
  const dispatch = useDispatch();
  const notes = useSelector(selectAllNotes);
  const loading = useSelector(selectNotesLoading);
  const error = useSelector(selectNotesError);
  const workers = useSelector(selectWorkers);
  const sharedWithMe = useSelector(selectSharedWithMe);
  const sharedWithMeLoading = useSelector(selectSharedWithMeLoading);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();
  const [selectedNote, setSelectedNote] = useState(null);
  const [formData, setFormData] = useState({ content: '' });
  const [shareData, setShareData] = useState({ noteId: '', workerIds: [], message: '' });

  const { isAuthenticated, currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (isAuthenticated && token) {
      dispatch(fetchNotes());
      // Carica le note condivise solo per gli operai
      if (currentUser?.role === 'worker') {
        dispatch(fetchSharedWithMe());
      }
    }
  }, [dispatch, isAuthenticated, currentUser?.role]);

  const handleCreateNote = async () => {
    if (!formData.content.trim()) {
      toast({
        title: 'Errore',
        description: 'Il contenuto è obbligatorio',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Aggiungi un titolo di default o basato sul contenuto
      const noteData = {
        ...formData,
        title: formData.content.substring(0, 20) || 'Nuovo appunto',
      };
      await dispatch(createNote(noteData)).unwrap();
      setFormData({ content: '' });
      onCreateClose();
      toast({
        title: 'Successo',
        description: 'Appunto creato con successo',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore nella creazione dell\'appunto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditNote = async () => {
    if (!formData.content.trim()) {
      toast({
        title: 'Errore',
        description: 'Il contenuto è obbligatorio',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const noteData = {
        ...formData,
        title: formData.content.substring(0, 20) || 'Nuovo appunto',
      };
      await dispatch(updateNote({ 
        id: selectedNote.id, 
        updates: noteData 
      })).unwrap();
      setFormData({ content: '' });
      setSelectedNote(null);
      onEditClose();
      toast({
        title: 'Successo',
        description: 'Appunto aggiornato con successo',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore nell\'aggiornamento dell\'appunto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await dispatch(deleteNote(noteId)).unwrap();
      toast({
        title: 'Successo',
        description: 'Appunto eliminato con successo',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore nell\'eliminazione dell\'appunto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleShareNote = async () => {
    if (shareData.workerIds.length === 0) {
      toast({
        title: 'Errore',
        description: 'Seleziona almeno un operaio',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await dispatch(shareNote(shareData)).unwrap();
      setShareData({ noteId: '', workerIds: [], message: '' });
      onShareClose();
      toast({
        title: 'Successo',
        description: 'Appunto condiviso con successo',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: error || 'Errore nella condivisione dell\'appunto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openEditDialog = (note) => {
    setSelectedNote(note);
    setFormData({ content: note.content });
    onEditOpen();
  };

  const openShareDialog = (note) => {
    setShareData({ ...shareData, noteId: note.id });
    // Forza il caricamento degli operai quando si apre il modal
    dispatch(fetchWorkers());
    onShareOpen();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayedNotes = notes.slice(0, 3);
  const hasMoreNotes = notes.length > 3;

  if (error) {
    return (
      <Card h="full" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.600" }}>
        <CardHeader>
          <Heading size="md" display="flex" alignItems="center" gap={2}>
            <StickyNoteIcon className="h-5 w-5" />
            Appunti
          </Heading>
        </CardHeader>
        <CardBody>
          <Text textAlign="center" color="red.500" _dark={{ color: "red.300" }}>
            Errore nel caricamento degli appunti
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card h="full" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.600" }}>
      <CardHeader pb={3}>
        <HStack justify="space-between">
          <HStack spacing={2}>
            <StickyNoteIcon className="h-5 w-5" />
            <Heading size="md">Appunti</Heading>
            {notes.length > 0 && (
              <Badge colorScheme="gray" ml={2}>
                {notes.length}
              </Badge>
            )}
          </HStack>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={onCreateOpen}
            p={0}
            minW="32px"
            h="32px"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        {loading && notes.length === 0 ? (
          <VStack spacing={4} py={8}>
            <Spinner size="lg" />
            <Text color="gray.500" _dark={{ color: "gray.400" }}>Caricamento appunti...</Text>
          </VStack>
        ) : notes.length === 0 ? (
          <VStack spacing={4} py={8}>
            <StickyNoteIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <Text color="gray.500" _dark={{ color: "gray.400" }}>Nessun appunto presente</Text>
            <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>Clicca il pulsante + per aggiungerne uno</Text>
          </VStack>
        ) : (
          <Box maxH="300px" overflowY="auto" pr={4}>
            <VStack spacing={3}>
              {displayedNotes.map((note, index) => (
                <Box key={note.id} border="1px" borderColor="gray.200" borderRadius="lg" p={3} bg="white" _dark={{ bg: "gray.700", borderColor: "gray.600" }} w="full">
                  <HStack justify="space-between" align="start" mb={2}>

                    <HStack spacing={1} ml={2}>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => openEditDialog(note)}
                        minW="24px"
                        h="24px"
                        p={0}
                      >
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                      {currentUser?.role === 'admin' && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => openShareDialog(note)}
                          minW="24px"
                          h="24px"
                          p={0}
                        >
                          <ShareIcon className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                          setSelectedNote(note);
                          onDeleteOpen();
                        }}
                        minW="24px"
                        h="24px"
                        p={0}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </HStack>
                  </HStack>
                  <Text fontSize="xs" color="gray.600" _dark={{ color: "gray.300" }} noOfLines={2} mb={2}>
                    {note.content}
                  </Text>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
                      {formatDate(note.createdAt)}
                    </Text>
                    {note.priority && (
                      <Badge 
                        colorScheme={note.priority === 'high' ? 'red' : 
                                note.priority === 'medium' ? 'blue' : 'gray'}
                        fontSize="xs"
                      >
                        {note.priority === 'high' ? 'Alta' : 
                         note.priority === 'medium' ? 'Media' : 'Bassa'}
                      </Badge>
                    )}
                  </HStack>
                  {index < displayedNotes.length - 1 && <Divider mt={3} />}
                </Box>
              ))}
              {hasMoreNotes && (
                <Box textAlign="center" py={2}>
                  <Badge variant="outline" fontSize="xs">
                    +{notes.length - 3} altri appunti
                  </Badge>
                </Box>
              )}
            </VStack>
          </Box>
        )}
        
        {/* Sezione Note Condivise - Solo per operai */}
        {currentUser?.role === 'worker' && (
          <>
            <Divider my={4} />
            <Box>
              <HStack spacing={2} mb={3}>
                <ShareIcon className="h-4 w-4" />
                <Text fontSize="sm" fontWeight="medium" _dark={{ color: "gray.200" }}>Note Condivise</Text>
                {sharedWithMe.length > 0 && (
                  <Badge colorScheme="blue" fontSize="xs">
                    {sharedWithMe.length}
                  </Badge>
                )}
              </HStack>
              
              {sharedWithMeLoading ? (
                <VStack spacing={2} py={4}>
                  <Spinner size="sm" />
                  <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>Caricamento condivisioni...</Text>
                </VStack>
              ) : sharedWithMe.length === 0 ? (
                <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }} textAlign="center" py={4}>
                  Nessuna nota condivisa
                </Text>
              ) : (
                <Box maxH="200px" overflowY="auto">
                  <VStack spacing={2}>
                    {sharedWithMe.slice(0, 3).map((shared, index) => (
                      <Box key={shared.noteId} border="1px" borderColor="blue.200" borderRadius="md" p={2} bg="blue.50" _dark={{ bg: "blue.900", borderColor: "blue.600" }} w="full">
                        <Text fontSize="xs" color="gray.700" _dark={{ color: "gray.200" }} noOfLines={2} mb={1}>
                          {shared.note.content}
                        </Text>
                        {shared.message && (
                          <Box bg="white" _dark={{ bg: "gray.800", borderColor: "blue.500" }} border="1px" borderColor="blue.300" borderRadius="sm" p={2} mb={1}>
                            <Text fontSize="xs" color="blue.700" _dark={{ color: "blue.300" }} fontWeight="medium">Messaggio:</Text>
                            <Text fontSize="xs" color="blue.600" _dark={{ color: "blue.200" }}>{shared.message}</Text>
                          </Box>
                        )}
                        <HStack justify="space-between" mt={1}>
                          <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
                            Da: {shared.sharedByName}
                          </Text>
                          <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
                            {formatDate(shared.sharedAt)}
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                    {sharedWithMe.length > 3 && (
                      <Box textAlign="center" py={1}>
                        <Badge variant="outline" fontSize="xs">
                          +{sharedWithMe.length - 3} altre condivisioni
                        </Badge>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}
            </Box>
          </>
        )}
      </CardBody>

      {/* Modal per creare appunto */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nuovo Appunto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>

              <Textarea
                placeholder="Contenuto dell'appunto"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
              />
              {isAdmin && (
                <Select
                  placeholder="Seleziona priorità"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Bassa</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </Select>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button variant="outline" onClick={onCreateClose}>
                Annulla
              </Button>
              <Button colorScheme="blue" onClick={handleCreateNote} isLoading={loading}>
                Crea Appunto
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal per modificare appunto */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifica Appunto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>

              <Textarea
                placeholder="Contenuto dell'appunto"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button variant="outline" onClick={onEditClose}>
                Annulla
              </Button>
              <Button colorScheme="blue" onClick={handleEditNote} isLoading={loading}>
                Salva Modifiche
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal per condividere appunto */}
      <Modal isOpen={isShareOpen} onClose={onShareClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Condividi Appunto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box w="full">
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Seleziona operai
                </Text>
                <VStack as="fieldset" align="start" w="full" border="1px" borderColor="gray.200" borderRadius="md" p={3}>
                  <Text as="legend" fontWeight="medium" mb={2}>Seleziona operai</Text>
                  <Checkbox
                    isChecked={shareData.workerIds.length === workers.length}
                    onChange={(e) => {
                      const allWorkerIds = workers.map(w => w.id);
                      setShareData({ 
                        ...shareData, 
                        workerIds: e.target.checked ? allWorkerIds : [] 
                      });
                    }}
                  >
                    Tutti gli operai
                  </Checkbox>
                  <Divider my={2} />
                  <VStack align="start" spacing={1} maxH="150px" overflowY="auto" w="full">
                    {workers.map((worker) => (
                      <Checkbox
                        key={worker.id}
                        isChecked={shareData.workerIds.includes(worker.id)}
                        onChange={(e) => {
                          const workerId = worker.id;
                          setShareData(prev => ({
                            ...prev,
                            workerIds: e.target.checked
                              ? [...prev.workerIds, workerId]
                              : prev.workerIds.filter(id => id !== workerId)
                          }));
                        }}
                      >
                        {worker.name}
                      </Checkbox>
                    ))}
                  </VStack>
                </VStack>
              </Box>
              <Box w="full">
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Operai selezionati
                </Text>
                <Box minH="40px" p={2} border="1px" borderColor="gray.200" borderRadius="md">
                  {shareData.workerIds.length === 0 ? (
                    <Text color="gray.500" fontSize="sm">Nessun operaio selezionato</Text>
                  ) : (
                    <HStack spacing={2} wrap="wrap">
                      {shareData.workerIds.map((workerId) => {
                        const worker = workers.find(w => w.id === workerId);
                        return worker ? (
                          <Badge key={workerId} colorScheme="blue" fontSize="xs">
                            {worker.name}
                            <Button
                              size="xs"
                              variant="ghost"
                              ml={1}
                              p={0}
                              minW="auto"
                              h="auto"
                              color="red.500"
                              _hover={{ color: "red.700" }}
                              onClick={() => setShareData({
                                ...shareData,
                                workerIds: shareData.workerIds.filter(id => id !== workerId)
                              })}
                            >
                              ×
                            </Button>
                          </Badge>
                        ) : null;
                      })}
                    </HStack>
                  )}
                </Box>
              </Box>
              <Textarea
                placeholder="Messaggio aggiuntivo (opzionale)"
                value={shareData.message}
                onChange={(e) => setShareData({ ...shareData, message: e.target.value })}
                rows={3}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button variant="outline" onClick={onShareClose}>
                Annulla
              </Button>
              <Button colorScheme="blue" onClick={handleShareNote} isLoading={loading}>
                Condividi
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AlertDialog per eliminare appunto */}
      <AlertDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        leastDestructiveRef={undefined}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Elimina Appunto
            </AlertDialogHeader>
            <AlertDialogBody>
              Sei sicuro di voler eliminare questo appunto? Questa azione non può essere annullata.
            </AlertDialogBody>
            <AlertDialogFooter>
              <HStack spacing={2}>
                <Button onClick={onDeleteClose}>
                  Annulla
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    if (selectedNote) {
                      handleDeleteNote(selectedNote.id);
                      onDeleteClose();
                    }
                  }}
                >
                  Elimina
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Card>
  );
};

export default NotesWidget;