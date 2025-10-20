import fs from 'fs'
import path from 'path'
import { executeCommand } from '../utils/execute-command'

export const checkIfFileExists = (dir: string, fileName: string): boolean => {
  return fs.existsSync(path.join(dir, fileName))
}

export const checkIfDirectoryExists = (dir: string): boolean => {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}
