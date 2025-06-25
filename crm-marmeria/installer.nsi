; CRM Marmeria Installer Script
; Versione aggiornata con correzioni per sincronizzazione dati

!define APPNAME "CRM Marmeria"
!define COMPANYNAME "Marmeria Solutions"
!define DESCRIPTION "Sistema CRM per gestione marmeria con sincronizzazione dati"
!define VERSIONMAJOR 1
!define VERSIONMINOR 2
!define VERSIONBUILD 0
!define HELPURL "https://github.com/yourusername/crm-marmeria"
!define UPDATEURL "https://github.com/yourusername/crm-marmeria/releases"
!define ABOUTURL "https://github.com/yourusername/crm-marmeria"
!define INSTALLSIZE 150000

; Configurazione generale
RequestExecutionLevel admin
InstallDir "$PROGRAMFILES\${COMPANYNAME}\${APPNAME}"
Name "${APPNAME}"
OutFile "releases\CRM-Marmeria-Setup.exe"

; Pagine dell'installer
Page directory
Page instfiles

; Sezione principale di installazione
Section "install"
    ; Imposta la directory di output
    SetOutPath $INSTDIR
    
    ; Copia tutti i file dell'applicazione
    File /r "..\build\CRM-Marmeria-win32-x64\*"
    
    ; Crea collegamenti nel menu Start
    CreateDirectory "$SMPROGRAMS\${COMPANYNAME}"
    CreateShortcut "$SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk" "$INSTDIR\CRM-Marmeria.exe" "" "$INSTDIR\resources\app.asar.unpacked\assets\icon.ico"
    CreateShortcut "$SMPROGRAMS\${COMPANYNAME}\Disinstalla ${APPNAME}.lnk" "$INSTDIR\uninstall.exe"
    
    ; Crea collegamento sul desktop
    CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\CRM-Marmeria.exe" "" "$INSTDIR\resources\app.asar.unpacked\assets\icon.ico"
    
    ; Scrivi informazioni nel registro per il pannello di controllo
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayName" "${APPNAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "InstallLocation" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayIcon" "$INSTDIR\resources\app.asar.unpacked\assets\icon.ico"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "Publisher" "${COMPANYNAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "HelpLink" "${HELPURL}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "URLUpdateInfo" "${UPDATEURL}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "URLInfoAbout" "${ABOUTURL}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "VersionMajor" ${VERSIONMAJOR}
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "VersionMinor" ${VERSIONMINOR}
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "NoRepair" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "EstimatedSize" ${INSTALLSIZE}
    
    ; Crea il disinstallatore
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

; Sezione di disinstallazione
Section "uninstall"
    ; Rimuovi i file
    RMDir /r "$INSTDIR"
    
    ; Rimuovi i collegamenti
    Delete "$SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk"
    Delete "$SMPROGRAMS\${COMPANYNAME}\Disinstalla ${APPNAME}.lnk"
    RMDir "$SMPROGRAMS\${COMPANYNAME}"
    Delete "$DESKTOP\${APPNAME}.lnk"
    
    ; Rimuovi le voci del registro
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}"
SectionEnd