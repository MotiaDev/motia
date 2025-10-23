import fs from 'fs'
import path from 'path'
import { getStepFiles } from './generate-locked-data'
import { activatePythonVenv } from './utils/activate-python-env'
import { ensureUvInstalled } from './utils/ensure-uv'
import { executeCommand } from './utils/execute-command'
import { installLambdaPythonPackages } from './utils/install-lambda-python-packages'
import { getPythonCommand } from './utils/python-version-utils'

interface InstallConfig {
  isVerbose?: boolean
  pythonVersion?: string
}

type PythonInstallConfig = InstallConfig & { baseDir: string }

export const pythonInstall = async ({
  baseDir,
  isVerbose = false,
  pythonVersion = '3.13',
}: PythonInstallConfig): Promise<void> => {
  const venvPath = path.join(baseDir, 'python_modules')
  console.log('📦 Installing Python dependencies...', venvPath)

  const coreRequirementsPath = path.join(baseDir, 'node_modules', 'motia', 'dist', 'requirements-core.txt')
  const snapRequirementsPath = path.join(baseDir, 'node_modules', 'motia', 'dist', 'requirements-snap.txt')
  const localRequirements = path.join(baseDir, 'requirements.txt')

  const requirementsList = [coreRequirementsPath, snapRequirementsPath, localRequirements]

  try {
    // Get the appropriate Python command
    const pythonCmd = await getPythonCommand(pythonVersion, baseDir)
    if (isVerbose) {
      console.log(`🐍 Using Python command: ${pythonCmd}`)
    }

    // Check if virtual environment exists
    if (!fs.existsSync(venvPath)) {
      console.log('📦 Creating Python virtual environment...')
      await executeCommand(`${pythonCmd} -m venv python_modules`, baseDir)
    }

    activatePythonVenv({ baseDir, isVerbose, pythonVersion })

    // Ensure UV is installed
    console.log('🔧 Checking UV installation...')
    await ensureUvInstalled()
    console.log('✅ UV is available')

    installLambdaPythonPackages({ isVerbose, requirementsList })

    // Install requirements
    console.log('📥 Installing Python dependencies...')

    // Core requirements

    for (const requirement of requirementsList) {
      if (fs.existsSync(requirement)) {
        if (isVerbose) {
          console.log('📄 Using requirements from:', requirement)
        }
        await executeCommand(`pip install -r "${requirement}" --only-binary=:all:`, baseDir)
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Installation failed:', errorMessage)
    process.exit(1)
  }
}

const csharpInstall = async (baseDir: string): Promise<void> => {
  console.log('🔧 Checking .NET SDK installation...')

  try {
    const { execSync } = require('child_process')
    const dotnetVersion = execSync('dotnet --version', { encoding: 'utf-8' }).trim()
    console.log(`✅ .NET SDK detected: ${dotnetVersion}`)

    // Check if .NET 9 is installed
    if (!dotnetVersion.startsWith('9.')) {
      console.warn('⚠️  Warning: .NET 9 is recommended for C# steps. You have version', dotnetVersion)
      console.warn('   Download .NET 9 from: https://dotnet.microsoft.com/download/dotnet/9.0')
    }
  } catch (error) {
    console.error('❌ .NET SDK not found!')
    console.error('   Please install .NET 9 SDK from: https://dotnet.microsoft.com/download/dotnet/9.0')
    process.exit(1)
  }
}

export const install = async ({ isVerbose = false, pythonVersion = '3.13' }: InstallConfig): Promise<void> => {
  const baseDir = process.cwd()

  const steps = getStepFiles(baseDir)
  if (steps.some((file) => file.endsWith('.py'))) {
    await pythonInstall({ baseDir, isVerbose, pythonVersion })
  }

  if (steps.some((file) => file.endsWith('.cs'))) {
    await csharpInstall(baseDir)
  }

  console.info('✅ Installation completed successfully!')

  process.exit(0)
}
