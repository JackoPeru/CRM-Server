@echo off
echo ========================================
echo    CRM MARMERIA - CREAZIONE PACCHETTO
echo ========================================
echo.

echo Creazione pacchetto di distribuzione...
echo.

REM Crea cartella temporanea
if exist "CRM-Marmeria-Setup" rmdir /s /q "CRM-Marmeria-Setup"
mkdir "CRM-Marmeria-Setup"

REM Copia file di setup
copy "setup.bat" "CRM-Marmeria-Setup\setup.bat"
copy "setup.ps1" "CRM-Marmeria-Setup\setup.ps1"
copy "INSTALLAZIONE.md" "CRM-Marmeria-Setup\INSTALLAZIONE.md"
if exist "README.md" copy "README.md" "CRM-Marmeria-Setup\README.md"
if exist "DEPLOY.md" copy "DEPLOY.md" "CRM-Marmeria-Setup\DEPLOY.md"

REM Crea file di avvio rapido
echo @echo off > "CRM-Marmeria-Setup\INSTALLA-QUI.bat"
echo echo ======================================== >> "CRM-Marmeria-Setup\INSTALLA-QUI.bat"
echo echo     CRM MARMERIA - INSTALLAZIONE >> "CRM-Marmeria-Setup\INSTALLA-QUI.bat"
echo echo ======================================== >> "CRM-Marmeria-Setup\INSTALLA-QUI.bat"
echo echo. >> "CRM-Marmeria-Setup\INSTALLA-QUI.bat"
echo echo Avvio installazione automatica... >> "CRM-Marmeria-Setup\INSTALLA-QUI.bat"
echo echo. >> "CRM-Marmeria-Setup\INSTALLA-QUI.bat"
echo call setup.bat >> "CRM-Marmeria-Setup\INSTALLA-QUI.bat"

REM Crea file informativo
echo # CRM Marmeria - Pacchetto Installazione > "CRM-Marmeria-Setup\LEGGIMI.txt"
echo. >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo ## Contenuto Pacchetto: >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo. >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo - INSTALLA-QUI.bat     (Avvio installazione rapida) >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo - setup.bat            (Script installazione Windows) >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo - setup.ps1            (Script installazione PowerShell) >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo - INSTALLAZIONE.md     (Guida completa installazione) >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo. >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo ## Installazione Rapida: >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo. >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo 1. Doppio click su INSTALLA-QUI.bat >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo 2. Segui le istruzioni a schermo >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo 3. Attendi il completamento >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo. >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo ## Versione Online: >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo. >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo Accesso diretto senza installazione: >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo https://jackoperu.github.io/Crm-Marmeria/ >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo. >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo ## Supporto: >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo. >> "CRM-Marmeria-Setup\LEGGIMI.txt"
echo Repository: https://github.com/JackoPeru/Crm-Marmeria >> "CRM-Marmeria-Setup\LEGGIMI.txt"

echo Pacchetto creato nella cartella: CRM-Marmeria-Setup
echo.
echo Contenuto del pacchetto:
dir "CRM-Marmeria-Setup" /b
echo.
echo Puoi copiare questa cartella su qualsiasi PC per l'installazione
echo.
pause