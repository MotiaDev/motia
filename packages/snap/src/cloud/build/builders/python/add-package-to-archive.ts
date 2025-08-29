import fs from 'fs'
import path from 'path'
import colors from 'colors'
import { Archiver } from '../archiver'

const shouldIgnore = (filePath: string): boolean => {
  const ignorePatterns = [
    /\.pyc$/,
    /\.pyo$/,
    /\.egg$/,
    /\.egg-info$/,
    /__pycache__/,
    /\.dist-info$/,
    /^tests?\//,
    /^docs?\//,
    /^examples?\//,
    /\.pytest_cache/,
  ]
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

const findInSitePackages = (sitePackagesDir: string, packageName: string): string | null => {
  // Get potential module names
  const moduleNames = this.cache[packageName] 

  for (const moduleName of moduleNames) {
    // Check as directory
    const dirPath = path.join(sitePackagesDir, moduleName)
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      return dirPath
    }

    // Check as .py file
    const pyPath = path.join(sitePackagesDir, `${moduleName}.py`)
    if (fs.existsSync(pyPath)) {
      return pyPath
    }
  }

  return null
}

export const addPackageToArchive = async (
  archive: Archiver,
  sitePackagesDir: string,
  packageName: string,
): Promise<void> => {
  // Try dynamic resolution first
  let fullPath = findInSitePackages(sitePackagesDir, packageName)
  
  // If dynamic resolution didn't work, try heuristics
  if (!fullPath) {
    // Generate package name variations to try
    const namesToTry = [
      packageName,
      packageName.replace(/-/g, '_'),
      packageName.replace(/_/g, '-'),
      packageName.toLowerCase(),
    ]
    
    // Handle python- prefix
    if (packageName.startsWith('python-') || packageName.startsWith('python_')) {
      namesToTry.push(packageName.substring(7))
    }
    
    for (const name of namesToTry) {
      const dirPath = path.join(sitePackagesDir, name)
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        fullPath = dirPath
        break
      }
      
      const pyPath = path.join(sitePackagesDir, `${name}.py`)
      if (fs.existsSync(pyPath)) {
        fullPath = pyPath
        break
      }
    }
  }

  if (!fullPath) {
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
