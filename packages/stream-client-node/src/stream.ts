import { Stream as StreamClient } from '@motiadev/stream-client'
import { StreamSocketAdapter } from './stream-adapter'

export class Stream extends StreamClient {
  constructor(address: string) {
    super(() => new StreamSocketAdapter(address))
  }
}
