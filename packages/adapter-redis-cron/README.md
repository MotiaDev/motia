# @motiadev/adapter-redis-cron

Redis cron adapter for Motia framework, enabling distributed cron job coordination to prevent duplicate executions across multiple instances.

## Installation

```bash
npm install @motiadev/adapter-redis-cron
```

## Usage

Configure the Redis cron adapter in your `motia.config.ts`:

```typescript
import { config } from '@motiadev/core'
import { RedisCronAdapter } from '@motiadev/adapter-redis-cron'

export default config({
  adapters: {
    cron: new RedisCronAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'motia:cron:lock:',
      lockTTL: 300000,
      instanceId: process.env.INSTANCE_ID || undefined,
    }),
  },
})
```

## Configuration Options

### RedisCronAdapterConfig

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

## How It Works

When running multiple instances of a Motia application, each instance schedules the same cron jobs. Without coordination, this leads to duplicate executions. The Redis Cron Adapter solves this using distributed locking:

1. **Job Scheduling**: All instances schedule cron jobs normally
2. **Lock Acquisition**: When a cron job triggers, the instance attempts to acquire a distributed lock
3. **Execution**: Only the instance that successfully acquires the lock executes the job
4. **Lock Release**: After execution completes (or fails), the lock is released
5. **TTL Protection**: Locks have a TTL to prevent deadlocks if an instance crashes

## Execution Flow

```
Instance 1              Instance 2              Instance 3
    |                       |                       |
    | Cron triggers         | Cron triggers         | Cron triggers
    | (9:00 AM)             | (9:00 AM)             | (9:00 AM)
    |                       |                       |
    v                       v                       v
acquireLock()          acquireLock()          acquireLock()
    |                       |                       |
    v                       v                       v
┌─────────────────────────────────────────────────────┐
│         Distributed Lock Store (Redis)              │
│                                                     │
│  Lock: daily-report                                │
│  Owner: instance-1                                 │
│  Acquired: 2025-10-22 09:00:00                    │
│  Expires: 2025-10-22 09:05:00                     │
└─────────────────────────────────────────────────────┘
    |                       |                       |
    v                       v                       v
Lock acquired ✓        Lock failed ✗          Lock failed ✗
    |                       |                       |
    v                       |                       |
Execute job             Skip execution         Skip execution
    |                       |                       |
    v                       |                       |
releaseLock()              |                       |
```

## Features

- **Distributed Locking**: Prevents duplicate cron job executions across instances
- **Automatic TTL**: Locks expire automatically to prevent deadlocks
- **Lock Renewal**: Support for renewing locks for long-running jobs
- **Health Checks**: Monitor Redis connection health
- **Retry Logic**: Configurable retry attempts for lock acquisition
- **Instance Tracking**: Track which instance holds each lock
- **Graceful Shutdown**: Automatically releases locks on shutdown

## Key Namespacing

The adapter uses the following key pattern:
```
{keyPrefix}{jobName}
```

For example:
```
motia:cron:lock:daily-report
motia:cron:lock:cleanup-task
motia:cron:lock:send-notifications
```

## Example Cron Step

```typescript
// steps/dailyReport/dailyReport.step.ts
import { type Handlers } from './types'

export const config = {
  name: 'DailyReport',
  cron: '0 9 * * *', // Run at 9 AM daily
}

export const handler: Handlers['DailyReport'] = async ({ logger }) => {
  logger.info('Generating daily report')
  
  // This will only execute on ONE instance
  // even if you have 10 instances running
  
  await generateReport()
  await sendReport()
  
  logger.info('Daily report sent successfully')
}
```

## Lock Renewal for Long-Running Jobs

For cron jobs that may take longer than the lock TTL, implement lock renewal:

```typescript
export const handler: Handlers['LongRunningJob'] = async ({ logger }) => {
  // Note: Lock renewal is handled internally by the cron handler
  // You can configure a longer lockTTL in the adapter config
  
  logger.info('Starting long-running job')
  
  // Your long-running logic here
  await processLargeDataset()
  
  logger.info('Long-running job completed')
}
```

## Monitoring Active Locks

To monitor which instances are executing cron jobs:

```typescript
import { RedisCronAdapter } from '@motiadev/adapter-redis-cron'

const adapter = new RedisCronAdapter({
  host: 'localhost',
  port: 6379,
})

const activeLocks = await adapter.getActiveLocks()
console.log('Active cron jobs:', activeLocks)
```

## Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DATABASE=0
CRON_KEY_PREFIX=motia:cron:lock:
CRON_LOCK_TTL=300000
INSTANCE_ID=instance-1
```

## Lock TTL Selection

Choose the lock TTL based on your job execution times:

- **Short Jobs** (< 1 minute): Use 60000ms (1 minute) TTL
- **Medium Jobs** (1-5 minutes): Use 300000ms (5 minutes) TTL
- **Long Jobs** (> 5 minutes): Use 600000ms+ (10+ minutes) TTL

## Performance Considerations

- **Lock Overhead**: Redis lock acquisition adds ~2-5ms overhead per cron trigger (negligible)
- **Scalability**: Scales linearly with number of unique cron jobs, not number of instances
- **Network Latency**: Consider network latency between app and Redis
- **TTL Settings**: Set appropriate TTL values based on job execution times

## Edge Cases

### Instance Crashes

If an instance crashes while holding a lock, the lock will expire after the TTL, allowing another instance to execute the job. This provides automatic recovery.

### Clock Skew

Different instances might have slightly different system clocks, causing cron jobs to trigger at slightly different times. The lock mechanism ensures only one execution regardless of timing differences.

### Redis Unavailability

If Redis is unavailable, all instances will fail to acquire locks and no cron jobs will execute. This is a fail-safe behavior to prevent duplicates.

## Development vs Production

### Development

For development environments where horizontal scaling is not needed:
- Omit the `cron` adapter from configuration
- Cron jobs will execute normally without distributed locking
- Reduces external dependencies during development

### Production

For production with multiple instances:
- Always configure a cron adapter
- Use managed Redis services (AWS ElastiCache, etc.) for high availability
- Set appropriate lock TTLs based on job execution times
- Monitor active locks to ensure proper coordination

## Troubleshooting

### Cron Jobs Not Executing

If no cron jobs are executing:
1. Verify Redis is accessible from all instances
2. Check Redis connection credentials
3. Review instance logs for lock acquisition errors
4. Verify cron expressions are valid
5. Check Redis memory and connection limits

### Duplicate Executions

If you see duplicate executions:
1. Verify all instances use the same Redis instance
2. Check that cron adapter is properly configured
3. Review lock TTL settings (may be too short)
4. Check for clock skew between instances
5. Monitor Redis connection stability

### Lock Contention

If locks are frequently contended:
1. Review cron schedules to avoid overlapping jobs
2. Consider staggering job execution times
3. Increase lock retry attempts if appropriate
4. Monitor Redis performance

## License

[Elastic License 2.0 (ELv2)](https://github.com/MotiaDev/motia/blob/main/LICENSE)

