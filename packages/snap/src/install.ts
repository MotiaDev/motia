import path from 'path'
import fs from 'fs'
import { executeCommand } from './utils/execute-command'
import { activatePythonVenv } from './utils/activate-python-env'
import { installLambdaPythonPackages } from './utils/install-lambda-python-packages'
import { getStepFiles } from './generate-locked-data'
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

export const install = async ({ isVerbose = false, pythonVersion = '3.13' }: InstallConfig): Promise<void> => {
  const baseDir = process.cwd()
  const steps = getStepFiles(baseDir)
  if (steps.some((file) => file.endsWith('.py'))) {
    await pythonInstall({ baseDir, isVerbose, pythonVersion })
  }

  console.info('✅ Installation completed successfully!')

  process.exit(0)
}
