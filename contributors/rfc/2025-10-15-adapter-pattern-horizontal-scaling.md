# RFC: Adapter Pattern for Horizontal Scaling

## Status
- **RFC Date**: 2025-10-15
- **Status**: Draft
- **Authors**: Motia Team
- **Reviewers**: TBD

## Summary

This RFC proposes implementing a comprehensive adapter pattern for Motia that enables horizontal scaling by externalizing state management, stream processing, and event handling to distributed systems like Redis, RabbitMQ, Kafka, and other cloud-native solutions. This will allow Motia applications to scale across multiple instances in production environments while maintaining data consistency and event delivery guarantees.

## Background

Currently, Motia provides three core components for application functionality:
- **State Management**: Stores application data across steps
- **Streams**: Manages data collections with real-time updates
- **Events**: Handles pub/sub messaging between steps

The current implementations use file-based and in-memory storage:
- **File Adapter**: Stores data in `.motia/*.json` files
- **Memory Adapter**: Stores data in process memory

However, users deploying to production environments face critical limitations:
- **Single Instance Limitation**: File and memory adapters only work within a single process, making horizontal scaling impossible
- **No High Availability**: If the application instance crashes, all in-memory state and queued events are lost
- **No Distributed Events**: Events are only delivered within the same process, preventing distributed architectures
- **No Persistence Guarantees**: File writes are not atomic and can be corrupted during crashes
- **Cluster Incompatibility**: Cannot deploy to Kubernetes, ECS, or other container orchestration platforms with multiple replicas

The documentation mentions Redis adapter support, but this is not actually implemented in the codebase.

## Goals

### Primary Goals

1. **Enable Horizontal Scaling**: Allow Motia applications to run multiple instances simultaneously with shared state and event distribution
2. **Pluggable Adapter System**: Define clear interfaces that allow users to implement custom adapters for any distributed system
3. **Production-Ready Implementations**: Provide battle-tested adapters for popular systems (Redis, RabbitMQ, Kafka)
4. **Backward Compatibility**: Ensure existing applications continue to work without changes
5. **Configuration-Based Selection**: Allow adapter selection through simple configuration files
6. **Zero Code Changes**: Enable scaling without modifying application code
7. **Type Safety**: Provide full TypeScript type support for all adapter implementations

### Secondary Goals

1. **Adapter Marketplace**: Create a registry of community-contributed adapters


### Non-Goals

- Building a new distributed database or message queue system
- Replacing existing well-established distributed systems
- Providing adapter implementations for every possible technology
- Supporting multi-cloud deployments in the initial implementation

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Motia Application                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Motia Core Runtime                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐      │  │
│  │  │   State    │  │  Streams   │  │    Events    │      │  │
│  │  │  Manager   │  │  Manager   │  │   Manager    │      │  │
│  │  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘      │  │
│  │        │               │                 │              │  │
│  │        v               v                 v              │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │         Adapter Interface Layer               │    │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │    │  │
│  │  │  │  State   │ │  Stream  │ │    Event     │  │    │  │
│  │  │  │ Adapter  │ │ Adapter  │ │   Adapter    │  │    │  │
│  │  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │    │  │
│  │  └───────┼────────────┼───────────────┼──────────┘    │  │
│  └──────────┼────────────┼───────────────┼───────────────┘  │
│             │            │               │                  │
└─────────────┼────────────┼───────────────┼──────────────────┘
              │            │               │
              v            v               v
    ┌─────────────────────────────────────────────────┐
    │      Distributed Infrastructure Layer          │
    ├─────────────────────────────────────────────────┤
    │                                                 │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
    │  │  Redis   │  │  Redis   │  │   RabbitMQ   │ │
    │  │  State   │  │  Streams │  │    Events    │ │
    │  └──────────┘  └──────────┘  └──────────────┘ │
    │                                                 │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
    │  │   DynamoDB │  │  Kafka   │  │   AWS SNS   │ │
    │  │   State  │  │  Streams │  │    Events    │ │
    │  └──────────┘  └──────────┘  └──────────────┘ │
    │                                                 │
    └─────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
