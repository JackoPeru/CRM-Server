# CRM Marmeria - Setup PowerShell
# Esegui con: PowerShell -ExecutionPolicy Bypass -File setup.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    CRM MARMERIA - SETUP AUTOMATICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Funzione per controllare se un comando esiste
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Funzione per scaricare file
function Download-File($url, $output) {
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        return $true
    }
    catch {
        return $false
    }
}

# Controlla Node.js
Write-Host "🔍 Controllo Node.js..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js trovato: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ Node.js non trovato!" -ForegroundColor Red
    Write-Host "📥 Apertura pagina download Node.js..." -ForegroundColor Yellow
    Start-Process "https://nodejs.org/en/download/"
    Write-Host ""
    Write-Host "⚠️  ISTRUZIONI:" -ForegroundColor Yellow
    Write-Host "1. Scarica e installa Node.js LTS"
    Write-Host "2. Riavvia questo script dopo l'installazione"
    Write-Host ""
    Read-Host "Premi Enter per uscire"
    exit 1
}

# Controlla Git
Write-Host "🔍 Controllo Git..." -ForegroundColor Yellow
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "✅ Git trovato: $gitVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ Git non trovato!" -ForegroundColor Red
    Write-Host "📥 Apertura pagina download Git..." -ForegroundColor Yellow
    Start-Process "https://git-scm.com/download/win"
    Write-Host ""
    Write-Host "⚠️  ISTRUZIONI:" -ForegroundColor Yellow
    Write-Host "1. Scarica e installa Git per Windows"
    Write-Host "2. Riavvia questo script dopo l'installazione"
    Write-Host ""
    Read-Host "Premi Enter per uscire"
    exit 1
}

Write-Host ""

# Definisci cartella di installazione
$installDir = "$env:USERPROFILE\Desktop\CRM-Marmeria"
Write-Host "📁 Cartella di installazione: $installDir" -ForegroundColor Cyan
Write-Host ""

# Rimuovi installazione precedente
if (Test-Path $installDir) {
    Write-Host "🗑️  Rimozione installazione precedente..." -ForegroundColor Yellow
    Remove-Item -Path $installDir -Recurse -Force
}

# Clona repository
Write-Host "📥 Download codice da GitHub..." -ForegroundColor Yellow
try {
    git clone "https://github.com/JackoPeru/Crm-Marmeria.git" $installDir
    Write-Host "✅ Codice scaricato con successo!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Errore durante il download!" -ForegroundColor Red
    Read-Host "Premi Enter per uscire"
    exit 1
}

Write-Host ""

# Entra nella cartella
Set-Location $installDir

# Installa dipendenze
Write-Host "📦 Installazione dipendenze..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dipendenze installate con successo!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Errore durante l'installazione delle dipendenze!" -ForegroundColor Red
    Read-Host "Premi Enter per uscire"
    exit 1
}

Write-Host ""

# Crea script di avvio PowerShell
Write-Host "🚀 Creazione script di avvio..." -ForegroundColor Yellow

$avviaScript = @'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    CRM MARMERIA - AVVIO APPLICAZIONE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Avvio del server di sviluppo..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 L'applicazione sarà disponibile su:" -ForegroundColor Green
Write-Host "    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Per fermare il server premi Ctrl+C" -ForegroundColor Yellow
Write-Host ""
npm run dev
Read-Host "Premi Enter per chiudere"
'@

$avviaScript | Out-File -FilePath "avvia-crm.ps1" -Encoding UTF8

# Crea script di aggiornamento PowerShell
$aggiornaScript = @'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    CRM MARMERIA - AGGIORNAMENTO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📥 Scaricamento aggiornamenti da GitHub..." -ForegroundColor Yellow
git pull origin master
Write-Host ""
Write-Host "📦 Aggiornamento dipendenze..." -ForegroundColor Yellow
npm install
Write-Host ""
Write-Host "✅ Aggiornamento completato!" -ForegroundColor Green
Read-Host "Premi Enter per chiudere"
'@

$aggiornaScript | Out-File -FilePath "aggiorna-crm.ps1" -Encoding UTF8

# Crea anche i file .bat per compatibilità
$avviaBat = @'
@echo off
chcp 65001 >nul
PowerShell -ExecutionPolicy Bypass -File "%~dp0avvia-crm.ps1"
'@

$avviaBat | Out-File -FilePath "avvia-crm.bat" -Encoding ASCII

$aggiornaBat = @'
@echo off
chcp 65001 >nul
PowerShell -ExecutionPolicy Bypass -File "%~dp0aggiorna-crm.ps1"
'@

$aggiornaBat | Out-File -FilePath "aggiorna-crm.bat" -Encoding ASCII

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ INSTALLAZIONE COMPLETATA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Percorso installazione: $installDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Per avviare l'applicazione:" -ForegroundColor Yellow
Write-Host "   - Doppio click su 'avvia-crm.bat'" -ForegroundColor White
Write-Host "   - Oppure apri http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Per aggiornare l'applicazione:" -ForegroundColor Yellow
Write-Host "   - Doppio click su 'aggiorna-crm.bat'" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Versione online sempre aggiornata:" -ForegroundColor Yellow
Write-Host "   https://jackoperu.github.io/Crm-Marmeria/" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Vuoi avviare l'applicazione ora? (s/n)"
if ($choice -eq "s" -or $choice -eq "S") {
    Write-Host ""
    Write-Host "🚀 Avvio dell'applicazione..." -ForegroundColor Green
    Start-Process -FilePath "avvia-crm.bat"
}

Write-Host ""
Write-Host "Grazie per aver installato CRM Marmeria! 🎉" -ForegroundColor Green
Read-Host "Premi Enter per chiudere"