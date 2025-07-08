const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Funzione per hash della password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Funzione principale
const fixPasswords = async () => {
  try {
    console.log('Fixing user passwords...');
    
    // Hash delle password corrette
    const adminPasswordHash = await hashPassword('admin123');
    const operaioPasswordHash = await hashPassword('operaio123');
    
    console.log('Admin password hash:', adminPasswordHash);
    console.log('Operaio password hash:', operaioPasswordHash);
    
    // Leggi il file utenti
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    // Aggiorna le password
    users.forEach(user => {
      if (user.username === 'admin') {
        user.password = adminPasswordHash;
        console.log('Updated admin password');
      } else if (user.username === 'operaio1') {
        user.password = operaioPasswordHash;
        console.log('Updated operaio1 password');
      }
    });
    
    // Salva il file aggiornato
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('Users file updated successfully!');
    
    // Test delle password
    console.log('\nTesting passwords:');
    const testAdmin = await bcrypt.compare('admin123', adminPasswordHash);
    const testOperaio = await bcrypt.compare('operaio123', operaioPasswordHash);
    
    console.log('Admin password test:', testAdmin ? 'PASS' : 'FAIL');
    console.log('Operaio password test:', testOperaio ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

fixPasswords();