Instance 1                  Instance 2                  Instance 3
┌──────────┐               ┌──────────┐               ┌──────────┐
│  Motia   │               │  Motia   │               │  Motia   │
│  App     │               │  App     │               │  App     │
└────┬─────┘               └────┬─────┘               └────┬─────┘
     │                          │                          │
     │                          │                          │
     v                          v                          v
┌─────────────────────────────────────────────────────────────┐
│                   State Adapter (Redis)                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐             │
│  │ Trace:123 │  │ Trace:456 │  │ Trace:789 │             │
│  │ state:foo │  │ state:bar │  │ state:baz │             │
│  └───────────┘  └───────────┘  └───────────┘             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Event Adapter (RabbitMQ)                       │
│                                                             │
│  Exchange: motia.events                                    │
│  ├─ Queue: user.created  → [Instance 1, Instance 2, ...]  │
│  ├─ Queue: order.placed  → [Instance 1, Instance 3, ...]  │
│  └─ Queue: email.sent    → [All instances]                │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Design

### 1. Adapter Interfaces

#### State Adapter Interface

```typescript
export interface StateAdapter {
  get<T>(traceId: string, key: string): Promise<T | null>
  
  set<T>(traceId: string, key: string, value: T): Promise<T>
  
  delete<T>(traceId: string, key: string): Promise<T | null>
  
  clear(traceId: string): Promise<void>
  
  cleanup(): Promise<void>
  
  keys(traceId: string): Promise<string[]>
  
  exists(traceId: string, key: string): Promise<boolean>
  
  getMany<T>(traceId: string, keys: string[]): Promise<(T | null)[]>
  
  setMany<T>(traceId: string, items: Record<string, T>): Promise<void>
}
```

#### Stream Adapter Interface

```typescript
export interface StreamAdapter<TData> {
  get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  
  set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>>
  
  delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  
  getGroup(groupId: string): Promise<BaseStreamItem<TData>[]>
  
  send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void>
  
  subscribe<T>(
    channel: StateStreamEventChannel,
    handler: (event: StateStreamEvent<T>) => void | Promise<void>
  ): Promise<void>
  
  unsubscribe(channel: StateStreamEventChannel): Promise<void>
  
  clear(groupId: string): Promise<void>
  
  query(groupId: string, filter: StreamQueryFilter<TData>): Promise<BaseStreamItem<TData>[]>
}

export interface StreamQueryFilter<TData> {
  limit?: number
  offset?: number
  orderBy?: keyof TData
  orderDirection?: 'asc' | 'desc'
  where?: Partial<TData>
}
```

#### Event Adapter Interface

```typescript
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
```

### 2. Configuration Schema

#### motia.config.ts Configuration

```typescript
import { config, type Config, type Motia } from '@motiadev/core'
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'
import { RedisStreamAdapter } from '@motiadev/adapter-redis-streams'
import { RabbitMQEventAdapter } from '@motiadev/adapter-rabbitmq-events'

export default config({
  adapters: {
    state: new RedisStateAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'motia:state:',
      ttl: 3600,
    }),
    
    streams: new RedisStreamAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'motia:stream:',
    }),
    
    events: new RabbitMQEventAdapter({
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      exchangeName: 'motia.events',
      exchangeType: 'topic',
      durable: true,
    }),
  },
  
  plugins: [
  ],
})
```

#### Environment Variables

```bash
REDIS_HOST=redis.production.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_password
REDIS_KEY_PREFIX=myapp:motia:

RABBITMQ_URL=amqp://user:pass@rabbitmq.production.com
RABBITMQ_EXCHANGE=motia.events

STATE_ADAPTER=redis
STREAM_ADAPTER=redis
EVENT_ADAPTER=rabbitmq
```

### 3. Core Type Updates

Update `Config` type in `packages/core/src/types/app-config-types.ts`:

