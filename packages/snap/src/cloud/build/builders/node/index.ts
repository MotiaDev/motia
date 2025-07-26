import { ApiRouteConfig, Step } from '@motiadev/core'
import colors from 'colors'
import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { Builder, RouterBuildResult, StepBuilder } from '../../builder'
import { Archiver } from '../archiver'
import { includeStaticFiles } from '../include-static-files'

export class NodeBuilder implements StepBuilder {
  constructor(private readonly builder: Builder) {}

  private async loadEsbuildConfig(): Promise<esbuild.BuildOptions | null> {
    const configFiles = ['esbuild.config.json', '.esbuildrc.json']

    for (const configFile of configFiles) {
      const configPath = path.join(this.builder.projectDir, configFile)
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf-8')
          return JSON.parse(configContent)
        } catch (err) {
          console.warn(colors.yellow(`Warning: Failed to load esbuild config from ${configFile}`))
        }
      }
    }

    return null
  }

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<RouterBuildResult> {
    const relativePath = path.relative(this.builder.distDir, this.builder.projectDir)
    const getStepPath = (step: Step<ApiRouteConfig>) => {
      return step.filePath.replace(this.builder.projectDir, relativePath).replace(/(.*)\.(ts|js)$/, '$1.js')
    }

    const file = fs
      .readFileSync(path.join(__dirname, 'router-template.ts'), 'utf-8')
      .replace(
        '// {{imports}}',
        steps.map((step, index) => `import * as route${index} from '${getStepPath(step)}'`).join('\n'),
      )
      .replace(
        '// {{routes}}',
        steps
          .map((step, index) => {
            const method = step.config.method.toLowerCase()
            return `app.${method}('${step.config.path}', router(route${index}.handler, route${index}.config, createContext(context, '${step.config.name}')))`
          })
          .join('\n  '),
      )

    const tsRouter = path.join(this.builder.distDir, 'router.ts')
    fs.writeFileSync(tsRouter, file)

    const userConfig = await this.loadEsbuildConfig()
    const defaultConfig: esbuild.BuildOptions = {
      entryPoints: [tsRouter],
      bundle: true,
      sourcemap: true,
      outfile: path.join(this.builder.distDir, 'router.js'),
      platform: 'node',
    }

    await esbuild.build(userConfig ? { ...defaultConfig, ...userConfig } : defaultConfig)

    const zipName = 'router-node.zip'
    const archiver = new Archiver(path.join(this.builder.distDir, zipName))
    const routerJs = path.join(this.builder.distDir, 'router.js')
    const routerMap = path.join(this.builder.distDir, 'router.js.map')

    archiver.append(fs.createReadStream(routerJs), 'router.js')
    archiver.append(fs.createReadStream(routerMap), 'router.js.map')
    includeStaticFiles(steps, this.builder, archiver)

    const size = await archiver.finalize()

    fs.unlinkSync(tsRouter)
    fs.unlinkSync(routerJs)
    fs.unlinkSync(routerMap)

    return { size, path: zipName }
  }

  async build(step: Step): Promise<void> {
    const relativeFilePath = step.filePath.replace(this.builder.projectDir, '')
    const entrypointPath = relativeFilePath.replace(/(.*)\.(ts|js)$/, '$1.js')
    const entrypointMapPath = entrypointPath.replace(/(.*)\.js$/, '$1.js.map')
    const bundlePath = path.join('node', entrypointPath.replace(/(.*)\.js$/, '$1.zip'))
    const outputJsFile = path.join(this.builder.distDir, 'node', entrypointPath)
    const outputMapFile = path.join(this.builder.distDir, 'node', entrypointMapPath)

    this.builder.registerStep({ entrypointPath, bundlePath, step, type: 'node' })
    this.builder.printer.printStepBuilding(step)

    try {
      const userConfig = await this.loadEsbuildConfig()
      const defaultConfig: esbuild.BuildOptions = {
        entryPoints: [step.filePath],
        bundle: true,
        sourcemap: true,
        outfile: outputJsFile,
        platform: 'node',
      }

      await esbuild.build(userConfig ? { ...defaultConfig, ...userConfig } : defaultConfig)

      const archiver = new Archiver(path.join(this.builder.distDir, bundlePath))

      archiver.append(fs.createReadStream(outputJsFile), entrypointPath)
      archiver.append(fs.createReadStream(outputMapFile), entrypointMapPath)
      includeStaticFiles([step], this.builder, archiver)

      const size = await archiver.finalize()

      fs.unlinkSync(outputJsFile)
      fs.unlinkSync(outputMapFile)

      this.builder.printer.printStepBuilt(step, size)
    } catch (err) {
      this.builder.printer.printStepFailed(step, err as Error)
      throw err
    }
  }
}
