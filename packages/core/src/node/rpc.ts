/// <reference types="node" />
import crypto from 'crypto'

type RpcResponse = {
  type: 'rpc_response'
  id: string
  result: unknown
  error: unknown
}

export class RpcSender {
  private readonly pendingRequests: Record<
    string,
    /* biome-ignore-start lint/suspicious/noExplicitAny: migration */
    {
      resolve: (result: any) => void
      reject: (error: any) => void
      method: string
      args: any
    }
    /* biome-ignore-end lint/suspicious/noExplicitAny: migration */
  > = {}

  constructor(private readonly process: NodeJS.Process) {}

  async close(): Promise<void> {
    const outstandingRequests = Object.values(this.pendingRequests)

    if (outstandingRequests.length > 0) {
      console.error('Process ended while there are some promises outstanding')
      this.process.exit(1)
    }
  }

  send<T>(method: string, args: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID()
      this.pendingRequests[id] = { resolve, reject, method, args }

      this.process.send?.({ type: 'rpc_request', id, method, args })
    })
  }

  sendNoWait(method: string, args: unknown) {
    this.process.send?.({ type: 'rpc_request', method, args })
  }

  init() {
    this.process.on('message', (msg: RpcResponse) => {
      if (msg.type === 'rpc_response') {
        const { id, result, error } = msg
        const callbacks = this.pendingRequests[id]

        if (!callbacks) {
          return
        } else if (error) {
          callbacks.reject(error)
        } else {
          callbacks.resolve(result)
        }

        delete this.pendingRequests[id]
      }
    })
  }
}
