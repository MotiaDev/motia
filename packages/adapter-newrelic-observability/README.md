# @motiadev/adapter-newrelic-observability

New Relic observability adapter for Motia framework, enabling APM tracing, logging, and metrics export to New Relic.

## Installation

```bash
npm install @motiadev/adapter-newrelic-observability newrelic
```

## Configuration

```typescript
// motia.config.ts
import { createNewRelicObservabilityAdapter } from '@motiadev/adapter-newrelic-observability'
import { createCompositeObservabilityAdapter, createDefaultObservabilityAdapter } from '@motiadev/core'

export default {
  adapters: {
    observability: createCompositeObservabilityAdapter([
      createDefaultObservabilityAdapter(lockedData),
      createNewRelicObservabilityAdapter(lockedData, {
        licenseKey: process.env.NEW_RELIC_LICENSE_KEY!,
        appName: 'my-motia-app',
        logLevel: 'info',
        enableTraces: true,
        enableLogs: true,
        enableMetrics: true,
        distributedTracingEnabled: true,
      }),
    ]),
  },
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `licenseKey` | `string` | **required** | New Relic license key |
| `appName` | `string` | `'motia-app'` | Application name in New Relic |
| `logLevel` | `string` | `'info'` | Log level (fatal, error, warn, info, debug, trace) |
| `enableLogs` | `boolean` | `true` | Enable log forwarding |
| `enableTraces` | `boolean` | `true` | Enable APM tracing |
| `enableMetrics` | `boolean` | `true` | Enable metrics |
| `distributedTracingEnabled` | `boolean` | `true` | Enable distributed tracing |
| `transactionTracerEnabled` | `boolean` | `true` | Enable transaction tracing |
| `errorCollectorEnabled` | `boolean` | `true` | Enable error collection |
| `customInsightsEvents` | `boolean` | `true` | Enable custom insights events |

## Features

- **APM Tracing**: Automatic distributed tracing for all Motia steps
- **Transaction Monitoring**: Creates web transactions for step execution
- **Custom Attributes**: Adds Motia-specific attributes (step name, type, flows)
- **Error Tracking**: Automatically captures and reports errors to New Relic
- **Custom Events**: Records custom insights events for emit operations
- **Performance Monitoring**: Tracks state operations, emits, and stream operations

## Usage with Composite Adapter

To maintain local observability (for Workbench) while also sending data to New Relic:

```typescript
import { createCompositeObservabilityAdapter, createDefaultObservabilityAdapter } from '@motiadev/core'
import { createNewRelicObservabilityAdapter } from '@motiadev/adapter-newrelic-observability'

export default {
  adapters: {
    observability: createCompositeObservabilityAdapter([
      createDefaultObservabilityAdapter(lockedData),
      createNewRelicObservabilityAdapter(lockedData, {
        licenseKey: process.env.NEW_RELIC_LICENSE_KEY!,
        appName: 'my-app',
      }),
    ]),
  },
}
```

## New Relic Configuration File

You can also configure New Relic using a `newrelic.js` configuration file:

```javascript
// newrelic.js
exports.config = {
  app_name: ['my-motia-app'],
  license_key: 'your-license-key',
  logging: {
    level: 'info'
  },
  distributed_tracing: {
    enabled: true
  },
  transaction_tracer: {
    enabled: true
  }
}
```

## Environment Variables

You can use environment variables for configuration:

```bash
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=my-motia-app
NEW_RELIC_LOG_LEVEL=info
NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true
```

## License

MIT

