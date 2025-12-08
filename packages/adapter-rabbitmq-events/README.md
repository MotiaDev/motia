# @motiadev/adapter-rabbitmq-events

RabbitMQ event adapter for Motia framework, enabling distributed event handling across multiple instances.

## Installation

```bash
npm install @motiadev/adapter-rabbitmq-events
```

## Usage

Configure the RabbitMQ adapter in your `motia.config.ts`:

```typescript
import { config } from '@motiadev/core'
import { RabbitMQEventAdapter } from '@motiadev/adapter-rabbitmq-events'

export default config({
  adapters: {
    events: new RabbitMQEventAdapter({
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      exchangeName: 'motia.events',
      exchangeType: 'topic',
      durable: true,
    }),
  },
})
```

## Configuration Options

### RabbitMQEventAdapterConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | Required | RabbitMQ connection URL (e.g., `amqp://localhost`) |
| `exchangeName` | `string` | Required | Name of the exchange to use |
| `exchangeType` | `'direct' \| 'topic' \| 'fanout' \| 'headers'` | Required | Type of exchange |
| `durable` | `boolean` | `true` | Whether the exchange should survive broker restarts |
| `autoDelete` | `boolean` | `false` | Whether to delete the exchange when all queues are unbound |
| `connectionTimeout` | `number` | `10000` | Connection timeout in milliseconds |
| `reconnectDelay` | `number` | `5000` | Delay before attempting reconnection in milliseconds |
| `prefetch` | `number` | `10` | Number of messages to prefetch |

## Features

- **Topic-based Routing**: Flexible event routing using RabbitMQ exchanges
- **Durable Messaging**: Messages persist across broker restarts
- **Automatic Reconnection**: Handles connection failures gracefully
- **Message Acknowledgment**: Ensures reliable message delivery
- **Load Balancing**: Distributes events across multiple instances
- **Dead Letter Queues**: Failed messages are properly handled

## Example

```typescript
import { RabbitMQEventAdapter } from '@motiadev/adapter-rabbitmq-events'

const adapter = new RabbitMQEventAdapter({
  url: 'amqp://user:password@rabbitmq.example.com:5672',
  exchangeName: 'motia.events',
  exchangeType: 'topic',
  durable: true,
  prefetch: 20,
})
```

## Environment Variables

```bash
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=motia.events
```

## Performance Considerations

- Use topic exchanges for flexible routing patterns
- Set appropriate prefetch values based on your workload
- Enable message persistence for critical events
- Monitor queue depths to detect processing bottlenecks

## Troubleshooting

### Connection Issues

If you experience connection problems:
1. Verify RabbitMQ is running and accessible
2. Check your connection URL and credentials
3. Ensure firewall rules allow connections on port 5672
4. Review RabbitMQ logs for errors

### Message Delivery

If messages are not being delivered:
1. Verify exchange and queue bindings
2. Check message acknowledgment settings
3. Review consumer prefetch settings
4. Monitor dead letter queues for failed messages

## License

[Elastic License 2.0 (ELv2)](https://github.com/MotiaDev/motia/blob/main/LICENSE)

