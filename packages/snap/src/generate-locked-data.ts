import { LockedData, Step, getStepConfig, getStreamConfig } from '@motiadev/core'
import { NoPrinter, Printer } from '@motiadev/core/dist/src/printer'
import colors from 'colors'
import { randomUUID } from 'crypto'
import { globSync } from 'glob'
import path from 'path'
import { CompilationError } from './utils/errors/compilation.error'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

export const getStepFiles = (projectDir: string): string[] => {
  const stepsDir = path.join(projectDir, 'steps')
  return [
    ...globSync('**/*.step.{ts,js,rb}', { absolute: true, cwd: stepsDir }),
    ...globSync('**/*_step.{ts,js,py,rb}', { absolute: true, cwd: stepsDir }),
  ]
}

export const getStreamFiles = (projectDir: string): string[] => {
  const stepsDir = path.join(projectDir, 'steps')
  return [
    ...globSync('**/*.stream.{ts,js,rb}', { absolute: true, cwd: stepsDir }),
    ...globSync('**/*_stream.{ts,js,py,rb}', { absolute: true, cwd: stepsDir }),
  ]
}

// Helper function to recursively collect flow data
export const collectFlows = async (projectDir: string, lockedData: LockedData): Promise<Step[]> => {
  const invalidSteps: Step[] = []
  const stepFiles = getStepFiles(projectDir)
  const streamFiles = getStreamFiles(projectDir)
  const deprecatedSteps = globSync('**/*.step.py', { absolute: true, cwd: path.join(projectDir, 'steps') })

  for (const filePath of stepFiles) {
    try {
      const config = await getStepConfig(filePath)

      if (!config) {
        console.warn(`No config found in step ${filePath}, step skipped`)
        continue
      }

      const result = lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })

      if (!result) {
        invalidSteps.push({ filePath, version, config })
      }
    } catch (err) {
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

export const generateLockedData = async (
  projectDir: string,
  streamAdapter: 'file' | 'memory' = 'file',
  printerType: 'disabled' | 'default' = 'default',
): Promise<LockedData> => {
  try {
    const printer = printerType === 'disabled' ? new NoPrinter() : new Printer(projectDir)
    /*
     * NOTE: right now for performance and simplicity let's enforce a folder,
     * but we might want to remove this and scan the entire current directory
     */
    const lockedData = new LockedData(projectDir, streamAdapter, printer)

    await collectFlows(projectDir, lockedData)
    lockedData.saveTypes()

    return lockedData
  } catch (error) {
    console.error(error)
    throw Error('Failed to parse the project, generating locked data step failed')
  }
}
