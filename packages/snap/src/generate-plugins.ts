import { Config, Motia, MotiaPlugin } from '@motiadev/core'
import { globSync } from 'glob'

const defaultPlugins: MotiaPlugin[] = [
  {
    workbench: [
      {
        packageName: '@motiadev/plugin-endpoint',
      },
    ],
  },
]

export const generatePlugins = async (motia: Motia): Promise<MotiaPlugin[]> => {
  const configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: motia.lockedData.baseDir })
  if (configFiles.length === 0) {
    return defaultPlugins
  }

  const appConfig: Config = (await import(configFiles[0])).default
  const plugins = appConfig.plugins?.flatMap((item) => item(motia)) || []

  return plugins.length > 0 ? [...defaultPlugins, ...plugins] : defaultPlugins
}
