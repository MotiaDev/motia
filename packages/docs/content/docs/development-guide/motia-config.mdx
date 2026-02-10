---
title: iii Configuration (config.yaml)
description: Configure your iii application with config.yaml - the central configuration file using a modular architecture.
---

The `config.yaml` file is the central configuration for your iii application. It uses a modular architecture where each concern (API, queues, state, streams, etc.) is configured as a separate module.

<Callout type="info">
**Migration Note**: The `motia.config.ts` file has been replaced by `config.yaml`. If you are upgrading from an older version, migrate your configuration to the new YAML-based modular format.
</Callout>

## Quick Start

Create a `config.yaml` file in your project root:

```yaml title="config.yaml"
modules:
  - class: modules::api::RestApiModule
    config:
      port: 3111
      host: 127.0.0.1

  - class: modules::queue::QueueModule
    config:
      adapter:
        class: modules::queue::BuiltinQueueAdapter

  - class: modules::state::StateModule
    config:
      adapter:
        class: modules::state::adapters::KvStore
        config:
          store_method: file_based
          file_path: ./data/state_store.db
```

Each module is independently configured. You only need to include the modules your application uses.

---

## Critical Requirement: ES Modules

<Callout type="error">
**Your `package.json` must have `"type": "module"`**

The framework uses ES modules internally. Without this setting, you'll get import/export errors at runtime.
</Callout>

```json title="package.json"
{
  "name": "my-app",
  "type": "module",
  "scripts": {
    "dev": "motia dev",
    "start": "motia start",
    "build": "motia build"
  }
}
```

---

## Module Architecture

The `config.yaml` file contains a single top-level `modules` array. Each entry defines a module with its `class` and optional `config`:

```yaml
modules:
  - class: modules::module_name::ClassName
    config:
      key: value
```

### Available Modules

| Module | Class | Purpose |
|--------|-------|---------|
| **REST API** | `modules::api::RestApiModule` | HTTP endpoints, CORS, timeouts |
| **Queue** | `modules::queue::QueueModule` | Background job processing |
| **State** | `modules::state::StateModule` | Persistent key-value state |
| **Streams** | `modules::streams::StreamModule` | Real-time WebSocket streams |
| **PubSub** | `modules::pubsub::PubSubModule` | Publish/subscribe messaging |
| **Cron** | `modules::cron::CronModule` | Scheduled tasks |
| **Observability** | `modules::observability::OtelModule` | OpenTelemetry tracing and metrics |
| **Shell Exec** | `modules::shell::ExecModule` | File watching and command execution |

---

## Environment Variable Interpolation

All config values support environment variable interpolation with optional defaults:

```yaml
config:
  port: ${STREAMS_PORT:3112}
  host: ${HOST:127.0.0.1}
  redis_url: ${REDIS_URL:redis://localhost:6379}
```

The syntax is `${VARIABLE_NAME:default_value}`. If the environment variable is not set, the default value after `:` is used.

---

## Full Development Configuration

Here's a complete development configuration with all modules:

```yaml title="config.yaml"
modules:
  - class: modules::streams::StreamModule
    config:
      port: ${STREAMS_PORT:3112}
      host: 127.0.0.1
      adapter:
        class: modules::streams::adapters::KvStore
        config:
          store_method: file_based
          file_path: ./data/streams_store

  - class: modules::state::StateModule
    config:
      adapter:
        class: modules::state::adapters::KvStore
        config:
          store_method: file_based
          file_path: ./data/state_store.db

  - class: modules::api::RestApiModule
    config:
      port: 3111
      host: 127.0.0.1
      default_timeout: 30000
      concurrency_request_limit: 1024
      cors:
        allowed_origins:
          - http://localhost:3000
          - http://localhost:5173
        allowed_methods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS

  - class: modules::observability::OtelModule
    config:
      enabled: ${OTEL_ENABLED:true}
      service_name: ${OTEL_SERVICE_NAME:iii-engine}
      exporter: ${OTEL_EXPORTER_TYPE:memory}

  - class: modules::queue::QueueModule
    config:
      adapter:
        class: modules::queue::BuiltinQueueAdapter

  - class: modules::pubsub::PubSubModule
    config:
      adapter:
        class: modules::pubsub::LocalAdapter

  - class: modules::cron::CronModule
    config:
      adapter:
        class: modules::cron::KvCronAdapter

  - class: modules::shell::ExecModule
    config:
      watch:
        - steps/**/*.ts
        - motia.config.ts
      exec:
        - npx motia dev
```

