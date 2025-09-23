import { Step } from '@motiadev/core'
import fs from 'fs'
import path from 'path'
import { activatePythonVenv, getSitePackagesPath } from '../../../../utils/activate-python-env'
import { distDir } from '../../../new-deployment/constants'
import { BuildListener } from '../../../new-deployment/listeners/listener.types'
import { Builder, RouterBuildResult, StepBuilder } from '../../builder'
import { Archiver } from '../archiver'
import { includeStaticFiles } from '../include-static-files'
import { extractPythonData } from './python-data/extract-python-data'
import { readRequirements, Requirements } from './python-data/read-requirements'
import { resolveDepNames } from './python-data/resolve-dep-name'
import { UvPackager } from './uv-packager'

export class PythonBuilder implements StepBuilder {
  private packager: UvPackager

  constructor(
    private readonly builder: Builder,
    private readonly listener: BuildListener,
  ) {
    activatePythonVenv({ baseDir: this.builder.projectDir })
    this.packager = new UvPackager()
  }

  private getRequirements(): Requirements {
    const requirementsFile = path.join(this.builder.projectDir, 'requirements.txt')
    const depNames = Object.keys(readRequirements(requirementsFile, (name: string) => ({ name, importName: name })))
    const sitePackagesPath = getSitePackagesPath({ baseDir: this.builder.projectDir })
    const mapper = resolveDepNames(depNames, sitePackagesPath)

    const describer = (name: string) => {
      const [, to] = mapper.find(([from]) => from === name) ?? []
      return { name, importName: to ?? name }
    }

    return readRequirements(requirementsFile, describer)
  }

  async buildApiSteps(steps: Step[]): Promise<RouterBuildResult> {
    const zipName = 'router-python.zip'
    const archive = new Archiver(path.join(distDir, zipName))
    const bundleDir = path.join(distDir, 'python', 'router')

    try {
      fs.mkdirSync(bundleDir, { recursive: true })

      const routerTemplate = this.createRouterTemplate(steps)
      archive.append(routerTemplate, 'router.py')

      await this.generatePackage(bundleDir, 'router.py', archive, routerTemplate)

      includeStaticFiles(steps, this.builder, archive)

      const { compressedSize, uncompressedSize } = await archive.finalize()

      return { compressedSize, uncompressedSize, path: zipName }
    } catch (error) {
      throw new Error(`Failed to build Python API router: ${error}`)
    } finally {
      this.cleanup(bundleDir)
    }
  }

  async build(step: Step): Promise<void> {
    const entrypointPath = step.filePath.replace(this.builder.projectDir, '')
    const bundlePath = path.join('python', entrypointPath.replace(/(.*)\.py$/, '$1.zip'))
    const bundleDir = path.join(distDir, 'python', entrypointPath.replace(/(.*)\.py$/, '$1'))
    const outfile = path.join(distDir, bundlePath)

    this.builder.registerStep({ entrypointPath, bundlePath, step, type: 'python' })
    this.listener.onBuildStart(step)

    try {
      fs.mkdirSync(path.dirname(outfile), { recursive: true })
      fs.mkdirSync(bundleDir, { recursive: true })
      const archive = new Archiver(outfile)

      await this.generatePackage(bundleDir, entrypointPath, archive)

      // Include static files
      includeStaticFiles([step], this.builder, archive)

      const { compressedSize, uncompressedSize } = await archive.finalize()
      this.builder.recordStepSize(step, compressedSize, uncompressedSize)
      this.listener.onBuildEnd(step, compressedSize)
    } catch (err) {
      this.listener.onBuildError(step, err as Error)
      throw err
    } finally {
      this.cleanup(bundleDir)
    }
  }

  private async generatePackage(bundleDir: string, entrypointPath: string, archive: Archiver, fileContent?: string) {
    const requirements = this.getRequirements()
    const { externalDependencies, files } = extractPythonData(
      this.builder.projectDir,
      entrypointPath,
      requirements,
      fileContent,
    )

    // move files
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(bundleDir, file)), { recursive: true })

      if (fileContent && file === entrypointPath) {
        fs.writeFileSync(path.join(bundleDir, file), fileContent)
      } else {
        fs.copyFileSync(path.join(this.builder.projectDir, file), path.join(bundleDir, file))
      }
    }

    const dependencies = Object.values(externalDependencies)

    if (dependencies.length > 0) {
      // create requirements.txt
      fs.writeFileSync(path.join(bundleDir, 'requirements.txt'), Object.values(externalDependencies).join('\n'))
      await this.packager.packageDependencies(bundleDir)
    }

    // zip entire folder
    archive.appendDirectory(bundleDir, '/')
  }

  private cleanup(bundleDir: string): void {
    if (bundleDir && fs.existsSync(bundleDir)) {
      try {
        fs.rmSync(bundleDir, { recursive: true, force: true })
      } catch (_error) {
        // Ignore cleanup errors
      }
    }
  }

  private createRouterTemplate(steps: Step[]): string {
    const imports = steps
      .map(
        (step, index) =>
          `from ${this.getModuleName(step)} import handler as route${index}_handler, config as route${index}_config`,
      )
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
      .replace('    # {{router paths}}', routerPaths)
  }

  private getModuleName(step: Step): string {
    // return step path
    return step.filePath.replace(this.builder.projectDir, '').substring(1).replace(/\.py$/, '').replace(/\//g, '.')
  }
}
