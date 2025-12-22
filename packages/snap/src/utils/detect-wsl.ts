/**
 * Detects if we're running in WSL2 with a Windows filesystem path.
 * This is used to determine if we need to add --no-bin-links to npm commands
 * to avoid EPERM errors when npm tries to chmod files on Windows filesystem.
 */

/**
 * Check if the current environment is WSL (Windows Subsystem for Linux)
 */
export function isWsl(): boolean {
  // Check for WSL-specific environment variables
  if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
    return true
  }

  // Check if running on Linux (WSL reports as Linux)
  if (process.platform !== 'linux') {
    return false
  }

  // Additional check: look for WSL in the kernel version
  try {
    const os = require('os')
    const release = os.release().toLowerCase()
    return release.includes('microsoft') || release.includes('wsl')
  } catch {
    return false
  }
}

/**
 * Check if a path is on the Windows filesystem (mounted via /mnt/)
 */
export function isWindowsFilesystemPath(targetPath: string): boolean {
  // Windows drives are mounted at /mnt/c/, /mnt/d/, etc. in WSL
  return targetPath.startsWith('/mnt/')
}

/**
 * Determines if --no-bin-links should be used for npm commands.
 * This is needed when running in WSL2 on Windows filesystem to avoid
 * EPERM errors during npm install.
 */
export function shouldUseNoBinLinks(targetPath: string): boolean {
  return isWsl() && isWindowsFilesystemPath(targetPath)
}