```typescript
import type { Motia } from '../motia'
import type { StateAdapter } from '../state/state-adapter'
import type { StreamAdapter } from '../streams/adapters/stream-adapter'
import type { EventAdapter } from '../adapters/event-adapter'

export type Runtime = {
  steps: string
  streams: string
  runtime: any
}

export type WorkbenchPlugin = {
  packageName: string
  componentName?: string
  label?: string
  labelIcon?: string
  position?: 'bottom' | 'top'
  cssImports?: string[]
  props?: Record<string, any>
}

export type MotiaPlugin = {
  workbench: WorkbenchPlugin[]
}

export type MotiaPluginBuilder = (motia: Motia) => MotiaPlugin

export type AdapterConfig = {
  state?: StateAdapter
  streams?: StreamAdapter<any>
  events?: EventAdapter
}

export type Config = {
  runtimes?: Runtime[]
  plugins?: MotiaPluginBuilder[]
  adapters?: AdapterConfig
}
```

## Implementation Examples

### Example 1: Redis State Adapter

```typescript
import Redis from 'ioredis'
import type { StateAdapter } from '@motiadev/core'

export interface RedisStateAdapterConfig {
  host: string
  port: number
  password?: string
  db?: number
  keyPrefix?: string
  ttl?: number
}

export class RedisStateAdapter implements StateAdapter {
  private client: Redis
  private keyPrefix: string
  private ttl?: number

  constructor(config: RedisStateAdapterConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
    })
    this.keyPrefix = config.keyPrefix || 'motia:state:'
    this.ttl = config.ttl
  }

  private makeKey(traceId: string, key: string): string {
    return `${this.keyPrefix}${traceId}:${key}`
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this.makeKey(traceId, key)
    const value = await this.client.get(fullKey)
    return value ? JSON.parse(value) : null
  }

  async set<T>(traceId: string, key: string, value: T): Promise<T> {
    const fullKey = this.makeKey(traceId, key)
    const serialized = JSON.stringify(value)
    
    if (this.ttl) {
      await this.client.setex(fullKey, this.ttl, serialized)
    } else {
      await this.client.set(fullKey, serialized)
    }
    
    return value
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this.makeKey(traceId, key)
    const value = await this.get<T>(traceId, key)
    await this.client.del(fullKey)
    return value
  }

  async clear(traceId: string): Promise<void> {
    const pattern = `${this.keyPrefix}${traceId}:*`
    const keys = await this.client.keys(pattern)
    
    if (keys.length > 0) {
      await this.client.del(...keys)
    }
  }

  async cleanup(): Promise<void> {
    await this.client.quit()
  }

  async keys(traceId: string): Promise<string[]> {
    const pattern = `${this.keyPrefix}${traceId}:*`
    const keys = await this.client.keys(pattern)
    const prefixLength = this.makeKey(traceId, '').length
    return keys.map(key => key.slice(prefixLength))
  }

  async exists(traceId: string, key: string): Promise<boolean> {
    const fullKey = this.makeKey(traceId, key)
    const exists = await this.client.exists(fullKey)
    return exists === 1
  }

  async getMany<T>(traceId: string, keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return []
    
    const fullKeys = keys.map(key => this.makeKey(traceId, key))
    const values = await this.client.mget(...fullKeys)
    
    return values.map(value => value ? JSON.parse(value) : null)
  }

  async setMany<T>(traceId: string, items: Record<string, T>): Promise<void> {
    const pipeline = this.client.pipeline()
    
    for (const [key, value] of Object.entries(items)) {
      const fullKey = this.makeKey(traceId, key)
      const serialized = JSON.stringify(value)
      
      if (this.ttl) {
        pipeline.setex(fullKey, this.ttl, serialized)
      } else {
        pipeline.set(fullKey, serialized)
      }
    }
    
    await pipeline.exec()
  }
}
```

### Example 2: RabbitMQ Event Adapter

