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

- Create mock flow contexts for testing
- Simulate event emission and capture
- Mock loggers for testing
- Test event-driven workflows in isolation
- Utilities for testing state management

## Usage

### Creating a Tester

```typescript
import { createTester } from '@motiadev/test';

// Create a tester instance
const tester = createTester();

// Use the tester to test your workflows
const response = await tester.request()
  .post('/api/endpoint')
  .send({ data: 'test' });

// Assert on the response
expect(response.status).toBe(200);
```

### Capturing Events

```typescript
import { createTester } from '@motiadev/test';

const tester = createTester();

// Set up event capturing
const watcher = tester.watchEvents('event.topic');

// Trigger an action that emits events
await tester.request()
  .post('/api/trigger')
  .send({ action: 'test' });

// Get captured events
const events = watcher.getCapturedEvents();
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
expect(logger.messages.info).toContain('Test message');
```

## API Reference

### `createTester()`

Creates a tester instance for testing Motia workflows.

**Returns:**
- `MotiaTester`: A tester instance with methods for testing workflows.

### `createMockFlowContext()`

Creates a mock flow context for testing step handlers.

**Returns:**
- `MockFlowContext`: A mock context object with spied methods.

### `createMockLogger()`

Creates a mock logger for testing logging functionality.

**Returns:**
- `MockLogger`: A mock logger with methods for logging and tracking messages.

### `MotiaTester` Methods

- `request()`: Returns a supertest instance for making HTTP requests.
- `watchEvents(topic)`: Creates a watcher for capturing events on a specific topic.
- `close()`: Closes the tester and cleans up resources.

### `Watcher` Methods

- `getCapturedEvents()`: Returns an array of captured events.

## Example: Testing a Complete Flow

```typescript
import { createTester } from '@motiadev/test';
import { expect, test } from 'vitest';

test('complete order flow works correctly', async () => {
  const tester = createTester();
  
  // Watch for order completion events
  const orderCompletedWatcher = tester.watchEvents('order.completed');
  
  // Trigger the order creation
  const response = await tester.request()
    .post('/api/orders')
    .send({
      items: [{ id: 'item1', quantity: 2 }],
      customer: { id: 'cust1', email: 'test@example.com' }
    });
  
  // Verify the API response
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('orderId');
  
  // Wait for all events to be processed
  await tester.waitForEvents();
  
  // Verify the order completed event was emitted
  const completedEvents = orderCompletedWatcher.getCapturedEvents();
  expect(completedEvents).toHaveLength(1);
  expect(completedEvents[0].data).toMatchObject({
    orderId: expect.any(String),
    status: 'completed'
  });
  
  // Clean up
  await tester.close();
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This package is part of the Motia framework and is licensed under the same terms.
