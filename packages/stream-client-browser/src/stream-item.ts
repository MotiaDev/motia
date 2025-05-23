import { StreamSubscription } from './stream-subscription'
import { ItemEventMessage, ItemJoinMessage, Listener, Message } from './stream.types'

export class StreamItemSubscription<TData extends { id: string }> extends StreamSubscription {
  private onChangeListeners: Set<Listener<TData>> = new Set()
  private listeners: Set<EventListener> = new Set()
  private state: TData | null = null

  constructor(
    private readonly ws: WebSocket,
    private readonly sub: ItemJoinMessage,
  ) {
    super()

    const message: Message = { type: 'join', data: sub }
    const listenerWrapper = (event: MessageEvent<string>) => {
      const message: ItemEventMessage<TData> = JSON.parse(event.data)
      const isStreamName = message.streamName === this.sub.streamName
      const isId = 'id' in message && message.id === this.sub.id

      if (isStreamName && isId) {
        if (message.event.type === 'sync' || message.event.type === 'create' || message.event.type === 'update') {
          this.state = message.event.data
        } else if (message.event.type === 'delete') {
          this.state = null
        } else if (message.event.type === 'event') {
          this.onEventReceived(message.event.event)
        }

        this.onChangeListeners.forEach((listener) => listener(this.state))
      }
    }
    this.ws.addEventListener('message', listenerWrapper as EventListener)
    this.listeners.add(listenerWrapper as EventListener)

    ws.send(JSON.stringify(message))
  }

  /**
   * Close the subscription.
   */
  close() {
    const message: Message = { type: 'leave', data: this.sub }
    this.ws.send(JSON.stringify(message))
    this.listeners.forEach((listener) => this.ws.removeEventListener('message', listener))
  }

  /**
   * Add a change listener. This listener will be called whenever the state of the item changes.
   */
  addChangeListener(listener: Listener<TData>) {
    this.onChangeListeners.add(listener)
  }

  /**
   * Remove a change listener.
   */
  removeChangeListener(listener: Listener<TData>) {
    this.onChangeListeners.delete(listener)
  }

  /**
   * Get the current state of the item.
   */
  getState(): TData | null {
    return this.state
  }
}
