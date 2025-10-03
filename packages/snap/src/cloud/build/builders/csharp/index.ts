import { ApiRouteConfig, Step } from '@motiadev/core'
import fs from 'fs'
import path from 'path'
import { distDir } from '../../../new-deployment/constants'
import { BuildListener } from '../../../new-deployment/listeners/listener.types'
import { Builder, RouterBuildResult, StepBuilder } from '../../builder'
import { Archiver } from '../archiver'
import { includeStaticFiles } from '../include-static-files'

export class CSharpBuilder implements StepBuilder {
  private csharpRunnerPath: string

  constructor(
    private readonly builder: Builder,
    private readonly listener: BuildListener,
  ) {
    // Path to the pre-built C# runner in @motiadev/core
    this.csharpRunnerPath = path.join(
      require.resolve('@motiadev/core'),
      '..',
      'src',
      'csharp',
      'bin',
      'Release',
      'net9.0',
    )
  }

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<RouterBuildResult> {
    // For C#, we don't need a router template like Python
    // Each C# step is self-contained and executed via MotiaRunner
    // Return empty result for now
    return { compressedSize: 0, uncompressedSize: 0, path: '' }
  }

  async build(step: Step): Promise<void> {
    const entrypointPath = step.filePath.replace(this.builder.projectDir, '')
    const bundlePath = path.join('csharp', entrypointPath.replace(/(.*)\.cs$/, '$1.zip'))
    const bundleDir = path.join(distDir, 'csharp', entrypointPath.replace(/(.*)\.cs$/, '$1'))
    const outfile = path.join(distDir, bundlePath)

    this.builder.registerStep({ entrypointPath, bundlePath, step, type: 'csharp' })
    this.listener.onBuildStart(step)

    try {
      fs.mkdirSync(path.dirname(outfile), { recursive: true })
      fs.mkdirSync(bundleDir, { recursive: true })
      const archive = new Archiver(outfile)

      // Add the C# step file
      const stepContent = fs.readFileSync(step.filePath, 'utf-8')
      archive.append(stepContent, path.basename(step.filePath))

      // Add the C# runner and its dependencies
      this.addCSharpRuntime(archive)

      // Include static files (if any)
      includeStaticFiles([step], this.builder, archive)

      const { compressedSize, uncompressedSize } = await archive.finalize()
      this.builder.recordStepSize(step, compressedSize, uncompressedSize)
      this.listener.onBuildEnd(step, compressedSize)
    } catch (err) {
      this.listener.onBuildError(step, err as Error)
      throw err
    }
  }

  private addCSharpRuntime(archive: Archiver): void {
    // Add the compiled MotiaRunner and its dependencies
    if (!fs.existsSync(this.csharpRunnerPath)) {
      throw new Error(`C# runner not found at ${this.csharpRunnerPath}. Please build @motiadev/core first.`)
    }

    // Add all files from the C# runner directory
    const files = this.getAllFiles(this.csharpRunnerPath)
    for (const file of files) {
      const relativePath = path.relative(this.csharpRunnerPath, file)
      const stream = fs.createReadStream(file)
      archive.append(stream, path.join('runtime', relativePath))
    }
  }

  private getAllFiles(dir: string): string[] {
    const files: string[] = []
    const items = fs.readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      if (item.isDirectory()) {
        files.push(...this.getAllFiles(fullPath))
      } else {
        files.push(fullPath)
      }
    }

    return files
  }
}

