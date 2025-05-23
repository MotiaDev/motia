import { getStepConfig, LockedData } from '@motiadev/core'
import { randomUUID } from 'crypto'
import { globSync } from 'glob'
import path from 'path'

const version = `${randomUUID()}:${Math.floor(Date.now() / 1000)}`

export const generateTypes = async (projectDir: string) => {
  const stepsDir = path.join(projectDir, 'steps')
  const files = globSync('**/*.step.{ts,js,py,rb}', { absolute: true, cwd: stepsDir })
  const lockedData = new LockedData(projectDir)

  for (const filePath of files) {
    const config = await getStepConfig(filePath)

    if (config) {
      lockedData.createStep({ filePath, version, config }, { disableTypeCreation: true })
    }
  }

  lockedData.saveTypes()

  console.log('✨ Types created successfully')
}
