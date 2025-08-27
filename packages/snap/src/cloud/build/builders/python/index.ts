import { ApiRouteConfig, Step } from '@motiadev/core'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { activatePythonVenv } from '../../../../utils/activate-python-env'
import { Builder, RouterBuildResult, StepBuilder } from '../../builder'
import { Archiver } from '../archiver'
import { includeStaticFiles } from '../include-static-files'
import { addPackageToArchive } from './add-package-to-archive'
import { BuildListener } from '../../../new-deployment/listeners/listener.types'
import { distDir } from '../../../new-deployment/constants'

interface PythonBuilderData {
  packages: Array<{ name: string; version: string; is_direct_import: boolean }>
  files: string[]
}

export class PythonBuilder implements StepBuilder {
  constructor(
    private readonly builder: Builder,
    private readonly listener: BuildListener,
  ) {
    activatePythonVenv({ baseDir: this.builder.projectDir })
  }

  private async buildStep(step: Step, archive: Archiver): Promise<string> {
    const normalizedEntrypointPath = this.getStepPath(step)
    const sitePackagesDir = `${process.env.PYTHON_SITE_PACKAGES}-lambda`

    // Get Python builder response
    const { packages, files } = await this.getPythonBuilderData(step)

    // Add main file to archive
    if (!fs.existsSync(step.filePath)) {
      throw new Error(`Source file not found: ${step.filePath}`)
    }

    archive.append(fs.createReadStream(step.filePath), path.relative(this.builder.projectDir, normalizedEntrypointPath))
    files.forEach((file) => archive.append(fs.createReadStream(file), path.relative(this.builder.projectDir, file)))

    if (packages.length > 0) {
      await Promise.all(packages.map((pkg) => addPackageToArchive(archive, sitePackagesDir, pkg.name)))
      this.listener.onBuildProgress(step, `Added ${packages.length} packages to archive`)
    }

    return normalizedEntrypointPath
  }

  async build(step: Step): Promise<void> {
    const entrypointPath = step.filePath.replace(this.builder.projectDir, '')
    const bundlePath = path.join('python', entrypointPath.replace(/(.*)\.py$/, '$1.zip'))
    const outfile = path.join(distDir, bundlePath)

    try {
      // Create output directory
      fs.mkdirSync(path.dirname(outfile), { recursive: true })
      this.listener.onBuildStart(step)

      // Create the step zip archive
      const stepArchiver = new Archiver(outfile)

      // Build the step
      const stepPath = await this.buildStep(step, stepArchiver)

      // Add static files to the archive
      includeStaticFiles([step], this.builder, stepArchiver)

      // Finalize the archive and wait for completion
      const size = await stepArchiver.finalize()

      this.builder.registerStep({ entrypointPath: stepPath, bundlePath, step, type: 'python' })
      this.listener.onBuildEnd(step, size)
    } catch (err) {
      this.listener.onBuildError(step, err as Error)
      throw err
    }
  }

  private getStepPath(step: Step, normalizePythonModulePath: boolean = false) {
    let normalizedStepPath = step.filePath
      .replace(/[.]step.py$/, '_step.py') // Replace .step.py with _step.py
      .replace(`${this.builder.projectDir}/`, '') // Remove the project directory from the path
      
    if (normalizePythonModulePath) {
      normalizedStepPath = normalizedStepPath.replace(/(.*)\.py$/, '$1') // Remove .py extension
    }
    
    const pathParts = normalizedStepPath.split(path.sep).map(part => 
      part
        .replace(/^[0-9]+/g, '') // Remove numeric prefixes
        .replace(/[^a-zA-Z0-9._]/g, '_') // Replace any non-alphanumeric characters (except dots) with underscores
        .replace(/^_/, '')) // Remove leading underscore

    return pathParts.join(normalizePythonModulePath ? '.' : path.sep) // Convert path delimiter to dot (python module separator)
  }

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<RouterBuildResult> {
    const zipName = 'router-python.zip'
    const archive = new Archiver(path.join(distDir, zipName))
    const dependencies = ['uvicorn', 'pydantic', 'pydantic_core', 'uvloop', 'starlette', 'typing_inspection']
    const lambdaSitePackages = `${process.env.PYTHON_SITE_PACKAGES}-lambda`
    await Promise.all(
      dependencies.map(async (packageName) => addPackageToArchive(archive, lambdaSitePackages, packageName)),
    )

    await Promise.all(
      steps.map(async (step) => {
        await this.buildStep(step, archive)
      }),
    )

    const file = fs
      .readFileSync(path.join(__dirname, 'router_template.py'), 'utf-8')
      .replace(
        '# {{imports}}',
        steps
          .map(
            (step, index) =>
              `from ${this.getStepPath(step, true)} import handler as route${index}_handler, config as route${index}_config`,
          )
          .join('\n'),
      )
      .replace(
        '# {{router paths}}',
        steps
          .map(
            (step, index) =>
              `'${step.config.method} ${step.config.path}': RouterPath('${step.config.name}', '${step.config.method.toLowerCase()}', route${index}_handler, route${index}_config)`,
          )
          .join(',\n    '),
      )

    archive.append(file, 'router.py')

    includeStaticFiles(steps, this.builder, archive)

    // Finalize the archive and wait for completion
    const size = await archive.finalize()

    return { size, path: zipName }
  }

  private async getPythonBuilderData(step: Step): Promise<PythonBuilderData> {
    return new Promise((resolve, reject) => {
      const child = spawn(
        'python',
        [path.join(__dirname, 'python-builder.py'), this.builder.projectDir, step.filePath],
        {
          cwd: this.builder.projectDir,
          stdio: [undefined, undefined, 'pipe', 'ipc'],
        },
      )
      const err: string[] = []

      child.on('stderr', (data) => err.push(data.toString()))
      child.on('message', resolve)
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(err.join('')))
        }
      })
    })
  }
}
