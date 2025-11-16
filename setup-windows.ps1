# Motia Windows Setup Script
# Questo script verifica i prerequisiti e aiuta nell'installazione di Motia su Windows

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   Motia Windows Setup Script    " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Funzione per verificare se un comando esiste
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Funzione per ottenere la versione di un comando
function Get-CommandVersion {
    param($Command, $VersionArg = "--version")
    try {
        $version = & $Command $VersionArg 2>&1 | Select-Object -First 1
        return $version
    }
    catch {
        return "Non rilevata"
    }
}

Write-Host "Verifica dei prerequisiti..." -ForegroundColor Yellow
Write-Host ""

# Verifica Node.js
Write-Host "1. Node.js:" -NoNewline
if (Test-Command "node") {
    $nodeVersion = Get-CommandVersion "node" "-v"
    Write-Host " ✓ Installato ($nodeVersion)" -ForegroundColor Green
} else {
    Write-Host " ✗ NON installato" -ForegroundColor Red
    Write-Host "   Scarica da: https://nodejs.org/" -ForegroundColor Yellow
}

# Verifica npm
Write-Host "2. npm:" -NoNewline
if (Test-Command "npm") {
    $npmVersion = Get-CommandVersion "npm" "-v"
    Write-Host " ✓ Installato (v$npmVersion)" -ForegroundColor Green
} else {
    Write-Host " ✗ NON installato" -ForegroundColor Red
}

# Verifica Python
Write-Host "3. Python:" -NoNewline
if (Test-Command "python") {
    $pythonVersion = Get-CommandVersion "python" "--version"
    Write-Host " ✓ Installato ($pythonVersion)" -ForegroundColor Green
} else {
    Write-Host " ✗ NON installato" -ForegroundColor Red
    Write-Host "   Scarica da: https://www.python.org/downloads/" -ForegroundColor Yellow
}

# Verifica pip
Write-Host "4. pip:" -NoNewline
if (Test-Command "pip") {
    $pipVersion = Get-CommandVersion "pip" "--version"
    Write-Host " ✓ Installato ($pipVersion)" -ForegroundColor Green
} else {
    Write-Host " ✗ NON installato" -ForegroundColor Red
}

# Verifica Git
Write-Host "5. Git:" -NoNewline
if (Test-Command "git") {
    $gitVersion = Get-CommandVersion "git" "--version"
    Write-Host " ✓ Installato ($gitVersion)" -ForegroundColor Green
} else {
    Write-Host " ✗ NON installato" -ForegroundColor Red
    Write-Host "   Scarica da: https://git-scm.com/download/win" -ForegroundColor Yellow
}

