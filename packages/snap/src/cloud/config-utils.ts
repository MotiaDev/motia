import { flush } from '@amplitude/analytics-node'
import { logCliError } from '../utils/analytics'
import { handleBuildToolsError } from '../utils/build-tools-error'
import { CLIOutputManager, type Message } from './cli-output-manager'

export type { Message }

const getCommandName = (): string => {
  const args = process.argv.slice(2)
  const commandParts: string[] = []

  for (let i = 0; i < args.length && i < 3; i++) {
    const arg = args[i]
    if (!arg.startsWith('-') && !arg.startsWith('--')) {
      commandParts.push(arg)
    } else {
      break
    }
  }

  return commandParts.join(' ') || 'unknown'
}

export class CliContext {
  private readonly output = new CLIOutputManager()

  log(id: string, callback: (message: Message) => void) {
    this.output.log(id, callback)
  }

  exitWithError(msg: string, error?: unknown): never {
    this.output.log('error', (message) => {
      message.tag('failed').append(msg)

      if (error) {
        message.box([error instanceof Error ? error.message : 'Unknown error'], 'red')
      }
    })
    process.exit(1)
  }

  exit(code: number): never {
    process.exit(code)
  }
}

export type CliHandler = <TArgs extends Record<string, any>>(args: TArgs, context: CliContext) => Promise<void>

export function handler(handler: CliHandler): (args: Record<string, any>) => Promise<void> {
  return async (args: Record<string, unknown>) => {
    const context = new CliContext()
    const commandName = getCommandName()

    try {
      await handler(args, context)
    } catch (error: any) {
      logCliError(commandName, error)
      await flush().promise.catch(() => {
        // Silently fail
      })

      const wasBuildToolsError = handleBuildToolsError(error, 'install')

      if (!wasBuildToolsError) {
        if (error instanceof Error) {
          context.log('error', (message) => message.tag('failed').append(error.message))
        } else {
          context.exitWithError('An error occurred', error)
        }
      }

      context.exit(1)
    }
  }
}
