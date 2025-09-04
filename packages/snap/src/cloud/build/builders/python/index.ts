import type { ApiRouteConfig, Step } from '@motiadev/core'
import fs from 'fs'
import path from 'path'
import { activatePythonVenv } from '../../../../utils/activate-python-env'
import { distDir } from '../../../new-deployment/constants'
import type { BuildListener } from '../../../new-deployment/listeners/listener.types'
import type { Builder, RouterBuildResult, StepBuilder } from '../../builder'
import { Archiver } from '../archiver'
import { includeStaticFiles } from '../include-static-files'
import { UvPackager } from './uv-packager'

export class PythonBuilder implements StepBuilder {
  private uvPackager: UvPackager

  constructor(
    private readonly builder: Builder,
    private readonly listener: BuildListener,
  ) {
    activatePythonVenv({ baseDir: this.builder.projectDir })
    this.uvPackager = new UvPackager(this.builder.projectDir)
  }

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<RouterBuildResult> {
    const zipName = 'router-python.zip'
    const archive = new Archiver(path.join(distDir, zipName))

    const tempSitePackages = path.join(distDir, `temp-python-packages-${Date.now()}`)

    try {
      await this.uvPackager.packageDependencies(tempSitePackages)

      // Wait for directory to be ready with proper access checks
      await this.waitForDirectoryReady(tempSitePackages)

      await this.addPackagesToArchive(archive, tempSitePackages)

      for (const step of steps) {
        await this.addStepToArchive(step, archive)
      }

      const routerTemplate = this.createRouterTemplate(steps)
      archive.append(routerTemplate, 'router.py')

      includeStaticFiles(steps, this.builder, archive)

      const size = await archive.finalize()
      return { size, path: zipName }
    } catch (error) {
      throw new Error(`Failed to build Python API router: ${error}`)
    } finally {
      if (fs.existsSync(tempSitePackages)) {
        fs.rmSync(tempSitePackages, { recursive: true, force: true })
      }
    }
  }

  async build(step: Step): Promise<void> {
    const entrypointPath = step.filePath.replace(this.builder.projectDir, '')
    const bundlePath = path.join('python', entrypointPath.replace(/(.*)\.py$/, '$1.zip'))
    const outfile = path.join(distDir, bundlePath)

    this.builder.registerStep({
      entrypointPath,
      bundlePath,
      step,
      type: 'python',
    })
    this.listener.onBuildStart(step)

    try {
      fs.mkdirSync(path.dirname(outfile), { recursive: true })

      const archive = new Archiver(outfile)
      const tempSitePackages = path.join(distDir, `temp-python-packages-${Date.now()}`)

      try {
        await this.uvPackager.packageDependencies(tempSitePackages)

        await this.waitForDirectoryReady(tempSitePackages)

        await this.addStepToArchive(step, archive)
        await this.addPackagesToArchive(archive, tempSitePackages)

        includeStaticFiles([step], this.builder, archive)

        const size = await archive.finalize()
        this.listener.onBuildEnd(step, size)
      } finally {
        if (fs.existsSync(tempSitePackages)) {
          fs.rmSync(tempSitePackages, { recursive: true, force: true })
        }
      }
    } catch (err) {
      this.listener.onBuildError(step, err as Error)
      throw err
    }
  }

  private async addStepToArchive(step: Step, archive: Archiver): Promise<void> {
    const normalizedPath = this.normalizeStepPath(step, false)
    archive.append(fs.createReadStream(step.filePath), normalizedPath)

    const internalFiles = await this.findInternalFiles(step.filePath)
    for (const file of internalFiles) {
      const fullPath = path.join(this.builder.projectDir, file)
      if (fs.existsSync(fullPath) && fullPath !== step.filePath) {
        const archivePath = file.replace(/\.step\.py$/, '_step.py')
        archive.append(fs.createReadStream(fullPath), archivePath)
      }
    }
  }

