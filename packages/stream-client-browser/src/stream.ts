import { v4 as uuidv4 } from 'uuid'
import { StreamGroupSubscription } from './stream-group'
import { StreamItemSubscription } from './stream-item'

export class Stream {
  private ws: WebSocket

  constructor(address: string, onReady: () => void) {
    this.ws = new WebSocket(address)
    this.ws.onopen = () => onReady()
  }

  /**
   * Subscribe to an item in a stream.
   *
   * @argument streamName - The name of the stream to subscribe to.
   * @argument id - The id of the item to subscribe to.
   */
  subscribeItem<TData extends { id: string }>(streamName: string, id: string): StreamItemSubscription<TData> {
    const subscriptionId = uuidv4()
    return new StreamItemSubscription<TData>(this.ws, { streamName, id, subscriptionId })
  }

  /**
   * Subscribe to a group in a stream.
   *
   * @argument streamName - The name of the stream to subscribe to.
   * @argument groupId - The id of the group to subscribe to.
   */
  subscribeGroup<TData extends { id: string }>(streamName: string, groupId: string): StreamGroupSubscription<TData> {
    const subscriptionId = uuidv4()
    return new StreamGroupSubscription<TData>(this.ws, { streamName, groupId, subscriptionId })
  }

  close() {
    this.ws.close()
  }
}
