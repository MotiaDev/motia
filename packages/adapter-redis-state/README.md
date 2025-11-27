# @motiadev/adapter-redis-state

Redis state adapter for Motia framework, enabling distributed state management across multiple instances.

## Installation

```bash
npm install @motiadev/adapter-redis-state
```

## Usage

Configure the Redis state adapter in your `motia.config.ts`:

```typescript
import { config } from '@motiadev/core'
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'

export default config({
  adapters: {
    state: new RedisStateAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'motia:state:',
      ttl: 3600,
    }),
  },
})
```

## Configuration Options

### RedisStateAdapterConfig

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

## Features

- **Distributed State**: Share state across multiple Motia instances
- **Automatic TTL**: Optional automatic cleanup of expired state
- **Connection Pooling**: Efficient Redis connection management
- **Automatic Reconnection**: Handles connection failures gracefully
- **Atomic Operations**: Ensures data consistency
- **Efficient Scanning**: Uses SCAN for large datasets to avoid blocking
- **Type Preservation**: Maintains type information for state values

## Key Namespacing

The adapter uses the following key pattern:
```
{keyPrefix}{traceId}:{key}
```

For example:
```
motia:state:trace-123:userData
motia:state:trace-456:orderDetails
```

## Example

```typescript
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'

const adapter = new RedisStateAdapter({
  host: 'redis.example.com',
  port: 6379,
  password: 'your-secure-password',
  keyPrefix: 'myapp:motia:state:',
  ttl: 7200,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        return new Error('Too many retries')
      }
      return Math.min(retries * 50, 2000)
    },
  },
})
```

## Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DATABASE=0
STATE_KEY_PREFIX=motia:state:
STATE_TTL=3600
```

## Performance Considerations

- **TTL Settings**: Set appropriate TTL values to prevent memory bloat
- **Key Prefix**: Use descriptive prefixes to organize keys
- **Connection Pooling**: Redis client handles connection pooling automatically
- **Batch Operations**: The adapter uses batch operations where possible
- **Scan Operations**: Uses SCAN instead of KEYS to avoid blocking

## Troubleshooting

### Connection Issues

If you experience connection problems:
1. Verify Redis is running and accessible
2. Check your host, port, and credentials
3. Ensure firewall rules allow connections on the Redis port
4. Review Redis logs for errors

### Memory Issues

If Redis runs out of memory:
1. Configure appropriate TTL values
2. Implement state cleanup strategies
3. Monitor Redis memory usage
4. Consider using Redis eviction policies

### Performance Issues

If you experience slow operations:
1. Monitor Redis server performance
2. Check network latency between app and Redis
3. Review key patterns and optimize queries
4. Consider Redis clustering for large datasets

## License

[Elastic License 2.0 (ELv2)](https://github.com/MotiaDev/motia/blob/main/LICENSE)

