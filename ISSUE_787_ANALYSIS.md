# Issue #787: Build Fails on Windows - Analisi Completa e Soluzioni

## 📋 Sommario

Il build di Motia fallisce su Windows a causa dell'uso di comandi Unix-specific negli script npm. Questo documento analizza il problema e propone soluzioni complete.

## 🔍 Problema Identificato

### File Affected

| File | Comandi Problematici | Impatto |
|------|---------------------|---------|
| `packages/core/package.json` | `rm -rf`, `mkdir -p`, `cp` | ❌ Build fallisce |
| `packages/workbench/package.json` | `rm -rf`, `sh post-build.sh` | ❌ Build fallisce |
| `playground/package.json` | `rm -rf` | ❌ Clean fallisce |

### Dettagli Comandi Problematici

#### 1. packages/core/package.json

```json
"scripts": {
  "move:python": "mkdir -p dist/src/python && cp src/python/*.py dist/src/python",
  "move:rb": "mkdir -p dist/src/ruby && cp src/ruby/*.rb dist/src/ruby",
  "move:steps": "cp src/steps/*.ts dist/src/steps",
  "build": "rm -rf dist && tsc && npm run move:python && npm run move:rb && npm run move:steps",
  "clean": "rm -rf python_modules dist"
}
```

**Problemi**:
- `rm -rf` non esiste su Windows CMD/PowerShell
- `mkdir -p` non esiste (Windows usa `mkdir` ma non supporta `-p`)
- `cp` non esiste (Windows usa `copy` ma con sintassi diversa)
- Il glob `*.py` e `*.rb` non funziona uguale

#### 2. packages/workbench/package.json

```json
"scripts": {
  "build": "rm -rf dist && tsc --build && sh post-build.sh"
}
```

**Problemi**:
- `rm -rf dist` fallisce su Windows
- `sh post-build.sh` richiede bash (non disponibile di default su Windows)

#### 3. playground/package.json

```json
"scripts": {
  "clean": "rm -rf .mermaid node_modules python_modules"
}
```

**Problemi**:
- `rm -rf` fallisce su Windows

### Errore Tipico su Windows

```
'rm' is not recognized as an internal or external command,
operable program or batch file.
```

o

```
The syntax of the command is incorrect.
```

## ✅ Soluzioni Proposte

### Approccio 1: Pacchetti NPM Cross-Platform (RACCOMANDATO)

Usare pacchetti Node.js che funzionano su tutti i sistemi operativi.

#### Pacchetti da Installare

```bash
pnpm add -D -w rimraf cpy-cli mkdirp
```

**Perché questi pacchetti?**

| Pacchetto | Sostituisce | Descrizione |
|-----------|-------------|-------------|
| `rimraf` | `rm -rf` | Rimozione ricorsiva cross-platform |
| `cpy-cli` | `cp` | Copia file con glob support |
| `mkdirp` | `mkdir -p` | Creazione directory ricorsiva |

#### Script Aggiornati

**packages/core/package.json**:
```json
{
  "scripts": {
    "move:python": "mkdirp dist/src/python && cpy 'src/python/*.py' dist/src/python --parents",
    "move:rb": "mkdirp dist/src/ruby && cpy 'src/ruby/*.rb' dist/src/ruby --parents",
    "move:steps": "cpy 'src/steps/*.ts' dist/src/steps --parents",
    "build": "rimraf dist && tsc && npm run move:python && npm run move:rb && npm run move:steps",
    "clean": "rimraf python_modules dist"
  }
}
```

**packages/workbench/package.json**:
```json
{
  "scripts": {
    "build": "rimraf dist && tsc --build && node post-build.js",
    "build:original": "rimraf dist && tsc --build && sh post-build.sh"
  }
}
```

**playground/package.json**:
```json
{
  "scripts": {
    "clean": "rimraf .mermaid node_modules python_modules"
  }
}
```

### Approccio 2: Script Node.js per post-build.sh

Il file `sh post-build.sh` deve essere convertito in uno script Node.js.

#### Convertiamo post-build.sh

**Prima** (packages/workbench/post-build.sh):
```bash
#!/bin/bash
# Script content qui
```

**Dopo** (packages/workbench/post-build.js):
```javascript
const fs = require('fs');
const path = require('path');

// Converti le operazioni del bash script in Node.js
// Esempio: file copy, directory creation, ecc.
```