```typescript
import amqp, { type Connection, type Channel, type ConsumeMessage } from 'amqplib'
import type { EventAdapter, Event, SubscribeOptions, SubscriptionHandle } from '@motiadev/core'
import { v4 as uuidv4 } from 'uuid'

export interface RabbitMQEventAdapterConfig {
  url: string
  exchangeName: string
  exchangeType: 'direct' | 'topic' | 'fanout' | 'headers'
  durable?: boolean
  autoDelete?: boolean
}

export class RabbitMQEventAdapter implements EventAdapter {
  private connection?: Connection
  private channel?: Channel
  private config: RabbitMQEventAdapterConfig
  private subscriptions: Map<string, SubscriptionHandle> = new Map()

  constructor(config: RabbitMQEventAdapterConfig) {
    this.config = {
      durable: true,
      autoDelete: false,
      ...config,
    }
  }

  private async ensureConnection(): Promise<Channel> {
    if (!this.connection) {
      this.connection = await amqp.connect(this.config.url)
      this.channel = await this.connection.createChannel()
      
      await this.channel.assertExchange(
        this.config.exchangeName,
        this.config.exchangeType,
        {
          durable: this.config.durable,
          autoDelete: this.config.autoDelete,
        }
      )
    }
    
    return this.channel!
  }

  async emit<TData>(event: Event<TData>): Promise<void> {
    const channel = await this.ensureConnection()
    
    const message = {
      topic: event.topic,
      data: event.data,
      traceId: event.traceId,
      timestamp: Date.now(),
    }
    
    const content = Buffer.from(JSON.stringify(message))
    
    channel.publish(
      this.config.exchangeName,
      event.topic,
      content,
      {
        persistent: true,
        contentType: 'application/json',
      }
    )
  }

  async subscribe<TData>(
    topic: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: SubscribeOptions
  ): Promise<SubscriptionHandle> {
    const channel = await this.ensureConnection()
    const queueName = options?.queue || `motia.${topic}.${uuidv4()}`
    
    const queue = await channel.assertQueue(queueName, {
      durable: options?.durable ?? true,
      exclusive: options?.exclusive ?? false,
      autoDelete: !options?.durable,
    })
    
    await channel.bindQueue(queue.queue, this.config.exchangeName, topic)
    
    if (options?.prefetch) {
      await channel.prefetch(options.prefetch)
    }
    
    const consumerTag = await channel.consume(
      queue.queue,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return
        
        try {
          const content = JSON.parse(msg.content.toString())
          await handler(content as Event<TData>)
          channel.ack(msg)
        } catch (error) {
          console.error('Error processing message:', error)
          channel.nack(msg, false, false)
        }
      }
    )
    
    const handle: SubscriptionHandle = {
      topic,
      id: consumerTag.consumerTag,
      unsubscribe: async () => {
        await this.unsubscribe(handle)
      },
    }
    
    this.subscriptions.set(handle.id, handle)
    return handle
  }

  async unsubscribe(handle: SubscriptionHandle): Promise<void> {
    const channel = await this.ensureConnection()
    await channel.cancel(handle.id)
    this.subscriptions.delete(handle.id)
  }

  async shutdown(): Promise<void> {
    if (this.channel) {
      await this.channel.close()
    }
    if (this.connection) {
      await this.connection.close()
    }
  }

  async getSubscriptionCount(topic: string): Promise<number> {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.topic === topic)
      .length
  }

  async listTopics(): Promise<string[]> {
    return Array.from(new Set(
      Array.from(this.subscriptions.values()).map(sub => sub.topic)
    ))
  }
}
```

### Example 3: Redis Streams Adapter

