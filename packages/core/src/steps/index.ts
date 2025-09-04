import path from 'path'
import type { Step } from '../types'
import { config as emitConfig } from './emit.step'

export const systemSteps: Step[] = [
  {
    // NOTE: this is the path of the file inside the dist folder
    filePath: path.join(__dirname, 'emit.step.js'),
    version: '1',
    config: emitConfig,
  },
]
