import { getStepConfig, getStreamConfig, LockedData, Printer } from '@motiadev/core'
import { randomUUID } from 'crypto'
import { globSync } from 'glob'
import path from 'path'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

export const generateTypes = async (projectDir: string) => {
  const stepsDir = path.join(projectDir, 'steps')
  const files = globSync('**/*.step.{ts,js,py,rb}', {
    absolute: true,
    cwd: stepsDir,
  })
  const streamsFiles = globSync('**/*.stream.{ts,js,py,rb}', {
    absolute: true,
    cwd: stepsDir,
  })
  const lockedData = new LockedData(projectDir, 'memory', new Printer(projectDir))

  for (const filePath of files) {
    const config = await getStepConfig(filePath)

    if (config) {
      lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })
    }
  }

  for (const filePath of streamsFiles) {
    const config = await getStreamConfig(filePath)

    if (config) {
      lockedData.createStream({ filePath, config }, { disableTypeCreation: true })
    }
  }

  lockedData.saveTypes()

  console.log('✨ Types created successfully')
}