```typescript
import Redis from 'ioredis'
import type { StreamAdapter, BaseStreamItem, StateStreamEvent, StateStreamEventChannel } from '@motiadev/core'

export interface RedisStreamAdapterConfig {
  host: string
  port: number
  password?: string
  db?: number
  keyPrefix?: string
}

export class RedisStreamAdapter<TData> implements StreamAdapter<TData> {
  private client: Redis
  private keyPrefix: string
  private subscriptions: Map<string, NodeJS.Timeout> = new Map()

  constructor(config: RedisStreamAdapterConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
    })
    this.keyPrefix = config.keyPrefix || 'motia:stream:'
  }

  private makeKey(groupId: string, id?: string): string {
    return id 
      ? `${this.keyPrefix}${groupId}:${id}`
      : `${this.keyPrefix}${groupId}`
  }

  async get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    const key = this.makeKey(groupId, id)
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }

  async set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>> {
    const key = this.makeKey(groupId, id)
    const item: BaseStreamItem<TData> = { ...data, id } as BaseStreamItem<TData>
    await this.client.set(key, JSON.stringify(item))
    
    await this.send({ groupId, id }, { type: 'update', data: item })
    
    return item
  }

  async delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    const item = await this.get(groupId, id)
    if (item) {
      const key = this.makeKey(groupId, id)
      await this.client.del(key)
      await this.send({ groupId, id }, { type: 'delete', data: item })
    }
    return item
  }

  async getGroup(groupId: string): Promise<BaseStreamItem<TData>[]> {
    const pattern = `${this.makeKey(groupId)}:*`
    const keys = await this.client.keys(pattern)
    
    if (keys.length === 0) return []
    
    const values = await this.client.mget(...keys)
    return values
      .filter((v): v is string => v !== null)
      .map(v => JSON.parse(v))
  }

  async send<T>(
    channel: StateStreamEventChannel,
    event: StateStreamEvent<T>
  ): Promise<void> {
    const channelKey = channel.id 
      ? `motia:stream:events:${channel.groupId}:${channel.id}`
      : `motia:stream:events:${channel.groupId}`
    
    await this.client.publish(channelKey, JSON.stringify(event))
  }

  async subscribe<T>(
    channel: StateStreamEventChannel,
    handler: (event: StateStreamEvent<T>) => void | Promise<void>
  ): Promise<void> {
    const channelKey = channel.id 
      ? `motia:stream:events:${channel.groupId}:${channel.id}`
      : `motia:stream:events:${channel.groupId}`
    
    const subscriber = this.client.duplicate()
    await subscriber.subscribe(channelKey)
    
    subscriber.on('message', async (ch, message) => {
      if (ch === channelKey) {
        const event = JSON.parse(message) as StateStreamEvent<T>
        await handler(event)
      }
    })
  }

  async unsubscribe(channel: StateStreamEventChannel): Promise<void> {
    const channelKey = channel.id 
      ? `motia:stream:events:${channel.groupId}:${channel.id}`
      : `motia:stream:events:${channel.groupId}`
    
    await this.client.unsubscribe(channelKey)
  }

  async clear(groupId: string): Promise<void> {
    const pattern = `${this.makeKey(groupId)}:*`
    const keys = await this.client.keys(pattern)
    
    if (keys.length > 0) {
      await this.client.del(...keys)
    }
  }

  async query(
    groupId: string,
    filter: StreamQueryFilter<TData>
  ): Promise<BaseStreamItem<TData>[]> {
    let items = await this.getGroup(groupId)
    
    if (filter.where) {
      items = items.filter(item => {
        return Object.entries(filter.where!).every(([key, value]) => {
          return (item as any)[key] === value
        })
      })
    }
    
    if (filter.orderBy) {
      items.sort((a, b) => {
        const aVal = (a as any)[filter.orderBy!]
        const bVal = (b as any)[filter.orderBy!]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return filter.orderDirection === 'desc' ? -comparison : comparison
      })
    }
    
    if (filter.offset) {
      items = items.slice(filter.offset)
    }
    
    if (filter.limit) {
      items = items.slice(0, filter.limit)
    }
    
    return items
  }
}
```

### Example 4: Kafka Event Adapter

