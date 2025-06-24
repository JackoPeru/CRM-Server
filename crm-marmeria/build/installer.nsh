; Personalizzazioni aggiuntive per l'installer NSIS
; Questo file viene incluso durante la creazione dell'installer

; Messaggio di benvenuto personalizzato
!define MUI_WELCOMEPAGE_TITLE "Benvenuto nell'installazione di CRM Marmeria"
!define MUI_WELCOMEPAGE_TEXT "Questo programma installerà CRM Marmeria sul tuo computer.$\r$\n$\r$\nCRM Marmeria è un sistema professionale per la gestione di marmerie e lavorazioni in pietra.$\r$\n$\r$\nSi consiglia di chiudere tutte le altre applicazioni prima di continuare con l'installazione. Questo permetterà al programma di installazione di aggiornare i file di sistema senza dover riavviare il computer.$\r$\n$\r$\nClicca Avanti per continuare."

; Messaggio di completamento personalizzato
!define MUI_FINISHPAGE_TITLE "Installazione di CRM Marmeria completata"
!define MUI_FINISHPAGE_TEXT "CRM Marmeria è stato installato correttamente sul tuo computer.$\r$\n$\r$\nClicca Fine per chiudere questa procedura guidata."

; Opzioni aggiuntive
!define MUI_FINISHPAGE_RUN "$INSTDIR\CRM Marmeria.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Avvia CRM Marmeria"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Mostra il file README"

; Controllo prerequisiti
Function .onInit
  ; Verifica se l'applicazione è già in esecuzione
  System::Call 'kernel32::CreateMutexA(i 0, i 0, t "CRMMarmeriaInstaller") i .r1 ?e'
  Pop $R0
  StrCmp $R0 0 +3
    MessageBox MB_OK|MB_ICONEXCLAMATION "L'installer è già in esecuzione."
    Abort
    
  ; Verifica versione Windows
  ${IfNot} ${AtLeastWin7}
    MessageBox MB_OK|MB_ICONSTOP "CRM Marmeria richiede Windows 7 o superiore."
    Abort
  ${EndIf}
FunctionEnd

; Funzione per la disinstallazione
Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Sei sicuro di voler rimuovere completamente CRM Marmeria e tutti i suoi componenti?" IDYES +2
  Abort
FunctionEnd

; Sezione per creare collegamenti aggiuntivi
Section "Collegamenti Desktop" SecDesktop
  CreateShortCut "$DESKTOP\CRM Marmeria.lnk" "$INSTDIR\CRM Marmeria.exe" "" "$INSTDIR\CRM Marmeria.exe" 0
SectionEnd

; Sezione per associazioni file (opzionale)
Section "Associazioni File" SecFileAssoc
  ; Qui puoi aggiungere associazioni per file specifici se necessario
SectionEnd