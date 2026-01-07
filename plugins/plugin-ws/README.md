# @motiadev/plugin-ws

A Motia workbench plugin for real-time WebSocket log monitoring and debugging.

![WebSocket Plugin Screenshot](assets/screenshot.png)

> **Credits**: Originally created by [@potatocoder](https://github.com/Rohithgilla12) (Rohith Gilla) as [@potatocoder/ws-plugin](https://github.com/Rohithgilla12/motia-ws-plugin). Now maintained as an official Motia plugin.

## Overview

This plugin adds a "WebSockets" tab to the Motia workbench bottom panel, providing:

- Real-time WebSocket message monitoring
- Stream subscription management (logs, API endpoints, custom streams)
- JSON syntax highlighting with expand/collapse for large payloads
- Message filtering by stream
- Connection status indicators
- Copy-to-clipboard functionality

## Installation

```bash
npm install @motiadev/plugin-ws
# or
pnpm add @motiadev/plugin-ws
```

## Usage

Add the plugin to your `motia.config.ts`:

```typescript
import wsPlugin from '@motiadev/plugin-ws/plugin'

export default {
  plugins: [wsPlugin],
}
```

The plugin will automatically appear as a "WebSockets" tab in the bottom panel of your Motia workbench.

## Features

### Stream Subscriptions

The plugin auto-subscribes to default Motia streams on connection:
- `__motia.logs` - Application logs
- `__motia.api-endpoints` - API request/response events

Add custom streams via the "Add" button in the stream bar.

### Message Types

Messages are color-coded by type:
- **System** - Connection events (amber)
- **Error** - Error messages (red)
- **Sync/Create/Update/Delete** - CRUD operations (various colors)
- **Sent** - Outgoing messages (blue)

### Exported APIs

```typescript
// Main component
export { WebSocketsPage } from '@motiadev/plugin-ws'

// Types
export type { WebSocketConnection, WebSocketMessage, WebSocketStats } from '@motiadev/plugin-ws'

// Zustand store for external state access
export { useWebSocketStore } from '@motiadev/plugin-ws'

// Hooks
export { useWebSocketConnections, useWebSocketMessages } from '@motiadev/plugin-ws'
```

## Development

```bash
pnpm install
pnpm run dev      # Watch mode
pnpm run build    # Production build
pnpm run clean    # Remove dist/
```

## Requirements

- Motia with `@motiadev/core` and `@motiadev/ui`
- React 19+

## Contributors

Special thanks to:
- **Rohith Gilla** ([@Rohithgilla12](https://github.com/Rohithgilla12)) - Original plugin creator

## License

MIT
