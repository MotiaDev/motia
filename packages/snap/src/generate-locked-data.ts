import { LockedData, Step, getStepConfig, getStreamConfig } from '@motiadev/core'
import { NoPrinter, Printer } from '@motiadev/core/dist/src/printer'
import colors from 'colors'
import { randomUUID } from 'crypto'
import { globSync } from 'glob'
import path from 'path'
import { CompilationError } from './utils/errors/compilation.error'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

export const getStepFiles = (projectDir: string, stepDirs?: string[]): string[] => {
  const dirs = stepDirs || [path.join(projectDir, 'steps')]
  
  const allStepFiles: string[] = []
  
  for (const dir of dirs) {
    allStepFiles.push(
      ...globSync('**/*.step.{ts,js,rb}', { absolute: true, cwd: dir }),
      ...globSync('**/*_step.{ts,js,py,rb}', { absolute: true, cwd: dir }),
    )
  }
  
  return allStepFiles
}

export const getStreamFiles = (projectDir: string, stepDirs?: string[]): string[] => {
  const dirs = stepDirs || [path.join(projectDir, 'steps')]
  
  const allStreamFiles: string[] = []
  
  for (const dir of dirs) {
    allStreamFiles.push(
      ...globSync('**/*.stream.{ts,js,rb}', { absolute: true, cwd: dir }),
      ...globSync('**/*_stream.{ts,js,py,rb}', { absolute: true, cwd: dir }),
    )
  }
  
  return allStreamFiles
}

// Helper function to recursively collect flow data
export const collectFlows = async (projectDir: string, lockedData: LockedData, stepDirs: string[]): Promise<Step[]> => {
  const invalidSteps: Step[] = []
  const stepFiles = getStepFiles(projectDir, stepDirs)
  const streamFiles = getStreamFiles(projectDir, stepDirs)
  
  const deprecatedSteps: string[] = []
  for (const dir of stepDirs) {
    deprecatedSteps.push(...globSync('**/*.step.py', { absolute: true, cwd: dir }))
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

export type GenerateLockedDataParams = {
  projectDir: string
  streamAdapter?: 'file' | 'memory'
  printerType?: 'disabled' | 'default'
  stepDirs: string[]
}

export const generateLockedData = async ({
  projectDir,
  streamAdapter = 'file',
  printerType = 'default',
  stepDirs,
}: GenerateLockedDataParams): Promise<LockedData> => {
  try {
    const printer = printerType === 'disabled' ? new NoPrinter() : new Printer(projectDir)
    const lockedData = new LockedData(projectDir, streamAdapter, printer)

    await collectFlows(projectDir, lockedData, stepDirs)
    lockedData.saveTypes()

    return lockedData
  } catch (error) {
    console.error(error)
    throw Error('Failed to parse the project, generating locked data step failed')
  }
}
