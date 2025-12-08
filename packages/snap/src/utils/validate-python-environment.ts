import fs from 'fs'
import path from 'path'
import { getPackageManager } from './get-package-manager'
import { internalLogger } from './internal-logger'
import { getPythonCommand } from './python-version-utils'

export interface ValidationResult {
  success: boolean
  hasPythonFiles: boolean
}

interface ValidateConfig {
  baseDir: string
  hasPythonFiles: boolean
  pythonVersion?: string
}

function getInstallCommand(baseDir: string): string {
  const pm = getPackageManager(baseDir)
  switch (pm) {
    case 'yarn':
      return 'yarn install'
    case 'pnpm':
      return 'pnpm install'
    case 'bun':
      return 'bun install'
    case 'npm':
    default:
      return 'npm install'
  }
}

export async function validatePythonEnvironment({
  baseDir,
  hasPythonFiles,
  pythonVersion = '3.13',
}: ValidateConfig): Promise<ValidationResult> {
  if (!hasPythonFiles) {
    return { success: true, hasPythonFiles: false }
  }

  try {
    await getPythonCommand(pythonVersion, baseDir)
  } catch {
    internalLogger.error('Python is not installed')
    internalLogger.info('Python files were detected in your project but Python 3 is not available')
    internalLogger.info('Please install Python 3.10 or higher: https://www.python.org/downloads/')
    return { success: false, hasPythonFiles: true }
  }

  const venvPath = path.join(baseDir, 'python_modules')
  if (!fs.existsSync(venvPath)) {
    const installCmd = getInstallCommand(baseDir)
    internalLogger.error('Python environment not configured')
    internalLogger.info('The python_modules directory was not found')
    internalLogger.info(`Run '${installCmd}' to set up your Python environment`)
    return { success: false, hasPythonFiles: true }
  }

  const libPath = path.join(venvPath, 'lib')
  if (!fs.existsSync(libPath)) {
    const installCmd = getInstallCommand(baseDir)
    internalLogger.error('Python environment is incomplete')
    internalLogger.info('The python_modules directory exists but appears to be corrupted')
    internalLogger.info(`Run '${installCmd}' to recreate your Python environment`)
    return { success: false, hasPythonFiles: true }
  }

  try {
    const libContents = fs.readdirSync(libPath)
    const pythonDirs = libContents.filter((item) => item.startsWith('python3'))

    if (pythonDirs.length === 0) {
      const installCmd = getInstallCommand(baseDir)
      internalLogger.error('Python environment is incomplete')
      internalLogger.info('The python_modules/lib directory exists but contains no Python version directories')
      internalLogger.info(`Run '${installCmd}' to recreate your Python environment`)
      return { success: false, hasPythonFiles: true }
    }
  } catch (error: any) {
    const installCmd = getInstallCommand(baseDir)
    internalLogger.error('Python environment is incomplete')
    internalLogger.info('The python_modules/lib directory cannot be read')
    internalLogger.info(`Run '${installCmd}' to recreate your Python environment`)
    return { success: false, hasPythonFiles: true }
  }

  return { success: true, hasPythonFiles: true }
}
