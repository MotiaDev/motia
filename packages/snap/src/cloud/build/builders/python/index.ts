import { ApiRouteConfig, Step } from '@motiadev/core'
import fs from 'fs'
import path from 'path'
import { Builder, RouterBuildResult, StepBuilder } from '../../builder'
import { Archiver } from '../archiver'
import { includeStaticFiles } from '../include-static-files'
import { BuildListener } from '../../../new-deployment/listeners/listener.types'
import { distDir } from '../../../new-deployment/constants'
import { activatePythonVenv } from '../../../../utils/activate-python-env'
import { PackageHandler } from './package-handler'

export class PythonBuilder implements StepBuilder {
  private packageHandler: PackageHandler

  constructor(
    private readonly builder: Builder,
    private readonly listener: BuildListener,
  ) {
    activatePythonVenv({ baseDir: this.builder.projectDir })
    this.packageHandler = new PackageHandler(this.builder.projectDir)
  }

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<RouterBuildResult> {
    const zipName = 'router-python.zip'
    const archive = new Archiver(path.join(distDir, zipName))
    let tempDirToCleanup: string | undefined

    try {
      // Collect all Python files for analysis
      const pythonFiles = steps.map((step) => step.filePath)

      // Build packages using the unified handler
      const buildResult = await this.packageHandler.buildPackages({
        pythonFiles,
        archive,
        projectDir: this.builder.projectDir,
      })

      tempDirToCleanup = buildResult.tempDirCreated

      // Add all step files to archive
      for (const step of steps) {
        await this.addStepToArchive(step, archive)
      }

      // Add router template
      const routerTemplate = this.createRouterTemplate(steps)
      archive.append(routerTemplate, 'router.py')

      // Include static files
      includeStaticFiles(steps, this.builder, archive)

      const { compressedSize, uncompressedSize } = await archive.finalize()
      return { compressedSize, uncompressedSize, path: zipName }
    } catch (error) {
      throw new Error(`Failed to build Python API router: ${error}`)
    } finally {
      this.packageHandler.cleanup(tempDirToCleanup)
    }
  }

  async build(step: Step): Promise<void> {
    const entrypointPath = step.filePath.replace(this.builder.projectDir, '').replace(/\.step\.py$/, '_step.py')
    const bundlePath = path.join('python', entrypointPath.replace(/(.*)\.py$/, '$1.zip'))
    const outfile = path.join(distDir, bundlePath)

    this.builder.registerStep({ entrypointPath, bundlePath, step, type: 'python' })
    this.listener.onBuildStart(step)

    let tempDirToCleanup: string | undefined

    try {
      fs.mkdirSync(path.dirname(outfile), { recursive: true })
      const archive = new Archiver(outfile)

      // Collect Python files for analysis (including internal files)
      const pythonFiles = [step.filePath]
      const internalFiles = await this.findInternalFiles(step.filePath)
      for (const file of internalFiles) {
        pythonFiles.push(path.join(this.builder.projectDir, file))
      }

      // Build packages using the unified handler
      const buildResult = await this.packageHandler.buildPackages({
        pythonFiles,
        archive,
        projectDir: this.builder.projectDir,
      })

      tempDirToCleanup = buildResult.tempDirCreated

      // Add step file to archive
      await this.addStepToArchive(step, archive)

      // Include static files
      includeStaticFiles([step], this.builder, archive)

      const { compressedSize, uncompressedSize } = await archive.finalize()
      this.builder.recordStepSize(step, compressedSize, uncompressedSize)
      this.listener.onBuildEnd(step, compressedSize)
    } catch (err) {
      this.listener.onBuildError(step, err as Error)
      throw err
    } finally {
      this.packageHandler.cleanup(tempDirToCleanup)
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

  private async findInternalFiles(entryFile: string): Promise<string[]> {
    const files: string[] = []
    const visited = new Set<string>()

    const analyzeFile = (filePath: string) => {
      if (visited.has(filePath) || !fs.existsSync(filePath)) return
      visited.add(filePath)
      files.push(path.relative(this.builder.projectDir, filePath))

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const importRegex = /^(?:from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+import|import\s+([a-zA-Z_][a-zA-Z0-9_.]*))/gm
        let match

        while ((match = importRegex.exec(content)) !== null) {
          const moduleName = match[1] || match[2]
          this.resolveModulePaths(moduleName, path.dirname(filePath)).forEach((possiblePath) => {
            if (fs.existsSync(possiblePath)) {
              analyzeFile(possiblePath)
            }
          })
        }
      } catch (_error) {
        // Ignore file read/parse errors
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

  private normalizeStepPath(step: Step, normalizePythonModulePath: boolean): string {
    let normalizedStepPath = step.filePath.replace(/[.]step.py$/, '_step.py').replace(`${this.builder.projectDir}/`, '')

    const pathParts = normalizedStepPath.split(path.sep).map((part) =>
      part
        .replace(/[^a-zA-Z0-9._]/g, '_') // Replace any non-alphanumeric characters (except dots) with underscores
        .replace(/^_/, ''),
    )

    normalizedStepPath = normalizePythonModulePath ? pathParts.join('.') : '/' + pathParts.join(path.sep)

    return normalizedStepPath
  }

  private createRouterTemplate(steps: Step<ApiRouteConfig>[]): string {
    const imports = steps
      .map((step, index) => {
        const moduleName = this.getModuleName(step)
        return `route${index}_module = importlib.import_module('${moduleName}')`
      })
      .join('\n')

    const routerPaths = steps
      .map((step, index) => {
        const method = step.config.method.toUpperCase()
        const path = step.config.path
        return `    '${method} ${path}': RouterPath('${step.config.name}', '${step.config.method.toLowerCase()}', route${index}_module.handler, route${index}_module.config)`
      })
      .join(',\n')

    return fs
      .readFileSync(path.join(__dirname, 'router_template.py'), 'utf-8')
      .replace('# {{imports}}', imports)
      .replace('# {{router paths}}', routerPaths)
  }

  private getModuleName(step: Step): string {
    return this.normalizeStepPath(step, true).replace(/\.py$/, '').replace(/\//g, '.')
  }
}
