# Multi-Trigger Example

This example demonstrates how to use **multiple triggers** and **multiple trigger types** in Motia steps. Each step showcases different combinations of trigger types working together.

## Trigger Types in Motia

Motia supports four trigger types:

1. **API Trigger** - Triggered by HTTP requests
2. **Event Trigger** - Triggered by emitted events/topics
3. **Cron Trigger** - Triggered by scheduled time (cron expression)
4. **State Trigger** - Triggered by state changes with optional conditions

## Examples in This Folder

### 1. `comprehensive-analytics.step.ts`
**All Four Trigger Types Together**

Demonstrates a single step that can be triggered in four different ways:
- ✅ API: Manual analytics run via `POST /analytics/run`
- ✅ Event: Triggered by `user.activity` events
- ✅ Cron: Scheduled runs every 4 hours
- ✅ State: Triggered when `analytics.config` changes

**Use Case**: A flexible analytics engine that can run on-demand, automatically, or in response to system changes.

### 2. `data-processor.step.ts`
**Multiple Event Triggers**

Shows how to listen to multiple event topics:
- ✅ Event: `data.uploaded`
- ✅ Event: `data.updated`
- ✅ Event: `data.validated`

**Use Case**: A unified data processor that handles data from multiple sources.

### 3. `notification-sender.step.ts`
**API + Multiple Events + State Trigger**

Demonstrates notification delivery via multiple mechanisms:
- ✅ API: Manual notification send
- ✅ Event: `user.registered` (welcome notification)
- ✅ Event: `order.completed` (order confirmation)
- ✅ State: Triggered when `notifications.queue` has items

**Use Case**: A notification system that handles both automated and manual notifications.

### 4. `cache-manager.step.ts`
**Cron + Multiple APIs + State Trigger**

Shows cache management with automatic and manual controls:
- ✅ Cron: Scheduled cleanup every 2 hours
- ✅ API: `POST /cache/clear` (manual clear)
- ✅ API: `POST /cache/optimize` (manual optimize)
- ✅ State: Triggered when `cache.size` exceeds threshold

**Use Case**: Smart cache management with automatic maintenance and manual overrides.

### 5. `health-monitor.step.ts`
**Multiple State Triggers + API**

Monitors multiple system metrics simultaneously:
- ✅ State: `system.memory.usage` (> 80%)
- ✅ State: `system.cpu.usage` (> 75%)
- ✅ State: `system.errors.rate` (> 10/min)
- ✅ State: `system.connections.active` (> 1000)
- ✅ API: `GET /health/check` (manual check)

**Use Case**: Comprehensive system health monitoring with automatic alerts.

## How to Test

### Test Comprehensive Analytics

```bash
# 1. Manual API trigger
curl -X POST http://localhost:3000/analytics/run \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "forceRecalculation": true
  }'

# 2. Event trigger (via another step)
# Emit a 'user.activity' event

# 3. Cron trigger will run automatically every 4 hours

# 4. State trigger
# Update analytics.config state to trigger calculation
```

### Test Data Processor

```bash
# Emit different event types to trigger the processor
# - data.uploaded
# - data.updated
# - data.validated
```

### Test Notification Sender

```bash
# 1. API trigger
curl -X POST http://localhost:3000/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "Test notification",
    "type": "email",
    "priority": "high"
  }'

# 2. Event triggers will fire when:
#    - User registers (user.registered event)
#    - Order completes (order.completed event)

# 3. State trigger fires when items are added to notifications.queue
```

### Test Cache Manager

```bash
# 1. Manual clear
curl -X POST http://localhost:3000/cache/clear \
  -H "Content-Type: application/json" \
  -d '{ "force": true }'

# 2. Manual optimize
curl -X POST http://localhost:3000/cache/optimize \
  -H "Content-Type: application/json" \
  -d '{ "operation": "optimize" }'

# 3. Cron trigger runs every 2 hours automatically

# 4. State trigger fires when cache.size > 1000
```

### Test Health Monitor

```bash
# 1. Manual health check
curl http://localhost:3000/health/check

# 2. State triggers fire automatically when:
#    - Memory usage > 80%
#    - CPU usage > 75%
#    - Error rate > 10/min
#    - Active connections > 1000

# To trigger state monitors, set values:
# - state.set('system', 'memory.usage', 85)
# - state.set('system', 'cpu.usage', 80)
```

## Key Patterns

### 1. Multiple Triggers of Same Type
```typescript
triggers: [
  { type: 'event', topic: 'event.one' },
  { type: 'event', topic: 'event.two' },
  { type: 'event', topic: 'event.three' },
]
```

### 2. Multiple Triggers of Different Types
```typescript
triggers: [
  { type: 'api', path: '/endpoint', method: 'POST' },
  { type: 'event', topic: 'my.event' },
  { type: 'cron', cron: '0 */4 * * *' },
  { type: 'state', key: 'my.key', condition: (v) => v > 100 },
]
```

### 3. State Triggers with Conditions
```typescript
triggers: [
  {
    type: 'state',
    key: 'user.score',
    condition: (value: unknown) => {
      return typeof value === 'number' && value > 1000
    }
  }
]
```

## Benefits of Multi-Trigger Steps

1. **Flexibility** - Same logic can be invoked in multiple ways
2. **Automation** - Combine manual and automatic triggers
3. **Responsiveness** - React to state changes, events, and schedules
4. **Maintainability** - One handler for multiple trigger sources
5. **Unified Logic** - No code duplication across trigger types

## Best Practices

1. **Log the trigger source** - Include information about which trigger fired
2. **Handle all trigger types** - Ensure handler works regardless of trigger
3. **Use appropriate triggers** - Choose triggers that match your use case
4. **Set conditions wisely** - State trigger conditions should be specific
5. **Consider performance** - Be careful with state triggers on frequently changing keys
6. **Test all triggers** - Verify each trigger type works independently

## Flow Assignment

All examples use the `multi-trigger-demo` flow for visualization in the Motia workbench.
