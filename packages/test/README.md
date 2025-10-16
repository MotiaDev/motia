# @motiadev/test

A testing utility package for Motia workflows that provides tools for mocking, testing, and simulating Motia components.

## Installation

```bash
npm install @motiadev/test --save-dev
# or
yarn add @motiadev/test --dev
# or
pnpm add @motiadev/test --save-dev
```

## Features

* Create mock flow contexts for testing steps and workflows
* Simulate event emission and capture events
* Mock loggers for testing
* Test event-driven workflows in isolation
* Utilities for testing state management

## Usage

### Creating a Tester

```typescript
import { createMotiaTester } from '@motiadev/test';

// Create a tester instance
const tester = createMotiaTester();

// Use the tester to test your workflows
const response = await tester.post('/api/endpoint', { body: { data: 'test' } });

// Assert on the response
expect(response.status).toBe(200);
```

### Capturing Events

```typescript
import { createMotiaTester } from '@motiadev/test';

const tester = createMotiaTester();

// Set up event capturing
const watcher = tester.watch('event.topic');

// Trigger an action that emits events
await tester.post('/api/trigger', { body: { action: 'test' } });

// Get captured events
const events = await watcher;
expect(events).toHaveLength(1);
expect(events[0].data).toEqual({ result: 'success' });
```

### Mocking Flow Context

```typescript
import { createMockFlowContext } from '@motiadev/test';

// Create a mock context for testing a step handler
const mockContext = createMockFlowContext();

// Call your step handler with the mock context
await myStepHandler(inputData, mockContext);

// Assert on emitted events
expect(mockContext.emit).toHaveBeenCalledWith({
  topic: 'expected.topic',
  data: expect.any(Object)
});
```

### Using Mock Logger

```typescript
import { createMockLogger } from '@motiadev/test';

// Create a mock logger
const logger = createMockLogger();

// Use the logger in your tests
logger.info('Test message');

// Assert on logged messages
expect(logger.info).toHaveBeenCalledWith('Test message');
```

## API Reference

### `createMotiaTester()`

Creates a tester instance for testing Motia workflows.

**Returns:**

* `MotiaTester`: Tester instance with methods for posting requests, watching events, and closing the tester.

### `createMockFlowContext()`

Creates a mock flow context for testing step handlers.

**Returns:**

* `MockFlowContext`: Mocked context with spied methods like `emit` and `logger`.

### `createMockLogger()`

Creates a mock logger for testing logging functionality.

**Returns:**

* `MockLogger`: Mock logger with all standard logging methods mocked.

### `MotiaTester` Methods

* `post(path, options)` → Send POST requests to your endpoint.
* `get(path, options)` → Send GET requests.
* `watch(event)` → Capture events emitted on a topic.
* `waitEvents()` → Wait for all events to be processed.
* `emit(event)` → Emit an event.
* `close()` → Clean up resources after testing.

### `Watcher` Methods

* Returns a Promise of captured events.
* `getCapturedEvents()` → Get an array of captured events.

## Example: Testing a Complete Flow

```typescript
import { createMotiaTester } from '@motiadev/test';
import { expect, test } from 'vitest';

test('complete order flow works correctly', async () => {
  const tester = createMotiaTester();
  
  // Watch for order completion events
const orderCompletedWatcher = tester.watch('order.completed');

  
  // Trigger the order creation
const response = await tester.post('/api/orders', {
    body: {
      items: [{ id: 'item1', quantity: 2 }],
      customer: { id: 'cust1', email: 'test@example.com' }
    }
  });
  
  // Verify the API response
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('orderId');
  
  // Wait for all events to be processed
  await tester.waitEvents();
  
  // Verify the order completed event was emitted
  const completedEvents = await orderCompletedWatcher;
  expect(completedEvents).toHaveLength(1);
  expect(completedEvents[0].data).toMatchObject({ orderId: expect.any(String), status: 'completed' });

  // Clean up
await tester.close();
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This package is part of the Motia framework and is licensed under the same terms.
