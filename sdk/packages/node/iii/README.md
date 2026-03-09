# iii-sdk

Node.js / TypeScript SDK for the [iii engine](https://github.com/iii-hq/iii).

[![npm](https://img.shields.io/npm/v/iii-sdk)](https://www.npmjs.com/package/iii-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../../LICENSE)

## Install

```bash
npm install iii-sdk
```

## Hello World

```javascript
import { init } from 'iii-sdk'

const iii = init('ws://localhost:49134')

iii.registerFunction({ id: 'greet' }, async (input) => {
  return { message: `Hello, ${input.name}!` }
})

iii.registerTrigger({
  type: 'http',
  function_id: 'greet',
  config: { api_path: '/greet', http_method: 'POST' },
})

const result = await iii.trigger('greet', { name: 'world' })
```

## API

| Operation                | Signature                                            | Description                                                  |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| Initialize               | `init(url, options?)`                                | Create and connect to the engine. Returns an `ISdk` instance |
| Register function        | `iii.registerFunction({ id }, handler)`              | Register a function that can be invoked by name              |
| Register trigger         | `iii.registerTrigger({ type, function_id, config })` | Bind a trigger (HTTP, cron, queue, etc.) to a function       |
| Invoke (await)           | `await iii.trigger(id, data, timeoutMs?)`            | Invoke a function and wait for the result                    |
| Invoke (fire-and-forget) | `iii.triggerVoid(id, data)`                          | Invoke a function without waiting (fire-and-forget)          |

### Registering Functions

```javascript
iii.registerFunction({ id: 'orders.create' }, async (input) => {
  return { status_code: 201, body: { id: '123', item: input.body.item } }
})
```

### Registering Triggers

```javascript
iii.registerTrigger({
  type: 'http',
  function_id: 'orders.create',
  config: { api_path: '/orders', http_method: 'POST' },
})
```

### Invoking Functions

```javascript
const result = await iii.trigger('orders.create', { item: 'widget' })

iii.triggerVoid('analytics.track', { event: 'page_view' })
```

## Node Modules

| Import              | What it provides                      |
| ------------------- | ------------------------------------- |
| `iii-sdk`           | Core SDK (`init`, types)              |
| `iii-sdk/stream`    | Stream client for real-time state     |
| `iii-sdk/state`     | State client for key-value operations |
| `iii-sdk/telemetry` | OpenTelemetry integration             |

## Deprecated

`call()` and `callVoid()` are deprecated aliases for `trigger()` and `triggerVoid()`. They still work but will be removed in a future release.

## Resources

- [Documentation](https://iii.dev/docs)
- [iii Engine](https://github.com/iii-hq/iii)
- [Examples](https://github.com/iii-hq/iii-examples)