### Approccio 3: Pacchetto `cross-env` per Env Variables (Se Necessario)

Se ci sono differenze negli environment variables:

```bash
pnpm add -D -w cross-env
```

```json
"scripts": {
  "build": "cross-env NODE_ENV=production rimraf dist && tsc"
}
```

## 📝 Piano di Implementazione

### Step 1: Installare Dipendenze

```bash
cd /home/user/motiaMatrix
pnpm add -D -w rimraf cpy-cli mkdirp cross-env
```

### Step 2: Aggiornare packages/core/package.json

Modificare gli script come mostrato sopra.

### Step 3: Aggiornare packages/workbench/package.json

1. Convertire `post-build.sh` in `post-build.js`
2. Aggiornare script build

### Step 4: Aggiornare playground/package.json

Sostituire `rm -rf` con `rimraf`.

### Step 5: Verificare Altri Package.json

Cercare e fixare eventuali altri file con comandi Unix.

### Step 6: Testing

Testare che il build funzioni:

```bash
# Test build core
cd packages/core
pnpm build

# Test build workbench
cd ../workbench
pnpm build

# Test clean playground
cd ../../playground
pnpm clean
```

### Step 7: Documentazione

Aggiornare la documentazione per includere note su Windows.

## 🧪 Testing su Windows

### Test Checklist

```
[ ] pnpm install funziona
[ ] pnpm build (root) funziona
[ ] pnpm build (core) funziona
[ ] pnpm build (workbench) funziona
[ ] pnpm clean (playground) funziona
[ ] pnpm dev funziona
[ ] pnpm dev:workbench funziona
```

### Comandi di Test

```powershell
# Da root del progetto
pnpm install
pnpm build

# Test core
cd packages\core
pnpm build
pnpm clean

# Test workbench
cd ..\workbench
pnpm build

# Test playground
cd ..\..\playground
pnpm clean

# Test dev
cd ..
pnpm dev
```

## 📊 Comparazione Approcci

| Approccio | Pro | Contro | Raccomandazione |
|-----------|-----|--------|-----------------|
| **NPM Packages** | ✅ Cross-platform nativo<br>✅ Manutenzione npm<br>✅ Comunità ampia | ❌ Dipendenze extra | ⭐⭐⭐⭐⭐ |
| **Script Separati** | ✅ Nessuna dipendenza | ❌ Manutenzione doppia<br>❌ Complessità | ⭐⭐ |
| **PowerShell + Bash** | ✅ Native | ❌ Due versioni<br>❌ Detecting OS | ⭐ |

**Scelta: Usare NPM Packages** (Approccio 1)

## 🔧 Fix Dettagliati per post-build.sh

Dobbiamo vedere il contenuto di `post-build.sh` per convertirlo. File location:
- `packages/workbench/post-build.sh`

**Prossimo Step**: Leggere il file e convertire in Node.js.

## 📚 Riferimenti

- Issue originale: #787
- PR esistente: #788
- Pacchetti:
  - [rimraf](https://www.npmjs.com/package/rimraf)
  - [cpy-cli](https://www.npmjs.com/package/cpy-cli)
  - [mkdirp](https://www.npmjs.com/package/mkdirp)
  - [cross-env](https://www.npmjs.com/package/cross-env)

## 🎯 Benefici della Soluzione

1. ✅ **Cross-platform**: Funziona su Windows, macOS, Linux
2. ✅ **Manutenibile**: Un solo script per tutti i sistemi
3. ✅ **Standard**: Usa pacchetti npm ben mantenuti
4. ✅ **Testing**: Facilmente testabile su CI/CD
5. ✅ **Developer Experience**: Stesso workflow su tutti i sistemi

## 🚀 Next Steps

1. ✅ Analisi completa (questo documento)
2. ⏳ Implementare fix per packages/core
3. ⏳ Implementare fix per packages/workbench
4. ⏳ Implementare fix per playground
5. ⏳ Convertire post-build.sh
6. ⏳ Testing completo
7. ⏳ Creare PR

---

**Stato**: Analisi completata, pronto per implementazione

**Autore**: Contributo alla soluzione di issue #787

**Data**: Novembre 2025
