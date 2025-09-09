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
  private standardLibModules: Set<string>
  private importToPackageMap: Map<string, string> | null = null
  private projectDir: string

  constructor(projectDir: string) {
    this.projectDir = projectDir
    this.standardLibModules = new Set([
      'abc',
      'argparse',
      'array',
      'ast',
      'asyncio',
      'atexit',
      'base64',
      'binascii',
      'bisect',
      'builtins',
      'bz2',
      'calendar',
      'cmath',
      'cmd',
      'code',
      'codecs',
      'collections',
      'contextlib',
      'copy',
      'csv',
      'ctypes',
      'dataclasses',
      'datetime',
      'decimal',
      'difflib',
      'dis',
      'email',
      'enum',
      'errno',
      'fcntl',
      'fileinput',
      'fnmatch',
      'fractions',
      'functools',
      'gc',
      'getopt',
      'getpass',
      'glob',
      'gzip',
      'hashlib',
      'heapq',
      'hmac',
      'html',
      'http',
      'importlib',
      'inspect',
      'io',
      'itertools',
      'json',
      'keyword',
      'locale',
      'logging',
      'lzma',
      'math',
      'mmap',
      'multiprocessing',
      'numbers',
      'operator',
      'os',
      'pathlib',
      'pickle',
      'platform',
      'pprint',
      'profile',
      'queue',
      'random',
      're',
      'readline',
      'resource',
      'secrets',
      'select',
      'shelve',
      'shlex',
      'shutil',
      'signal',
      'socket',
      'sqlite3',
      'ssl',
      'stat',
      'statistics',
      'string',
      'struct',
      'subprocess',
      'sys',
      'tarfile',
      'tempfile',
      'textwrap',
      'threading',
      'time',
      'timeit',
      'token',
      'tokenize',
      'traceback',
      'types',
      'typing',
      'unittest',
      'urllib',
      'uuid',
      'warnings',
      'weakref',
      'xml',
      'xmlrpc',
      'zipfile',
      'zlib',
      '__future__',
    ])
  }

  async analyzeProject(stepFiles: string[]): Promise<DependencyAnalysisResult> {
    const result: DependencyAnalysisResult = {
      usedPackages: new Set<string>(),
      imports: [],
      errors: [],
    }

    // Build the import-to-package mapping if not already built
    if (!this.importToPackageMap) {
      this.importToPackageMap = await this.buildPackageImportMap()
    }

    for (const file of stepFiles) {
      if (file.endsWith('.py')) {
        await this.analyzeFile(file, result)
      }
    }

    return result
  }

  private async analyzeFile(filePath: string, result: DependencyAnalysisResult): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const imports = this.extractImports(content)

      for (const importStatement of imports) {
        const importInfo = this.parseImport(importStatement)
        if (importInfo) {
          result.imports.push(importInfo)
          if (!importInfo.isStandardLib) {
            result.usedPackages.add(importInfo.package)
          }
        }
      }

      const fromImports = this.extractFromImports(content)
      for (const fromImport of fromImports) {
        const importInfo = this.parseFromImport(fromImport)
        if (importInfo) {
          result.imports.push(importInfo)
          if (!importInfo.isStandardLib) {
            result.usedPackages.add(importInfo.package)
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to analyze ${filePath}: ${error}`)
    }
  }

  private extractImports(content: string): string[] {
    // Match import statements with optional leading whitespace (to handle indented imports)
    const importRegex = /^\s*import\s+([a-zA-Z_][a-zA-Z0-9_.]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_.]*)*)/gm
    const matches: string[] = []
    let match

    while ((match = importRegex.exec(content)) !== null) {
      const modules = match[1].split(',').map((m) => m.trim())
      matches.push(...modules)
    }

    return matches
  }

  private extractFromImports(content: string): string[] {
    // Match from imports with optional leading whitespace (to handle indented imports)
    const fromImportRegex = /^\s*from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+import/gm
    const matches: string[] = []
    let match

    while ((match = fromImportRegex.exec(content)) !== null) {
      matches.push(match[1])
    }

    return matches
  }

  private parseImport(importStatement: string): ImportInfo | null {
    const module = importStatement.trim()
    const packageName = this.getPackageName(module)
    const isStandardLib = this.isStandardLibrary(packageName)

    return {
      module,
      package: this.resolvePackageName(packageName),
      isStandardLib,
    }
  }

  private parseFromImport(module: string): ImportInfo | null {
    const packageName = this.getPackageName(module)
    const isStandardLib = this.isStandardLibrary(packageName)

    return {
      module,
      package: this.resolvePackageName(packageName),
      isStandardLib,
    }
  }

  private getPackageName(module: string): string {
    const parts = module.split('.')
    return parts[0]
  }

  private isStandardLibrary(packageName: string): boolean {
    return this.standardLibModules.has(packageName)
  }

  private resolvePackageName(packageName: string): string {
    return this.importToPackageMap?.get(packageName) || packageName
  }

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
        if (!this.isStandardLibrary(dep)) {
          dependencies.add(dep)
          await findDeps(dep)
        }
      }
    } catch (error) {
      console.warn(`Could not parse metadata from ${metadataPath}`)
    }
  }

  private async buildPackageImportMap(): Promise<Map<string, string>> {
    const importToPackageMap = new Map<string, string>()

    try {
      const sitePackagesPath = this.getLambdaSitePackagesPath()
      if (!sitePackagesPath) {
        console.warn('Lambda site-packages not found, using fallback import resolution')
        return importToPackageMap
      }

      const entries = fs.readdirSync(sitePackagesPath)
      const distInfoDirs = entries.filter((entry) => entry.endsWith('.dist-info'))

      for (const distInfoDir of distInfoDirs) {
        const distInfoPath = path.join(sitePackagesPath, distInfoDir)

        try {
          const packageName = await this.getPackageNameFromMetadata(distInfoPath)
          const topLevelModules = await this.getTopLevelModules(distInfoPath)

          // Map each top-level module to this package
          for (const module of topLevelModules) {
            importToPackageMap.set(module, packageName)
          }
        } catch (error) {
          console.warn(`Could not process ${distInfoDir}: ${error}`)
        }
      }

      // Dynamic import mapping built successfully
    } catch (error) {
      console.warn(`Error building package import map: ${error}`)
    }

    return importToPackageMap
  }

  private getLambdaSitePackagesPath(): string | null {
    const venvPath = path.join(this.projectDir, 'python_modules')
    const libPath = path.join(venvPath, 'lib')

    try {
      // Find the actual Python version directory
      const entries = fs.readdirSync(libPath)
      const pythonDirs = entries.filter((entry) => entry.startsWith('python3.'))

      if (pythonDirs.length === 0) {
        return null
      }

      const pythonVersionDir = pythonDirs[0] // Use the first Python version found
      const lambdaSitePackages = path.join(libPath, pythonVersionDir, 'site-packages-lambda')

      return fs.existsSync(lambdaSitePackages) ? lambdaSitePackages : null
    } catch (error) {
      return null
    }
  }

  private async getPackageNameFromMetadata(distInfoPath: string): Promise<string> {
    const metadataPath = path.join(distInfoPath, 'METADATA')

    if (!fs.existsSync(metadataPath)) {
      // Fall back to parsing package name from directory name
      const dirName = path.basename(distInfoPath)
      return dirName.replace(/[-_][\d.]+.*\.dist-info$/, '')
    }

    const metadata = fs.readFileSync(metadataPath, 'utf-8')
    const nameMatch = metadata.match(/^Name:\s*(.+)$/m)

    if (nameMatch) {
      return nameMatch[1].trim()
    }

    // Fallback: parse from directory name
    const dirName = path.basename(distInfoPath)
    return dirName.replace(/[-_][\d.]+.*\.dist-info$/, '')
  }

  private async getTopLevelModules(distInfoPath: string): Promise<string[]> {
    const topLevelPath = path.join(distInfoPath, 'top_level.txt')

    if (!fs.existsSync(topLevelPath)) {
      // Fallback: assume the package name is the import name
      const packageName = await this.getPackageNameFromMetadata(distInfoPath)
      return [packageName.replace('-', '_').toLowerCase()]
    }

    try {
      const content = fs.readFileSync(topLevelPath, 'utf-8')
      return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
    } catch (error) {
      console.warn(`Could not read top_level.txt from ${distInfoPath}: ${error}`)
      // Fallback: assume the package name is the import name
      const packageName = await this.getPackageNameFromMetadata(distInfoPath)
      return [packageName.replace('-', '_').toLowerCase()]
    }
  }
}
