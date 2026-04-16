@echo off
setlocal

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "APP_DIR=%ROOT_DIR%\crm-marmeria"
set "SERVER_DIR=%APP_DIR%\server"
set "ENV_EXAMPLE=%APP_DIR%\.env.example"
set "ENV_FILE=%APP_DIR%\.env"

echo ==========================================
echo   CRM Marmeria - Installazione Web
echo ==========================================
echo.

if not exist "%APP_DIR%\package.json" (
    echo ERRORE: cartella app non trovata:
    echo %APP_DIR%
    pause
    exit /b 1
)

if not exist "%SERVER_DIR%\package.json" (
    echo ERRORE: cartella server non trovata:
    echo %SERVER_DIR%
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo ERRORE: Node.js non e' installato o non e' nel PATH.
    echo Installa Node.js 18 o superiore e riprova.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERRORE: npm non e' disponibile nel PATH.
    echo Reinstalla Node.js e riprova.
    pause
    exit /b 1
)

echo [1/4] Installazione dipendenze root...
if exist "%ROOT_DIR%\package.json" (
    pushd "%ROOT_DIR%"
    call npm install
    if errorlevel 1 (
        echo ERRORE: npm install fallito nella root del progetto.
        popd
        pause
        exit /b 1
    )
    popd
) else (
    echo Nessun package.json nella root, passaggio saltato.
)

echo.
echo [2/4] Installazione dipendenze frontend...
pushd "%APP_DIR%"
call npm install
if errorlevel 1 (
    echo ERRORE: npm install fallito nel frontend.
    popd
    pause
    exit /b 1
)
popd

echo.
echo [3/4] Installazione dipendenze backend...
pushd "%SERVER_DIR%"
call npm install
if errorlevel 1 (
    echo ERRORE: npm install fallito nel backend.
    popd
    pause
    exit /b 1
)
popd

echo.
echo [4/4] Configurazione file .env...
if exist "%ENV_FILE%" (
    echo File .env gia' presente, non viene sovrascritto.
) else (
    if exist "%ENV_EXAMPLE%" (
        copy "%ENV_EXAMPLE%" "%ENV_FILE%" >nul
        if errorlevel 1 (
            echo ERRORE: impossibile creare il file .env
            pause
            exit /b 1
        )
        echo File .env creato da .env.example
    ) else (
        echo ATTENZIONE: .env.example non trovato.
        echo Crea manualmente %ENV_FILE% con:
        echo VITE_API_BASE_URL=http://localhost:3001/api
    )
)

echo.
echo Installazione completata.
echo Per avviare l'app usa:
echo %ROOT_DIR%\crm_start.bat
echo.
pause
exit /b 0
