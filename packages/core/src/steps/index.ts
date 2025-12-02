import path from 'path'
import { fileURLToPath } from 'url'
import type { Step } from '../types'
import { config as emitConfig } from './emit.step'

export const systemSteps: Step[] = [
  {
    // NOTE: this is the path of the file inside the dist folder (dist/src/steps/)
    filePath: path.join(path.dirname(fileURLToPath(import.meta.url)), 'emit.step.ts'),
    version: '1',
    config: emitConfig,
  },
]
