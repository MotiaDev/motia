import type { StreamAdapter } from '../../interfaces/stream-adapter.interface'
import type { StreamAdapterManager } from '../../interfaces/stream-adapter-manager.interface'
import { FileStreamAdapter } from './file-stream-adapter'

export class FileStreamAdapterManager implements StreamAdapterManager {
  constructor(
    private readonly baseDir: string,
    private readonly motiaFileStoragePath: string = '.motia',
  ) {}

  createStream<TData>(streamName: string): StreamAdapter<TData> {
    return new FileStreamAdapter<TData>(this.baseDir, streamName, this.motiaFileStoragePath)
  }
}
