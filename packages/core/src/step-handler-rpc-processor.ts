import type { ChildProcess } from 'child_process'
import type {
  MessageCallback,
  RpcHandler,
  RpcProcessorInterface,
} from './process-communication/rpc-processor-interface'

export type RpcMessage = {
  type: 'rpc_request'
  id: string | undefined
  method: string
  args: unknown
}

export class RpcProcessor implements RpcProcessorInterface {
  /* biome-ignore lint/suspicious/noExplicitAny: migration */
  private handlers: Record<string, RpcHandler<any, any>> = {}
  /* biome-ignore lint/suspicious/noExplicitAny: migration */
  private messageCallback?: MessageCallback<any>
  private isClosed = false

  constructor(private child: ChildProcess) {}

  handler<TInput, TOutput = unknown>(method: string, handler: RpcHandler<TInput, TOutput>) {
    this.handlers[method] = handler
  }

  onMessage<T = unknown>(callback: MessageCallback<T>): void {
    this.messageCallback = callback
  }

  async handle(method: string, input: unknown) {
    const handler = this.handlers[method]
    if (!handler) {
      throw new Error(`Handler for method ${method} not found`)
    }
    return handler(input)
  }

  private response(id: string | undefined, result: unknown, error: unknown) {
    if (id && !this.isClosed && this.child.send && this.child.connected) {
      const responseMessage = {
        type: 'rpc_response',
        id,
        result: error ? undefined : result,
        error: error ? String(error) : undefined,
      }
      this.child.send(responseMessage)
    }
  }

  async init() {
    /* biome-ignore lint/suspicious/noExplicitAny: migration */
    this.child.on('message', (msg: any) => {
      // Call generic message callback if registered
      if (this.messageCallback) {
        this.messageCallback(msg)
      }

      // Handle RPC requests specifically
      if (msg && msg.type === 'rpc_request') {
        const { id, method, args } = msg as RpcMessage
        this.handle(method, args)
          .then((result) => this.response(id, result, null))
          .catch((error) => this.response(id, null, error))
      }
    })

    this.child.on('exit', () => {
      this.isClosed = true
    })
    this.child.on('close', () => {
      this.isClosed = true
    })
    this.child.on('disconnect', () => {
      this.isClosed = true
    })
  }

  close() {
    this.isClosed = true
    this.messageCallback = undefined
  }
}
