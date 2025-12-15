import fs from 'node:fs'
import path from 'node:path'
import type { Printer } from '@motiadev/core'
import { executeCommand } from '../utils/execute-command'
import { getPackageManager } from '../utils/get-package-manager'
import { version } from '../version'
import { pluginDependencies } from './plugin-dependencies'

export const installPluginDependencies = async (baseDir: string, printer: Printer): Promise<void> => {
  const packageJsonPath = path.join(baseDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    printer.printPluginWarn('No package.json found, skipping plugin dependency installation')
    return
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies) {
    packageJson.dependencies = {}
  }

  const missingDependencies: string[] = []

  for (const dep of pluginDependencies) {
    if (packageJson.devDependencies?.[dep]) {
      delete packageJson.devDependencies[dep]
    }

    if (!packageJson.dependencies[dep]) {
      packageJson.dependencies[dep] = version
      missingDependencies.push(dep)
    }
  }

  if (missingDependencies.length === 0) {
    printer.printPluginLog('All plugin dependencies already installed')
    return
  }

  printer.printPluginLog(`Adding missing plugin dependencies: ${missingDependencies.join(', ')}`)

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
  printer.printPluginLog('Updated package.json with plugin dependencies')

  let packageManager = getPackageManager(baseDir)
  if (packageManager === 'unknown') {
    printer.printPluginError('No package manager found, using npm as default')
    packageManager = 'npm'
  }
  printer.printPluginLog(`Installing dependencies using ${packageManager}...`)

  const installCommands: Record<string, string> = {
    npm: 'npm install',
    yarn: 'yarn install',
    pnpm: 'pnpm install',
  }

  const installCommand = installCommands[packageManager] || 'npm install'

  try {
    await executeCommand(installCommand, baseDir, { silent: false })
    printer.printPluginLog('Plugin dependencies installed successfully')
  } catch (error) {
    printer.printPluginError('Failed to install plugin dependencies:', error)
    printer.printPluginWarn(`Please run '${installCommand}' manually to install the dependencies`)
  }
}
