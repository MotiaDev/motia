import path from 'path'
import { Step } from '../types'
import { config as emitConfig } from './emit.step'
import { config as clearStateConfig } from './clear-state.step'
import { config as clearLogsConfig } from './clear-logs.step'
import { config as clearTracesConfig } from './clear-traces.step'

export const systemSteps: Step[] = [
  {
    // NOTE: this is the path of the file inside the dist folder
    filePath: path.join(__dirname, 'emit.step.js'),
    version: '1',
    config: emitConfig,
  },
  {
    filePath: path.join(__dirname, 'clear-state.step.js'),
    version: '1',
    config: clearStateConfig,
  },
  {
    filePath: path.join(__dirname, 'clear-logs.step.js'),
    version: '1',
    config: clearLogsConfig,
  },
  {
    filePath: path.join(__dirname, 'clear-traces.step.js'),
    version: '1',
    config: clearTracesConfig,
  },
]
