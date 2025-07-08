require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  authenticateToken,
  requirePermission,
  requireRole,
  generateToken,
  hashPassword,
  verifyPassword,
  findUserByCredentials,
  readUsers,
  writeUsers
} = require('./middleware/auth');


const app = express();
const PORT = process.env.PORT || 3001; // Porta backend

// Middleware
app.use(cors({
  origin: '*', // Accetta richieste da qualsiasi origine
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Methods']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurazione di Multer per l'upload delle immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    
    // Determina la directory in base al tipo di endpoint
    if (req.params.projectId) {
      // Endpoint progetti
      const projectId = req.params.projectId;
      uploadDir = path.join(__dirname, 'uploads', 'projects', projectId);
    } else if (req.params.orderId) {
      // Endpoint ordini
      const orderId = req.params.orderId;
      uploadDir = path.join(__dirname, 'uploads', 'orders', orderId);
    } else {
      // Fallback generico
      uploadDir = path.join(__dirname, 'uploads', 'general');
    }
    
    // Crea la directory se non esiste
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Genera un nome file unico con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo le immagini sono accettate!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite di 5MB
});

// Servi i file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware per logging delle richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Directory per i dati
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Funzioni helper per gestire i dati
const readData = (collection) => {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Errore lettura ${collection}:`, error);
    return [];
  }
};

const writeData = (collection, data) => {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Errore scrittura ${collection}:`, error);
    return false;
  }
};

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Routes di base
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'CRM Marmeria API Server'
  });
});

// AUTENTICAZIONE
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password richiesti' });
    }
    
    const user = findUserByCredentials(username);
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    // Verifica password hashata con bcrypt
    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // Con JWT stateless, il logout è gestito lato client
  res.json({ message: 'Logout effettuato con successo' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

// Aggiornamento profilo utente
app.patch('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const { username, name, email, avatar } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    // Aggiorna solo i campi forniti
    if (username) {
      users[userIndex].username = username;
      // Sincronizza anche il campo name con username per coerenza
      users[userIndex].name = username;
    }
    if (name) {
      users[userIndex].name = name;
      // Sincronizza anche il campo username con name per coerenza
      users[userIndex].username = name;
    }
    if (email) users[userIndex].email = email;
    if (avatar) users[userIndex].avatar = avatar;
    
    users[userIndex].updatedAt = new Date().toISOString();
    writeUsers(users);
    
    // Restituisci l'utente aggiornato (senza password)
    const { password, ...updatedUser } = users[userIndex];
    
    console.log('✅ Profilo utente aggiornato:', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('❌ Errore aggiornamento profilo:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del profilo' });
  }
});

// GESTIONE UTENTI (solo admin)
app.get('/api/users', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const users = readUsers();
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero utenti' });
  }
});

app.post('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, permissions } = req.body;
    
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Tutti i campi sono richiesti' });
    }
    
    const users = readUsers();
    
    // Verifica che username ed email siano unici
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username o email già esistenti' });
    }
    
    const hashedPassword = await hashPassword(password);
    
    const newUser = {
      id: generateId(),
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: true,
      permissions: permissions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeUsers(users);
    
    // Rimuovi la password dalla risposta
    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Errore creazione utente:', error);
    res.status(500).json({ error: 'Errore nella creazione utente' });
  }
});

// CLIENTI
app.get('/api/clients', authenticateToken, requirePermission('clients.view'), (req, res) => {
  try {
    const clients = readData('clients');
    console.log('🔍 [API] /api/clients - Dati clienti restituiti:', clients.length, 'clienti');
    console.log('🔍 [API] /api/clients - Primi 2 clienti:', clients.slice(0, 2));
    res.json(clients);
  } catch (error) {
    console.error('❌ [API] /api/clients - Errore:', error);
    res.status(500).json({ error: 'Errore nel recupero clienti' });
  }
});

