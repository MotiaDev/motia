# @motiadev/adapter-datadog-observability

Datadog observability adapter for Motia framework, enabling APM tracing, logging, and metrics export to Datadog.

## Installation

```bash
npm install @motiadev/adapter-datadog-observability dd-trace
```

## Configuration

```typescript
// motia.config.ts
import { createDatadogObservabilityAdapter } from '@motiadev/adapter-datadog-observability'
import { createCompositeObservabilityAdapter, createDefaultObservabilityAdapter } from '@motiadev/core'

export default {
  adapters: {
    observability: createCompositeObservabilityAdapter([
      createDefaultObservabilityAdapter(lockedData),
      createDatadogObservabilityAdapter(lockedData, {
        apiKey: process.env.DD_API_KEY!,
        service: 'my-motia-app',
        env: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        enableTraces: true,
        enableLogs: true,
        enableMetrics: true,
      }),
    ]),
  },
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **required** | Datadog API key |
| `service` | `string` | `'motia-app'` | Service name in Datadog |
| `env` | `string` | `process.env.NODE_ENV` | Environment (production, staging, etc.) |
| `version` | `string` | `'1.0.0'` | Application version |
| `hostname` | `string` | `undefined` | Custom hostname |
| `agentHost` | `string` | `'localhost'` | Datadog agent host |
| `agentPort` | `number` | `8126` | Datadog agent port |
| `enableLogs` | `boolean` | `true` | Enable log forwarding |
| `enableTraces` | `boolean` | `true` | Enable APM tracing |
| `enableMetrics` | `boolean` | `true` | Enable metrics |
| `logLevel` | `string` | `'info'` | Log level (debug, info, warn, error) |
| `sampleRate` | `number` | `1.0` | Trace sampling rate (0.0-1.0) |
| `flushInterval` | `number` | `2000` | Flush interval in milliseconds |

## Features

- **APM Tracing**: Automatic distributed tracing for all Motia steps
- **Log Correlation**: Correlates logs with traces using trace IDs
- **Custom Tags**: Adds Motia-specific tags (step name, type, flows)
- **Error Tracking**: Automatically captures and reports errors
- **Performance Monitoring**: Tracks state operations, emits, and stream operations

## Usage with Composite Adapter

To maintain local observability (for Workbench) while also sending data to Datadog:

```typescript
import { createCompositeObservabilityAdapter, createDefaultObservabilityAdapter } from '@motiadev/core'
import { createDatadogObservabilityAdapter } from '@motiadev/adapter-datadog-observability'

export default {
  adapters: {
    observability: createCompositeObservabilityAdapter([
      createDefaultObservabilityAdapter(lockedData),
      createDatadogObservabilityAdapter(lockedData, {
        apiKey: process.env.DD_API_KEY!,
        service: 'my-app',
      }),
    ]),
  },
}
```

## Environment Variables

You can use environment variables for configuration:

```bash
DD_API_KEY=your-api-key
DD_SERVICE=my-motia-app
DD_ENV=production
DD_VERSION=1.0.0
DD_AGENT_HOST=localhost
DD_AGENT_PORT=8126
```

## License

MIT

