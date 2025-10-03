/**
 * Configuration for step directories that Motia will scan for step files.
 * This allows flexibility in project structure while maintaining backward compatibility.
 */

export interface StepDirectoryConfig {
  /** Array of directory names to scan for step files */
  directories: string[]
  /** Whether to scan recursively within each directory */
  recursive: boolean
}

/**
 * Default step directory configuration.
 * Supports both 'steps' (legacy) and 'src' directories for backward compatibility.
 */
export const DEFAULT_STEP_DIRECTORIES: StepDirectoryConfig = {
  directories: ['steps', 'src'],
  recursive: true,
}

/**
 * Get step directories configuration from environment variables or use defaults.
 * 
 * Environment variables:
 * - MOTIA_STEP_DIRS: Comma-separated list of directories (e.g., "steps,src")
 * - MOTIA_STEP_RECURSIVE: Whether to scan recursively (default: true)
 */
export const getStepDirectoryConfig = (): StepDirectoryConfig => {
  const envDirs = process.env.MOTIA_STEP_DIRS
  const envRecursive = process.env.MOTIA_STEP_RECURSIVE

  if (envDirs) {
    return {
      directories: envDirs.split(',').map(dir => dir.trim()),
      recursive: envRecursive !== 'false',
    }
  }

  // Even when using default directories, check for recursive setting
  return {
    directories: DEFAULT_STEP_DIRECTORIES.directories,
    recursive: envRecursive !== 'false',
  }
}

/**
 * Get all step directories for a given project root.
 * Returns absolute paths to all configured step directories that exist.
 */
export const getStepDirectoryPaths = (projectDir: string): string[] => {
  const config = getStepDirectoryConfig()
  const path = require('path')
  
  return config.directories
    .map(dir => path.join(projectDir, dir))
    .filter(dirPath => {
      try {
        const fs = require('fs')
        return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
      } catch {
        return false
      }
    })
}
