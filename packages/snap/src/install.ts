import fs from 'fs'
import path from 'path'
import pc from 'picocolors'
import { getStepFiles, getStreamFiles } from './generate-locked-data'
import { activatePythonVenv } from './utils/activate-python-env'
import { ensureUvInstalled } from './utils/ensure-uv'
import { executeCommand } from './utils/execute-command'
import { installLambdaPythonPackages } from './utils/install-lambda-python-packages'
import { internalLogger } from './utils/internal-logger'
import { getPythonCommand } from './utils/python-version-utils'
import { getInstallCommand } from './utils/validate-python-environment'

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

    const sitePackagesPath = process.env.PYTHON_SITE_PACKAGES

    if (!sitePackagesPath || !fs.existsSync(sitePackagesPath)) {
      const installCmd = getInstallCommand(baseDir)
      internalLogger.error('Python virtual environment was not created')
      internalLogger.info(
        `Please try running ${pc.cyan(installCmd)} or manually create the venv with: ${pc.cyan('python3 -m venv python_modules')}`,
      )
      process.exit(1)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    internalLogger.error('Installation failed:', errorMessage)
    process.exit(1)
  }
}

export const install = async ({ isVerbose = false, pythonVersion = '3.13' }: InstallConfig): Promise<void> => {
  const baseDir = process.cwd()

  const steps = getStepFiles(baseDir)
  const streams = getStreamFiles(baseDir)
  if (steps.some((file) => file.endsWith('.py')) || streams.some((file) => file.endsWith('.py'))) {
    await pythonInstall({ baseDir, isVerbose, pythonVersion })
  }

  console.info('✅ Installation completed successfully!')

  process.exit(0)
}
