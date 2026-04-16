@echo off
setlocal

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "APP_DIR=%ROOT_DIR%\crm-marmeria"
set "SERVER_DIR=%APP_DIR%\server"
set "ENV_FILE=%APP_DIR%\.env"

echo ==========================================
echo   CRM Marmeria - Avvio Web
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

if not exist "%APP_DIR%\node_modules" (
    echo ERRORE: dipendenze frontend mancanti.
    echo Esegui prima crm_install.bat
    pause
    exit /b 1
)

if not exist "%SERVER_DIR%\node_modules" (
    echo ERRORE: dipendenze backend mancanti.
    echo Esegui prima crm_install.bat
    pause
    exit /b 1
)

if not exist "%ENV_FILE%" (
    echo ATTENZIONE: file .env non trovato.
    echo Esegui prima crm_install.bat oppure crea:
    echo %ENV_FILE%
    echo.
)

echo Avvio backend sulla porta 3001...
start "CRM Backend Server" /D "%SERVER_DIR%" cmd /k "npm run dev"

echo Avvio frontend sulla porta 5173...
start "CRM Frontend App" /D "%APP_DIR%" cmd /k "npm run dev"

echo.
echo Avvio richiesto correttamente.
echo Backend:  http://localhost:3001/api/health
echo Frontend: http://localhost:5173
echo.
exit /b 0