```typescript
import { Kafka, type Producer, type Consumer, type EachMessagePayload } from 'kafkajs'
import type { EventAdapter, Event, SubscribeOptions, SubscriptionHandle } from '@motiadev/core'
import { v4 as uuidv4 } from 'uuid'

export interface KafkaEventAdapterConfig {
  clientId: string
  brokers: string[]
  groupId?: string
}

export class KafkaEventAdapter implements EventAdapter {
  private kafka: Kafka
  private producer?: Producer
  private consumers: Map<string, Consumer> = new Map()
  private subscriptions: Map<string, SubscriptionHandle> = new Map()
  private groupId: string

  constructor(config: KafkaEventAdapterConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
    })
    this.groupId = config.groupId || 'motia-default'
  }

  private async ensureProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer()
      await this.producer.connect()
    }
    return this.producer
  }

  async emit<TData>(event: Event<TData>): Promise<void> {
    const producer = await this.ensureProducer()
    
    await producer.send({
      topic: event.topic,
      messages: [
        {
          key: event.traceId,
          value: JSON.stringify({
            topic: event.topic,
            data: event.data,
            traceId: event.traceId,
            timestamp: Date.now(),
          }),
        },
      ],
    })
  }

  async subscribe<TData>(
    topic: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: SubscribeOptions
  ): Promise<SubscriptionHandle> {
    const groupId = options?.queue || this.groupId
    const consumerId = uuidv4()
    
    const consumer = this.kafka.consumer({ 
      groupId,
      sessionTimeout: 30000,
    })
    
    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: false })
    
    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const content = JSON.parse(payload.message.value?.toString() || '{}')
          await handler(content as Event<TData>)
        } catch (error) {
          console.error('Error processing Kafka message:', error)
        }
      },
    })
    
    this.consumers.set(consumerId, consumer)
    
    const handle: SubscriptionHandle = {
      topic,
      id: consumerId,
      unsubscribe: async () => {
        await this.unsubscribe(handle)
      },
    }
    
    this.subscriptions.set(handle.id, handle)
    return handle
  }

  async unsubscribe(handle: SubscriptionHandle): Promise<void> {
    const consumer = this.consumers.get(handle.id)
    if (consumer) {
      await consumer.disconnect()
      this.consumers.delete(handle.id)
    }
    this.subscriptions.delete(handle.id)
  }

  async shutdown(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect()
    }
    
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect()
    }
    
    this.consumers.clear()
    this.subscriptions.clear()
  }

  async getSubscriptionCount(topic: string): Promise<number> {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.topic === topic)
      .length
  }

  async listTopics(): Promise<string[]> {
    return Array.from(new Set(
      Array.from(this.subscriptions.values()).map(sub => sub.topic)
    ))
  }
}
```

## Integration Points

### 1. Core Server Initialization

Update `packages/core/src/server.ts` to support adapter configuration:

```typescript
export const createServer = (
  lockedData: LockedData,
  eventManager: EventManager | EventAdapter,
  state: StateAdapter,
  config: MotiaServerConfig,
  streamAdapterFactory?: () => StreamAdapter<any>
): MotiaServer => {
}
```

### 2. Snap CLI Integration

Update `packages/snap/src/dev.ts` and `packages/snap/src/start.ts`:

```typescript
const appConfig: Config = await loadMotiaConfig(baseDir)

const state = appConfig.adapters?.state || createStateAdapter({
  adapter: 'default',
  filePath: path.join(baseDir, motiaFileStoragePath),
})

const eventManager = appConfig.adapters?.events || createEventManager()

const streamAdapterFactory = appConfig.adapters?.streams 
  ? () => appConfig.adapters!.streams!
  : undefined
```

### 3. Docker Support

Update Docker image generation to support external services:

```dockerfile
ENV STATE_ADAPTER=redis
ENV STREAM_ADAPTER=redis
ENV EVENT_ADAPTER=rabbitmq

ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

ENV RABBITMQ_URL=amqp://rabbitmq:5672
```

## Technical Considerations

### Performance Impact

- **State Operations**: Redis adds ~1-2ms latency vs in-memory (acceptable for most use cases)
- **Event Delivery**: RabbitMQ adds ~5-10ms vs in-process (provides reliability guarantees)
- **Stream Updates**: Real-time updates may have slight delay (~10-50ms) but gain horizontal scaling

### Scalability Considerations

- **State**: Redis can handle millions of operations per second with clustering
- **Events**: RabbitMQ/Kafka can handle thousands of messages per second per topic
- **Streams**: Redis Streams can handle high throughput with consumer groups

