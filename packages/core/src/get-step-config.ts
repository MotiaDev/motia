import { getLanguageBasedRunner } from './language-runner'
import { globalLogger } from './logger'
import { ProcessManager } from './process-communication/process-manager'
import { compile } from './ts-compiler'
import type { StepConfig } from './types'
import type { StreamConfig } from './types-stream'

const getConfig = async <T>(file: string, projectRoot?: string): Promise<T | null> => {
  const filePathToExecute = file.endsWith('.ts') ? await compile(file) : file

  const { runner, command, args } = getLanguageBasedRunner(file, {
    python: 'get-config.py',
    ruby: 'get-config.rb',
    node: { js: 'get-config.mjs', ts: 'get-config.ts' },
  })

  const processManager = new ProcessManager({
    command,
    args: [...args, runner, filePathToExecute],
    logger: globalLogger,
    context: 'Config',
    projectRoot,
  })

  return new Promise((resolve, reject) => {
    let config: T | null = null

    processManager
      .spawn()
      .then(() => {
        processManager.onMessage<T>((message) => {
          config = message
          globalLogger.debug(`[Config] Read config via ${processManager.commType?.toUpperCase()}`, {
            config,
            communicationType: processManager.commType,
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
      })
      .catch((error) => {
        reject(`Failed to spawn process: ${error}`)
      })
  })
}

export const getStepConfig = (file: string, projectRoot?: string): Promise<StepConfig | null> => {
  return getConfig<StepConfig>(file, projectRoot)
}

export const getStreamConfig = (file: string, projectRoot?: string): Promise<StreamConfig | null> => {
  return getConfig<StreamConfig>(file, projectRoot)
}

export { invalidate } from './ts-compiler'
