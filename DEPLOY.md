# Deploy Automatico su GitHub Pages

## Configurazione GitHub Pages

### 1. Abilita GitHub Pages
1. Vai su GitHub.com nel tuo repository `Crm-Marmeria`
2. Clicca su **Settings** (Impostazioni)
3. Scorri fino alla sezione **Pages** nel menu laterale
4. In **Source**, seleziona **GitHub Actions**

### 2. Configura i Permessi
1. Vai su **Settings** > **Actions** > **General**
2. In **Workflow permissions**, seleziona:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

### 3. Push del Codice
Ogni volta che fai push su `main` o `master`, l'app si aggiornerà automaticamente!

```bash
git add .
git commit -m "Setup auto-deploy"
git push origin main
```

## Come Funziona

1. **Push su GitHub** → Trigger automatico del workflow
2. **GitHub Actions** → Build dell'applicazione
3. **Deploy automatico** → App aggiornata su GitHub Pages
4. **URL pubblico** → `https://jackoperu.github.io/Crm-Marmeria/`

## Vantaggi

✅ **Aggiornamenti automatici** - Ogni push aggiorna l'app  
✅ **Zero configurazione** - Funziona subito dopo il setup  
✅ **Gratuito** - Hosting gratuito con GitHub Pages  
✅ **HTTPS** - Certificato SSL automatico  
✅ **CDN globale** - Velocità di caricamento ottimale  

## Monitoraggio

- **Status deploy**: Tab **Actions** nel repository
- **URL live**: `https://jackoperu.github.io/Crm-Marmeria/`
- **Logs**: Dettagli di ogni deploy nelle Actions

## Rollback

In caso di problemi:
```bash
git revert HEAD
git push origin main
```

L'app tornerà automaticamente alla versione precedente!