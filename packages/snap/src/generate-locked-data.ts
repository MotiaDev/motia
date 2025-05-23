import { LockedData, getStepConfig, getStreamConfig } from '@motiadev/core'
import { randomUUID } from 'crypto'
import { globSync } from 'glob'
import path from 'path'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

export const getStepFiles = (projectDir: string): string[] => {
  const stepsDir = path.join(projectDir, 'steps')
  return globSync('**/*.step.{ts,js,py,rb}', { absolute: true, cwd: stepsDir })
}

// Helper function to recursively collect flow data
export const collectFlows = async (projectDir: string, lockedData: LockedData): Promise<void> => {
  const stepFiles = getStepFiles(projectDir)
  const streamFiles = globSync(path.join(projectDir, '{steps,streams}/**/*.stream.{ts,js}'))

  for (const filePath of stepFiles) {
    const config = await getStepConfig(filePath)

    if (!config) {
      console.warn(`No config found in step ${filePath}, step skipped`)
      continue
    }

    lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })
  }

  for (const filePath of streamFiles) {
    const config = await getStreamConfig(filePath)

    if (!config) {
      console.warn(`No config found in stream ${filePath}, stream skipped`)
      continue
    }

    lockedData.createStream({ filePath, config }, { disableTypeCreation: true })
  }
}

export const generateLockedData = async (projectDir: string): Promise<LockedData> => {
  try {
    /*
     * NOTE: right now for performance and simplicity let's enforce a folder,
     * but we might want to remove this and scan the entire current directory
     */
    const lockedData = new LockedData(projectDir)

    await collectFlows(projectDir, lockedData)
    lockedData.saveTypes()

    return lockedData
  } catch (error) {
    console.error(error)
    throw Error('Failed to parse the project, generating locked data step failed')
  }
}
