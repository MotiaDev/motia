import type { Config } from '@motiadev/core'
import { globSync } from 'glob'

export const loadMotiaConfig = async (baseDir: string): Promise<Config> => {
  const configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: baseDir })

  if (configFiles.length === 0) {
    return {}
  }

  try {
    const appConfig: Config = (await import(configFiles[0])).default
    return appConfig || {}
  } catch (error) {
    console.warn('Failed to load motia.config.ts:', error)
    return {}
  }
}
