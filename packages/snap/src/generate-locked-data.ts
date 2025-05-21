import { getStepConfig, LockedData } from '@motiadev/core'
import { randomUUID } from 'crypto'
import { globSync } from 'glob'
import path from 'path'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

export const getStepFiles = (projectDir: string): string[] => {
  return globSync(path.join(projectDir, 'steps', '**', '*.step.{ts,js,py,rb}'), {
    windowsPathsNoEscape: process.platform === 'win32',
  })
}

// Helper function to recursively collect flow data
export const collectFlows = async (projectDir: string, lockedData: LockedData): Promise<void> => {
  const files = getStepFiles(projectDir)

  for (const filePath of files) {
    const config = await getStepConfig(filePath)

    if (!config) {
      console.warn(`No config found in step ${filePath}, step skipped`)
      continue
    }

    lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })
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
