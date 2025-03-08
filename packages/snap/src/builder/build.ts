import { Step, StepConfig } from '@motiadev/core'
import { LockedData } from '@motiadev/core/dist/src/locked-data'
import { NoPrinter } from '@motiadev/core/dist/src/printer'
import colors from 'colors'
import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { collectFlows } from '../generate-locked-data'
import { BuildPrinter } from './build-printer'
import { spawn } from 'child_process'
import archiver from 'archiver'

type StepType = 'node' | 'python'

class Builder {
  public readonly printer: BuildPrinter
  public readonly distDir: string
  public readonly stepsConfig: Record<string, { type: StepType; entrypointPath: string; config: StepConfig }>
  public modulegraphInstalled: boolean = false

  constructor(public readonly projectDir: string) {
    this.distDir = path.join(projectDir, 'dist')
    this.stepsConfig = {}
    this.printer = new BuildPrinter()
  }

  registerStep(args: { entrypointPath: string; bundlePath: string; step: Step; type: StepType }) {
    this.stepsConfig[args.bundlePath] = {
      type: args.type,
      entrypointPath: args.entrypointPath,
      config: args.step.config,
    }
  }
}

const installModulegraph = async (builder: Builder): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('python', ['-m', 'pip', 'install', 'modulegraph'], {
      cwd: builder.projectDir,
      stdio: 'pipe',
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to install modulegraph'))
      } else {
        builder.modulegraphInstalled = true
        resolve()
      }
    })
  })
}

const buildPython = async (step: Step, builder: Builder) => {
  const archive = archiver('zip', { zlib: { level: 9 } })
  const entrypointPath = step.filePath.replace(builder.projectDir, '')
  const bundlePath = path.join('python', entrypointPath.replace(/(.*)\.py$/, '$1.zip'))
  const outfile = path.join(builder.distDir, bundlePath)

  return new Promise<void>((resolve, reject) => {
    try {
      // Ensure output directory exists
      fs.mkdirSync(path.dirname(outfile), { recursive: true })
      builder.printer.printStepBuilding(step)

      const type = 'python'
      const child = spawn('python', [path.join(__dirname, 'python-builder.py'), step.filePath], {
        cwd: builder.projectDir,
        stdio: [undefined, undefined, undefined, 'ipc'],
      })

      builder.registerStep({ entrypointPath, bundlePath, step, type })

      archive.pipe(fs.createWriteStream(outfile))

      child.on('message', (message: string[]) => {
        message.forEach((file) => {
          archive.append(fs.createReadStream(path.join(builder.projectDir, file)), { name: file })
        })
      })

      let errorOutput = ''
      child.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

      child.on('close', (code) => {
        if (code !== 0) {
          const errorMessage = `Python builder failed with exit code ${code}. Error output: ${errorOutput}`
          builder.printer.printStepFailed(step, new Error(errorMessage))
          return reject(new Error(errorMessage))
        }

        builder.printer.printStepBuilt(step)
        archive.finalize()
      })

      archive.on('close', () => resolve())
      archive.on('error', (err) => reject(err))
    } catch (err) {
      builder.printer.printStepFailed(step, err as Error)
      reject(err)
    }
  })
}

const buildNode = async (step: Step, builder: Builder) => {
  const relativeFilePath = step.filePath.replace(builder.projectDir, '')
  const entrypointPath = relativeFilePath.replace(/(.*)\.(ts|js)$/, '$1.js')
  const entrypointMapPath = entrypointPath.replace(/(.*)\.js$/, '$1.js.map')
  const bundlePath = path.join('node', entrypointPath.replace(/(.*)\.js$/, '$1.zip'))
  const outputJsFile = path.join(builder.distDir, 'node', entrypointPath)
  const outputMapFile = path.join(builder.distDir, 'node', entrypointMapPath)
  const type = 'node'
  builder.registerStep({ entrypointPath, bundlePath, step, type })
  builder.printer.printStepBuilding(step)

  try {
    await esbuild.build({
      entryPoints: [step.filePath],
      bundle: true,
      sourcemap: true,
      outfile: outputJsFile,
      platform: 'node',
    })

    await new Promise<void>((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } })
      archive.pipe(fs.createWriteStream(path.join(builder.distDir, bundlePath)))
      archive.append(fs.createReadStream(outputJsFile), { name: entrypointPath })
      archive.append(fs.createReadStream(outputMapFile), { name: entrypointMapPath })
      archive.finalize()

      archive.on('close', () => {
        fs.unlinkSync(outputJsFile)
        fs.unlinkSync(outputMapFile)
        resolve()
      })
      archive.on('error', (err) => reject(err))
    })

    builder.printer.printStepBuilt(step)
  } catch (err) {
    builder.printer.printStepFailed(step, err as Error)
  }
}

export const build = async (): Promise<void> => {
  const projectDir = process.cwd()
  const builder = new Builder(projectDir)
  const stepsConfigPath = path.join(projectDir, 'dist', 'motia.steps.json')
  const lockedData = new LockedData(projectDir)
  const promises: Promise<unknown>[] = []

  const distDir = path.join(projectDir, 'dist')

  lockedData.printer = new NoPrinter(projectDir) // let's make it not print anything

  fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })

  lockedData.onStep('step-created', (step) => {
    if (step.config.type === 'noop') {
      return
    } else if (step.filePath.endsWith('.ts') || step.filePath.endsWith('.js')) {
      return promises.push(buildNode(step, builder))
    } else if (step.filePath.endsWith('.py')) {
      const setupPromise = !builder.modulegraphInstalled 
        ? installModulegraph(builder)
        : Promise.resolve()
        
      setupPromise.then(() => promises.push(buildPython(step, builder)))
    } else {
      return builder.printer.printStepSkipped(step, 'File not supported')
    }
  })

  await collectFlows(path.join(projectDir, 'steps'), lockedData)
  await Promise.all(promises)

  fs.writeFileSync(stepsConfigPath, JSON.stringify(builder.stepsConfig, null, 2))

  console.log(colors.green('✓ [SUCCESS] '), 'Build completed')
}
