import fs from 'fs'
import path from 'path'
import { PythonDependencyAnalyzer } from './python-dependency-analyzer'
import { PackageCopier } from './package-copier'
import { UvPackager } from './uv-packager'
import { Archiver } from '../archiver'
import { distDir } from '../../../new-deployment/constants'

export interface PackageBuildOptions {
  pythonFiles: string[]
  archive: Archiver
  projectDir: string
}

export interface PackageBuildResult {
  packagesUsed: number
  optimized: boolean
  tempDirCreated?: string
}

export class PackageHandler {
  private dependencyAnalyzer: PythonDependencyAnalyzer
  private packageCopier: PackageCopier
  private uvPackager: UvPackager

  constructor(projectDir: string) {
    this.dependencyAnalyzer = new PythonDependencyAnalyzer(projectDir)
    this.packageCopier = new PackageCopier(projectDir)
    this.uvPackager = new UvPackager(projectDir)
  }

  async buildPackages(options: PackageBuildOptions): Promise<PackageBuildResult> {
    const { pythonFiles, archive, projectDir } = options

    // Analyze dependencies
    const analysisResult = await this.dependencyAnalyzer.analyzeProject(pythonFiles)
    const usedPackages = analysisResult.usedPackages

    // Check if we can use optimized packaging
    const canOptimize = this.packageCopier.isLambdaSitePackagesAvailable() && usedPackages.size > 0

    return await this.buildFallback(archive)
  }

  private async buildOptimized(
    usedPackages: Set<string>,
    archive: Archiver,
    projectDir: string,
  ): Promise<PackageBuildResult> {
    const lambdaSitePackages = path.join(projectDir, 'python_modules/lib/python3.13/site-packages-lambda')

    // Add transitive dependencies
    const allPackages = new Set(usedPackages)
    for (const pkg of usedPackages) {
      const transitiveDeps = await this.dependencyAnalyzer.findTransitiveDependencies(pkg, lambdaSitePackages)
      transitiveDeps.forEach((dep) => allPackages.add(dep))
    }

    // Archive directly from site-packages-lambda
    await this.addSelectedPackagesToArchive(archive, lambdaSitePackages, allPackages)

    return {
      packagesUsed: allPackages.size,
      optimized: true,
    }
  }

  private async buildFallback(archive: Archiver): Promise<PackageBuildResult> {
    const tempDir = path.join(distDir, `temp-python-packages-${Date.now()}`)

    await this.uvPackager.packageDependencies(tempDir)
    await this.waitForDirectoryReady(tempDir)
    await this.addAllPackagesToArchive(archive, tempDir)

    return {
      packagesUsed: 0,
      optimized: false,
      tempDirCreated: tempDir,
    }
  }

  private async addSelectedPackagesToArchive(
    archive: Archiver,
    sitePackagesDir: string,
    selectedPackages: Set<string>,
  ): Promise<void> {
    for (const packageName of selectedPackages) {
      const packageVariations = this.getPackageNameVariations(packageName)
      let packageFound = false

      for (const variation of packageVariations) {
        const packagePath = path.join(sitePackagesDir, variation)

        if (fs.existsSync(packagePath)) {
          await this.addPackageDirectoryToArchive(archive, packagePath, sitePackagesDir)
          packageFound = true
        }

        // Also add .dist-info directory
        const distInfoDir = this.findDistInfoDir(sitePackagesDir, variation)
        if (distInfoDir) {
          const distInfoPath = path.join(sitePackagesDir, distInfoDir)
          await this.addPackageDirectoryToArchive(archive, distInfoPath, sitePackagesDir)
          packageFound = true
        }

        if (packageFound) break
      }
    }
  }

  private async addAllPackagesToArchive(archive: Archiver, sitePackagesDir: string): Promise<void> {
    if (!fs.existsSync(sitePackagesDir)) return

    const addDirectory = (dirPath: string, basePath: string = sitePackagesDir) => {
      try {
        const items = fs.readdirSync(dirPath)
        for (const item of items) {
          const fullPath = path.join(dirPath, item)
          const relativePath = path.relative(basePath, fullPath)

          try {
            const stat = fs.statSync(fullPath)
            if (stat.isDirectory()) {
              addDirectory(fullPath, basePath)
            } else {
              archive.append(fs.createReadStream(fullPath), relativePath)
            }
          } catch (_error) {
            // Ignore individual file errors
          }
        }
      } catch (_error) {
        // Ignore directory read errors
      }
    }

    addDirectory(sitePackagesDir)
  }

  private async addPackageDirectoryToArchive(archive: Archiver, packagePath: string, basePath: string): Promise<void> {
    if (!fs.existsSync(packagePath)) return

    const stat = fs.statSync(packagePath)
    const relativePath = path.relative(basePath, packagePath)

    if (stat.isDirectory()) {
      const items = fs.readdirSync(packagePath)
      for (const item of items) {
        const fullPath = path.join(packagePath, item)
        const itemRelativePath = path.relative(basePath, fullPath)

        try {
          const itemStat = fs.statSync(fullPath)
          if (itemStat.isDirectory()) {
            await this.addPackageDirectoryToArchive(archive, fullPath, basePath)
          } else {
            archive.append(fs.createReadStream(fullPath), itemRelativePath)
          }
        } catch (_error) {
          // Ignore individual file errors
        }
      }
    } else {
      archive.append(fs.createReadStream(packagePath), relativePath)
    }
  }

  private getPackageNameVariations(packageName: string): string[] {
    const variations = [
      packageName,
      packageName.toLowerCase(),
      packageName.replace(/-/g, '_'),
      packageName.replace(/_/g, '-'),
      packageName.toLowerCase().replace(/-/g, '_'),
      packageName.toLowerCase().replace(/_/g, '-'),
    ]
    return [...new Set(variations)]
  }

  private findDistInfoDir(sourceDir: string, packageName: string): string | null {
    try {
      const entries = fs.readdirSync(sourceDir)
      const variations = this.getPackageNameVariations(packageName)

      for (const entry of entries) {
        if (entry.endsWith('.dist-info')) {
          const entryLower = entry.toLowerCase()
          for (const variation of variations) {
            if (entryLower.startsWith(variation.toLowerCase() + '-')) {
              return entry
            }
          }
        }
      }
    } catch (_error) {
      // Ignore errors
    }
    return null
  }

  private async waitForDirectoryReady(
    dirPath: string,
    maxRetries: number = 10,
    initialDelayMs: number = 10,
  ): Promise<void> {
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        const exists = await fs.promises
          .access(dirPath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false)

        if (!exists) {
          lastError = new Error(`Directory ${dirPath} does not exist yet`)
        } else {
          await fs.promises.access(dirPath, fs.constants.R_OK)
          return
        }
      } catch (error) {
        lastError = error as Error
      }

      if (i === maxRetries - 1) {
        throw new Error(
          `Directory ${dirPath} is not accessible after ${maxRetries} attempts. ` +
            `Last error: ${lastError?.message || 'Unknown error'}`,
        )
      }

      const delay = initialDelayMs * Math.pow(2, i)
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 1000)))
    }
  }

  cleanup(tempDir?: string): void {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch (_error) {
        // Ignore cleanup errors
      }
    }
  }
}
