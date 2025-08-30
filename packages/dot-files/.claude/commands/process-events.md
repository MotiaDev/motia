# Process Events Command

Handle asynchronous event processing in Motia.

## Basic Event Handler

```typescript
// steps/events/process-[entity].step.ts
import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'Process[Entity]',
  subscribes: ['[entity].created'],
  emits: ['[entity].processed', '[next].step'],
  input: z.object({
    // Define input schema
  })
}

export const handler: Handlers['Process[Entity]'] = async (input, { emit, logger, state }) => {
  try {
    // Process the event
    await emit({
      topic: '[entity].processed',
      data: { /* results */ }
    })
  } catch (error) {
    logger.error('Processing failed', { error })
    throw error
  }
}
```

## Event Patterns

### Chain Processing
```typescript
// Step 1 → Step 2 → Step 3
subscribes: ['order.created']
emits: ['inventory.check']

subscribes: ['inventory.checked']
emits: ['payment.process']

subscribes: ['payment.processed']
emits: ['order.completed']
```

### Fan-Out
```typescript
// One event → Multiple handlers
subscribes: ['user.registered']
emits: [
  'email.welcome',
  'profile.create',
  'analytics.track',
  'admin.notify'
]
```

### Aggregation
```typescript
// Collect multiple events
const aggregation = await state.get('aggregations', orderId) || {}
aggregation[itemId] = status

if (allItemsProcessed(aggregation)) {
  await emit({ topic: 'order.ready' })
}
```

### Retry Pattern
```typescript
const retries = await state.get('retries', taskId) || 0
if (retries < MAX_RETRIES) {
  await state.set('retries', taskId, retries + 1)
  setTimeout(() => emit({ topic: 'task.retry', data: input }), backoffTime)
}
```

## Best Practices

1. **Idempotency**: Ensure handlers can be safely retried
2. **Error Handling**: Log errors with context
3. **State Management**: Use TTL for temporary data
4. **Event Naming**: Use dot notation (entity.action)
5. **Testing**: Mock external dependencies