@echo off
chcp 65001 >nul
echo ========================================
echo    CRM MARMERIA - SETUP AUTOMATICO
echo ========================================
echo.

REM Controlla se Node.js è installato
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js non trovato!
    echo 📥 Scaricando Node.js...
    echo.
    echo Apro il browser per scaricare Node.js...
    start https://nodejs.org/en/download/
    echo.
    echo ⚠️  ISTRUZIONI:
    echo 1. Scarica e installa Node.js LTS
    echo 2. Riavvia questo script dopo l'installazione
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js trovato: 
node --version
echo.

REM Controlla se Git è installato
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git non trovato!
    echo 📥 Scaricando Git...
    echo.
    echo Apro il browser per scaricare Git...
    start https://git-scm.com/download/win
    echo.
    echo ⚠️  ISTRUZIONI:
    echo 1. Scarica e installa Git per Windows
    echo 2. Riavvia questo script dopo l'installazione
    echo.
    pause
    exit /b 1
)

echo ✅ Git trovato: 
git --version
echo.

REM Crea cartella di destinazione
set "INSTALL_DIR=%USERPROFILE%\Desktop\CRM-Marmeria"
echo 📁 Cartella di installazione: %INSTALL_DIR%
echo.

REM Rimuovi cartella esistente se presente
if exist "%INSTALL_DIR%" (
    echo 🗑️  Rimuovo installazione precedente...
    rmdir /s /q "%INSTALL_DIR%"
)

REM Clona il repository
echo 📥 Scaricando il codice da GitHub...
git clone https://github.com/JackoPeru/Crm-Marmeria.git "%INSTALL_DIR%"
if %errorlevel% neq 0 (
    echo ❌ Errore durante il download!
    pause
    exit /b 1
)

echo ✅ Codice scaricato con successo!
echo.

REM Entra nella cartella
cd /d "%INSTALL_DIR%"

REM Installa le dipendenze
echo 📦 Installazione dipendenze...
npm install
if %errorlevel% neq 0 (
    echo ❌ Errore durante l'installazione delle dipendenze!
    pause
    exit /b 1
)

echo ✅ Dipendenze installate con successo!
echo.

REM Crea script di avvio
echo 🚀 Creazione script di avvio...
echo @echo off > avvia-crm.bat
echo chcp 65001 ^>nul >> avvia-crm.bat
echo echo ========================================== >> avvia-crm.bat
echo echo    CRM MARMERIA - AVVIO APPLICAZIONE >> avvia-crm.bat
echo echo ========================================== >> avvia-crm.bat
echo echo. >> avvia-crm.bat
echo echo 🚀 Avvio del server di sviluppo... >> avvia-crm.bat
echo echo. >> avvia-crm.bat
echo echo 🌐 L'applicazione sarà disponibile su: >> avvia-crm.bat
echo echo    http://localhost:5173 >> avvia-crm.bat
echo echo. >> avvia-crm.bat
echo echo 💡 Per fermare il server premi Ctrl+C >> avvia-crm.bat
echo echo. >> avvia-crm.bat
echo npm run dev >> avvia-crm.bat
echo pause >> avvia-crm.bat

REM Crea script di aggiornamento
echo 🔄 Creazione script di aggiornamento...
echo @echo off > aggiorna-crm.bat
echo chcp 65001 ^>nul >> aggiorna-crm.bat
echo echo ========================================== >> aggiorna-crm.bat
echo echo    CRM MARMERIA - AGGIORNAMENTO >> aggiorna-crm.bat
echo echo ========================================== >> aggiorna-crm.bat
echo echo. >> aggiorna-crm.bat
echo echo 📥 Scaricando aggiornamenti da GitHub... >> aggiorna-crm.bat
echo git pull origin master >> aggiorna-crm.bat
echo echo. >> aggiorna-crm.bat
echo echo 📦 Aggiornamento dipendenze... >> aggiorna-crm.bat
echo npm install >> aggiorna-crm.bat
echo echo. >> aggiorna-crm.bat
echo echo ✅ Aggiornamento completato! >> aggiorna-crm.bat
echo pause >> aggiorna-crm.bat

echo.
echo ========================================
echo ✅ INSTALLAZIONE COMPLETATA!
echo ========================================
echo.
echo 📁 Percorso installazione: %INSTALL_DIR%
echo.
echo 🚀 Per avviare l'applicazione:
echo    - Doppio click su "avvia-crm.bat"
echo    - Oppure apri http://localhost:5173
echo.
echo 🔄 Per aggiornare l'applicazione:
echo    - Doppio click su "aggiorna-crm.bat"
echo.
echo 🌐 Versione online sempre aggiornata:
echo    https://jackoperu.github.io/Crm-Marmeria/
echo.
echo Vuoi avviare l'applicazione ora? (s/n)
set /p choice=
if /i "%choice%"=="s" (
    echo.
    echo 🚀 Avvio dell'applicazione...
    start "" "avvia-crm.bat"
)

echo.
echo Grazie per aver installato CRM Marmeria! 🎉
pause