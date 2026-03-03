# III SDK for Node.js

## Installation

```bash
npm install iii-sdk
```

## Usage

```javascript
import { III } from 'iii-sdk'

/**
 * Make sure the III Core Instance is up and Running on the given URL.
 */
const iii = new III(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

iii.registerFunction({ id: 'myFunction' }, (req) => {
  return { status_code: 200, body: { message: 'Hello, world!' } }
})

iii.registerTrigger({
  type: 'http',
  function_id: 'myFunction',
  config: { api_path: 'myApiPath', http_method: 'POST' },
})
```

### Registering Functions

III Allows you to register functions that can be invoked by other services.

```javascript
iii.registerFunction({ id: 'myFunction' }, (req) => {
  // ... do something
  return { status_code: 200, body: { message: 'Hello, world!' } }
})
```

### Registering Triggers

III Allows you to register triggers that can be invoked by other services.

```javascript
iii.registerTrigger({
  type: 'http',
  function_id: 'myFunction',
  config: { api_path: 'myApiPath', http_method: 'POST' },
})
```

### Registering Trigger Types

Triggers are mostly created by III Core Modules, but you can also create your own triggers

```javascript
iii.registerTrigger_type(
  {
    /**
     * This is the id of the trigger type, it's unique.
     * Then, you can register a trigger by calling the registerTrigger method.
     */
    id: 'myTrigger_type',
    description: 'My trigger type',
  },
  {
    /**
     * Trigger config has: id, function_id, and config.
     * Your logic should know what to do with the config.
     */
    registerTrigger: async (config) => {
      // ... do something
    },
    unregisterTrigger: async (config) => {
      // ... do something
    },
  },
)
```

### Invoking Functions

III Allows you to invoke functions, they can be functions from the Core Modules or
functions registered by workers.

```javascript
const result = await iii.call('myFunction', { param1: 'value1' })
console.log(result)
```

### Invoking Functions Async

III Allows you to invoke functions asynchronously, they can be functions from the Core Modules or functions registered by workers.

```javascript
iii.callVoid('myFunction', { param1: 'value1' })
```

This means the Engine won't hold the execution of the function, it will return immediately. Which means the function will be executed in the background.
