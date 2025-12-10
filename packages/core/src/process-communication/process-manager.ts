import { type ChildProcess, spawn } from 'child_process'
import type { Logger } from '../logger'
import { RpcProcessor } from '../step-handler-rpc-processor'
import { RpcStdinProcessor } from '../step-handler-rpc-stdin-processor'
import { type CommunicationType, createCommunicationConfig } from './communication-config'
import type { MessageCallback, RpcHandler, RpcProcessorInterface } from './rpc-processor-interface'

export interface ProcessManagerOptions {
  command: string
  args: string[]
  logger: Logger
  context?: string
  projectRoot?: string
}

export class ProcessManager {
  private child?: ChildProcess
  private processor?: RpcProcessorInterface
  private communicationType?: CommunicationType

  constructor(private options: ProcessManagerOptions) {}

  async spawn(): Promise<ChildProcess> {
    const { command, args, logger, context = 'Process', projectRoot } = this.options

    // Get communication configuration
    const commConfig = createCommunicationConfig(command, projectRoot)
    this.communicationType = commConfig.type

    logger.debug(`[${context}] Spawning process`, {
      command,
      args,
      communicationType: this.communicationType,
    })

    // Spawn the process
    this.child = spawn(command, args, commConfig.spawnOptions)

    // Create appropriate processor based on communication type
    this.processor = this.communicationType === 'rpc' ? new RpcStdinProcessor(this.child) : new RpcProcessor(this.child)

    // Initialize the processor
    await this.processor.init()

    return this.child
  }

  handler<TInput, TOutput = unknown>(method: string, handler: RpcHandler<TInput, TOutput>): void {
    if (!this.processor) {
      throw new Error('Process not spawned yet. Call spawn() first.')
    }
    this.processor.handler(method, handler)
  }

  onMessage<T = unknown>(callback: MessageCallback<T>): void {
    if (!this.processor) {
      throw new Error('Process not spawned yet. Call spawn() first.')
    }
    this.processor.onMessage(callback)
  }

  onProcessClose(callback: (code: number | null) => void): void {
    if (!this.child) {
      throw new Error('Process not spawned yet. Call spawn() first.')
    }
    this.child.on('close', callback)
  }

  onProcessError(callback: (error: Error & { code?: string }) => void): void {
    if (!this.child) {
      throw new Error('Process not spawned yet. Call spawn() first.')
    }
    this.child.on('error', callback)
  }

  onStderr(callback: (data: Buffer) => void): void {
    if (!this.child) {
      throw new Error('Process not spawned yet. Call spawn() first.')
    }
    this.child.stderr?.on('data', callback)
  }

  onStdout(callback: (data: Buffer) => void): void {
    if (!this.child) {
      throw new Error('Process not spawned yet. Call spawn() first.')
    }
    // Only for non-RPC mode (in RPC mode, stdout is used for communication)
    if (this.communicationType !== 'rpc') {
      this.child.stdout?.on('data', callback)
    }
  }

  kill(): void {
    if (this.child) {
      this.child.removeAllListeners()
      this.child.stdout?.removeAllListeners()
      this.child.stderr?.removeAllListeners()
      this.child.kill('SIGKILL')
    }
    this.child = undefined
  }

  close(): void {
    if (this.processor) {
      this.processor.close()
    }
    this.processor = undefined
  }

  get process(): ChildProcess | undefined {
    return this.child
  }

  get commType(): CommunicationType | undefined {
    return this.communicationType
  }
}
