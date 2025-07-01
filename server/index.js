const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware per logging delle richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware per gestire errori di parsing JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
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

// CLIENTI
app.get('/api/clients', (req, res) => {
  try {
    const clients = readData('clients');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero clienti' });
  }
});

app.get('/api/clients/:id', (req, res) => {
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

app.post('/api/clients', (req, res) => {
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

app.put('/api/clients/:id', (req, res) => {
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

app.delete('/api/clients/:id', (req, res) => {
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
app.get('/api/orders', (req, res) => {
  try {
    const orders = readData('orders');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero ordini' });
  }
});

app.get('/api/orders/:id', (req, res) => {
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

app.post('/api/orders', (req, res) => {
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

app.put('/api/orders/:id', (req, res) => {
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

app.delete('/api/orders/:id', (req, res) => {
  try {
    const orders = readData('orders');
    const filteredOrders = orders.filter(o => o.id !== req.params.id);
    if (orders.length === filteredOrders.length) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    writeData('orders', filteredOrders);
    res.json({ message: 'Ordine eliminato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione ordine' });
  }
});

// MATERIALI
app.get('/api/materials', (req, res) => {
  try {
    const materials = readData('materials');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero materiali' });
  }
});

app.get('/api/materials/:id', (req, res) => {
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

app.post('/api/materials', (req, res) => {
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

app.put('/api/materials/:id', (req, res) => {
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

app.delete('/api/materials/:id', (req, res) => {
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

// STATISTICHE MATERIALI
app.get('/api/materials/stats', (req, res) => {
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
app.get('/api/materials/categories', (req, res) => {
  try {
    const materials = readData('materials');
    const categories = [...new Set(materials.map(m => m.category || 'Altro').filter(Boolean))];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero categorie' });
  }
});

// FORNITORI MATERIALI
app.get('/api/materials/suppliers', (req, res) => {
  try {
    const materials = readData('materials');
    const suppliers = [...new Set(materials.map(m => m.supplier || 'Non specificato').filter(Boolean))];
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero fornitori' });
  }
});

// ANALYTICS
app.get('/api/analytics/daily/:date?', (req, res) => {
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

// RICERCA
app.get('/api/clients/search', (req, res) => {
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

app.get('/api/orders/search', (req, res) => {
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

// STATISTICHE CLIENTI
app.get('/api/clients/stats', (req, res) => {
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

// STATISTICHE ORDINI
app.get('/api/orders/stats', (req, res) => {
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

// Middleware per gestire errori 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// Avvio del server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CRM Marmeria API Server avviato su http://localhost:${PORT}`);
  console.log(`🌐 Accessibile dalla rete su http://0.0.0.0:${PORT}`);
  console.log(`📁 Dati salvati in: ${DATA_DIR}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📱 Supporta connessioni multiple da dispositivi diversi`);
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