---

## Module Reference

### REST API Module

Configures HTTP endpoints, CORS, timeouts, and concurrency.

```yaml
- class: modules::api::RestApiModule
  config:
    port: 3111
    host: 127.0.0.1
    default_timeout: 30000
    concurrency_request_limit: 1024
    cors:
      allowed_origins:
        - http://localhost:3000
      allowed_methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
```

| Option | Type | Description |
|--------|------|-------------|
| `port` | `number` | Server port (default: `3111`) |
| `host` | `string` | Server host (default: `127.0.0.1`) |
| `default_timeout` | `number` | Request timeout in ms (default: `30000`) |
| `concurrency_request_limit` | `number` | Max concurrent requests (default: `1024`) |
| `cors.allowed_origins` | `string[]` | Origins allowed for CORS |
| `cors.allowed_methods` | `string[]` | HTTP methods allowed for CORS |

### Queue Module

Handles background job processing. Uses a built-in adapter for development and Redis for production.

<Tabs items={['Development', 'Production']}>
<Tab value='Development'>

```yaml
- class: modules::queue::QueueModule
  config:
    adapter:
      class: modules::queue::BuiltinQueueAdapter
```

</Tab>
<Tab value='Production'>

```yaml
- class: modules::queue::QueueModule
  config:
    adapter:
      class: modules::queue::RedisAdapter
      config:
        redis_url: ${REDIS_URL:redis://localhost:6379}
```

</Tab>
</Tabs>

### State Module

Persistent key-value state storage. Uses file-based storage for development and Redis for production.

<Tabs items={['Development', 'Production']}>
<Tab value='Development'>

```yaml
- class: modules::state::StateModule
  config:
    adapter:
      class: modules::state::adapters::KvStore
      config:
        store_method: file_based
        file_path: ./data/state_store.db
```

</Tab>
<Tab value='Production'>

```yaml
- class: modules::state::StateModule
  config:
    adapter:
      class: modules::state::adapters::RedisAdapter
      config:
        redis_url: ${REDIS_URL:redis://localhost:6379}
```

</Tab>
</Tabs>

### Streams Module

Real-time WebSocket streams for live data. Supports authentication in production.

<Tabs items={['Development', 'Production']}>
<Tab value='Development'>

```yaml
- class: modules::streams::StreamModule
  config:
    port: ${STREAMS_PORT:3112}
    host: 127.0.0.1
    adapter:
      class: modules::streams::adapters::KvStore
      config:
        store_method: file_based
        file_path: ./data/streams_store
```

</Tab>
<Tab value='Production'>

```yaml
- class: modules::streams::StreamModule
  config:
    port: ${STREAMS_PORT:31112}
    host: 0.0.0.0
    auth_function: motia.streams.authenticate
    adapter:
      class: modules::streams::adapters::RedisAdapter
      config:
        redis_url: ${REDIS_URL:redis://localhost:6379}
```

</Tab>
</Tabs>

| Option | Type | Description |
|--------|------|-------------|
| `port` | `number` | WebSocket port (default: `3112`) |
| `host` | `string` | Bind host |
| `auth_function` | `string` | Function path for stream authentication |

### Observability Module

OpenTelemetry integration for tracing and metrics.

```yaml
- class: modules::observability::OtelModule
  config:
    enabled: ${OTEL_ENABLED:true}
    service_name: ${OTEL_SERVICE_NAME:iii-engine}
    exporter: ${OTEL_EXPORTER_TYPE:memory}
```

| Option | Type | Description |
|--------|------|-------------|
| `enabled` | `boolean` | Enable/disable tracing (default: `true`) |
| `service_name` | `string` | Service name in traces (default: `iii-engine`) |
| `exporter` | `string` | Exporter type (`memory`, `otlp`, etc.) |

