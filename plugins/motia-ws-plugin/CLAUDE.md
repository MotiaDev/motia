# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm run build    # Build the plugin with tsdown
pnpm run dev      # Watch mode for development
pnpm run clean    # Remove dist/ artifacts
```

## Architecture

This is a **Motia workbench plugin** that provides WebSocket logging/monitoring UI for the Motia framework. It registers as a bottom panel tab showing real-time WebSocket messages.

### Entry Points

- `src/index.ts` - Package entry, exports the main component (`WebSocketsPage`), types, store, and hooks
- `src/plugin.ts` - Plugin definition that registers the workbench tab with Motia

### Core Structure

**State Management**: Zustand store (`stores/websocket-store.ts`) manages:
- WebSocket connections and their statuses
- Messages (sent/received)
- Selected connection for viewing
- Global stats (total messages, active connections)

**Hooks** (`hooks/use-websocket-connections.ts`):
- `useMotiaWebSocket()` - Connects to Motia's WS server, handles join/leave stream subscriptions
- `useWebSocketConnections()` - Connection list management
- `useWebSocketMessages(connectionId)` - Filtered messages for a connection

**Components**:
- `WebSocketsPage` - Main UI with stream subscription tabs and message viewer
- `MessageViewer` - JSON syntax-highlighted message display with expand/collapse
- `ConnectionList` - Connection selector sidebar

### Plugin Registration

The plugin exports a function receiving `MotiaPluginContext` and returns workbench configuration:
```typescript
{
  packageName: "ws-plugin",
  cssImports: ["ws-plugin/dist/styles.css"],
  componentName: "WebSocketsPage",
  position: "bottom",
  labelIcon: "radio"
}
```

### Build Configuration

Uses tsdown with two build configs:
1. JS/TS build with React Compiler optimization via Babel
2. Separate CSS build with PostCSS/Tailwind v4

Peer dependencies: `@motiadev/core`, `@motiadev/ui`
