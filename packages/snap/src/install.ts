import path from 'path'
import fs from 'fs'
import { executeCommand } from './utils/executeCommand'
import { activatePythonVenv } from './utils/activatePythonEnv'
import { installLambdaPythonPackages } from './utils/installLambdaPythonPackages'
import { getStepFiles } from './generate-locked-data'

interface InstallConfig {
  isVerbose?: boolean
  pythonVersion?: string
}

type PythonInstallConfig = InstallConfig & { baseDir: string }

const pythonInstall = async ({ baseDir, isVerbose = false, pythonVersion = '3.13' }: PythonInstallConfig): Promise<void> => {
  const venvPath = path.join(baseDir, 'python_modules')
  console.log('📦 Installing Python dependencies...', venvPath)

  try {
    // Check if virtual environment exists
    if (!fs.existsSync(venvPath)) {
      console.log('📦 Creating Python virtual environment...')
      await executeCommand(`python${pythonVersion} -m venv python_modules`, baseDir)
    }

    activatePythonVenv({ baseDir, isVerbose, pythonVersion })
    installLambdaPythonPackages({ baseDir, isVerbose })

    // Install requirements
    console.log('📥 Installing Python dependencies...')

    // Core requirements
    const coreRequirementsPath = path.join(baseDir, 'node_modules', 'motia', 'dist', 'requirements-core.txt')
    if (fs.existsSync(coreRequirementsPath)) {
      if (isVerbose) {
        console.log('📄 Using core requirements from:', coreRequirementsPath)
      }
      await executeCommand(`pip install -r "${coreRequirementsPath}" --only-binary=:all:`, baseDir)
    } else {
      console.warn(`⚠️ Core requirements not found at: ${coreRequirementsPath}`)
    }

    // Snap requirements
    const snapRequirementsPath = path.join(baseDir, 'node_modules', 'motia', 'dist', 'requirements-snap.txt')
    if (fs.existsSync(snapRequirementsPath)) {
      if (isVerbose) {
        console.log('📄 Using snap requirements from:', snapRequirementsPath)
      }
      await executeCommand(`pip install -r "${snapRequirementsPath}" --only-binary=:all:`, baseDir)
    } else {
      console.warn(`⚠️ Snap requirements not found at: ${snapRequirementsPath}`)
    }

    // Project-specific requirements
    const localRequirements = path.join(baseDir, 'requirements.txt')
    if (fs.existsSync(localRequirements)) {
      if (isVerbose) {
        console.log('📄 Using project requirements from:', localRequirements)
      }
      await executeCommand(`pip install -r "${localRequirements}" --only-binary=:all:`, baseDir)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Installation failed:', errorMessage)
    process.exit(1)
  }
}

export const install = async ({ isVerbose = false, pythonVersion = '3.13' }: InstallConfig): Promise<void> => {
  const baseDir = process.cwd()
  const steps = getStepFiles(baseDir)
  if (steps.some((file) => file.endsWith('.py'))) {
    await pythonInstall({ baseDir, isVerbose, pythonVersion })
  }

  console.info('✅ Installation completed successfully!')

  process.exit(0);
}
