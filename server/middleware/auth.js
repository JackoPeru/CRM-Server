const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Chiave segreta per JWT (in produzione dovrebbe essere in variabile d'ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'crm_marmeria_secret_key_2024';
const JWT_EXPIRES_IN = '24h';

// Funzione per leggere gli utenti
const readUsers = () => {
  const filePath = path.join(__dirname, '../data/users.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Errore lettura utenti:', error);
    return [];
  }
};

// Funzione per scrivere gli utenti
const writeUsers = (users) => {
  const filePath = path.join(__dirname, '../data/users.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Errore scrittura utenti:', error);
    return false;
  }
};

// Middleware per verificare il token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token di accesso richiesto' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token non valido' });
    }
    
    // Verifica che l'utente esista ancora e sia attivo
    const users = readUsers();
    const currentUser = users.find(u => u.id === user.id && u.isActive);
    
    if (!currentUser) {
      return res.status(403).json({ error: 'Utente non trovato o disattivato' });
    }
    
    req.user = currentUser;
    next();
  });
};

// Middleware per verificare i permessi
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticazione richiesta' });
    }
    
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Permessi insufficienti' });
    }
    
    next();
  };
};

// Middleware per verificare il ruolo
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticazione richiesta' });
    }
    
    if (!roleArray.includes(req.user.role)) {
      return res.status(403).json({ error: 'Ruolo insufficiente' });
    }
    
    next();
  };
};

// Funzione per generare token JWT
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Funzione per hash della password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Funzione per verificare la password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Funzione per trovare utente per username/email
const findUserByCredentials = (identifier) => {
  const users = readUsers();
  return users.find(user => 
    (user.username === identifier || user.email === identifier) && user.isActive
  );
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  generateToken,
  hashPassword,
  verifyPassword,
  findUserByCredentials,
  readUsers,
  writeUsers
};