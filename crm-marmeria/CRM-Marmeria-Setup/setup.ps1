# CRM Marmeria - Setup PowerShell
# Esegui con: PowerShell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   CRM MARMERIA - SETUP AUTOMATICO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Controllo Node.js
Write-Host "Controllo Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Node.js trovato: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js non trovato"
    }
} catch {
    Write-Host "ERRORE: Node.js non e' installato!" -ForegroundColor Red
    Write-Host "Scarica e installa Node.js da: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "Riavvia questo script dopo l'installazione" -ForegroundColor Yellow
    Read-Host "Premi Invio per uscire"
    exit 1
}

Write-Host ""

# Controllo Git
Write-Host "Controllo Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Git trovato: $gitVersion" -ForegroundColor Green
    } else {
        throw "Git non trovato"
    }
} catch {
    Write-Host "ERRORE: Git non e' installato!" -ForegroundColor Red
    Write-Host "Scarica e installa Git da: https://git-scm.com" -ForegroundColor Yellow
    Write-Host "Riavvia questo script dopo l'installazione" -ForegroundColor Yellow
    Read-Host "Premi Invio per uscire"
    exit 1
}

Write-Host ""

# Definisci cartella di installazione
$INSTALL_DIR = "$env:USERPROFILE\Desktop\CRM-Marmeria"
Write-Host "Cartella di installazione: $INSTALL_DIR" -ForegroundColor Cyan
Write-Host ""

# Rimuovi cartella esistente se presente
if (Test-Path $INSTALL_DIR) {
    Write-Host "Rimozione installazione precedente..." -ForegroundColor Yellow
    Remove-Item -Path $INSTALL_DIR -Recurse -Force
}

# Clona il repository
Write-Host "Scaricamento codice da GitHub..." -ForegroundColor Yellow
try {
    git clone https://github.com/JackoPeru/Crm-Marmeria.git $INSTALL_DIR
    if ($LASTEXITCODE -ne 0) {
        throw "Errore durante il clone"
    }
    Write-Host "OK: Codice scaricato con successo" -ForegroundColor Green
} catch {
    Write-Host "ERRORE: Download del codice fallito!" -ForegroundColor Red
    Write-Host "Controlla la connessione internet e riprova" -ForegroundColor Yellow
    Read-Host "Premi Invio per uscire"
    exit 1
}

Write-Host ""

# Entra nella cartella
Set-Location $INSTALL_DIR

# Installa le dipendenze
Write-Host "Installazione dipendenze..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Errore durante npm install"
    }
    Write-Host "OK: Dipendenze installate con successo" -ForegroundColor Green
} catch {
    Write-Host "ERRORE: Installazione dipendenze fallita!" -ForegroundColor Red
    Write-Host "Controlla la connessione internet e riprova" -ForegroundColor Yellow
    Read-Host "Premi Invio per uscire"
    exit 1
}

Write-Host ""

# Crea script di avvio PowerShell
Write-Host "Creazione script di avvio PowerShell..." -ForegroundColor Yellow
$avviaScript = @"
# Avvia CRM Marmeria
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   CRM MARMERIA - AVVIO APPLICAZIONE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Avvio del server di sviluppo..." -ForegroundColor Yellow
Write-Host ""
Write-Host "L'applicazione sara' disponibile su:" -ForegroundColor Green
Write-Host "   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Per fermare il server premi Ctrl+C" -ForegroundColor Yellow
Write-Host ""

Set-Location "`$PSScriptRoot"
npm run dev

Read-Host "Premi Invio per chiudere"
"@

$avviaScript | Out-File -FilePath "avvia-crm.ps1" -Encoding UTF8

# Crea script di avvio Batch
Write-Host "Creazione script di avvio Batch..." -ForegroundColor Yellow
$avviaBat = @"
@echo off
echo ==========================================
echo    CRM MARMERIA - AVVIO APPLICAZIONE
echo ==========================================
echo.
echo Avvio del server di sviluppo...
echo.
echo L'applicazione sara' disponibile su:
echo    http://localhost:5173
echo.
echo Per fermare il server premi Ctrl+C
echo.
npm run dev
pause
"@

$avviaBat | Out-File -FilePath "avvia-crm.bat" -Encoding ASCII

# Crea script di aggiornamento PowerShell
Write-Host "Creazione script di aggiornamento PowerShell..." -ForegroundColor Yellow
$aggiornaScript = @"
# Aggiorna CRM Marmeria
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   CRM MARMERIA - AGGIORNAMENTO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scaricamento aggiornamenti da GitHub..." -ForegroundColor Yellow
git pull origin master
Write-Host ""
Write-Host "Aggiornamento dipendenze..." -ForegroundColor Yellow
npm install
Write-Host ""
Write-Host "Aggiornamento completato!" -ForegroundColor Green
Read-Host "Premi Invio per chiudere"
"@

$aggiornaScript | Out-File -FilePath "aggiorna-crm.ps1" -Encoding UTF8

# Crea script di aggiornamento Batch
Write-Host "Creazione script di aggiornamento Batch..." -ForegroundColor Yellow
$aggiornaBat = @"
@echo off
echo ==========================================
echo    CRM MARMERIA - AGGIORNAMENTO
echo ==========================================
echo.
echo Scaricamento aggiornamenti da GitHub...
git pull origin master
echo.
echo Aggiornamento dipendenze...
npm install
echo.
echo Aggiornamento completato!
pause
"@

$aggiornaBat | Out-File -FilePath "aggiorna-crm.bat" -Encoding ASCII

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "INSTALLAZIONE COMPLETATA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Percorso installazione: $INSTALL_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "Per avviare l'applicazione:" -ForegroundColor Yellow
Write-Host "   - Doppio click su 'avvia-crm.ps1' o 'avvia-crm.bat'" -ForegroundColor White
Write-Host "   - Oppure apri http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Per aggiornare l'applicazione:" -ForegroundColor Yellow
Write-Host "   - Doppio click su 'aggiorna-crm.ps1' o 'aggiorna-crm.bat'" -ForegroundColor White
Write-Host ""
Write-Host "Versione online sempre aggiornata:" -ForegroundColor Yellow
Write-Host "   https://jackoperu.github.io/Crm-Marmeria/" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Vuoi avviare l'applicazione ora? (s/n)"
if ($choice -eq "s" -or $choice -eq "S") {
    Write-Host ""
    Write-Host "Avvio dell'applicazione..." -ForegroundColor Green
    Start-Process PowerShell -ArgumentList "-ExecutionPolicy Bypass -File '$INSTALL_DIR\avvia-crm.ps1'"
}

Write-Host ""
Write-Host "Grazie per aver installato CRM Marmeria!" -ForegroundColor Green
Read-Host "Premi Invio per uscire"