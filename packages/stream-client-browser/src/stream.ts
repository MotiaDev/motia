import { Stream as StreamClient } from '@motiadev/stream-client'
import { HttpStorageAdapter } from './storage-adapter'
import { StreamSocketAdapter } from './stream-adapter'

export class Stream extends StreamClient<File> {
  constructor(address: string) {
    super(
      () => new StreamSocketAdapter(address),
      new HttpStorageAdapter(),
    )
  }
}
