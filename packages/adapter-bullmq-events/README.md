# @motiadev/adapter-bullmq-events

BullMQ event adapter for Motia framework, enabling distributed event handling with advanced features like retries, priorities, delays, and FIFO queues.

## Installation

```bash
npm install @motiadev/adapter-bullmq-events
```

## Usage

Configure the BullMQ adapter in your `motia.config.ts`:

```typescript
import { config } from '@motiadev/core'
import { BullMQEventAdapter } from '@motiadev/adapter-bullmq-events'

export default config({
  adapters: {
    events: new BullMQEventAdapter({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
  },
})
```

### Using an Existing Redis Connection

You can also pass an existing IORedis instance:

```typescript
import IORedis from 'ioredis'
import { BullMQEventAdapter } from '@motiadev/adapter-bullmq-events'

const redis = new IORedis({
  host: 'localhost',
  port: 6379,
})

const adapter = new BullMQEventAdapter({
  connection: redis,
})
```

## Configuration Options

### BullMQEventAdapterConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `connection` | `IORedis.Redis \| IORedis.RedisOptions` | Required | Redis connection instance or configuration |
| `prefix` | `string` | `'motia'` | Prefix for BullMQ queue keys |
| `defaultJobOptions` | `object` | See below | Default options for all jobs |
| `deadLetterQueue` | `object` | See below | Dead Letter Queue configuration |

### Default Job Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `attempts` | `number` | `3` | Number of retry attempts |
| `backoff` | `object` | `{ type: 'exponential', delay: 2000 }` | Backoff strategy for retries |
| `removeOnComplete` | `boolean \| number \| object` | `{ count: 1000 }` | Remove completed jobs after N jobs or age |
| `removeOnFail` | `boolean \| number \| object` | `{ count: 5000 }` | Remove failed jobs after N jobs or age |

### Dead Letter Queue Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable Dead Letter Queue for failed jobs |
| `suffix` | `string` | `'.dlq'` | Suffix appended to queue names for DLQ queues |
| `maxJobAge` | `number` | `undefined` | Maximum age in seconds for DLQ jobs (optional cleanup) |

### Backoff Types

- `fixed`: Wait a fixed delay between retries
- `exponential`: Exponentially increase delay between retries (2s, 4s, 8s, etc.)

## Features

- **Queue/Worker Pattern**: Uses BullMQ's robust job queue system
- **Automatic Retries**: Configurable retry attempts with backoff strategies
- **Dead Letter Queue**: Failed jobs after max retries are automatically moved to DLQ
- **FIFO Queues**: Support for FIFO processing via `concurrency: 1`
- **Priority Support**: Jobs can have priorities (configured via defaultJobOptions)
- **Delayed Jobs**: Support for delayed job execution
- **Visibility Timeout**: Configurable lock duration for job processing
- **Connection Management**: Accepts existing Redis connections or creates new ones
- **Graceful Shutdown**: Properly closes all queues and workers on shutdown

## Advanced Configuration

### Custom Retry Strategy

```typescript
const adapter = new BullMQEventAdapter({
  connection: {
    host: 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: {
      count: 500,
      age: 3600,
    },
    removeOnFail: {
      count: 1000,
      age: 86400,
    },
  },
})
```

### Dead Letter Queue Configuration

Dead Letter Queue (DLQ) is enabled by default. Failed jobs that exceed the maximum retry attempts are automatically moved to a dedicated DLQ queue for later analysis or reprocessing.

```typescript
const adapter = new BullMQEventAdapter({
  connection: {
    host: 'localhost',
    port: 6379,
  },
  deadLetterQueue: {
    enabled: true,
    suffix: '.dlq',
    maxJobAge: 86400,
  },
})
```

DLQ queues are created with the naming convention: `{originalQueueName}.dlq`. For example, a queue named `user.created.sendEmail` will have a corresponding DLQ queue named `user.created.sendEmail.dlq`.

Jobs moved to DLQ include the following metadata:
- `originalJobId`: The original job ID
- `originalJobName`: The original job name
- `originalData`: The original job data
- `failureReason`: The error message
- `failureStack`: The error stack trace
- `attemptsMade`: Number of attempts before failure
- `failedAt`: ISO timestamp of when the job failed
- `queueName`: The original queue name

### FIFO Queue Support

FIFO queues are automatically enabled when `options.type === 'fifo'` is passed to `subscribe()`:

```typescript
await adapter.subscribe(
  'order.processed',
  'processOrder',
  async (event) => {
    // Process order sequentially
  },
  {
    type: 'fifo',
    maxRetries: 3,
    visibilityTimeout: 30,
  }
)
```

## Example

```typescript
import { BullMQEventAdapter } from '@motiadev/adapter-bullmq-events'

const adapter = new BullMQEventAdapter({
  connection: {
    host: 'redis.example.com',
    port: 6379,
    password: 'your-password',
    db: 0,
  },
  prefix: 'myapp',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

await adapter.emit({
  topic: 'user.created',
  data: { userId: '123', email: 'user@example.com' },
  traceId: 'trace-123',
})

await adapter.subscribe(
  'user.created',
  'sendWelcomeEmail',
  async (event) => {
    console.log('Processing user creation:', event.data)
  },
  {
    type: 'standard',
    maxRetries: 5,
    visibilityTimeout: 60,
  }
)
```

## Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

## Performance Considerations

- Use appropriate `concurrency` settings for your workload
- Configure `removeOnComplete` and `removeOnFail` to prevent Redis memory bloat
- Monitor queue depths using BullMQ dashboard or Redis commands
- Use connection pooling when creating multiple adapters
- Set appropriate `lockDuration` (visibility timeout) based on job processing time

## Troubleshooting

### Connection Issues

If you experience connection problems:
1. Verify Redis is running and accessible
2. Check your connection configuration and credentials
3. Ensure firewall rules allow connections on Redis port (default 6379)
4. Review Redis logs for errors

### Job Processing

If jobs are not being processed:
1. Verify workers are subscribed to the correct topics
2. Check job failure logs in Redis
3. Review retry and backoff configurations
4. Monitor queue metrics using BullMQ dashboard

### Memory Issues

If Redis memory usage is high:
1. Configure `removeOnComplete` and `removeOnFail` appropriately
2. Use job age limits instead of count limits for long-running queues
3. Monitor Redis memory usage and set up eviction policies
4. Configure `maxJobAge` for DLQ to automatically clean up old failed jobs

### Dead Letter Queue

If jobs are accumulating in DLQ:
1. Review DLQ queues using BullMQ dashboard or Redis commands
2. Analyze failure reasons in DLQ job data
3. Fix underlying issues and reprocess DLQ jobs if needed
4. Configure `maxJobAge` to automatically remove old DLQ jobs
5. Monitor DLQ queue sizes and set up alerts

## License

MIT




