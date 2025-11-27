import path from 'path'
import fs from 'fs'
import { PythonError } from './python-errors'

/**
 * Resolve the name of the import from the name of the package
 * @param depName the package name
 * @returns a map of the import name to the package name
 */
export const resolveDepNames = (depNames: string[], sitePackagesDir: string): Record<string, string> => {
  const folders = fs
    .readdirSync(sitePackagesDir)
    .filter((folder) => fs.statSync(path.join(sitePackagesDir, folder)).isDirectory())

  const result: Record<string, string> = {}

  for (const depName of depNames) {
    const regex = new RegExp(`^${depName.replace(/-/g, '[-_]')}-.*\\.dist-info$`)
    const folder = folders.find((folder) => regex.test(folder))

    if (folder) {
      const topLevelFile = fs.existsSync(path.join(sitePackagesDir, folder, 'top_level.txt'))
      const recordFile = fs.existsSync(path.join(sitePackagesDir, folder, 'RECORD'))

      if (topLevelFile) {
        const topLevel = fs.readFileSync(path.join(sitePackagesDir, folder, 'top_level.txt'), 'utf8').trim()
        result[topLevel] = depName
      } else if (recordFile) {
        const record = fs.readFileSync(path.join(sitePackagesDir, folder, 'RECORD'), 'utf8').trim()

        // Parse RECORD file to find the main module name
        const recordLines = record.split('\n').filter((line) => line.trim())

        for (const line of recordLines) {
          // RECORD format: path/__init__.py,sha256=hash,size
          const match = /^([^/]+)\/__init__\.py,/.exec(line)

          if (match) {
            result[match[1]] = depName
          }
        }
      } else {
        throw new PythonError(`Could not find dependency name in site-packages: ${depName}`, depName)
      }
    } else {
      throw new PythonError(`Could not find dependency name in site-packages: ${depName}`, depName)
    }
  }

  return result
}
