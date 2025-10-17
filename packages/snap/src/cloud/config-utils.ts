import { CLIOutputManager, type Message } from './cli-output-manager'

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

    try {
      await handler(args, context)
    } catch (error: any) {
      if (error instanceof Error) {
        context.log('error', (message) => message.tag('failed').append(error.message))
        context.exit(1)
      } else {
        context.exitWithError('An error occurred', error)
      }
    }
  }
}
