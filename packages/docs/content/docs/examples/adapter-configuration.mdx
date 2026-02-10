---
title: 'Adapter Configuration'
description: 'Configure distributed adapters for horizontal scaling in production'
---

<Callout type="warn">
**Deprecated** - Adapter configuration has been removed from Motia. This page is kept for reference only.
</Callout>

This guide shows you how to configure distributed adapters for Motia to enable horizontal scaling and production-ready deployments. We'll cover setting up Redis and RabbitMQ adapters for state, streams, events, and cron.

## Why Distributed Adapters?

By default, Motia uses file-based and in-memory adapters that work great for single-instance deployments. However, when you need to:

- Run multiple Motia instances
- Scale horizontally
- Share state/events/streams across instances
- Deploy to production with high availability

You need distributed adapters that use shared infrastructure like Redis or RabbitMQ.

---

## Quick Setup

### 1. Install Adapter Packages

```bash
npm install @motiadev/adapter-redis-state \
            @motiadev/adapter-redis-streams \
            @motiadev/adapter-rabbitmq-events \
            @motiadev/adapter-redis-cron
```

### 2. Configure Adapters

```typescript title="iii config.yml"
import { config } from '@motiadev/core'
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'
import { RedisStreamAdapterManager } from '@motiadev/adapter-redis-streams'
import { RabbitMQEventAdapter } from '@motiadev/adapter-rabbitmq-events'
import { RedisCronAdapter } from '@motiadev/adapter-redis-cron'

export default config({
  adapters: {
    state: new RedisStateAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    }),
    streams: new RedisStreamAdapterManager({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    }),
    events: new RabbitMQEventAdapter({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchangeName: process.env.RABBITMQ_EXCHANGE || 'motia.events',
      exchangeType: 'topic',
    }),
    cron: new RedisCronAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    }),
  },
})
```

---

## Configuration Options

Each adapter supports additional configuration options for production use:

### Redis State Adapter

```typescript title="iii config.yml"
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'

export default config({
  adapters: {
    state: new RedisStateAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      database: parseInt(process.env.REDIS_DATABASE || '0'),
      keyPrefix: process.env.STATE_KEY_PREFIX || 'motia:state:',
      ttl: parseInt(process.env.STATE_TTL || '3600'),
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            return new Error('Too many retries')
          }
          return Math.min(retries * 50, 2000)
        },
      },
    }),
  },
})
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | `'localhost'` | Redis server host |
| `port` | `number` | `6379` | Redis server port |
| `password` | `string` | `undefined` | Redis authentication password |
| `username` | `string` | `undefined` | Redis authentication username |
| `database` | `number` | `0` | Redis database number |
| `keyPrefix` | `string` | `'motia:state:'` | Prefix for all state keys |
| `ttl` | `number` | `undefined` | Time-to-live in seconds for state entries |
| `socket.reconnectStrategy` | `function` | Auto-retry | Custom reconnection strategy |
| `socket.connectTimeout` | `number` | `10000` | Connection timeout in milliseconds |

### Redis Stream Adapter

```typescript title="iii config.yml"
import { RedisStreamAdapterManager } from '@motiadev/adapter-redis-streams'

export default config({
  adapters: {
    streams: new RedisStreamAdapterManager({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      database: parseInt(process.env.REDIS_DATABASE || '0'),
      keyPrefix: process.env.STREAM_KEY_PREFIX || 'motia:stream:',
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            return new Error('Too many retries')
          }
          return Math.min(retries * 50, 2000)
        },
      },
    }),
  },
})
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | `'localhost'` | Redis server host |
| `port` | `number` | `6379` | Redis server port |
| `password` | `string` | `undefined` | Redis authentication password |
| `username` | `string` | `undefined` | Redis authentication username |
| `database` | `number` | `0` | Redis database number |
| `keyPrefix` | `string` | `'motia:stream:'` | Prefix for all stream keys |
| `socket.reconnectStrategy` | `function` | Auto-retry | Custom reconnection strategy |
| `socket.connectTimeout` | `number` | `10000` | Connection timeout in milliseconds |

### RabbitMQ Event Adapter

```typescript title="iii config.yml"
import { RabbitMQEventAdapter } from '@motiadev/adapter-rabbitmq-events'

export default config({
  adapters: {
    events: new RabbitMQEventAdapter({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchangeName: process.env.RABBITMQ_EXCHANGE || 'motia.events',
      exchangeType: 'topic',
      durable: true,
      autoDelete: false,
      connectionTimeout: 10000,
      reconnectDelay: 5000,
      prefetch: 10,
    }),
  },
})
```

**Configuration Options:**

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

### Redis Cron Adapter

