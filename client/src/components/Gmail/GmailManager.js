import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
  Search as SearchIcon,
  MarkEmailRead as ReadIcon,
  MarkEmailUnread as UnreadIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gmail-tabpanel-${index}`}
      aria-labelledby={`gmail-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GmailManager = () => {
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [gmailStatus, setGmailStatus] = useState({ authenticated: false, profile: null });
  const [messages, setMessages] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [composeDialog, setComposeDialog] = useState(false);
  const [messageDialog, setMessageDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Form states
  const [emailForm, setEmailForm] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    text: '',
    html: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');

  useEffect(() => {
    checkGmailStatus();
  }, []);

  useEffect(() => {
    if (gmailStatus.authenticated) {
      loadMessages();
      loadLabels();
    }
  }, [gmailStatus.authenticated]);

  const apiCall = async (url, options = {}) => {
    const response = await fetch(`http://192.168.1.2:3001${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Errore nella richiesta');
    }
    
    return response.json();
  };

  const checkGmailStatus = async () => {
    try {
      setLoading(true);
      const status = await apiCall('/api/gmail/status');
      setGmailStatus(status);
    } catch (error) {
      console.error('Errore verifica stato Gmail:', error);
      setGmailStatus({ authenticated: false, profile: null });
    } finally {
      setLoading(false);
    }
  };

  const authenticateGmail = async () => {
    try {
      setLoading(true);
      const { authUrl } = await apiCall('/api/gmail/auth');
      
      // Apri finestra popup per autenticazione
      const popup = window.open(authUrl, 'gmail-auth', 'width=500,height=600');
      
      // Controlla quando la finestra si chiude
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Ricontrolla lo stato dopo l'autenticazione
          setTimeout(() => {
            checkGmailStatus();
          }, 1000);
        }
      }, 1000);
    } catch (error) {
      setError('Errore nell\'autenticazione Gmail: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        maxResults: '20'
      });
      
      if (selectedLabel) {
        params.append('labelIds', selectedLabel);
      }
      
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      
      const messagesData = await apiCall(`/api/gmail/messages?${params}`);
      setMessages(messagesData);
    } catch (error) {
      setError('Errore nel caricamento dei messaggi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLabels = async () => {
    try {
      const labelsData = await apiCall('/api/gmail/labels');
      setLabels(labelsData);
    } catch (error) {
      console.error('Errore caricamento etichette:', error);
    }
  };

  const sendEmail = async () => {
    try {
      setLoading(true);
      await apiCall('/api/gmail/send', {
        method: 'POST',
        body: JSON.stringify(emailForm)
      });
      
      setSuccess('Email inviata con successo!');
      setComposeDialog(false);
      setEmailForm({ to: '', cc: '', bcc: '', subject: '', text: '', html: '' });
      loadMessages();
    } catch (error) {
      setError('Errore nell\'invio dell\'email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId, read = true) => {
    try {
      await apiCall(`/api/gmail/messages/${messageId}/read`, {
        method: 'POST',
        body: JSON.stringify({ read })
      });
      
      loadMessages();
      setSuccess(`Messaggio marcato come ${read ? 'letto' : 'non letto'}`);
    } catch (error) {
      setError('Errore nella modifica dello stato: ' + error.message);
    }
  };

  const trashMessage = async (messageId) => {
    try {
      await apiCall(`/api/gmail/messages/${messageId}/trash`, {
        method: 'POST'
      });
      
      loadMessages();
      setSuccess('Messaggio spostato nel cestino');
    } catch (error) {
      setError('Errore nello spostamento nel cestino: ' + error.message);
    }
  };

  const viewMessage = async (messageId) => {
    try {
      setLoading(true);
      const message = await apiCall(`/api/gmail/messages/${messageId}`);
      setSelectedMessage(message);
      setMessageDialog(true);
    } catch (error) {
      setError('Errore nel caricamento del messaggio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      setLoading(true);
      await apiCall('/api/gmail/disconnect', { method: 'POST' });
      setGmailStatus({ authenticated: false, profile: null });
      setMessages([]);
      setLabels([]);
      setSuccess('Gmail disconnesso con successo');
    } catch (error) {
      setError('Errore nella disconnessione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(parseInt(dateString)).toLocaleString('it-IT');
  };

  const getMessageSnippet = (message) => {
    return message.snippet || 'Nessuna anteprima disponibile';
  };

  const isUnread = (message) => {
    return message.labelIds && message.labelIds.includes('UNREAD');
  };

  if (!gmailStatus.authenticated) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" p={4}>
            <EmailIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Integrazione Gmail
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" mb={3}>
              Connetti il tuo account Gmail per gestire le email direttamente dal CRM
            </Typography>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={authenticateGmail}
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : 'Connetti Gmail'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <EmailIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Gmail - {gmailStatus.profile?.emailAddress}
              </Typography>
            </Box>
            <Box>
              <Button
                startIcon={<SendIcon />}
                variant="contained"
                onClick={() => setComposeDialog(true)}
                sx={{ mr: 1 }}
              >
                Componi
              </Button>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadMessages}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Aggiorna
              </Button>
              <Button
                startIcon={<SettingsIcon />}
                onClick={disconnectGmail}
                color="error"
              >
                Disconnetti
              </Button>
            </Box>
          </Box>

          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Posta in arrivo" />
            <Tab label="Etichette" />
            <Tab label="Ricerca" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box mb={2}>
              <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
                <InputLabel>Filtra per etichetta</InputLabel>
                <Select
                  value={selectedLabel}
                  onChange={(e) => {
                    setSelectedLabel(e.target.value);
                    setTimeout(loadMessages, 100);
                  }}
                  label="Filtra per etichetta"
                >
                  <MenuItem value="">Tutte</MenuItem>
                  {labels.map((label) => (
                    <MenuItem key={label.id} value={label.id}>
                      {label.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    button
                    onClick={() => viewMessage(message.id)}
                    sx={{
                      backgroundColor: isUnread(message) ? 'action.hover' : 'transparent',
                      fontWeight: isUnread(message) ? 'bold' : 'normal'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: isUnread(message) ? 'bold' : 'normal' }}
                          >
                            {message.from || 'Mittente sconosciuto'}
                          </Typography>
                          {isUnread(message) && (
                            <Chip
                              label="Nuovo"
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" noWrap>
                            {message.subject || 'Nessun oggetto'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getMessageSnippet(message)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {formatDate(message.internalDate)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(message.id, !isUnread(message));
                        }}
                        size="small"
                      >
                        {isUnread(message) ? <ReadIcon /> : <UnreadIcon />}
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          trashMessage(message.id);
                        }}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Etichette Gmail
            </Typography>
            <List>
              {labels.map((label) => (
                <ListItem key={label.id}>
                  <ListItemText
                    primary={label.name}
                    secondary={`ID: ${label.id}`}
                  />
                  <Chip
                    icon={<LabelIcon />}
                    label={label.type || 'user'}
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Cerca messaggi"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadMessages();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={loadMessages}>
                      <SearchIcon />
                    </IconButton>
                  )
                }}
                helperText="Esempi: from:example@gmail.com, subject:importante, has:attachment"
              />
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Dialog Composizione Email */}
      <Dialog
        open={composeDialog}
        onClose={() => setComposeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Componi Email</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="A"
                value={emailForm.to}
                onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CC"
                value={emailForm.cc}
                onChange={(e) => setEmailForm({ ...emailForm, cc: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="BCC"
                value={emailForm.bcc}
                onChange={(e) => setEmailForm({ ...emailForm, bcc: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Oggetto"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Messaggio"
                value={emailForm.text}
                onChange={(e) => setEmailForm({ ...emailForm, text: e.target.value })}
                multiline
                rows={8}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeDialog(false)}>Annulla</Button>
          <Button
            onClick={sendEmail}
            variant="contained"
            disabled={loading || !emailForm.to || !emailForm.subject || !emailForm.text}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Invia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Visualizzazione Messaggio */}
      <Dialog
        open={messageDialog}
        onClose={() => setMessageDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedMessage?.subject || 'Nessun oggetto'}
        </DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Da:</strong> {selectedMessage.from}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                <strong>A:</strong> {selectedMessage.to}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Data:</strong> {formatDate(selectedMessage.internalDate)}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedMessage.textPlain || selectedMessage.snippet || 'Contenuto non disponibile'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<ReplyIcon />}
            onClick={() => {
              setEmailForm({
                ...emailForm,
                to: selectedMessage?.from || '',
                subject: `Re: ${selectedMessage?.subject || ''}`,
                text: `\n\n--- Messaggio originale ---\n${selectedMessage?.textPlain || ''}`
              });
              setMessageDialog(false);
              setComposeDialog(true);
            }}
          >
            Rispondi
          </Button>
          <Button
            startIcon={<ForwardIcon />}
            onClick={() => {
              setEmailForm({
                ...emailForm,
                to: '',
                subject: `Fwd: ${selectedMessage?.subject || ''}`,
                text: `\n\n--- Messaggio inoltrato ---\nDa: ${selectedMessage?.from}\nOggetto: ${selectedMessage?.subject}\n\n${selectedMessage?.textPlain || ''}`
              });
              setMessageDialog(false);
              setComposeDialog(true);
            }}
          >
            Inoltra
          </Button>
          <Button onClick={() => setMessageDialog(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GmailManager;