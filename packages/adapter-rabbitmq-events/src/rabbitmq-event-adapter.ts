import type { Event, EventAdapter, QueueConfig, SubscriptionHandle } from '@motiadev/core'
import type { ConsumeMessage } from 'amqplib'
import amqp from 'amqplib'
import { v4 as uuidv4 } from 'uuid'
import type { RabbitMQEventAdapterConfig, RabbitMQSubscribeOptions } from './types'

export class RabbitMQEventAdapter implements EventAdapter {
  private connection: any = null
  private channel: any = null
  private config: Required<RabbitMQEventAdapterConfig>
  private subscriptions: Map<string, SubscriptionHandle> = new Map()
  private reconnecting = false
  private shutdownRequested = false

  constructor(config: RabbitMQEventAdapterConfig) {
    this.config = {
      durable: true,
      autoDelete: false,
      connectionTimeout: 10000,
      reconnectDelay: 5000,
      prefetch: 10,
      ...config,
    }
  }

  private async ensureConnection(): Promise<any> {
    if (!this.connection || !this.channel) {
      await this.connect()
    }
    if (!this.channel) {
      throw new Error('Failed to establish channel')
    }
    return this.channel
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.url, {
        timeout: this.config.connectionTimeout,
      })

      if (this.connection) {
        this.connection.on('error', (err: any) => {
          console.error('[RabbitMQ] Connection error:', err)
          this.handleConnectionError()
        })

        this.connection.on('close', () => {
          console.warn('[RabbitMQ] Connection closed')
          this.handleConnectionError()
        })

        this.channel = await this.connection.createChannel()

        if (this.channel) {
          this.channel.on('error', (err: any) => {
            console.error('[RabbitMQ] Channel error:', err)
          })

          this.channel.on('close', () => {
            console.warn('[RabbitMQ] Channel closed')
          })

          await this.channel.assertExchange(this.config.exchangeName, this.config.exchangeType, {
            durable: this.config.durable,
            autoDelete: this.config.autoDelete,
          })

          if (this.config.prefetch) {
            await this.channel.prefetch(this.config.prefetch)
          }
        }
      }
    } catch (error) {
      console.error('[RabbitMQ] Failed to connect:', error)
      throw error
    }
  }

  private async handleConnectionError(): Promise<void> {
    if (this.shutdownRequested || this.reconnecting) {
      return
    }

    this.reconnecting = true
    this.connection = null
    this.channel = null

    console.log(`[RabbitMQ] Attempting to reconnect in ${this.config.reconnectDelay}ms...`)

    setTimeout(async () => {
      try {
        await this.connect()
        this.reconnecting = false
      } catch (error) {
        console.error('[RabbitMQ] Reconnection failed:', error)
        this.reconnecting = false
        this.handleConnectionError()
      }
    }, this.config.reconnectDelay)
  }

  async emit<TData>(event: Event<TData>): Promise<void> {
    const channel = await this.ensureConnection()

    const message = {
      topic: event.topic,
      data: event.data,
      traceId: event.traceId,
      flows: event.flows,
      messageGroupId: event.messageGroupId,
      timestamp: Date.now(),
    }

    const content = Buffer.from(JSON.stringify(message))

    const published = channel.publish(this.config.exchangeName, event.topic, content, {
      persistent: this.config.durable,
      contentType: 'application/json',
      timestamp: Date.now(),
    })

    if (!published) {
      throw new Error('Failed to publish message to RabbitMQ')
    }
  }

  async subscribe<TData>(
    topic: string,
    stepName: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: QueueConfig,
  ): Promise<SubscriptionHandle> {
    const channel = await this.ensureConnection()
    const queueName = `motia.${stepName}.${topic}`

    const subscribeOptions: RabbitMQSubscribeOptions = {
      durable: this.config.durable,
      exclusive: false,
      prefetch: this.config.prefetch,
    }

    const queue = await channel.assertQueue(queueName, {
      durable: subscribeOptions.durable ?? true,
      exclusive: subscribeOptions.exclusive ?? false,
      autoDelete: !subscribeOptions.durable,
    })

    await channel.bindQueue(queue.queue, this.config.exchangeName, topic)

    if (subscribeOptions.prefetch) {
      await channel.prefetch(subscribeOptions.prefetch)
    }

    const consumerTag = await channel.consume(queue.queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return

      try {
        const content = JSON.parse(msg.content.toString())
        await handler(content as Event<TData>)
        channel.ack(msg)
      } catch (error) {
        console.error('[RabbitMQ] Error processing message:', error)
        channel.nack(msg, false, false)
      }
    })

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
    this.shutdownRequested = true

    if (this.channel) {
      try {
        await this.channel.close()
      } catch (error) {
        console.error('[RabbitMQ] Error closing channel:', error)
      }
    }

    if (this.connection) {
      try {
        const conn = this.connection as any
        if (typeof conn.close === 'function') {
          await conn.close()
        }
      } catch (error) {
        console.error('[RabbitMQ] Error closing connection:', error)
      }
    }

    this.subscriptions.clear()
  }

  async getSubscriptionCount(topic: string): Promise<number> {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.topic === topic).length
  }

  async listTopics(): Promise<string[]> {
    return Array.from(new Set(Array.from(this.subscriptions.values()).map((sub) => sub.topic)))
  }
}