  private async addPackagesToArchive(archive: Archiver, sitePackagesDir: string): Promise<void> {
    if (!fs.existsSync(sitePackagesDir)) {
      console.warn(`Warning: Site packages directory not found: ${sitePackagesDir}`)
      return
    }

    try {
      fs.accessSync(sitePackagesDir, fs.constants.R_OK)
    } catch (error) {
      console.warn(`Warning: Cannot access site packages directory: ${sitePackagesDir}`)
      return
    }

    const addDirectory = (dirPath: string, basePath: string = sitePackagesDir) => {
      try {
        const items = fs.readdirSync(dirPath)

        for (const item of items) {
          const fullPath = path.join(dirPath, item)
          const relativePath = path.relative(basePath, fullPath)

          if (this.shouldIgnoreFile(relativePath)) {
            continue
          }

          try {
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
              addDirectory(fullPath, basePath)
            } else {
              archive.append(fs.createReadStream(fullPath), relativePath)
            }
          } catch (error) {
            console.warn(`Warning: Could not process file ${fullPath}: ${error}`)
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read directory ${dirPath}: ${error}`)
      }
    }

    addDirectory(sitePackagesDir)
  }

  private shouldIgnoreFile(filePath: string): boolean {
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

  private normalizeStepPath(step: Step, normalizePythonModulePath: boolean): string {
    let normalizedStepPath = step.filePath
      .replace(/[.]step.py$/, '_step.py') // Replace .step.py with _step.py
      .replace(`${this.builder.projectDir}/`, '') // Remove the project directory from the path

    const pathParts = normalizedStepPath.split(path.sep).map((part) =>
      part
        .replace(/^[0-9]+/g, '') // Remove numeric prefixes
        .replace(/[^a-zA-Z0-9._]/g, '_') // Replace any non-alphanumeric characters (except dots) with underscores
        .replace(/^_/, ''),
    ) // Remove leading underscore

    normalizedStepPath = normalizePythonModulePath
      ? pathParts.join('.') // Convert path delimiter to dot (python module separator)
      : '/' + pathParts.join(path.sep)

    return normalizedStepPath
  }

  private createRouterTemplate(steps: Step<ApiRouteConfig>[]): string {
    const imports = steps
      .map((step, index) => {
        const moduleName = this.getModuleName(step)
        return `from ${moduleName} import handler as route${index}_handler, config as route${index}_config`
      })
      .join('\n')

    const routerPaths = steps
      .map((step, index) => {
        const method = step.config.method.toUpperCase()
        const path = step.config.path
        return `    '${method} ${path}': RouterPath('${step.config.name}', '${step.config.method.toLowerCase()}', route${index}_handler, route${index}_config)`
      })
      .join(',\n')

    return fs
      .readFileSync(path.join(__dirname, 'router_template.py'), 'utf-8')
      .replace('# {{imports}}', imports)
      .replace('# {{router paths}}', routerPaths)
  }

  private async findInternalFiles(entryFile: string): Promise<string[]> {
    const files: string[] = []
    const visited = new Set<string>()

    const analyzeFile = (filePath: string) => {
      if (visited.has(filePath) || !fs.existsSync(filePath)) {
        return
      }

      visited.add(filePath)
      files.push(path.relative(this.builder.projectDir, filePath))

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const importRegex = /^(?:from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+import|import\s+([a-zA-Z_][a-zA-Z0-9_.]*))/gm
        let match

        while ((match = importRegex.exec(content)) !== null) {
          const moduleName = match[1] || match[2] // from X import Y ou import X

          this.resolveModulePaths(moduleName, path.dirname(filePath)).forEach((possiblePath) => {
            if (fs.existsSync(possiblePath)) {
              analyzeFile(possiblePath)
            }
          })
        }
      } catch (error) {
        console.warn(`Could not analyze file: ${filePath}`)
      }
    }

    analyzeFile(entryFile)
    return files
  }

  private resolveModulePaths(moduleName: string, currentDir: string): string[] {
    const parts = moduleName.split('.')
    const baseName = parts[0]
    const subPath = parts.length > 1 ? path.join(...parts) : baseName

    return [
      path.join(currentDir, `${baseName}.py`),
      path.join(currentDir, baseName, '__init__.py'),
      path.join(currentDir, `${subPath}.py`),

      path.join(this.builder.projectDir, `${baseName}.py`),
      path.join(this.builder.projectDir, baseName, '__init__.py'),
      path.join(this.builder.projectDir, `${subPath}.py`),

      path.join(this.builder.projectDir, subPath + '.py'),
      path.join(this.builder.projectDir, subPath, '__init__.py'),
    ]
  }

  private getModuleName(step: Step): string {
    return this.normalizeStepPath(step, true).replace(/\.py$/, '').replace(/\//g, '.')
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
          // Directory doesn't exist yet, wait
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

      // Exponential backoff: 10ms, 20ms, 40ms, 80ms, etc.
      const delay = initialDelayMs * 2 ** i
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 1000))) // Cap at 1 second
    }
  }
}
