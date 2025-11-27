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

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
  return Boolean(value) && typeof (value as PromiseLike<unknown>).then === 'function'
}

export class RpcProcessor implements RpcProcessorInterface {
  private handlers: Record<string, RpcHandler<any, any>> = {}

  private messageCallback?: MessageCallback<any>
  private isClosed = false

  constructor(private child: ChildProcess) {}

  handler<TInput, TOutput = unknown>(method: string, handler: RpcHandler<TInput, TOutput>) {
    this.handlers[method] = handler
  }

  onMessage<T = unknown>(callback: MessageCallback<T>): void {
    this.messageCallback = callback
  }

  handle(method: string, input: unknown): Promise<unknown> {
    const handler = this.handlers[method]
    if (!handler) {
      return Promise.reject(new Error(`Handler for method ${method} not found`))
    }
    try {
      return Promise.resolve(handler(input))
    } catch (error) {
      return Promise.reject(error)
    }
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
    this.child.on('message', (msg: any) => {
      if (this.isClosed) {
        return
      }
      // Call generic message callback if registered
      if (this.messageCallback) {
        this.messageCallback(msg)
      }

      // Handle RPC requests specifically
      if (msg && msg.type === 'rpc_request') {
        const { id, method, args } = msg as RpcMessage
        const handler = this.handlers[method]
        if (!handler) {
          this.response(id, null, `Unknown RPC method: ${method}`)
          return
        }
        let result: unknown
        try {
          result = handler(args)
        } catch (error) {
          this.response(id, null, error)
          return
        }
        if (isPromiseLike(result)) {
          Promise.resolve(result)
            .then((value) => this.response(id, value, null))
            .catch((error: unknown) => this.response(id, null, error))
        } else {
          this.response(id, result, null)
        }
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
