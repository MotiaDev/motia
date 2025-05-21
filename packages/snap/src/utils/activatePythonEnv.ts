import path from 'path'
import fs from 'fs'
import { findPythonSitePackagesDir } from './pythonVersionUtils'

interface VenvConfig {
  baseDir: string
  isVerbose?: boolean
  pythonVersion?: string
}

export const activatePythonVenv = ({ baseDir, isVerbose = false, pythonVersion = '3.13' }: VenvConfig): void => {
  // Set the virtual environment path
  const venvPath = path.join(baseDir, 'python_modules')
  const venvBinPath = path.join(venvPath, process.platform === 'win32' ? 'Scripts' : 'bin')
  const libPath = path.join(venvPath, 'lib')
  
  // Find the Python version directory using the utility function
  const actualPythonVersionPath = findPythonSitePackagesDir(libPath, pythonVersion, isVerbose)
  const sitePackagesPath = path.join(venvPath, 'lib', actualPythonVersionPath, 'site-packages')

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

    // Log Python environment information if verbose mode is enabled
    if (isVerbose) {
      const pythonPath =
        process.platform === 'win32' ? path.join(venvBinPath, 'python.exe') : path.join(venvBinPath, 'python')
      console.log('🐍 Using Python from:', pythonPath)
      console.log('📦 Site-packages path:', sitePackagesPath)
    }
  } else {
    console.warn('❌ Python virtual environment not found in python_modules/')
    console.warn('Please run `motia install` to create a new virtual environment')
  }
}
