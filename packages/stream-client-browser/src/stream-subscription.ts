import { CustomEvent } from './stream.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomEventListener = (event: any) => void

export abstract class StreamSubscription {
  private customEventListeners: Map<string, CustomEventListener[]> = new Map()

  protected onEventReceived(event: CustomEvent) {
    const customEventListeners = this.customEventListeners.get(event.type)

    if (customEventListeners) {
      const eventData = event.data
      customEventListeners.forEach((listener) => listener(eventData))
    }
  }

  /**
   * Add a custom event listener. This listener will be called whenever the custom event is received.
   */
  onEvent(type: string, listener: CustomEventListener) {
    const listeners = this.customEventListeners.get(type) || []
    this.customEventListeners.set(type, [...listeners, listener])
  }

  /**
   * Remove a custom event listener.
   */
  offEvent(type: string, listener: CustomEventListener) {
    const listeners = this.customEventListeners.get(type) || []
    this.customEventListeners.set(
      type,
      listeners.filter((l) => l !== listener),
    )
  }
}
