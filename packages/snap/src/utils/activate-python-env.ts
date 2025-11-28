import fs from 'fs'
import path from 'path'
import { internalLogger } from './internal-logger'
import { findPythonSitePackagesDir } from './python-version-utils'

interface VenvConfig {
  baseDir: string
  isVerbose?: boolean
  pythonVersion?: string
}

export const getSitePackagesPath = ({ baseDir, pythonVersion = '3.13' }: VenvConfig): string => {
  const venvPath = path.join(baseDir, 'python_modules')
  const libPath = path.join(venvPath, 'lib')
  const actualPythonVersionPath = findPythonSitePackagesDir(libPath, pythonVersion)
  return path.join(venvPath, 'lib', actualPythonVersionPath, 'site-packages')
}

export const activatePythonVenv = ({ baseDir, isVerbose = false, pythonVersion = '3.13' }: VenvConfig): void => {
  internalLogger.info('Activating Python environment')

  // Set the virtual environment path
  const venvPath = path.join(baseDir, 'python_modules')
  const venvBinPath = path.join(venvPath, process.platform === 'win32' ? 'Scripts' : 'bin')

  // Find the Python version directory using the utility function
  const sitePackagesPath = getSitePackagesPath({ baseDir, pythonVersion })

  // Verify that the virtual environment exists
  if (fs.existsSync(venvPath)) {
    // Add virtual environment to PATH
    process.env.PATH = `${venvBinPath}${path.delimiter}${process.env.PATH}`
    // Set VIRTUAL_ENV environment variable
    process.env.VIRTUAL_ENV = venvPath
    // Set PYTHON_SITE_PACKAGES with the site-packages path
    process.env.PYTHON_SITE_PACKAGES = sitePackagesPath
    // Remove PYTHONHOME if it exists as it can interfere with venv
    delete process.env.PYTHONHOME

    // Ensure motia/core types exist for Python users
    const motiaDir = path.join(baseDir, 'motia')
    const coreDest = path.join(motiaDir, 'core')
    const coreSourceCandidates = [
      path.resolve(baseDir, 'node_modules/@motiadev/core/dist/src/python/motia_core'),
      path.resolve(baseDir, 'node_modules/@motiadev/core/src/python/motia_core'),
    ]
    const coreSource = coreSourceCandidates.find((p) => fs.existsSync(p))

    if (!coreSource) {
      internalLogger.warn('[motia] Could not find motia_core in @motiadev/core; skipping type copy')
    } else if (!fs.existsSync(coreDest)) {
      fs.mkdirSync(motiaDir, { recursive: true })
      fs.cpSync(coreSource, coreDest, { recursive: true })
      internalLogger.info('[motia] Copied core Python types to motia/core')
    } else {
      internalLogger.info('[motia] motia/core already exists, skipping copy')
    }

    // Log Python environment information if verbose mode is enabled
    if (isVerbose) {
      const pythonPath =
        process.platform === 'win32' ? path.join(venvBinPath, 'python.exe') : path.join(venvBinPath, 'python')

      const relativePath = (p: string) => p.replace(baseDir, '<projectDir>')

      internalLogger.info('Using Python', relativePath(pythonPath))
      internalLogger.info('Site-packages path', relativePath(sitePackagesPath))
    }
  } else {
    internalLogger.error('Python virtual environment not found in python_modules/')
    internalLogger.error('Please run `motia install` to create a new virtual environment')
  }
}
