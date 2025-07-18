import fs from 'fs'
import path from 'path'
import colors from 'colors'
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
  // First try the package name as is
  let fullPath = path.join(sitePackagesDir, packageName)

  // If not found, try with .py extension
  if (!fs.existsSync(fullPath)) {
    const pyPath = path.join(sitePackagesDir, `${packageName}.py`)
    if (fs.existsSync(pyPath)) {
      fullPath = pyPath
    }
  }

  if (!fs.existsSync(fullPath)) {
    console.log(colors.yellow(`Warning: Package not found in site-packages: ${packageName}`))
    return
  }

  const stat = fs.statSync(fullPath)
  if (stat.isDirectory()) {
    await addDirectoryToArchive(archive, sitePackagesDir, fullPath)
  } else {
    const relativePath = path.relative(sitePackagesDir, fullPath)
    archive.append(fs.createReadStream(fullPath), relativePath)
  }
}
