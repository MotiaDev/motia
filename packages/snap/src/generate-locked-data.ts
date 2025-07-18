import { LockedData, Step, getStepConfig, getStreamConfig } from '@motiadev/core'
import { NoPrinter, Printer } from '@motiadev/core/dist/src/printer'
import { randomUUID } from 'crypto'
import { globSync } from 'glob'
import path from 'path'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

export const getStepFiles = (projectDir: string): string[] => {
  const stepsDir = path.join(projectDir, 'steps')
  return [
    ...globSync('**/*.step.{ts,js,py,rb}', { absolute: true, cwd: stepsDir }),
    ...globSync('**/*_step.{ts,js,py,rb}', { absolute: true, cwd: stepsDir }),
  ]
}

// Helper function to recursively collect flow data
export const collectFlows = async (projectDir: string, lockedData: LockedData): Promise<Step[]> => {
  const invalidSteps: Step[] = []
  const stepFiles = getStepFiles(projectDir)
  const streamFiles = [
    ...globSync(path.join(projectDir, '{steps,streams}/**/*.stream.{ts,js,py}')),
    ...globSync(path.join(projectDir, '{steps,streams}/**/*_stream.{ts,js,py}')),
  ]

  for (const filePath of stepFiles) {
    const config = await getStepConfig(filePath)

    if (!config) {
      console.warn(`No config found in step ${filePath}, step skipped`)
      continue
    }

    const result = lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })

    if (!result) {
      invalidSteps.push({ filePath, version, config })
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
