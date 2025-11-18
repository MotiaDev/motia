import { getStepConfig, getStreamConfig, LockedData, MemoryStreamAdapterManager, Printer } from '@motiadev/core'
import { randomUUID } from 'crypto'
import { getStepFiles, getStreamFiles } from './generate-locked-data'
import { instanceRedisMemoryServer } from './redis-memory-manager'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

export const generateTypes = async (projectDir: string) => {
  const files = getStepFiles(projectDir)
  const streamsFiles = getStreamFiles(projectDir)
  const redisClient = await instanceRedisMemoryServer(projectDir, false)

  const lockedData = new LockedData(projectDir, new MemoryStreamAdapterManager(), new Printer(projectDir), redisClient)

  for (const filePath of files) {
    const config = await getStepConfig(filePath, projectDir)

    if (config) {
      lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })
    }
  }

  for (const filePath of streamsFiles) {
    const config = await getStreamConfig(filePath, projectDir)

    if (config) {
      lockedData.createStream({ filePath, config }, { disableTypeCreation: true })
    }
  }

  lockedData.saveTypes()

  console.log('✨ Types created successfully')
}
