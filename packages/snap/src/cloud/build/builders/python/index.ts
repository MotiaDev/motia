import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import archiver, { Archiver } from 'archiver'
import { ApiRouteConfig, Step } from '@motiadev/core'

import { Builder, StepBuilder } from '../../builder'
import { addPackageToArchive } from './add-package-to-archive'
import { activatePythonVenv } from '../../../../utils/activate-python-env'
import { includeStaticFiles } from '../node/include-static-files'

export class PythonBuilder implements StepBuilder {
  constructor(private readonly builder: Builder) {
    activatePythonVenv({ baseDir: this.builder.projectDir })
  }

  private async buildStep(step: Step, archive: Archiver): Promise<string> {
    const entrypointPath = step.filePath.replace(this.builder.projectDir, '')
    const normalizedEntrypointPath = entrypointPath.replace(/[.]step.py$/, '_step.py')
    const sitePackagesDir = `${process.env.PYTHON_SITE_PACKAGES}-lambda`

    // Get Python builder response
    const { packages } = await this.getPythonBuilderData(step)

    // Add main file to archive
    if (!fs.existsSync(step.filePath)) {
      throw new Error(`Source file not found: ${step.filePath}`)
    }

    archive.append(fs.createReadStream(step.filePath), {
      name: path.relative(this.builder.projectDir, normalizedEntrypointPath),
    })

    await Promise.all(packages.map(async (packageName) => addPackageToArchive(archive, sitePackagesDir, packageName)))

    return normalizedEntrypointPath
  }

  async build(step: Step): Promise<void> {
    const entrypointPath = step.filePath.replace(this.builder.projectDir, '')
    const bundlePath = path.join('python', entrypointPath.replace(/(.*)\.py$/, '$1.zip'))
    const outfile = path.join(this.builder.distDir, bundlePath)

    try {
      // Create output directory
      fs.mkdirSync(path.dirname(outfile), { recursive: true })
      this.builder.printer.printStepBuilding(step)

      // Set up archive
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Sets the compression level
      })
      const outputStream = fs.createWriteStream(outfile)
      archive.pipe(outputStream)

      const stepPath = await this.buildStep(step, archive)

      // Finalize the archive and wait for completion
      const size = await new Promise<number>((resolve, reject) => {
        outputStream.on('close', () => resolve(archive.pointer()))
        outputStream.on('error', reject)
        includeStaticFiles(step, this.builder, archive)
        archive.finalize()
      })

      this.builder.registerStep({ entrypointPath: stepPath, bundlePath, step, type: 'python' })
      this.builder.printer.printStepBuilt(step, size)
    } catch (err) {
      this.builder.printer.printStepFailed(step, err as Error)
      throw err
    }
  }

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<number> {
    const getStepPath = (step: Step<ApiRouteConfig>) => {
      const normalizedEntrypointPath = step.filePath.replace(/[.]step.py$/, '_step.py')
      return normalizedEntrypointPath
        .replace(`${this.builder.projectDir}/`, '')
        .replace(/(.*)\.py$/, '$1')
        .replace(/\//g, '.')
    }

    const toFastAPI = (path: string) => {
      return path.replace(/:(\w+)/g, '{${1}}')
    }

    const archive = archiver('zip', { zlib: { level: 0 } })
    const outputStream = fs.createWriteStream(path.join(this.builder.distDir, 'router-python.zip'))
    archive.pipe(outputStream)

    const dependencies = ['fastapi', 'uvicorn', 'pydantic', 'uvloop']
    await Promise.all(
      dependencies.map(async (packageName) =>
        addPackageToArchive(archive, process.env.PYTHON_SITE_PACKAGES!, packageName),
      ),
    )

    for (const step of steps) {
      await this.buildStep(step, archive)
    }

    const file = fs
      .readFileSync(path.join(__dirname, 'router.py'), 'utf-8')
      .replace(
        '# {{imports}}',
        steps
          .map(
            (step, index) =>
              `from ${getStepPath(step)} import handler as route${index}_handler, config as route${index}_config`,
          )
          .join('\n'),
      )
      .replace(
        '# {{routes}}',
        steps
          .map((step, index) => {
            const method = step.config.method.toLowerCase()
            return [
              `@app.${method}('${toFastAPI(step.config.path)}')`,
              `async def handler_${index}(request: Request, response: Response):`,
              `    handler_route = await router(route${index}_handler, route${index}_config, create_context(context, '${step.config.name}'))`,
              `    return await handler_route(request, response)`,
            ].join('\n    ')
          })
          .join('\n\n    '),
      )

    archive.append(file, { name: 'router.py' })

    // Finalize the archive and wait for completion
    return new Promise<number>((resolve, reject) => {
      outputStream.on('close', () => resolve(archive.pointer()))
      outputStream.on('error', reject)
      archive.finalize()
    })
  }

  private async getPythonBuilderData(step: Step): Promise<{ file: string; files: string[]; packages: string[] }> {
    return new Promise((resolve, reject) => {
      const child = spawn('python', [path.join(__dirname, 'python-builder.py'), step.filePath], {
        cwd: this.builder.projectDir,
        stdio: [undefined, undefined, 'pipe', 'ipc'],
      })
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
