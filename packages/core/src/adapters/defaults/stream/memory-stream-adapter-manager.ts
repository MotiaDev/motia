import type { StreamAdapter } from '../../interfaces/stream-adapter.interface'
import type { StreamAdapterManager } from '../../interfaces/stream-adapter-manager.interface'
import { MemoryStreamAdapter } from './memory-stream-adapter'

export class MemoryStreamAdapterManager implements StreamAdapterManager {
  createStream<TData>(streamName: string): StreamAdapter<TData> {
    return new MemoryStreamAdapter<TData>(streamName)
  }
}
