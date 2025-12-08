import type { Config } from '@motiadev/core'
import { globSync } from 'glob'
import { createJiti } from 'jiti'

export type LoadedMotiaConfig = Config

const jiti = createJiti(import.meta.url)

export const loadMotiaConfig = async (baseDir: string): Promise<LoadedMotiaConfig> => {
  const configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: baseDir })

  if (configFiles.length === 0) {
    return {}
  }

  try {
    const appConfig: Config = (await jiti.import(configFiles[0], { default: true })) as Config
    return appConfig
  } catch (error) {
    console.warn('Failed to load motia.config.ts:', error)
    return {}
  }
}
