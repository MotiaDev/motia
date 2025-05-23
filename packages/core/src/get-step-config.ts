import path from 'path'
import { StepConfig } from './types'
import { globalLogger } from './logger'
import { StateStreamConfig } from './types-stream'
import { ProcessManager } from './process-communication/process-manager'

const getLanguageBasedRunner = (
  stepFilePath = '',
): {
  command: string
  runner: string
  args: string[]
} => {
  const isPython = stepFilePath.endsWith('.py')
  const isRuby = stepFilePath.endsWith('.rb')
  const isNode = stepFilePath.endsWith('.js') || stepFilePath.endsWith('.ts')

  if (isPython) {
    const pythonRunner = path.join(__dirname, 'python', 'get-config.py')
    return { runner: pythonRunner, command: 'python', args: [] }
  } else if (isRuby) {
    const rubyRunner = path.join(__dirname, 'ruby', 'get-config.rb')
    return { runner: rubyRunner, command: 'ruby', args: [] }
  } else if (isNode) {
    if (process.env._MOTIA_TEST_MODE === 'true') {
      const nodeRunner = path.join(__dirname, 'node', 'get-config.ts')
      return { runner: nodeRunner, command: 'node', args: ['-r', 'ts-node/register'] }
    }

    const nodeRunner = path.join(__dirname, 'node', 'get-config.js')
    return { runner: nodeRunner, command: 'node', args: [] }
  }

  throw Error(`Unsupported file extension ${stepFilePath}`)
}

const getConfig = <T>(file: string): Promise<T | null> => {
  const { runner, command, args } = getLanguageBasedRunner(file)

  return new Promise((resolve, reject) => {
    let config: T | null = null

    const processManager = new ProcessManager({
      command,
      args: [...args, runner, file],
      logger: globalLogger,
      context: 'Config'
    })

    processManager.spawn().then(() => {
      processManager.onMessage<T>((message) => {
        config = message
        globalLogger.debug(`[Config] Read config via ${processManager.commType?.toUpperCase()}`, {
          config,
          communicationType: processManager.commType
        })
        resolve(config)
        processManager.kill()
      })

      processManager.onProcessClose((code) => {
        processManager.close()
        if (config) {
          return
        } else if (code !== 0) {
          reject(`Process exited with code ${code}`)
        } else if (!config) {
          reject(`No config found for file ${file}`)
        }
      })

      processManager.onProcessError((error) => {
        processManager.close()
        if (error.code === 'ENOENT') {
          reject(`Executable ${command} not found`)
        } else {
          reject(error)
        }
      })

    }).catch((error) => {
      reject(`Failed to spawn process: ${error}`)
    })
  })
}

export const getStepConfig = (file: string): Promise<StepConfig | null> => {
  return getConfig<StepConfig>(file)
}

export const getStreamConfig = (file: string): Promise<StateStreamConfig | null> => {
  return getConfig<StateStreamConfig>(file)
}

