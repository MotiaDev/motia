import type { Event } from '../types'

export interface SubscribeOptions {
    queue?: string
    exclusive?: boolean
    durable?: boolean
    prefetch?: number
}

export interface SubscriptionHandle {
    topic: string
    id: string
    unsubscribe: () => Promise<void>
}

export interface EventAdapter {
    emit<TData>(event: Event<TData>): Promise<void>

    subscribe<TData>(
        topic: string,
        handler: (event: Event<TData>) => void | Promise<void>,
        options?: SubscribeOptions
    ): Promise<SubscriptionHandle>

    unsubscribe(handle: SubscriptionHandle): Promise<void>

    shutdown(): Promise<void>

    getSubscriptionCount(topic: string): Promise<number>

    listTopics(): Promise<string[]>
}

