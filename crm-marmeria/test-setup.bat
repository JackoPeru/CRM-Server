@echo off
echo ========================================
echo    CRM MARMERIA - TEST SETUP
echo ========================================
echo.

echo Test 1: Controllo Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: Node.js non trovato!
    echo Installa Node.js da: https://nodejs.org
    pause
    exit /b 1
) else (
    echo OK: Node.js trovato
    node --version
)
echo.

echo Test 2: Controllo Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: Git non trovato!
    echo Installa Git da: https://git-scm.com
    pause
    exit /b 1
) else (
    echo OK: Git trovato
    git --version
)
echo.

echo Test 3: Controllo connessione GitHub...
ping -n 1 github.com >nul 2>&1
if %errorlevel% neq 0 (
    echo AVVISO: Connessione a GitHub non disponibile
    echo Controlla la connessione internet
) else (
    echo OK: Connessione a GitHub disponibile
)
echo.

echo Test 4: Controllo npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: npm non trovato!
    echo npm dovrebbe essere incluso con Node.js
    pause
    exit /b 1
) else (
    echo OK: npm trovato
    npm --version
)
echo.

echo ========================================
echo TUTTI I TEST COMPLETATI!
echo ========================================
echo.
echo Il sistema e' pronto per l'installazione del CRM.
echo Puoi ora eseguire setup.bat per installare l'applicazione.
echo.
pause