import {
  getStepConfig,
  getStreamConfig,
  type JsonSchema,
  LockedData,
  type Step,
  type StreamAdapterManager,
  type StreamAuthConfig,
} from '@motiadev/core'
import { NoPrinter, Printer } from '@motiadev/core/dist/src/printer'
import colors from 'colors'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'
import type { RedisClientType } from 'redis'
import { activatePythonVenv } from './utils/activate-python-env'
import { CompilationError } from './utils/errors/compilation.error'
import { LockedDataGenerationError } from './utils/errors/locked-data-generation.error'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

const getStepFilesFromDir = (dir: string): string[] => {
  if (!existsSync(dir)) {
    return []
  }
  return [
    ...globSync('**/*.step.{ts,js,rb}', { absolute: true, cwd: dir }),
    ...globSync('**/*_step.{ts,js,py,rb}', { absolute: true, cwd: dir }),
  ]
}

export const getStepFiles = (projectDir: string): string[] => {
  const stepsDir = path.join(projectDir, 'steps')
  const srcDir = path.join(projectDir, 'src')
  return [...getStepFilesFromDir(stepsDir), ...getStepFilesFromDir(srcDir)]
}

const getStreamFilesFromDir = (dir: string): string[] => {
  if (!existsSync(dir)) {
    return []
  }
  return [
    ...globSync('**/*.stream.{ts,js,rb}', { absolute: true, cwd: dir }),
    ...globSync('**/*_stream.{ts,js,py,rb}', { absolute: true, cwd: dir }),
  ]
}

export const getStreamFiles = (projectDir: string): string[] => {
  const stepsDir = path.join(projectDir, 'steps')
  const srcDir = path.join(projectDir, 'src')
  return [...getStreamFilesFromDir(stepsDir), ...getStreamFilesFromDir(srcDir)]
}

// Helper function to recursively collect flow data
export const collectFlows = async (projectDir: string, lockedData: LockedData): Promise<Step[]> => {
  const invalidSteps: Step[] = []
  const stepFiles = getStepFiles(projectDir)
  const streamFiles = getStreamFiles(projectDir)
  const stepsDir = path.join(projectDir, 'steps')
  const srcDir = path.join(projectDir, 'src')
  const deprecatedSteps = [
    ...(existsSync(stepsDir) ? globSync('**/*.step.py', { absolute: true, cwd: stepsDir }) : []),
    ...(existsSync(srcDir) ? globSync('**/*.step.py', { absolute: true, cwd: srcDir }) : []),
  ]

  const hasPythonFiles = stepFiles.some((file) => file.endsWith('.py'))

  if (hasPythonFiles) {
    activatePythonVenv({ baseDir: projectDir })
  }

  for (const filePath of stepFiles) {
    try {
      const config = await getStepConfig(filePath, projectDir)

      if (!config) {
        console.warn(`No config found in step ${filePath}, step skipped`)
        continue
      }

      const result = lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })

      if (!result) {
        invalidSteps.push({ filePath, version, config })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes('Executable ruby not found') || errorMessage.includes('Executable python not found')) {
        console.warn(colors.yellow(`! [WARNING] Skipping step ${filePath}: ${errorMessage}`))
        continue
      }
      throw new CompilationError(`Error collecting flow ${filePath}`, path.relative(projectDir, filePath), err as Error)
    }
  }

  for (const filePath of streamFiles) {
    const config = await getStreamConfig(filePath)

    if (!config) {
      console.warn(`No config found in stream ${filePath}, stream skipped`)
      continue
    }

    lockedData.createStream({ filePath, config }, { disableTypeCreation: true })
  }

  if (deprecatedSteps.length > 0) {
    const warning = colors.yellow('! [WARNING]')
    console.warn(
      colors.yellow(
        [
          '',
          '========================================',
          warning,
          '',
          `Python steps with ${colors.gray('.step.py')} extensions are no longer supported.`,
          `Please rename them to ${colors.gray('_step.py')}.`,
          '',
          colors.bold('Steps:'),
          ...deprecatedSteps.map((step) =>
            colors.reset(
              `- ${colors.cyan(colors.bold(step.replace(projectDir, '')))} rename to ${colors.gray(`${step.replace(projectDir, '').replace('.step.py', '_step.py')}`)}`,
            ),
          ),

          '',
          'Make sure the step names are importable from Python:',
          `- Don't use numbers, dots, dashes, commas, spaces, colons, or special characters`,
          '========================================',
          '',
        ].join('\n'),
      ),
    )
  }

  return invalidSteps
}

type StreamAuthOptions = {
  authenticate: StreamAuthConfig['authenticate']
  contextSchema?: JsonSchema
}

export const generateLockedData = async (config: {
  projectDir: string
  streamAdapter: StreamAdapterManager
  redisClient: RedisClientType
  printerType?: 'disabled' | 'default'
  streamAuth?: StreamAuthOptions
}): Promise<LockedData> => {
  try {
    const { projectDir, streamAdapter, printerType = 'default', redisClient, streamAuth } = config
    const printer = printerType === 'disabled' ? new NoPrinter() : new Printer(projectDir)
    /*
     * NOTE: right now for performance and simplicity let's enforce a folder,
     * but we might want to remove this and scan the entire current directory
     */
    const lockedData = new LockedData(projectDir, streamAdapter, printer, redisClient)
    lockedData.setStreamAuthConfig(streamAuth)

    await collectFlows(projectDir, lockedData)
    lockedData.saveTypes()

    return lockedData
  } catch (error) {
    console.error(error)

    throw new LockedDataGenerationError(
      'Failed to parse the project, generating locked data step failed',
      error as Error,
    )
  }
}
