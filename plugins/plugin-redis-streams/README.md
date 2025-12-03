# @motiadev/plugin-redis-streams

A Motia plugin for inspecting and debugging Redis Streams in real-time.

## Features

- Stream Discovery - Automatically discover and list all Redis Streams
- Entry Inspection - View stream entries with detailed field information
- Real-time Updates - Live stream length and metadata updates
- Pagination - Browse through large streams efficiently
- Visual Interface - Clean, intuitive UI for stream management

## Installation

```bash
npm install @motiadev/plugin-redis-streams
```

## Usage

Add the plugin to your `motia.config.ts`:

```typescript
import redisStreamsPlugin from '@motiadev/plugin-redis-streams/plugin'

export default {
  plugins: [redisStreamsPlugin],
}
```

### Configuration

The plugin will automatically detect and use the Redis connection from `@motiadev/adapter-redis-streams` if available. Otherwise, it uses environment variables:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

## Features

### Stream List

- View all discovered Redis Streams
- Search and filter streams by name
- Real-time stream length updates
- Quick navigation between streams

### Stream Details

- View stream metadata (length, first/last entry ID, consumer groups)
- Browse entries with pagination
- View entry fields as formatted JSON
- Timestamp information for each entry

### Entry Inspector

- Detailed view of individual stream entries
- JSON formatting for complex field values
- Copy entry data
- Entry ID and timestamp details

## Development

```bash
# Build the plugin
pnpm run build

# Watch mode for development
pnpm run dev

# Clean build artifacts
pnpm run clean
```

## License

Elastic License 2.0 (ELv2)

