# Guida all'Installazione di Motia su Windows

Questa guida fornisce istruzioni dettagliate per installare e configurare Motia su Windows PowerShell.

## 📋 Prerequisiti

### 1. Node.js (v20.11.1 raccomandato)

**Installazione:**
- Scarica Node.js da: https://nodejs.org/
- Versione raccomandata: v20.11.1 (LTS)
- Verifica l'installazione:
  ```powershell
  node --version
  npm --version
  ```

### 2. Python (3.9+ raccomandato)

**Installazione:**
- Scarica Python da: https://www.python.org/downloads/
- Durante l'installazione, seleziona "Add Python to PATH"
- Verifica l'installazione:
  ```powershell
  python --version
  pip --version
  ```

### 3. pnpm (Package Manager)

**Installazione:**
```powershell
npm install -g pnpm@10.11.0
```

Verifica l'installazione:
```powershell
pnpm --version
```

### 4. Git per Windows

**Installazione:**
- Scarica da: https://git-scm.com/download/win
- Durante l'installazione, seleziona "Git from the command line and also from 3rd-party software"

---

## 🚀 Installazione di Motia (Sviluppo del Framework)

Se vuoi contribuire allo sviluppo di Motia o modificare il framework stesso:

### 1. Clona il Repository

```powershell
git clone https://github.com/MotiaDev/motia.git
cd motia
```

### 2. Installa le Dipendenze

```powershell
pnpm install
```

### 3. Build del Progetto

```powershell
pnpm build
```

### 4. Configura il Playground

```powershell
cd playground
npx motia install
```

### 5. Configura le Variabili d'Ambiente

```powershell
# Copia il file di esempio
Copy-Item playground\.env.example playground\.env

# Modifica il file .env con le tue credenziali
notepad playground\.env
```

### 6. Avvia il Workbench di Sviluppo

Torna alla directory principale:
```powershell
cd ..
pnpm dev:workbench
```

Il workbench sarà disponibile su: **http://localhost:3000**

---

## 📦 Usare Motia nei Tuoi Progetti

Se vuoi semplicemente usare Motia nei tuoi progetti senza modificare il framework:

### 1. Crea un Nuovo Progetto Motia

```powershell
# Crea una nuova directory per il progetto
mkdir mio-progetto-motia
cd mio-progetto-motia

# Inizializza il progetto con il wizard interattivo
npx motia@latest create
```

Il wizard ti chiederà:
- Nome del progetto
- Template da usare (API, Event-driven, ecc.)
- Linguaggio (TypeScript, JavaScript, Python)

### 2. Installa le Dipendenze

```powershell
npm install
# oppure
pnpm install
```

### 3. Avvia il Server di Sviluppo

```powershell
npx motia dev
```

Il server sarà disponibile su: **http://localhost:3000**

---

## 🔗 Integrare Motia in un Progetto Esistente

### 1. Installa Motia nel Progetto Esistente

```powershell
cd path\to\tuo\progetto
npm install motia
# oppure
pnpm add motia
```

### 2. Inizializza Motia

```powershell
npx motia install
```

Questo comando:
- Crea la directory `steps/` per i tuoi step
- Configura i file necessari
- Installa le dipendenze richieste

### 3. Crea il Primo Step

Esempio di API Step (TypeScript):

Crea il file `steps/hello.step.ts`:
```typescript
export const config = {
  name: 'HelloAPI',
  type: 'api',
  path: '/hello',
  method: 'GET'
};

export const handler = async (req, { logger }) => {
  logger.info('Hello endpoint called');
  return {
    status: 200,
    body: { message: 'Hello from Motia!' }
  };
};
```

### 4. Avvia Motia

```powershell
npx motia dev
```

### 5. Testa l'Endpoint

```powershell
# In un nuovo terminale PowerShell
Invoke-WebRequest -Uri http://localhost:3000/hello -Method GET
```

---