### Compatibility and Migration

- **Backward Compatibility**: File and memory adapters remain the default
- **No Breaking Changes**: Existing applications work without modifications
- **Migration Path**: 
  1. Add adapter configuration to `motia.config.ts`
  2. Deploy with external services
  3. Scale to multiple instances
- **Data Migration**: Provide utility to copy state from file to Redis

### Risk Assessment

- **External Service Dependency**: Applications become dependent on Redis/RabbitMQ availability
  - **Mitigation**: Use managed services (AWS ElastiCache, Amazon MQ) with high availability
- **Configuration Complexity**: More configuration options may confuse users
  - **Mitigation**: Provide clear documentation and starter templates
- **Cost**: External services cost money
  - **Mitigation**: Keep file/memory adapters as free defaults for development

## Alternatives Considered

### Alternative 1: Built-in Distributed State

- **Pros**: No external dependencies, simpler deployment
- **Cons**: Reinventing the wheel, complex to implement correctly, less battle-tested
- **Decision**: Rejected - better to use proven distributed systems

### Alternative 2: Single Adapter for All Components

- **Pros**: Simpler configuration, fewer connections
- **Cons**: Less flexibility, forces suboptimal choices (Redis for everything)
- **Decision**: Rejected - different components have different needs

### Alternative 3: Automatic Clustering

- **Pros**: No configuration needed, works out of the box
- **Cons**: Complex to implement, less control, vendor lock-in
- **Decision**: Rejected - explicit configuration is more transparent

## Testing Strategy

### Unit Testing

- Test each adapter implementation in isolation
- Mock Redis/RabbitMQ/Kafka clients
- Verify correct method implementations
- Test error handling and edge cases

### Integration Testing

- Use Testcontainers to spin up real Redis/RabbitMQ/Kafka instances
- Test end-to-end flows with multiple Motia instances
- Verify data consistency across instances
- Test failover scenarios

### User Acceptance Testing

- Provide example applications using each adapter
- Document common deployment patterns
- Create migration guides for existing applications

## Success Metrics

### Technical Success

- **Zero Data Loss**: All state operations are atomic and durable
- **Horizontal Scaling**: Applications can scale to 10+ instances
- **Performance**: < 5ms p99 latency overhead vs in-memory
- **Reliability**: 99.9% uptime with managed services

### User Success

- **Adoption**: 30% of production deployments use adapters within 6 months
- **Documentation Quality**: < 5% support requests about adapter configuration
- **Community**: 3+ community-contributed adapters within first year

## Future Considerations

- **Adapter Marketplace**: Registry of community adapters
- **Adapter Testing Framework**: Standardized test suite for custom adapters
- **Multi-Cloud Support**: Adapters for AWS, GCP, Azure native services
- **Adapter Monitoring**: Built-in metrics and health checks
- **Adapter Migration Tools**: Utilities to migrate between adapters
- **Hybrid Adapters**: Combine multiple backends (Redis + DynamoDB)
- **Adapter Fallback**: Automatic fallback to file adapter on external service failure

## Package Structure

Adapters will be published as separate packages:

```
@motiadev/adapter-redis-state
@motiadev/adapter-redis-streams  
@motiadev/adapter-rabbitmq-events
@motiadev/adapter-kafka-events
@motiadev/adapter-aws-dynamodb-state
@motiadev/adapter-aws-sqs-events
```

## Conclusion

This RFC proposes a comprehensive adapter pattern that solves Motia's horizontal scaling limitations while maintaining backward compatibility and simplicity for development use cases. By leveraging battle-tested distributed systems like Redis, RabbitMQ, and Kafka, we can provide production-ready scaling capabilities without reinventing the wheel.

The pluggable adapter system allows users to choose the best technology for their specific needs, whether that's cost, performance, or operational preferences. The clear interface definitions enable community contributions and custom implementations for specialized use cases.

This change is critical for Motia to be viable in production environments and will unlock deployment to Kubernetes, AWS ECS, and other container orchestration platforms that require horizontal scaling for high availability and performance.