```typescript title="iii config.yml"
import { RedisCronAdapter } from '@motiadev/adapter-redis-cron'

export default config({
  adapters: {
    cron: new RedisCronAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      database: parseInt(process.env.REDIS_DATABASE || '0'),
      keyPrefix: process.env.CRON_KEY_PREFIX || 'motia:cron:lock:',
      lockTTL: parseInt(process.env.CRON_LOCK_TTL || '300000'),
      lockRetryDelay: 1000,
      lockRetryAttempts: 0,
      instanceId: process.env.INSTANCE_ID,
      enableHealthCheck: true,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            return new Error('Too many retries')
          }
          return Math.min(retries * 50, 2000)
        },
      },
    }),
  },
})
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | `'localhost'` | Redis server host |
| `port` | `number` | `6379` | Redis server port |
| `password` | `string` | `undefined` | Redis authentication password |
| `username` | `string` | `undefined` | Redis authentication username |
| `database` | `number` | `0` | Redis database number |
| `keyPrefix` | `string` | `'motia:cron:lock:'` | Prefix for all lock keys |
| `lockTTL` | `number` | `300000` | Lock time-to-live in milliseconds (5 minutes) |
| `lockRetryDelay` | `number` | `1000` | Delay between lock retry attempts in milliseconds |
| `lockRetryAttempts` | `number` | `0` | Number of times to retry acquiring a lock |
| `instanceId` | `string` | Auto-generated UUID | Unique identifier for this instance |
| `enableHealthCheck` | `boolean` | `true` | Whether to perform periodic health checks |
| `socket.reconnectStrategy` | `function` | Auto-retry | Custom reconnection strategy |
| `socket.connectTimeout` | `number` | `10000` | Connection timeout in milliseconds |

---

## Docker Compose Setup

For local development and production, use Docker Compose to run Redis and RabbitMQ:

```yaml title="docker-compose.yml"
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  redis-data:
  rabbitmq-data:
```

Start the services:

```bash
docker-compose up -d
```

---

## Partial Adapter Configuration

You don't need to configure all adapters. Mix and match based on your needs:

### Only State Adapter

If you only need shared state across instances:

```typescript title="iii config.yml"
import { config } from '@motiadev/core'
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'

export default config({
  adapters: {
    state: new RedisStateAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
    }),
    // Streams, events, and cron use defaults
  },
})
```

### Only Event Adapter

If you only need distributed events:

```typescript title="iii config.yml"
import { config } from '@motiadev/core'
import { RabbitMQEventAdapter } from '@motiadev/adapter-rabbitmq-events'

export default config({
  adapters: {
    events: new RabbitMQEventAdapter({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchangeName: process.env.RABBITMQ_EXCHANGE || 'motia.events',
      exchangeType: 'topic',
    }),
    // State, streams, and cron use defaults
  },
})
```

---

## Production Deployment

### Scaling Multiple Instances

With distributed adapters, you can run multiple Motia instances:

```yaml title="docker-compose.yml"
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"

  motia-1:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq

  motia-2:
    build: .
    ports:
      - "3001:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq

  motia-3:
    build: .
    ports:
      - "3002:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq
```

All instances share the same state, events, and streams.

### Cloud Provider Configuration

For cloud deployments, use managed services:

**AWS ElastiCache (Redis):**
```typescript
state: new RedisStateAdapter({
  host: process.env.REDIS_HOST, // ElastiCache endpoint
  port: 6379,
  password: process.env.REDIS_PASSWORD,
})
```

**CloudAMQP (RabbitMQ):**
```typescript
events: new RabbitMQEventAdapter({
  url: process.env.CLOUDAMQP_URL, // CloudAMQP connection string
  exchangeName: process.env.RABBITMQ_EXCHANGE || 'motia.events',
  exchangeType: 'topic',
})
```

---

## Testing Adapter Configuration

Your application code doesn't change when switching adapters. Test with defaults first:

```typescript
// This works with both file and Redis adapters
export const handler: Handlers<typeof config> = async (req, { state, streams, enqueue }) => {
  await state.set('orders', 'order-123', { id: 'order-123' })
  await streams.messages.set('chat-123', 'msg-1', { text: 'Hello' })
  await enqueue({ topic: 'order.created', data: { orderId: '123' } })
}
```

Then switch to distributed adapters for production without changing your code.

---

## What's Next?

<Cards>
  <Card href="/docs/development-guide/adapters/usage" title="📖 Using Adapters">
    Learn more about using adapters in your application
  </Card>
  
  <Card href="/docs/development-guide/adapters/creating-adapters" title="🔧 Creating Adapters">
    Build custom adapters for your infrastructure
  </Card>
  
  <Card href="/docs/deployment-guide/self-hosted" title="🚀 Deployment Guide">
    Learn about deploying Motia to production
  </Card>
</Cards>

