# Motia Plugins

This directory contains official Motia plugins that extend the workbench functionality.

## Overview

Motia plugins allow you to add custom tabs, visualizations, and functionality to the Motia workbench. Each plugin is a standalone package that can be imported and configured in your `motia.config.ts` file.

## Official Plugins

### [@motiadev/plugin-logs](./plugin-logs)

Real-time log viewer with advanced search and filtering capabilities.

**Features:**

- Real-time log streaming
- Search by message, trace ID, or step name
- Log level filtering with visual indicators
- Detailed log inspection sidebar
- Custom property viewing with JSON formatting

**Usage:**

```typescript
import logsPlugin from '@motiadev/plugin-logs/plugin'

export default {
  plugins: [logsPlugin],
}
```

### [@motiadev/plugin-endpoint](./plugin-endpoint)

Interactive API endpoint testing and management tool.

**Features:**

- Visual endpoint explorer
- Request testing with custom headers, params, and body
- Response visualization
- Path parameter configuration
- Real-time endpoint discovery

**Usage:**

```typescript
import endpointPlugin from '@motiadev/plugin-endpoint/plugin'

export default {
  plugins: [endpointPlugin],
}
```

### [@motiadev/plugin-observability](./plugin-observability)

Performance monitoring and distributed tracing visualization.

**Features:**

- Real-time trace viewing
- Performance metrics
- Request/response inspection
- Trace timeline visualization
- Step-by-step execution tracking

**Usage:**

```typescript
import observabilityPlugin from '@motiadev/plugin-observability/plugin'

export default {
  plugins: [observabilityPlugin],
}
```

### [@motiadev/plugin-states](./plugin-states)

State management and inspection tool for Motia flows.

**Features:**

- Visual state explorer
- Real-time state updates
- State history tracking
- JSON-formatted state viewing
- State search and filtering

**Usage:**

```typescript
import statesPlugin from '@motiadev/plugin-states/plugin'

export default {
  plugins: [statesPlugin],
}
```

### [@motiadev/plugin-streams](./plugin-streams)

Stream visualization and management plugin for Motia Workbench.

**Features:**

- Stream discovery and listing
- Group management with item counts
- Real-time data inspection with JSON viewer
- Schema visualization for typed streams
- Search and filter capabilities
- Support for hidden/internal streams toggle

**Usage:**

```typescript
import streamsPlugin from '@motiadev/plugin-streams/plugin'

export default {
  plugins: [streamsPlugin],
}
```

### [@motiadev/ws-plugin](./motia-ws-plugin)

Real-time WebSocket log monitoring and debugging tool.

> **Credits**: Originally created by [@Rohithgilla12](https://github.com/Rohithgilla12) (Rohith Gilla) as [@potatocoder/ws-plugin](https://github.com/Rohithgilla12/motia-ws-plugin). Now maintained as an official Motia plugin.

**Features:**

- Real-time WebSocket message monitoring
- Stream subscription management (logs, API endpoints, custom streams)
- JSON syntax highlighting with expand/collapse for large payloads
- Message filtering by stream
- Connection status indicators
- Copy-to-clipboard functionality

**Usage:**

```typescript
import wsPlugin from '@motiadev/ws-plugin/plugin'

export default {
  plugins: [wsPlugin],
}
```

### [@motiadev/cron-plugin](./motia-cron-plugin)

Cron job monitoring and management tool for scheduled tasks.

**Features:**

- Real-time cron job monitoring
- Human-readable cron expression descriptions
- Next/last execution time display
- Execution history with duration tracking
- Manual job triggering
- Enable/disable job controls
- Status filtering (idle, running, completed, failed, disabled)
- Search functionality

**Usage:**

```typescript
import cronPlugin from '@motiadev/cron-plugin/plugin'

export default {
  plugins: [cronPlugin],
}
```

### [@motiadev/plugin-example](./plugin-example)

A minimal example plugin demonstrating the plugin system architecture.

**Features:**

- Simple workbench tab integration
- UI component examples
- Plugin structure reference
- Build configuration template

**Usage:**

```typescript
import examplePlugin from '@motiadev/plugin-example/plugin'

export default {
  plugins: [examplePlugin],
}
```

## Creating Your Own Plugin

Want to create your own plugin? Check out these resources:

1. **[Plugin Development Guide](../packages/docs/content/docs/development-guide/plugins.mdx)** - Comprehensive guide on creating plugins
2. **[plugin-example](./plugin-example)** - Minimal example plugin to use as a template
3. **[plugin-logs source](./plugin-logs/src)** - Feature-rich plugin with real-world examples

### Quick Start

1. Create a new directory in `plugins/`:

```bash
mkdir plugins/plugin-myfeature
cd plugins/plugin-myfeature
```

2. Copy the structure from `plugin-example`:

```bash
cp -r ../plugin-example/package.json .
cp -r ../plugin-example/tsconfig.json .
cp -r ../plugin-example/vite.config.ts .
cp -r ../plugin-example/postcss.config.js .
cp -r ../plugin-example/src .
```

3. Update package names and customize your plugin

4. Build your plugin:

```bash
pnpm install
pnpm run build
```

5. Use it in your project's `motia.config.ts`:

```typescript
import myPlugin from './plugins/plugin-myfeature/plugin'

export default {
  plugins: [myPlugin],
}
```

## Plugin Architecture

Plugins in Motia consist of:

- **Plugin Definition** (`src/plugin.ts`) - Exports default function returning plugin configuration
- **UI Components** (`src/components/`) - React components for the workbench
- **Styles** (`src/styles.css`) - TailwindCSS styling
- **Build Configuration** (Vite, TypeScript, PostCSS) - Compilation setup

Each plugin exports two entry points:

- Main entry (`.`) - Components and utilities
- Plugin entry (`./plugin`) - Plugin definition function

## Development

### Building All Plugins

From the root of the monorepo:

```bash
pnpm run build
```

### Building Individual Plugin

Navigate to the plugin directory:

```bash
cd plugins/plugin-logs
pnpm run build
```

### Development Mode

Watch mode for automatic rebuilding:

```bash
cd plugins/plugin-logs
pnpm run dev
```

## Dependencies

All plugins share common peer dependencies:

- `@motiadev/core` - Core Motia functionality and types
- `@motiadev/ui` - UI component library
- `react` & `react-dom` - React framework

Additional dependencies vary by plugin functionality.

## Contributing

Contributions to existing plugins or new plugin ideas are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

When creating a new plugin:

1. Follow the naming convention: `@motiadev/plugin-{name}`
2. Include comprehensive documentation
3. Add tests for core functionality
4. Follow the established code style
5. Update this README with your plugin information

## Documentation

For detailed documentation on:

- **Plugin Development**: See [Plugin Guide](../packages/docs/content/docs/development-guide/plugins.mdx)
- **Workbench Concepts**: See [Workbench Documentation](../packages/docs/content/docs/concepts/workbench.mdx)
- **State Management**: See [State Guide](../packages/docs/content/docs/development-guide/state-management.mdx)
- **Streams**: See [Streams Guide](../packages/docs/content/docs/development-guide/streams.mdx)

## License

All plugins are licensed under the [Elastic License 2.0 (ELv2)](../LICENSE).
