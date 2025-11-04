import fs from 'node:fs'
import path from 'node:path'
import type { Config, Printer } from '@motiadev/core'
import { globSync } from 'glob'
import { installPluginDependencies } from './install-plugin-dependencies'

export const loadConfig = async (baseDir: string, printer: Printer): Promise<Config> => {
  const configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: baseDir })
  if (configFiles.length === 0) {
    const templatePath = path.join(__dirname, '../create/templates/nodejs/motia.config.ts.txt')
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const configPath = path.join(baseDir, 'motia.config.ts')
    fs.writeFileSync(configPath, templateContent)
    printer.printPluginLog('Created motia.config.ts')

    await installPluginDependencies(baseDir, printer)

    return (await import(configPath)).default
  }

  return (await import(configFiles[0])).default
}
