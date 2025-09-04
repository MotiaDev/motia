# Debugger Agent

Specialized agent for debugging Motia applications and troubleshooting issues.

## Common Issues & Solutions

### Step Not Loading

**Symptoms**: Step file exists but not being recognized

**Debug Steps**:
1. Check file naming: Must end with `.step.ts`, `.step.js`, `_step.py`, or `.step.rb`
2. Verify export structure:
```typescript
// ✓ Correct
export const config: ApiRouteConfig = { ... }
export const handler: Handlers['StepName'] = async (...) => { ... }

// ✗ Wrong
module.exports = { config, handler }  // Use ES6 exports
```

3. Check for syntax errors:
```bash
# TypeScript
npx tsc --noEmit steps/my-step.step.ts

# Python
python -m py_compile steps/my_step.py
```

### Event Not Firing

**Symptoms**: Emitted events not being received by subscribers

**Debug Steps**:
1. Add logging to verify emission:
```typescript
console.log('Emitting event:', { topic: 'user.created', data })
await emit({ topic: 'user.created', data })
console.log('Event emitted successfully')
```

2. Check subscriber configuration:
```typescript
// Ensure topic names match exactly
subscribes: ['user.created']  // Must match emit topic
```

3. Verify event handler is loaded:
```bash
# Check logs for "Step loaded" messages
grep "Step loaded" logs/motia.log
```

### State Not Persisting

**Symptoms**: Data not found after setting in state

**Debug Steps**:
1. Check Redis connection:
```typescript
// Add health check
try {
  await state.set('test', 'key', 'value')
  const val = await state.get('test', 'key')
  console.log('Redis working:', val === 'value')
} catch (error) {
  console.error('Redis error:', error)
}
```

2. Verify key format:
```typescript
// Good: Consistent key structure
await state.set('users', userId, userData)
await state.get('users', userId)

// Bad: Inconsistent keys
await state.set(userId, userData)  // Missing namespace
```

### Memory Leaks

**Symptoms**: Increasing memory usage over time

**Debug Tools**:
```typescript
// Add memory monitoring
setInterval(() => {
  const usage = process.memoryUsage()
  console.log('Memory:', {
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heap: Math.round(usage.heapUsed / 1024 / 1024) + ' MB'
  })
}, 60000)
```

**Common Causes**:
- Unclosed streams
- Event listener accumulation
- Large objects in closure scope
- Missing cleanup in long-running handlers

### Performance Issues

**Debug Approach**:

1. Add timing logs:
```typescript
const start = Date.now()
// ... operation ...
logger.info('Operation completed', { duration: Date.now() - start })
```

2. Profile slow queries:
```typescript
// Log slow state operations
const profiledState = new Proxy(state, {
  get(target, prop) {
    return async (...args) => {
      const start = Date.now()
      const result = await target[prop](...args)
      const duration = Date.now() - start
      if (duration > 100) {
        logger.warn('Slow state operation', { op: prop, duration, args })
      }
      return result
    }
  }
})
```

3. Check for N+1 queries:
```typescript
// Bad: N+1 queries
for (const id of userIds) {
  const user = await state.get('users', id)
  // Process user
}

// Good: Batch fetch
const users = await state.getMany('users', userIds)
```

## Debug Configuration

### Enable Verbose Logging

```yaml
# config/development.yml
logging:
  level: debug
  includeStack: true
  prettyPrint: true
```

### Debug Environment Variables

```bash
# .env.development
DEBUG=motia:*
LOG_LEVEL=debug
VERBOSE_ERRORS=true
TRACE_EVENTS=true
```

### Debugging Python Steps

```python
# Add debug helpers
import pdb

async def handler(input_data, ctx):
    # Set breakpoint
    # pdb.set_trace()
    
    # Debug logging
    ctx.logger.debug("Input received", extra={"data": input_data})
    
    try:
        result = process_data(input_data)
        ctx.logger.debug("Processing result", extra={"result": result})
    except Exception as e:
        ctx.logger.error("Processing failed", exc_info=True)
        raise
```

### Debugging Ruby Steps

```ruby
require 'pry' # Add to Gemfile first

def handler(input, context)
  # Add breakpoint
  # binding.pry
  
  context.logger.debug("Input: #{input.inspect}")
  
  begin
    result = process(input)
  rescue => e
    context.logger.error("Error: #{e.message}")
    context.logger.error(e.backtrace.join("\n"))
    raise
  end
end
```

## Workbench Debugging

The Motia Workbench provides visual debugging:

1. **Real-time Logs**: Stream logs from all steps
2. **Event Flow**: Visualize event propagation
3. **State Inspector**: Browse current state values
4. **Performance Metrics**: See slow operations

Access at: http://localhost:5173

## Emergency Debugging

When things go really wrong:

1. **Check Process**:
```bash
ps aux | grep node
lsof -i :3000  # Check if port is in use
```

2. **Clear State**:
```bash
redis-cli FLUSHDB  # Warning: Clears all data
```

3. **Reset Dependencies**:
```bash
rm -rf node_modules package-lock.json
npm install
```

4. **Enable Core Dumps**:
```bash
ulimit -c unlimited
node --abort-on-uncaught-exception index.js
```

## Debug Checklist

- [ ] Check logs for errors
- [ ] Verify file names and exports
- [ ] Test in isolation
- [ ] Check event topic names
- [ ] Verify state keys
- [ ] Monitor memory usage
- [ ] Profile slow operations
- [ ] Use workbench visualizer
- [ ] Add debug logging
- [ ] Test with minimal setup