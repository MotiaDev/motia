import fs from 'fs'
import path from 'path'
import { Archiver } from '../archiver'

const shouldIgnore = (filePath: string): boolean => {
  const ignorePatterns = [/\.pyc$/, /\.egg$/, /__pycache__/, /\.dist-info$/]
  return ignorePatterns.some((pattern) => pattern.test(filePath))
}

const addDirectoryToArchive = async (archive: Archiver, baseDir: string, dirPath: string): Promise<void> => {
  const files = fs.readdirSync(dirPath)

  await Promise.all(
    files
      .map(async (file) => {
        const fullPath = path.join(dirPath, file)
        const relativePath = path.relative(baseDir, fullPath)

        if (shouldIgnore(relativePath)) {
          return
        }

        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          await addDirectoryToArchive(archive, baseDir, fullPath)
        } else {
          archive.append(fs.createReadStream(fullPath), relativePath)
        }
      })
      .filter(Boolean),
  )
}

export const addPackageToArchive = async (
  archive: Archiver,
  sitePackagesDir: string,
  packageName: string,
): Promise<void> => {
  const packageNameVariations = [packageName, `${packageName}.py`]

  // Iterate over all possible package name variations
  for (const pkg of packageNameVariations) {
    let fullPath = path.join(sitePackagesDir, pkg)

    if (!fs.existsSync(fullPath)) {
      // If not found, try next package name variation
      continue
    }

    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      await addDirectoryToArchive(archive, sitePackagesDir, fullPath)
    } else {
      const relativePath = path.relative(sitePackagesDir, fullPath)
      archive.append(fs.createReadStream(fullPath), relativePath)
    }

    // package added successfully
    return
  }
}
