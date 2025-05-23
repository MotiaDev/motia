export type RpcHandler<TInput, TOutput> = (input: TInput) => Promise<TOutput>
export type MessageCallback<T = unknown> = (message: T) => void

export interface RpcProcessorInterface {
  handler<TInput, TOutput = unknown>(method: string, handler: RpcHandler<TInput, TOutput>): void
  handle(method: string, input: unknown): Promise<unknown>
  onMessage<T = unknown>(callback: MessageCallback<T>): void
  init(): Promise<void>
  close(): void
} 