# Verifica pnpm
Write-Host "6. pnpm:" -NoNewline
if (Test-Command "pnpm") {
    $pnpmVersion = Get-CommandVersion "pnpm" "-v"
    Write-Host " ✓ Installato (v$pnpmVersion)" -ForegroundColor Green
} else {
    Write-Host " ✗ NON installato" -ForegroundColor Red
    Write-Host "   Vuoi installare pnpm ora? (s/n): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 's' -or $response -eq 'S') {
        Write-Host "   Installazione di pnpm in corso..." -ForegroundColor Yellow
        npm install -g pnpm@10.11.0
        if ($?) {
            Write-Host "   ✓ pnpm installato con successo!" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Errore durante l'installazione di pnpm" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan

# Chiedi all'utente quale tipo di setup vuole fare
Write-Host ""
Write-Host "Che tipo di setup vuoi eseguire?" -ForegroundColor Yellow
Write-Host "1. Sviluppo del Framework Motia (contribuire al progetto)" -ForegroundColor White
Write-Host "2. Creare un nuovo progetto Motia" -ForegroundColor White
Write-Host "3. Integrare Motia in un progetto esistente" -ForegroundColor White
Write-Host "4. Solo verifica prerequisiti (fatto)" -ForegroundColor White
Write-Host "0. Esci" -ForegroundColor White
Write-Host ""
Write-Host "Scelta: " -NoNewline -ForegroundColor Yellow
$choice = Read-Host

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Setup per sviluppo del Framework Motia..." -ForegroundColor Cyan
        Write-Host ""

        # Verifica se siamo già nella directory del progetto
        if (Test-Path "package.json") {
            Write-Host "Rilevato package.json nella directory corrente." -ForegroundColor Green
            Write-Host "Installazione dipendenze..." -ForegroundColor Yellow
            pnpm install

            if ($?) {
                Write-Host ""
                Write-Host "Build del progetto..." -ForegroundColor Yellow
                pnpm build

                if ($?) {
                    Write-Host ""
                    Write-Host "✓ Setup completato!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Prossimi passi:" -ForegroundColor Yellow
                    Write-Host "1. Configura le variabili d'ambiente:" -ForegroundColor White
                    Write-Host "   Copy-Item playground\.env.example playground\.env" -ForegroundColor Gray
                    Write-Host "   notepad playground\.env" -ForegroundColor Gray
                    Write-Host ""
                    Write-Host "2. Avvia il workbench:" -ForegroundColor White
                    Write-Host "   pnpm dev:workbench" -ForegroundColor Gray
                    Write-Host ""
                    Write-Host "3. Apri il browser su: http://localhost:3000" -ForegroundColor White
                }
            }
        } else {
            Write-Host "Per lo sviluppo del framework, devi prima clonare il repository:" -ForegroundColor Yellow
            Write-Host "git clone https://github.com/MotiaDev/motia.git" -ForegroundColor Gray
            Write-Host "cd motia" -ForegroundColor Gray
            Write-Host "poi riesegui questo script." -ForegroundColor Yellow
        }
    }

    "2" {
        Write-Host ""
        Write-Host "Creazione di un nuovo progetto Motia..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Nome del progetto: " -NoNewline -ForegroundColor Yellow
        $projectName = Read-Host

        if ($projectName) {
            Write-Host "Creazione del progetto '$projectName'..." -ForegroundColor Yellow
            npx motia@latest create

            if ($?) {
                Write-Host ""
                Write-Host "✓ Progetto creato!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Prossimi passi:" -ForegroundColor Yellow
                Write-Host "1. Entra nella directory del progetto:" -ForegroundColor White
                Write-Host "   cd $projectName" -ForegroundColor Gray
                Write-Host ""
                Write-Host "2. Installa le dipendenze:" -ForegroundColor White
                Write-Host "   npm install" -ForegroundColor Gray
                Write-Host ""
                Write-Host "3. Avvia il server di sviluppo:" -ForegroundColor White
                Write-Host "   npx motia dev" -ForegroundColor Gray
            }
        }
    }

    "3" {
        Write-Host ""
        Write-Host "Integrazione di Motia in un progetto esistente..." -ForegroundColor Cyan
        Write-Host ""

        if (Test-Path "package.json") {
            Write-Host "Installazione di Motia..." -ForegroundColor Yellow
            npm install motia

            if ($?) {
                Write-Host "Inizializzazione di Motia nel progetto..." -ForegroundColor Yellow
                npx motia install

                if ($?) {
                    Write-Host ""
                    Write-Host "✓ Motia integrato con successo!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Prossimi passi:" -ForegroundColor Yellow
                    Write-Host "1. Crea i tuoi steps nella directory 'steps/'" -ForegroundColor White
                    Write-Host "2. Avvia Motia:" -ForegroundColor White
                    Write-Host "   npx motia dev" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "✗ Nessun package.json trovato nella directory corrente." -ForegroundColor Red
            Write-Host "  Assicurati di essere nella directory del tuo progetto Node.js." -ForegroundColor Yellow
        }
    }

    "4" {
        Write-Host ""
        Write-Host "Verifica prerequisiti completata." -ForegroundColor Green
    }

    "0" {
        Write-Host ""
        Write-Host "Uscita..." -ForegroundColor Yellow
    }

    default {
        Write-Host ""
        Write-Host "Scelta non valida." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Per ulteriori informazioni, consulta:" -ForegroundColor Cyan
Write-Host "- WINDOWS_SETUP.md (guida completa)" -ForegroundColor White
Write-Host "- https://motia.dev/docs (documentazione online)" -ForegroundColor White
Write-Host ""
