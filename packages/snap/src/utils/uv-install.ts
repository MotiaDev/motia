import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import colors from 'colors'

export interface UvInstallConfig {
  baseDir: string
  isVerbose?: boolean
  pythonVersion?: string
}

export const uvInstall = async ({
  baseDir,
  isVerbose = false,
  pythonVersion = '3.13'
}: UvInstallConfig): Promise<void> => {
  const projectDir = baseDir
  console.log('📦 Installing Python dependencies with UV...', projectDir)

  try {
    if (!await checkUvInstalled()) {
      throw new Error('UV is not installed. Please install UV: curl -LsSf https://astral.sh/uv/install.sh | sh')
    }

    await ensureUvProject(projectDir, pythonVersion, isVerbose)
    await installDependencies(projectDir, isVerbose)
    
    console.log(colors.green('✅ Python dependencies installed successfully with UV'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ UV Installation failed:', errorMessage)
    throw error
  }
}

async function checkUvInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('uv', ['--version'], { stdio: 'pipe' })
    
    child.on('close', (code) => {
      resolve(code === 0)
    })
    
    child.on('error', () => {
      resolve(false)
    })
  })
}

async function ensureUvProject(projectDir: string, pythonVersion: string, isVerbose: boolean): Promise<void> {
  const pyprojectPath = path.join(projectDir, 'pyproject.toml')
  
  if (!fs.existsSync(pyprojectPath)) {
    if (isVerbose) {
      console.log('📄 Creating pyproject.toml...')
    }
    
    await runUvCommand(['init', '--no-readme'], projectDir)
    
    const pyprojectContent = generatePyprojectToml(pythonVersion)
    fs.writeFileSync(pyprojectPath, pyprojectContent)
  }

  const pythonVersionFile = path.join(projectDir, '.python-version')
  if (!fs.existsSync(pythonVersionFile)) {
    fs.writeFileSync(pythonVersionFile, pythonVersion)
  }
}

async function installDependencies(projectDir: string, isVerbose: boolean): Promise<void> {
  const coreRequirementsPath = path.join(projectDir, 'node_modules', 'motia', 'dist', 'requirements-core.txt')
  const snapRequirementsPath = path.join(projectDir, 'node_modules', 'motia', 'dist', 'requirements-snap.txt')
  const localRequirements = path.join(projectDir, 'requirements.txt')

  const requirementsList = [coreRequirementsPath, snapRequirementsPath, localRequirements]

  for (const requirement of requirementsList) {
    if (fs.existsSync(requirement)) {
      if (isVerbose) {
        console.log(`📄 Installing from: ${requirement}`)
      }
      
      try {
        await runUvCommand(['add', '--requirements', requirement], projectDir)
      } catch (error) {
        console.warn(colors.yellow(`Warning: Could not install some dependencies from ${requirement}`))
        if (isVerbose) {
          console.warn(error)
        }
      }
    } else if (isVerbose) {
      console.log(colors.yellow(`⚠️  Requirements file not found: ${requirement}`))
    }
  }

  if (isVerbose) {
    console.log('🔄 Syncing UV environment...')
  }
  
  await runUvCommand(['sync'], projectDir)
}

function generatePyprojectToml(pythonVersion: string): string {
  return `[project]
name = "motia-project"
version = "0.1.0"
description = "Motia Python project"
requires-python = ">=${pythonVersion}"
dependencies = []

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.uv]
dev-dependencies = []
package = false

[tool.uv.sources]
`
}

async function runUvCommand(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('uv', args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`UV command failed: ${stderr || stdout}`))
      }
    })
    
    child.on('error', (error) => {
      reject(new Error(`Failed to spawn UV: ${error.message}`))
    })
  })
}