### PubSub Module

Publish/subscribe messaging between Steps.

```yaml
- class: modules::pubsub::PubSubModule
  config:
    adapter:
      class: modules::pubsub::LocalAdapter
```

### Cron Module

Scheduled task execution.

```yaml
- class: modules::cron::CronModule
  config:
    adapter:
      class: modules::cron::KvCronAdapter
```

### Shell Exec Module

File watching and command execution for development.

```yaml
- class: modules::shell::ExecModule
  config:
    watch:
      - steps/**/*.ts
      - motia.config.ts
    exec:
      - npx motia dev
```

---

## Production Configuration

For production, swap file-based adapters for Redis:

```yaml title="config-production.yaml"
modules:
  - class: modules::streams::StreamModule
    config:
      port: ${STREAMS_PORT:31112}
      host: 0.0.0.0
      auth_function: motia.streams.authenticate
      adapter:
        class: modules::streams::adapters::RedisAdapter
        config:
          redis_url: ${REDIS_URL:redis://localhost:6379}

  - class: modules::state::StateModule
    config:
      adapter:
        class: modules::state::adapters::RedisAdapter
        config:
          redis_url: ${REDIS_URL:redis://localhost:6379}

  - class: modules::api::RestApiModule
    config:
      port: ${PORT:3111}
      host: 0.0.0.0
      default_timeout: 30000
      concurrency_request_limit: 1024

  - class: modules::queue::QueueModule
    config:
      adapter:
        class: modules::queue::RedisAdapter
        config:
          redis_url: ${REDIS_URL:redis://localhost:6379}

  - class: modules::observability::OtelModule
    config:
      enabled: true
      service_name: ${OTEL_SERVICE_NAME:my-app}
      exporter: otlp

  - class: modules::pubsub::PubSubModule
    config:
      adapter:
        class: modules::pubsub::RedisAdapter
        config:
          redis_url: ${REDIS_URL:redis://localhost:6379}

  - class: modules::cron::CronModule
    config:
      adapter:
        class: modules::cron::KvCronAdapter
```

Key differences from development:
- **Host**: `0.0.0.0` instead of `127.0.0.1` (accept external connections)
- **Adapters**: Redis instead of file-based KvStore
- **Stream auth**: `auth_function` enabled for secure WebSocket connections
- **Observability**: OTLP exporter instead of memory

---

## Raw Body Access

The raw request body is available as `req.rawBody` in API Steps. Useful for webhook signature verification:

<Tabs items={['TypeScript', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript title="steps/webhook.step.ts"
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'StripeWebhook',
  description: 'Handle Stripe webhook events',
  triggers: [
    { type: 'api', path: '/webhooks/stripe', method: 'POST' },
  ],
  flows: ['payments'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (req, { logger }) => {
  const signature = req.headers['stripe-signature']
  const rawBody = req.rawBody

  const isValid = verifyStripeSignature(rawBody, signature)

  if (!isValid) {
    return { status: 401, body: { error: 'Invalid signature' } }
  }

  return { status: 200, body: { received: true } }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript title="steps/webhook.step.js"
const config = {
  name: 'StripeWebhook',
  description: 'Handle Stripe webhook events',
  triggers: [
    { type: 'api', path: '/webhooks/stripe', method: 'POST' },
  ],
  flows: ['payments'],
}

const handler = async (req, { logger }) => {
  const signature = req.headers['stripe-signature']
  const rawBody = req.rawBody

  const isValid = verifyStripeSignature(rawBody, signature)

  if (!isValid) {
    return { status: 401, body: { error: 'Invalid signature' } }
  }

  return { status: 200, body: { received: true } }
}

module.exports = { config, handler }
```

</Tab>
</Tabs>

---

## What's Next?

<Cards>
  <Card href="/docs/development-guide/streams" title="Streams">
    Build real-time features
  </Card>

  <Card href="/docs/development-guide/state-management" title="State Management">
    Persistent storage across Steps
  </Card>
</Cards>
