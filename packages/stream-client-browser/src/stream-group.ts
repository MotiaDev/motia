import { StreamSubscription } from './stream-subscription'
import { GroupEventMessage, GroupJoinMessage, Listener, Message } from './stream.types'

export class StreamGroupSubscription<TData extends { id: string }> extends StreamSubscription {
  private onChangeListeners: Set<Listener<TData[]>> = new Set()
  private listeners: Set<EventListener> = new Set()

  private state: TData[] = []

  constructor(
    private readonly ws: WebSocket,
    private readonly sub: GroupJoinMessage,
  ) {
    super()

    const message: Message = { type: 'join', data: sub }
    const listenerWrapper = (event: MessageEvent<string>) => {
      const message: GroupEventMessage<TData> = JSON.parse(event.data)
      const isStreamName = message.streamName === this.sub.streamName
      const isGroupId = 'groupId' in message && message.groupId === this.sub.groupId

      if (isStreamName && isGroupId) {
        if (message.event.type === 'sync') {
          this.state = message.event.data
        } else if (message.event.type === 'create') {
          const id = message.event.data.id

          if (!this.state.find((item) => item.id === id)) {
            this.state = [...this.state, message.event.data]
          }
        } else if (message.event.type === 'update') {
          const messageData = message.event.data
          const messageDataId = messageData.id
          this.state = this.state.map((item) => (item.id === messageDataId ? messageData : item))
        } else if (message.event.type === 'delete') {
          const messageDataId = message.event.data.id
          this.state = this.state.filter((item) => item.id !== messageDataId)
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
   * Add a change listener. This listener will be called whenever the state of the group changes.
   */
  addChangeListener(listener: Listener<TData[]>) {
    this.onChangeListeners.add(listener)
  }

  /**
   * Remove a change listener.
   */
  removeChangeListener(listener: Listener<TData[]>) {
    this.onChangeListeners.delete(listener)
  }

  /**
   * Get the current state of the group.
   */
  getState(): TData[] {
    return this.state
  }
}
