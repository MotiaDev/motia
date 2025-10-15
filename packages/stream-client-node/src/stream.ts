import { Stream as StreamClient } from '@motiadev/stream-client'
import { NodeStorageAdapter } from './storage-adapter'
import { StreamSocketAdapter } from './stream-adapter'

export class Stream extends StreamClient<Buffer> {
  constructor(address: string) {
    super(
      () => new StreamSocketAdapter(address),
      new NodeStorageAdapter(),
    )
  }
}
