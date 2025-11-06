export interface RabbitMQEventAdapterConfig {
  url: string
  exchangeName: string
  exchangeType: 'direct' | 'topic' | 'fanout' | 'headers'
  durable?: boolean
  autoDelete?: boolean
  connectionTimeout?: number
  reconnectDelay?: number
  prefetch?: number
}

export interface RabbitMQSubscribeOptions {
  queue?: string
  exclusive?: boolean
  durable?: boolean
  prefetch?: number
}
