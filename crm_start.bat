@echo off

rem === Avvia il back-end ===
cd "c:\Users\PcLavoro\Desktop\Crm-Marmeria\crm-marmeria\server"
start "CRM Backend Server" cmd /k "node index.js"

rem === Avvia il front-end ===
cd "c:\Users\PcLavoro\Desktop\Crm-Marmeria\crm-marmeria"
start "CRM Frontend App" cmd /k "npm run dev"

exit