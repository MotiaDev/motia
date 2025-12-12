import fs from 'fs'
import path from 'path'
import { checkIfFileExists } from '../create/utils'

export const getPackageManagerFromEnv = (): string | null => {
  const userAgent = process.env.npm_config_user_agent
  if (!userAgent) {
    return null
  }

  const match = userAgent.match(/^(npm|pnpm|yarn|bun)\//)
  if (match) {
    return match[1]
  }

  return null
}

const readPackageManagerFromPackageJson = (dir: string): string | null => {
  const packageJsonPath = path.join(dir, 'package.json')
  if (!checkIfFileExists(dir, 'package.json')) {
    return null
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    if (packageJson.packageManager) {
      const pm = packageJson.packageManager.split('@')[0]
      if (['npm', 'yarn', 'pnpm', 'bun'].includes(pm)) {
        return pm
      }
    }
  } catch {
    return null
  }

  return null
}

export const getPackageManager = (dir: string): string => {
  const envPackageManager = getPackageManagerFromEnv()
  if (envPackageManager) {
    return envPackageManager
  }

  let currentDir = dir

  while (currentDir !== path.dirname(currentDir)) {
    if (checkIfFileExists(currentDir, 'yarn.lock')) {
      return 'yarn'
    } else if (checkIfFileExists(currentDir, 'pnpm-lock.yaml')) {
      return 'pnpm'
    } else if (checkIfFileExists(currentDir, 'package-lock.json')) {
      return 'npm'
    } else if (checkIfFileExists(currentDir, 'bun.lockb') || checkIfFileExists(currentDir, 'bun.lock')) {
      return 'bun'
    }

    const packageManagerFromJson = readPackageManagerFromPackageJson(currentDir)
    if (packageManagerFromJson) {
      return packageManagerFromJson
    }

    currentDir = path.dirname(currentDir)
  }

  return 'npm'
}
