/**
 * Script di test per il server di condivisione dati
 * 
 * Questo script può essere eseguito con Node.js per testare il funzionamento
 * del server di condivisione dati senza avviare l'intera applicazione Electron.
 */

const DataSharingServer = require('./server-new.cjs');
const path = require('path');
const fs = require('fs');

// Configurazione del test
const TEST_PORT = 3001;
const TEST_SHARED_PATH = path.join(__dirname, 'test-shared-data');

// Crea la cartella di test se non esiste
if (!fs.existsSync(TEST_SHARED_PATH)) {
  fs.mkdirSync(TEST_SHARED_PATH, { recursive: true });
  console.log(`✅ Cartella di test creata: ${TEST_SHARED_PATH}`);
}

// Crea un'istanza del server
const server = new DataSharingServer();

// Funzione per testare il server
async function testServer() {
  console.log('🔍 Inizio test del server di condivisione dati');
  console.log('-------------------------------------------');
  
  try {
    // Test 1: Avvio del server
    console.log('Test 1: Avvio del server');
    const startResult = await server.start(TEST_PORT, TEST_SHARED_PATH);
    console.log(`✅ Server avviato: ${startResult.message}`);
    console.log(`   Porta: ${server.port}`);
    console.log(`   Percorso condiviso: ${server.sharedDataPath}`);
    console.log('-------------------------------------------');
    
    // Test 2: Verifica dello stato del server
    console.log('Test 2: Verifica dello stato del server');
    const status = server.getStatus();
    console.log(`✅ Stato del server: ${JSON.stringify(status, null, 2)}`);
    console.log('-------------------------------------------');
    
    // Test 3: Salvataggio dei dati
    console.log('Test 3: Salvataggio dei dati');
    const testData = [
      { id: '1', name: 'Cliente Test 1', email: 'test1@example.com' },
      { id: '2', name: 'Cliente Test 2', email: 'test2@example.com' }
    ];
    server.saveSharedData('customers', testData);
    console.log('✅ Dati salvati nella collezione "customers"');
    console.log('-------------------------------------------');
    
    // Test 4: Lettura dei dati
    console.log('Test 4: Lettura dei dati');
    const readData = server.getSharedData('customers');
    console.log(`✅ Dati letti dalla collezione "customers": ${JSON.stringify(readData, null, 2)}`);
    console.log('-------------------------------------------');
    
    // Test 5: Esportazione manuale dei dati
    console.log('Test 5: Esportazione manuale dei dati');
    const exportResult = await server.exportAllData();
    console.log(`✅ Dati esportati: ${exportResult.message}`);
    console.log(`   File: ${exportResult.filePath}`);
    console.log('-------------------------------------------');
    
    // Test 6: Avvio della sincronizzazione automatica
    console.log('Test 6: Avvio della sincronizzazione automatica');
    server.startAutoSync();
    console.log('✅ Sincronizzazione automatica avviata');
    console.log(`   Attiva: ${server.isAutoSyncActive()}`);
    console.log('-------------------------------------------');
    
    // Attendi 3 secondi
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 7: Arresto della sincronizzazione automatica
    console.log('Test 7: Arresto della sincronizzazione automatica');
    server.stopAutoSync();
    console.log('✅ Sincronizzazione automatica fermata');
    console.log(`   Attiva: ${server.isAutoSyncActive()}`);
    console.log('-------------------------------------------');
    
    // Test 8: Verifica dei peer
    console.log('Test 8: Verifica dei peer');
    const peers = server.discovery.getPeersDetails();
    console.log(`✅ Peer trovati: ${peers.length}`);
    if (peers.length > 0) {
      console.log(`   Peer: ${JSON.stringify(peers, null, 2)}`);
    } else {
      console.log('   Nessun peer trovato nella rete');
    }
    console.log('-------------------------------------------');
    
    // Test 9: Creazione di un backup manuale
    console.log('Test 9: Creazione di un backup manuale');
    const backupResult = await server.exportManualBackup();
    console.log(`✅ Backup creato: ${backupResult.message}`);
    console.log(`   File: ${backupResult.filePath}`);
    console.log('-------------------------------------------');
    
    // Test 10: Arresto del server
    console.log('Test 10: Arresto del server');
    const stopResult = await server.stop();
    console.log(`✅ Server fermato: ${stopResult.message}`);
    console.log('-------------------------------------------');
    
    console.log('🎉 Tutti i test completati con successo!');
  } catch (error) {
    console.error(`❌ Errore durante i test: ${error.message}`);
    console.error(error.stack);
    
    // Assicurati che il server venga fermato in caso di errore
    try {
      if (server.getStatus().isRunning) {
        await server.stop();
        console.log('✅ Server fermato dopo errore');
      }
    } catch (stopError) {
      console.error(`❌ Errore durante l'arresto del server: ${stopError.message}`);
    }
  }
}

// Esegui i test
testServer();