## 🛠️ Configurazione Avanzata

### Configurare il File motia.config.js

Crea un file `motia.config.js` nella root del progetto:

```javascript
module.exports = {
  port: 3000,
  stepsDir: './steps',
  // Altre configurazioni...
};
```

### Configurare le Variabili d'Ambiente

Crea un file `.env` nella root del progetto:

```env
# Porta del server
PORT=3000

# API Keys (se necessarie)
OPENAI_API_KEY=your_key_here
# ... altre variabili
```

---

## 🔄 Integrare Motia con Altri Framework

### Integrazione con Express.js

```javascript
const express = require('express');
const { createMotiaMiddleware } = require('motia');

const app = express();

// Monta Motia come middleware
app.use('/api', createMotiaMiddleware());

// Altre route Express
app.get('/', (req, res) => {
  res.send('App principale');
});

app.listen(4000);
```

### Integrazione con Next.js

```javascript
// pages/api/motia/[...path].js
import { createMotiaHandler } from 'motia';

export default createMotiaHandler();
```

---

## 🐛 Risoluzione Problemi su Windows

### Problema: Script Execution Policy

Se ricevi errori di execution policy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: Percorsi Lunghi

Windows ha un limite di 260 caratteri per i percorsi. Abilita i percorsi lunghi:

1. Esegui PowerShell come Amministratore
2. Esegui:
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Problema: pnpm non riconosciuto

Se `pnpm` non viene riconosciuto dopo l'installazione:

1. Chiudi e riapri PowerShell
2. Oppure aggiungi manualmente il path di npm global al PATH di sistema

### Problema: Python non trovato

Assicurati che Python sia nel PATH:

```powershell
# Controlla dove è installato Python
where.exe python

# Se non trovato, aggiungi manualmente al PATH:
# 1. Cerca "Environment Variables" nel menu Start
# 2. Modifica la variabile PATH
# 3. Aggiungi il percorso di Python (es. C:\Python39)
```

### Problema: Porta 3000 già in uso

Cambia la porta nel file `motia.config.js` o usa la variabile d'ambiente:

```powershell
$env:PORT=3001
npx motia dev
```

---

## 📚 Comandi Utili PowerShell

### Navigazione e File Management

```powershell
# Cambia directory
cd path\to\directory

# Crea directory
mkdir nome-directory

# Copia file
Copy-Item source.txt destination.txt

# Lista file
Get-ChildItem
# oppure l'alias
ls

# Apri file con editor predefinito
notepad file.txt

# Esegui comandi npm/pnpm
pnpm install
pnpm build
pnpm dev
```

### Gestione Processi

```powershell
# Trova processi sulla porta 3000
netstat -ano | findstr :3000

# Ferma processo per PID
Stop-Process -Id <PID>
```

---

## 🎯 Prossimi Passi

1. **Esplora gli Esempi**: https://github.com/MotiaDev/motia-examples
2. **Leggi la Documentazione**: https://motia.dev/docs
3. **Unisciti alla Community**: https://discord.gg/motia

---

## 🤝 Link Utili

- **Documentazione Completa**: https://motia.dev/docs
- **Repository GitHub**: https://github.com/MotiaDev/motia
- **Esempi**: https://github.com/MotiaDev/motia-examples
- **Discord Community**: https://discord.gg/motia
- **Segnala Bug**: https://github.com/MotiaDev/motia/issues

---

## ✅ Checklist di Verifica

Prima di iniziare, assicurati di aver:

- [ ] Installato Node.js v20+
- [ ] Installato Python 3.9+
- [ ] Installato pnpm
- [ ] Installato Git
- [ ] Clonato il repository (se contribuisci) o creato un nuovo progetto
- [ ] Installato le dipendenze con `pnpm install`
- [ ] Configurato le variabili d'ambiente (se necessarie)
- [ ] Avviato il server di sviluppo con successo

---

**Buon sviluppo con Motia! 🚀**
