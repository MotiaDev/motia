import type { Event, QueueConfig } from '../../types'

export interface SubscriptionHandle {
  topic: string
  id: string
  unsubscribe: () => Promise<void>
}

export interface EventAdapter {
  emit<TData>(event: Event<TData>): Promise<void>

  subscribe<TData>(
    topic: string,
    stepName: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: QueueConfig,
  ): Promise<SubscriptionHandle>

  unsubscribe(handle: SubscriptionHandle): Promise<void>

  shutdown(): Promise<void>

  getSubscriptionCount(topic: string): Promise<number>

  listTopics(): Promise<string[]>
}
