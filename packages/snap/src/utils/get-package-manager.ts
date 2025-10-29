import { checkIfFileExists } from '../create/utils'

export const getPackageManager = (dir: string): string => {
  if (checkIfFileExists(dir, 'yarn.lock')) {
    return 'yarn'
  } else if (checkIfFileExists(dir, 'pnpm-lock.yaml')) {
    return 'pnpm'
  } else if (checkIfFileExists(dir, 'package-lock.json')) {
    return 'npm'
  } else {
    return 'unknown'
  }
}
