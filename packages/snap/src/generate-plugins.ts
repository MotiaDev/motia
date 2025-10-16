import { Config, Motia, MotiaPlugin, MotiaPluginContext } from '@motiadev/core'
import fs from 'fs'
import { globSync } from 'glob'
import path from 'path'

export const generatePlugins = async (motia: Motia): Promise<MotiaPlugin[]> => {
  const baseDir = motia.lockedData.baseDir
  let configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: baseDir })

  if (configFiles.length === 0) {
    // Read template and create config file
    const templatePath = path.join(__dirname, 'create/templates/nodejs/motia.config.ts.txt')
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const configPath = path.join(baseDir, 'motia.config.ts')
    fs.writeFileSync(configPath, templateContent)
    console.log('Created motia.config.ts with default plugins')

    configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: baseDir })
  }

  const context: MotiaPluginContext = {
    app: motia.app,
    state: motia.stateAdapter,
    lockedData: motia.lockedData,
  }

  const appConfig: Config = (await import(configFiles[0])).default
  const plugins = appConfig.plugins?.flatMap((item) => item(context)) || []

  return plugins
}
