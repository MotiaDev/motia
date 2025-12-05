import path from 'path'
import { checkIfFileExists } from '../create/utils'

export const getPackageManager = (dir: string): string => {
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
    currentDir = path.dirname(currentDir)
  }

  return 'npm'
}
