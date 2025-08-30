import { ApiRouteConfig, Step } from '@motiadev/core'
import fs from 'fs'
import path from 'path'
import { Builder, RouterBuildResult, StepBuilder } from '../../builder'
import { Archiver } from '../archiver'
import { includeStaticFiles } from '../include-static-files'
import { BuildListener } from '../../../new-deployment/listeners/listener.types'
import { distDir } from '../../../new-deployment/constants'
import { UvPackager, UvPackageConfig, defaultUvConfig } from './uv-packager'

export class PythonBuilder implements StepBuilder {
  private uvPackager: UvPackager
  private uvConfig: UvPackageConfig

  constructor(
    private readonly builder: Builder,
    private readonly listener: BuildListener,
  ) {
    this.uvConfig = { ...defaultUvConfig, ...this.loadUvConfig() }
    this.uvPackager = new UvPackager(this.builder.projectDir, this.uvConfig)
  }

  private loadUvConfig(): Partial<UvPackageConfig> {
    const configFiles = ['uv.config.json', '.uvrc.json']

    for (const configFile of configFiles) {
      const configPath = path.join(this.builder.projectDir, configFile)
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf-8')
          return JSON.parse(configContent)
        } catch (err) {
          console.warn(`Warning: Failed to load UV config from ${configFile}`)
        }
      }
    }

    return {}
  }

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<RouterBuildResult> {
    const zipName = 'router-python.zip'
    const archive = new Archiver(path.join(distDir, zipName))

    if (!await this.uvPackager.checkUvInstalled()) {
      throw new Error('UV is not installed. Please install UV: curl -LsSf https://astral.sh/uv/install.sh | sh')
    }

    const tempSitePackages = path.join(distDir, `temp-python-packages-${Date.now()}`)
    
    try {
      await this.uvPackager.packageDependencies(tempSitePackages)
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

    this.builder.registerStep({ entrypointPath, bundlePath, step, type: 'python' })
    this.listener.onBuildStart(step)

    try {
      if (!await this.uvPackager.checkUvInstalled()) {
        throw new Error('UV is not installed. Please install UV: curl -LsSf https://astral.sh/uv/install.sh | sh')
      }

      fs.mkdirSync(path.dirname(outfile), { recursive: true })

      const archive = new Archiver(outfile)
      const tempSitePackages = path.join(distDir, `temp-python-packages-${Date.now()}`)

      try {
        await this.uvPackager.packageDependencies(tempSitePackages)
        await this.addPackagesToArchive(archive, tempSitePackages)
        await this.addStepToArchive(step, archive)

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
  }

  private async addPackagesToArchive(archive: Archiver, sitePackagesDir: string): Promise<void> {
    if (!fs.existsSync(sitePackagesDir)) {
      return
    }

    const addDirectory = (dirPath: string, basePath: string = sitePackagesDir) => {
      const items = fs.readdirSync(dirPath)
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item)
        const relativePath = path.relative(basePath, fullPath)
        
        if (this.shouldIgnoreFile(relativePath)) {
          continue
        }

        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          addDirectory(fullPath, basePath)
        } else {
          archive.append(fs.createReadStream(fullPath), relativePath)
        }
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

  private getModuleName(step: Step): string {
    return this.normalizeStepPath(step, true)
      .replace(/\.py$/, '')
      .replace(/\//g, '.')
  }
}