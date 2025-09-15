import fs from 'fs'
import path from 'path'

export interface ImportInfo {
  module: string
  package: string
  isStandardLib: boolean
}

export interface DependencyAnalysisResult {
  usedPackages: Set<string>
  imports: ImportInfo[]
  errors: string[]
}

export class PythonDependencyAnalyzer {
  async findTransitiveDependencies(packageName: string, sitePackagesDir: string): Promise<Set<string>> {
    const dependencies = new Set<string>()
    const visited = new Set<string>()

    const findDeps = async (pkg: string) => {
      if (visited.has(pkg)) return
      visited.add(pkg)

      const metadataPath = path.join(sitePackagesDir, `${pkg}.dist-info`, 'METADATA')

      if (!fs.existsSync(metadataPath)) {
        const normalizedName = pkg.replace('-', '_').toLowerCase()
        const dirs = fs.readdirSync(sitePackagesDir).filter((dir) => {
          const normalized = dir.toLowerCase().replace('-', '_')
          return normalized.startsWith(normalizedName) && dir.endsWith('.dist-info')
        })

        if (dirs.length > 0) {
          const actualMetadataPath = path.join(sitePackagesDir, dirs[0], 'METADATA')
          if (fs.existsSync(actualMetadataPath)) {
            await this.parseDependenciesFromMetadata(actualMetadataPath, dependencies, findDeps)
          }
        }
      } else {
        await this.parseDependenciesFromMetadata(metadataPath, dependencies, findDeps)
      }
    }

    await findDeps(packageName)
    return dependencies
  }

  private async parseDependenciesFromMetadata(
    metadataPath: string,
    dependencies: Set<string>,
    findDeps: (pkg: string) => Promise<void>,
  ): Promise<void> {
    try {
      const metadata = fs.readFileSync(metadataPath, 'utf-8')
      const requiresRegex = /^Requires-Dist:\s*([a-zA-Z0-9_-]+)/gm
      let match

      while ((match = requiresRegex.exec(metadata)) !== null) {
        const dep = match[1]
        dependencies.add(dep)
        await findDeps(dep)
      }
    } catch (error) {
      console.warn(`Could not parse metadata from ${metadataPath}`)
    }
  }
}
