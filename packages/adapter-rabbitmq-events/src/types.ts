export interface RabbitMQEventAdapterConfig {
  url: string
  exchangeType: 'direct' | 'topic' | 'fanout' | 'headers'
  exchangeName: string
  durable?: boolean
  autoDelete?: boolean
  connectionTimeout?: number
  reconnectDelay?: number
  prefetch?: number
  deadLetterExchange?: string
  deadLetterRoutingKey?: string
}

export interface RabbitMQSubscribeOptions {
  queue?: string
  exclusive?: boolean
  durable?: boolean
  prefetch?: number
}
