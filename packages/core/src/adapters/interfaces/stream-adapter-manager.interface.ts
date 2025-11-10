import type { StreamAdapter } from './stream-adapter.interface'

export interface StreamAdapterManager {
  createStream<TData>(streamName: string): StreamAdapter<TData>
  shutdown?(): Promise<void>
}
