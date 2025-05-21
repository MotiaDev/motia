import { executeCommand } from './executeCommand'
import fs from 'fs'
import path from 'path'

export async function checkPythonVersionExists(pythonCmd: string, baseDir: string): Promise<boolean> {
  try {
    await executeCommand(`${pythonCmd} --version`, baseDir, { silent: true })
    return true
  } catch (error) {
    return false
  }
}

export async function getPythonCommand(requestedVersion: string, baseDir: string): Promise<string> {
  // Check if python{version} exists (e.g., python3.13)
  const specificPythonCmd = `python${requestedVersion}`
  if (await checkPythonVersionExists(specificPythonCmd, baseDir)) {
    return specificPythonCmd
  }
  
  // Check if python exists and is version 3+
  try {
    const result = await executeCommand('python --version', baseDir, { silent: true })
    const versionMatch = result.match(/Python\s+(\d+)\.(\d+)\.(\d+)/)
    if (versionMatch && parseInt(versionMatch[1], 10) >= 3) {
      return 'python'
    }
  } catch (error) {
    // If error, python command doesn't exist or can't be executed
  }
  
  throw new Error('No compatible Python 3 installation found. Please install Python 3.')
}

export function findPythonSitePackagesDir(venvLibPath: string, pythonVersion: string, isVerbose = false): string {
  let pythonVersionPath = `python${pythonVersion}`
  
  if (!venvLibPath || !pythonVersion) {
    return pythonVersionPath
  }
  
  try {
    // Check if the exact version exists
    if (venvLibPath && !fs.existsSync(path.join(venvLibPath, pythonVersionPath))) {
      // Try to find any python3.x directory
      const libContents = fs.readdirSync(venvLibPath)
      const pythonDirs = libContents.filter(item => item.startsWith('python3'))
      
      if (pythonDirs.length > 0) {
        // Use the first python3.x directory found
        pythonVersionPath = pythonDirs[0]
        if (isVerbose) {
          console.log(`Found Python directory: ${pythonVersionPath}`)
        }
      }
    }
  } catch (error) {
    if (isVerbose) {
      console.warn(`Warning: Could not determine Python version directory: ${error}`)
    }
  }
  
  return pythonVersionPath
} 