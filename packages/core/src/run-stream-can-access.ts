import { getLanguageBasedRunner } from './language-runner'
import { globalLogger } from './logger'
import { ProcessManager } from './process-communication/process-manager'
import type { StreamSubscription } from './types-stream'

type RunStreamCanAccessOptions = {
  file: string
  subscription: StreamSubscription
  authContext?: unknown
  projectRoot?: string
}

export const runStreamCanAccess = async ({
  file,
  subscription,
  authContext,
  projectRoot,
}: RunStreamCanAccessOptions): Promise<boolean> => {
  const { runner, command, args } = getLanguageBasedRunner(file, {
    python: 'can-access.py',
    ruby: 'can-access.rb',
    node: { js: 'can-access.mjs', ts: 'can-access.ts' },
  })

  const payload = JSON.stringify({ subscription, authContext })

  return new Promise((resolve, reject) => {
    let result: boolean | null = null

    const processManager = new ProcessManager({
      command,
      args: [...args, runner, file, payload],
      logger: globalLogger,
      context: 'StreamCanAccess',
      projectRoot,
    })

    processManager
      .spawn()
      .then(() => {
        processManager.onMessage<boolean>((message) => {
          result = Boolean(message)
          resolve(result)
          processManager.kill()
        })

        processManager.onProcessClose((code) => {
          processManager.close()

          if (result !== null) {
            return
          }

          if (code !== 0) {
            reject(`Process exited with code ${code}`)
          } else {
            reject('Stream canAccess evaluation returned no result')
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
        processManager.close()
        reject(`Failed to spawn process: ${error}`)
      })
  })
}
