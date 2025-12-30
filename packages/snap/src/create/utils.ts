import fs from 'fs'
import path from 'path'

export const checkIfFileExists = (dir: string, fileName: string): boolean => {
  return fs.existsSync(path.join(dir, fileName))
}

export const checkIfDirectoryExists = (dir: string): boolean => {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}

/**
 * Recursively copies a directory using read/write operations.
 * This is a fallback method for WSL/Windows compatibility.
 */
function copyDirectoryRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath)
    } else {
      // For files, read and write manually
      const content = fs.readFileSync(srcPath)
      fs.writeFileSync(destPath, content)
    }
  }
}

/**
 * Copies a file or directory with WSL/Windows compatibility.
 * Attempts to use fs.cpSync first for better performance, but falls back
 * to manual read/write operations if permission errors occur (common in WSL).
 *
 * @param src - Source file or directory path
 * @param dest - Destination file or directory path
 * @param isDirectory - Whether the source is a directory
 * @throws Error if copy fails after all fallback attempts
 */
export function copyWithWSLCompat(src: string, dest: string, isDirectory: boolean): void {
  // Ensure the destination *parent* directory exists.
  // - For directory copies, fs.cpSync/copyDirectoryRecursive will create `dest` as needed.
  // - For file copies, we only need the parent directory.
  fs.mkdirSync(path.dirname(dest), { recursive: true })

  try {
    // Try the standard cpSync first (faster and works in most cases)
    fs.cpSync(src, dest, {
      recursive: isDirectory,
      force: true,
    })
  } catch (error: unknown) {
    // If we get permission errors (common in WSL when writing to Windows paths),
    // fall back to manual copy using read/write operations
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? (error as NodeJS.ErrnoException).code : undefined

    if (code === 'EPERM' || code === 'EACCES') {
      if (isDirectory) {
        copyDirectoryRecursive(src, dest)
      } else {
        // For files, read and write manually
        const content = fs.readFileSync(src)
        fs.writeFileSync(dest, content)
      }
    } else {
      // Re-throw other errors
      throw error
    }
  }
}
