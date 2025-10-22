# @motiadev/adapter-redis-streams

Redis streams adapter for Motia framework, enabling distributed stream management with real-time updates across multiple instances.

## Installation

```bash
npm install @motiadev/adapter-redis-streams
```

## Usage

Configure the Redis streams adapter in your `motia.config.ts`:

```typescript
import { config } from '@motiadev/core'
import { RedisStreamAdapter } from '@motiadev/adapter-redis-streams'

export default config({
  adapters: {
    streams: new RedisStreamAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'motia:stream:',
    }),
  },
})
```

## Configuration Options

### RedisStreamAdapterConfig

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

## Features

- **Distributed Streams**: Share stream data across multiple Motia instances
- **Real-time Updates**: Pub/sub for instant data synchronization
- **Efficient Querying**: Support for filtering, sorting, and pagination
- **Automatic Reconnection**: Handles connection failures gracefully
- **Connection Pooling**: Separate clients for pub/sub operations
- **Type Safety**: Full TypeScript support with generics

## Key Namespacing

The adapter uses the following patterns:
- **Stream data**: `{keyPrefix}{groupId}:{id}`
- **Events**: `motia:stream:events:{groupId}` or `motia:stream:events:{groupId}:{id}`

For example:
```
motia:stream:users:user-123
motia:stream:orders:order-456
motia:stream:events:users
motia:stream:events:users:user-123
```

## Example

```typescript
import { RedisStreamAdapter } from '@motiadev/adapter-redis-streams'

const adapter = new RedisStreamAdapter({
  host: 'redis.example.com',
  port: 6379,
  password: 'your-secure-password',
  keyPrefix: 'myapp:stream:',
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

## Real-time Updates

The adapter uses Redis pub/sub to notify all instances about stream changes:

```typescript
await adapter.subscribe(
  { groupId: 'users' },
  async (event) => {
    console.log('Stream event:', event.type, event.data)
  }
)

await adapter.set('users', 'user-123', { name: 'John', email: 'john@example.com' })
```

## Querying

The adapter supports flexible querying:

```typescript
const results = await adapter.query('users', {
  where: { status: 'active' },
  orderBy: 'createdAt',
  orderDirection: 'desc',
  limit: 10,
  offset: 0,
})
```

## Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DATABASE=0
STREAM_KEY_PREFIX=motia:stream:
```

## Performance Considerations

- **Pub/Sub Overhead**: Real-time updates add slight latency (~10-50ms)
- **Key Scanning**: Uses SCAN to avoid blocking on large datasets
- **Connection Pooling**: Maintains separate connections for pub/sub
- **Batch Operations**: Uses multi-get for group operations
- **Memory Usage**: Monitor Redis memory with large stream datasets

## Troubleshooting

### Connection Issues

If you experience connection problems:
1. Verify Redis is running and accessible
2. Check your host, port, and credentials
3. Ensure firewall rules allow connections
4. Review Redis logs for errors

### Subscription Issues

If real-time updates aren't working:
1. Verify pub/sub client is connected
2. Check subscription handlers are registered
3. Monitor Redis pub/sub channels with `PUBSUB CHANNELS`
4. Review network latency between instances

### Performance Issues

If you experience slow operations:
1. Monitor Redis server performance
2. Check network latency
3. Review query patterns and add appropriate filtering
4. Consider Redis clustering for large datasets
5. Monitor pub/sub message rates

## License

MIT