// STATISTICHE CLIENTI
app.get('/api/clients/stats', authenticateToken, requirePermission('clients.view'), (req, res) => {
  try {
    const clients = readData('clients');
    const stats = {
      total: clients.length,
      byType: clients.reduce((acc, client) => {
        const type = client.type || 'standard';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      recentlyAdded: clients.filter(client => {
        const createdDate = new Date(client.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel calcolo statistiche clienti' });
  }
});

app.get('/api/clients/:id', authenticateToken, requirePermission('clients.view'), (req, res) => {
  try {
    const clients = readData('clients');
    const client = clients.find(c => c.id === req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero cliente' });
  }
});

app.post('/api/clients', authenticateToken, requirePermission('clients.create'), (req, res) => {
  try {
    const clients = readData('clients');
    const newClient = {
      ...req.body,
      id: req.body.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    clients.push(newClient);
    writeData('clients', clients);
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione cliente' });
  }
});

app.put('/api/clients/:id', authenticateToken, requirePermission('clients.edit'), (req, res) => {
  try {
    const clients = readData('clients');
    const index = clients.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }
    clients[index] = {
      ...clients[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeData('clients', clients);
    res.json(clients[index]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento cliente' });
  }
});

app.delete('/api/clients/:id', authenticateToken, requirePermission('clients.delete'), (req, res) => {
  try {
    const clients = readData('clients');
    const filteredClients = clients.filter(c => c.id !== req.params.id);
    if (clients.length === filteredClients.length) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }
    writeData('clients', filteredClients);
    res.json({ message: 'Cliente eliminato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione cliente' });
  }
});

// ORDINI
app.get('/api/orders', authenticateToken, requirePermission('orders.view'), (req, res) => {
  try {
    const orders = readData('orders');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero ordini' });
  }
});

// STATISTICHE ORDINI
app.get('/api/orders/stats', authenticateToken, requirePermission('orders.view'), (req, res) => {
  try {
    const orders = readData('orders');
    const stats = {
      total: orders.length,
      byStatus: orders.reduce((acc, order) => {
        const status = order.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length : 0,
      recentOrders: orders.filter(order => {
        const createdDate = new Date(order.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length,
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      completedOrders: orders.filter(order => order.status === 'completed').length
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel calcolo statistiche ordini' });
  }
});

app.get('/api/orders/:id', authenticateToken, requirePermission('orders.view'), (req, res) => {
  try {
    const orders = readData('orders');
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero ordine' });
  }
});

app.post('/api/orders', authenticateToken, requirePermission('orders.create'), (req, res) => {
  try {
    const orders = readData('orders');
    const newOrder = {
      ...req.body,
      id: req.body.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.push(newOrder);
    writeData('orders', orders);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione ordine' });
  }
});

app.put('/api/orders/:id', authenticateToken, requirePermission('orders.edit'), (req, res) => {
  try {
    const orders = readData('orders');
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    orders[index] = {
      ...orders[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeData('orders', orders);
    res.json(orders[index]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento ordine' });
  }
});

app.delete('/api/orders/:id', authenticateToken, requirePermission('orders.delete'), (req, res) => {
  try {
    const orderId = req.params.id;
    const orders = readData('orders');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    // Elimina le immagini associate se esistono
    if (order.images && order.images.length > 0) {
      order.images.forEach(image => {
        const filePath = path.join(__dirname, image.path.replace('/uploads', 'uploads'));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Immagine ordine eliminata: ${filePath}`);
          } catch (err) {
            console.error(`Errore nell'eliminazione dell'immagine ${filePath}:`, err);
          }
        }
      });
    }
    
    // Elimina la directory dell'ordine se esiste
    const orderDir = path.join(__dirname, 'uploads', 'orders', orderId);
    if (fs.existsSync(orderDir)) {
      try {
        fs.rmSync(orderDir, { recursive: true, force: true });
        console.log(`Directory ordine eliminata: ${orderDir}`);
      } catch (err) {
        console.error(`Errore nell'eliminazione della directory ${orderDir}:`, err);
      }
    }
    
    // Rimuovi l'ordine dal database
    const filteredOrders = orders.filter(o => o.id !== orderId);
    writeData('orders', filteredOrders);
    
    res.json({ message: 'Ordine e immagini associate eliminate con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione ordine:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione ordine' });
  }
});

// Aggiorna lo stato di un ordine
app.patch('/api/orders/:id/status', authenticateToken, requirePermission('orders.edit'), (req, res) => {
  try {
    const { status } = req.body;
    console.log('Aggiornamento stato ordine:', { orderId: req.params.id, status, user: req.user });
    
    if (!status) {
      return res.status(400).json({ error: 'Lo stato dell\'ordine è richiesto' });
    }
    
    const orders = readData('orders');
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    const updatedOrder = {
      ...orders[index],
      status,
      updatedAt: new Date().toISOString()
    };
    
    // Assegnazione automatica operaio quando lo stato passa a "In Corso"
    if (status === 'In Corso' && !updatedOrder.assignedWorker) {
      const currentUser = req.user; // Dati dell'utente autenticato dal middleware
      console.log('Assegnazione automatica operaio:', currentUser);
      
      if (currentUser) {
        updatedOrder.assignedWorker = {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.username, // Usa lo username come nome visualizzato
          assignedAt: new Date().toISOString()
        };
        console.log('Operaio assegnato:', updatedOrder.assignedWorker);
      } else {
        console.log('Errore: req.user è undefined');
      }
    }
    
    // Se lo stato non è più "In Corso", rimuovi l'assegnazione
    if (status !== 'In Corso' && updatedOrder.assignedWorker) {
      updatedOrder.assignedWorker = null;
      console.log('Assegnazione operaio rimossa');
    }
    
    orders[index] = updatedOrder;
    writeData('orders', orders);
    res.json(orders[index]);
  } catch (error) {
    console.error('Errore nell\'aggiornamento stato ordine:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento stato ordine' });
  }
});

// MATERIALI
app.get('/api/materials', authenticateToken, requirePermission('materials.view'), (req, res) => {
  try {
    const materials = readData('materials');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero materiali' });
  }
});

// STATISTICHE MATERIALI
app.get('/api/materials/stats', authenticateToken, requirePermission('materials.view'), (req, res) => {
  try {
    const materials = readData('materials');
    const stats = {
      total: materials.length,
      byCategory: materials.reduce((acc, material) => {
        const category = material.category || 'Altro';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
      bySupplier: materials.reduce((acc, material) => {
        const supplier = material.supplier || 'Non specificato';
        acc[supplier] = (acc[supplier] || 0) + 1;
        return acc;
      }, {}),
      lowStock: materials.filter(material => (material.quantity || 0) < (material.minQuantity || 10)).length,
      totalValue: materials.reduce((sum, material) => sum + ((material.price || 0) * (material.quantity || 0)), 0)
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel calcolo statistiche materiali' });
  }
});

// CATEGORIE MATERIALI
app.get('/api/materials/categories', authenticateToken, requirePermission('materials.view'), (req, res) => {
  try {
    const materials = readData('materials');
    const categories = [...new Set(materials.map(m => m.category || 'Altro').filter(Boolean))];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero categorie' });
  }
});

// FORNITORI MATERIALI
app.get('/api/materials/suppliers', authenticateToken, requirePermission('materials.view'), (req, res) => {
  try {
    const materials = readData('materials');
    const suppliers = [...new Set(materials.map(m => m.supplier || 'Non specificato').filter(Boolean))];
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero fornitori' });
  }
});

app.get('/api/materials/:id', authenticateToken, requirePermission('materials.view'), (req, res) => {
  try {
    const materials = readData('materials');
    const material = materials.find(m => m.id === req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Materiale non trovato' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero materiale' });
  }
});

app.post('/api/materials', authenticateToken, requirePermission('materials.create'), (req, res) => {
  try {
    const materials = readData('materials');
    const newMaterial = {
      ...req.body,
      id: req.body.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    materials.push(newMaterial);
    writeData('materials', materials);
    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione materiale' });
  }
});

app.put('/api/materials/:id', authenticateToken, requirePermission('materials.edit'), (req, res) => {
  try {
    const materials = readData('materials');
    const index = materials.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Materiale non trovato' });
    }
    materials[index] = {
      ...materials[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeData('materials', materials);
    res.json(materials[index]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento materiale' });
  }
});

app.delete('/api/materials/:id', authenticateToken, requirePermission('materials.delete'), (req, res) => {
  try {
    const materials = readData('materials');
    const filteredMaterials = materials.filter(m => m.id !== req.params.id);
    if (materials.length === filteredMaterials.length) {
      return res.status(404).json({ error: 'Materiale non trovato' });
    }
    writeData('materials', filteredMaterials);
    res.json({ message: 'Materiale eliminato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione materiale' });
  }
});



// GESTIONE IMMAGINI ORDINI

// Upload di immagini per un ordine
app.post('/api/orders/:orderId/images', authenticateToken, requirePermission('orders.edit'), upload.array('images', 10), (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Verifica che l'ordine esista
    const orders = readData('orders');
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    // Prepara le informazioni sui file caricati
    const uploadedFiles = req.files.map(file => ({
      id: generateId(),
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/orders/${orderId}/${file.filename}`,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));
    
    // Aggiorna l'ordine con le nuove immagini
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (!orders[orderIndex].images) {
      orders[orderIndex].images = [];
    }
    orders[orderIndex].images.push(...uploadedFiles);
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    writeData('orders', orders);
    
    res.json({
      message: 'Immagini caricate con successo',
      images: uploadedFiles,
      order: orders[orderIndex]
    });
  } catch (error) {
    console.error('Errore nell\'upload delle immagini ordine:', error);
    res.status(500).json({ error: 'Errore nell\'upload delle immagini' });
  }
});

// Ottieni le immagini di un ordine
app.get('/api/orders/:orderId/images', authenticateToken, requirePermission('orders.view'), (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orders = readData('orders');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    res.json(order.images || []);
  } catch (error) {
    console.error('Errore nel recupero delle immagini ordine:', error);
    res.status(500).json({ error: 'Errore nel recupero delle immagini' });
  }
});

// Elimina un'immagine di un ordine
app.delete('/api/orders/:orderId/images/:imageId', authenticateToken, requirePermission('orders.edit'), (req, res) => {
  try {
    const { orderId, imageId } = req.params;
    const orders = readData('orders');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    const order = orders[orderIndex];
    if (!order.images) {
      return res.status(404).json({ error: 'Immagine non trovata' });
    }
    
    const imageIndex = order.images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Immagine non trovata' });
    }
    
    const image = order.images[imageIndex];
    
    // Elimina il file fisico
    const filePath = path.join(__dirname, image.path.replace('/uploads', 'uploads'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Rimuovi l'immagine dall'array
    order.images.splice(imageIndex, 1);
    order.updatedAt = new Date().toISOString();
    
    writeData('orders', orders);
    
    res.json({ message: 'Immagine eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'immagine ordine:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'immagine' });
  }
});

// PROGETTI
app.get('/api/projects', authenticateToken, requirePermission('projects.view'), (req, res) => {
  try {
    const projects = readData('projects');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero progetti' });
  }
});

app.get('/api/projects/:id', authenticateToken, requirePermission('projects.view'), (req, res) => {
  try {
    const projects = readData('projects');
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero progetto' });
  }
});

app.post('/api/projects', authenticateToken, requirePermission('projects.create'), (req, res) => {
  try {
    const projects = readData('projects');
    const newProject = {
      ...req.body,
      id: req.body.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(newProject);
    writeData('projects', projects);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione progetto' });
  }
});

app.put('/api/projects/:id', authenticateToken, requirePermission('projects.edit'), (req, res) => {
  try {
    const projects = readData('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    projects[index] = {
      ...projects[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeData('projects', projects);
    res.json(projects[index]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento progetto' });
  }
});

app.delete('/api/projects/:id', authenticateToken, requirePermission('projects.delete'), (req, res) => {
  try {
    const projectId = req.params.id;
    const projects = readData('projects');
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    
    const project = projects[projectIndex];
    
    // Elimina tutte le immagini associate al progetto
    if (project.images && project.images.length > 0) {
      project.images.forEach(image => {
        const filePath = path.join(__dirname, image.path.replace('/uploads', 'uploads'));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Immagine eliminata: ${filePath}`);
          } catch (err) {
            console.error(`Errore nell'eliminazione dell'immagine ${filePath}:`, err);
          }
        }
      });
    }
    
    // Elimina la directory del progetto se esiste
    const projectDir = path.join(__dirname, 'uploads', 'projects', projectId);
    if (fs.existsSync(projectDir)) {
      try {
        fs.rmSync(projectDir, { recursive: true, force: true });
        console.log(`Directory progetto eliminata: ${projectDir}`);
      } catch (err) {
        console.error(`Errore nell'eliminazione della directory ${projectDir}:`, err);
      }
    }
    
    // Rimuovi il progetto dal database
    const filteredProjects = projects.filter(p => p.id !== projectId);
    writeData('projects', filteredProjects);
    
    res.json({ message: 'Progetto e immagini associate eliminate con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione progetto:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione progetto' });
  }
});

// Aggiorna lo stato di un progetto
app.patch('/api/projects/:id', authenticateToken, requirePermission('projects.edit'), (req, res) => {
  try {
    const projects = readData('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    
    projects[index] = {
      ...projects[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    writeData('projects', projects);
    res.json(projects[index]);
  } catch (error) {
    console.error('Errore nell\'aggiornamento progetto:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento progetto' });
  }
});

// Aggiorna solo lo stato di un progetto
app.patch('/api/projects/:id/status', authenticateToken, requirePermission('projects.edit'), (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Lo stato del progetto è richiesto' });
    }
    
    const projects = readData('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    
    const updatedProject = {
      ...projects[index],
      status,
      updatedAt: new Date().toISOString()
    };
    
    // Assegnazione automatica operaio quando lo stato passa a "In Corso"
    if (status === 'In Corso' && !updatedProject.assignedWorker) {
      const currentUser = req.user; // Dati dell'utente autenticato dal middleware
      updatedProject.assignedWorker = {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.username, // Usa lo username come nome visualizzato
        assignedAt: new Date().toISOString()
      };
    }
    
    // Se lo stato non è più "In Corso", rimuovi l'assegnazione
    if (status !== 'In Corso' && updatedProject.assignedWorker) {
      updatedProject.assignedWorker = null;
    }
    
    projects[index] = updatedProject;
    writeData('projects', projects);
    res.json(projects[index]);
  } catch (error) {
    console.error('Errore nell\'aggiornamento stato progetto:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento stato progetto' });
  }
});

// GESTIONE IMMAGINI PROGETTI

// Upload di immagini per un progetto
app.post('/api/projects/:projectId/images', authenticateToken, requirePermission('projects.edit'), upload.array('images', 10), (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    // Verifica che il progetto esista
    const projects = readData('projects');
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    
    // Prepara le informazioni sui file caricati
    const uploadedFiles = req.files.map(file => ({
      id: generateId(),
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/projects/${projectId}/${file.filename}`,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));
    
    // Aggiorna il progetto con le nuove immagini
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (!projects[projectIndex].images) {
      projects[projectIndex].images = [];
    }
    projects[projectIndex].images.push(...uploadedFiles);
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    writeData('projects', projects);
    
    res.json({
      message: 'Immagini caricate con successo',
      images: uploadedFiles,
      project: projects[projectIndex]
    });
  } catch (error) {
    console.error('Errore nell\'upload delle immagini:', error);
    res.status(500).json({ error: 'Errore nell\'upload delle immagini' });
  }
});

// Ottieni le immagini di un progetto
app.get('/api/projects/:projectId/images', authenticateToken, requirePermission('projects.view'), (req, res) => {
  try {
    const projectId = req.params.projectId;
    const projects = readData('projects');
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    
    res.json(project.images || []);
  } catch (error) {
    console.error('Errore nel recupero delle immagini:', error);
    res.status(500).json({ error: 'Errore nel recupero delle immagini' });
  }
});

// Elimina un'immagine di un progetto
app.delete('/api/projects/:projectId/images/:imageId', authenticateToken, requirePermission('projects.edit'), (req, res) => {
  try {
    const { projectId, imageId } = req.params;
    const projects = readData('projects');
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }
    
    const project = projects[projectIndex];
    if (!project.images) {
      return res.status(404).json({ error: 'Immagine non trovata' });
    }
    
    const imageIndex = project.images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Immagine non trovata' });
    }
    
    const image = project.images[imageIndex];
    
    // Elimina il file fisico
    const filePath = path.join(__dirname, image.path.replace('/uploads', 'uploads'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Rimuovi l'immagine dall'array
    project.images.splice(imageIndex, 1);
    project.updatedAt = new Date().toISOString();
    
    writeData('projects', projects);
    
    res.json({ message: 'Immagine eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'immagine:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'immagine' });
  }
});

// PREVENTIVI
app.get('/api/quotes', authenticateToken, requirePermission('quotes.view'), (req, res) => {
  try {
    const quotes = readData('quotes');
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero preventivi' });
  }
});

app.get('/api/quotes/:id', authenticateToken, requirePermission('quotes.view'), (req, res) => {
  try {
    const quotes = readData('quotes');
    const quote = quotes.find(q => q.id === req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Preventivo non trovato' });
    }
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero preventivo' });
  }
});

app.post('/api/quotes', authenticateToken, requirePermission('quotes.create'), (req, res) => {
  try {
    const quotes = readData('quotes');
    const newQuote = {
      ...req.body,
      id: req.body.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    quotes.push(newQuote);
    writeData('quotes', quotes);
    res.status(201).json(newQuote);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione preventivo' });
  }
});

app.put('/api/quotes/:id', authenticateToken, requirePermission('quotes.edit'), (req, res) => {
  try {
    const quotes = readData('quotes');
    const index = quotes.findIndex(q => q.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Preventivo non trovato' });
    }
    quotes[index] = {
      ...quotes[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeData('quotes', quotes);
    res.json(quotes[index]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento preventivo' });
  }
});

app.delete('/api/quotes/:id', authenticateToken, requirePermission('quotes.delete'), (req, res) => {
  try {
    const quotes = readData('quotes');
    const filteredQuotes = quotes.filter(q => q.id !== req.params.id);
    if (quotes.length === filteredQuotes.length) {
      return res.status(404).json({ error: 'Preventivo non trovato' });
    }
    writeData('quotes', filteredQuotes);
    res.json({ message: 'Preventivo eliminato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione preventivo' });
  }
});

// FATTURE
app.get('/api/invoices', authenticateToken, requirePermission('invoices.view'), (req, res) => {
  try {
    const invoices = readData('invoices');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero fatture' });
  }
});

app.get('/api/invoices/:id', authenticateToken, requirePermission('invoices.view'), (req, res) => {
  try {
    const invoices = readData('invoices');
    const invoice = invoices.find(i => i.id === req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Fattura non trovata' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero fattura' });
  }
});

app.post('/api/invoices', authenticateToken, requirePermission('invoices.create'), (req, res) => {
  try {
    const invoices = readData('invoices');
    const newInvoice = {
      ...req.body,
      id: req.body.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    invoices.push(newInvoice);
    writeData('invoices', invoices);
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione fattura' });
  }
});

app.put('/api/invoices/:id', authenticateToken, requirePermission('invoices.edit'), (req, res) => {
  try {
    const invoices = readData('invoices');
    const index = invoices.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Fattura non trovata' });
    }
    invoices[index] = {
      ...invoices[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeData('invoices', invoices);
    res.json(invoices[index]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento fattura' });
  }
});

app.delete('/api/invoices/:id', authenticateToken, requirePermission('invoices.delete'), (req, res) => {
  try {
    const invoices = readData('invoices');
    const filteredInvoices = invoices.filter(i => i.id !== req.params.id);
    if (invoices.length === filteredInvoices.length) {
      return res.status(404).json({ error: 'Fattura non trovata' });
    }
    writeData('invoices', filteredInvoices);
    res.json({ message: 'Fattura eliminata con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione fattura' });
  }
});

// ANALYTICS
app.get('/api/analytics/daily/:date?', authenticateToken, requirePermission('dashboard.view'), (req, res) => {
  try {
    const targetDate = req.params.date || new Date().toISOString().split('T')[0];
    const orders = readData('orders');
    const clients = readData('clients');
    
    // Calcola statistiche per la data specificata
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return orderDate === targetDate;
    });
    
    const summary = {
      date: targetDate,
      totalOrders: dayOrders.length,
      totalRevenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      newClients: clients.filter(client => {
        const clientDate = new Date(client.createdAt).toISOString().split('T')[0];
        return clientDate === targetDate;
      }).length,
      pendingOrders: dayOrders.filter(order => order.status === 'pending').length,
      completedOrders: dayOrders.filter(order => order.status === 'completed').length
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel calcolo analytics' });
  }
});

app.get('/api/analytics/dashboard', authenticateToken, requirePermission('dashboard.view'), (req, res) => {
  try {
    const orders = readData('orders');
    const clients = readData('clients');
    const materials = readData('materials');
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return orderDate === today;
    });
    
    const stats = {
      totalOrders: orders.length,
      totalClients: clients.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.amount || 0), 0),
      todayOrders: todayOrders.length,
      pendingOrders: orders.filter(order => order.status === 'In Attesa').length,
      inProgressOrders: orders.filter(order => order.status === 'In Lavorazione').length,
      completedOrders: orders.filter(order => order.status === 'Completato').length,
      lowStockMaterials: materials.filter(material => material.quantity < 10).length,
      recentClients: clients.filter(client => {
        const createdDate = new Date(client.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero statistiche dashboard' });
  }
});

app.get('/api/analytics/trends', authenticateToken, requirePermission('dashboard.view'), (req, res) => {
  try {
    const { metric, period, startDate, endDate } = req.query;
    const orders = readData('orders');
    const clients = readData('clients');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const trendData = [];
    
    // Genera dati di trend basati sul periodo richiesto
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      let value = 0;
      
      switch (metric) {
        case 'orders':
          value = orders.filter(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === dateStr;
          }).length;
          break;
        case 'revenue':
          value = orders.filter(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === dateStr && order.status === 'Completato';
          }).reduce((sum, order) => sum + (order.amount || 0), 0);
          break;
        case 'clients':
          value = clients.filter(client => {
            const clientDate = new Date(client.createdAt).toISOString().split('T')[0];
            return clientDate === dateStr;
          }).length;
          break;
        default:
          value = 0;
      }
      
      trendData.push({
        date: dateStr,
        value,
        label: dateStr
      });
      
      // Incrementa la data in base al periodo
      if (period === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }
    
    res.json(trendData);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dati trend' });
  }
});

// RICERCA
app.get('/api/clients/search', authenticateToken, requirePermission('clients.view'), (req, res) => {
  try {
    const { q } = req.query;
    const clients = readData('clients');
    const filtered = clients.filter(client => 
      client.name?.toLowerCase().includes(q?.toLowerCase() || '') ||
      client.email?.toLowerCase().includes(q?.toLowerCase() || '') ||
      client.phone?.includes(q || '')
    );
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella ricerca clienti' });
  }
});

app.get('/api/orders/search', authenticateToken, requirePermission('orders.view'), (req, res) => {
  try {
    const { q } = req.query;
    const orders = readData('orders');
    const filtered = orders.filter(order => 
      order.title?.toLowerCase().includes(q?.toLowerCase() || '') ||
      order.description?.toLowerCase().includes(q?.toLowerCase() || '') ||
      order.clientName?.toLowerCase().includes(q?.toLowerCase() || '')
    );
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella ricerca ordini' });
  }
});

app.get('/api/orders/by-status/:status', authenticateToken, requirePermission('orders.view'), (req, res) => {
  try {
    const { status } = req.params;
    const orders = readData('orders');
    const filtered = orders.filter(order => order.status === status);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero ordini per stato' });
  }
});





// Middleware per gestire errori di parsing JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Errore parsing JSON:', err.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// Middleware per gestire errori 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// Avvio del server (temporaneamente su HTTP per sviluppo)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CRM Marmeria API Server avviato su http://0.0.0.0:${PORT}`);
  console.log(`🌐 Accessibile dalla rete su http://192.168.1.2:${PORT}`);
  console.log(`📁 Dati salvati in: ${DATA_DIR}`);
  console.log(`🔗 Health check: http://192.168.1.2:${PORT}/api/health`);
  console.log(`📱 Supporta connessioni multiple da dispositivi diversi`);
  console.log(`⚠️  HTTPS temporaneamente disabilitato per problemi di certificati`);
});

// Configurazione per gestire connessioni multiple
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.maxConnections = 1000;

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM ricevuto, chiusura graceful del server...');
  server.close(() => {
    console.log('Server chiuso.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT ricevuto, chiusura graceful del server...');
  server.close(() => {
    console.log('Server chiuso.');
    process.exit(0);
  });
});

module.exports = app;