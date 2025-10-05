# Multi-Trigger Type Fix - Implementation Guide

## Problem
Steps with multiple trigger types (API + Event + Cron + State) have emit type conflicts causing `never` types in the generated handlers, requiring `@ts-expect-error` suppressions.

## Root Cause
In `packages/core/src/types/generate-types.ts` (lines 99-116), type generation uses `if/else if` logic that only selects ONE handler type based on the first trigger found.

## Recommended Solution: Create MultiTriggerHandler Type

### Step 1: Add MultiTriggerHandler type definition

**File:** `packages/core/src/types.ts`

Add after the existing handler types (around line 240):

```typescript
/**
 * Handler type for steps with multiple trigger types.
 * Accepts input from any trigger type and can emit events.
 */
export type MultiTriggerHandler<TInput = any, TEmits = any> = (
  input: TInput | ApiRequest<TInput>,
  context: FlowContext<TEmits>
) => Promise<void | ApiResponse<any, any>>
```

### Step 2: Export the new type

**File:** `packages/core/index.ts`

Add to the exports:

```typescript
export type {
  // ... existing exports ...
  MultiTriggerHandler,
} from './types'
```

### Step 3: Update type generation logic

**File:** `packages/core/src/types/generate-types.ts`

Replace lines 99-117 with:

```typescript
for (const step of steps) {
  const emits = step.config.emits ? generateEmitData(step.config.emits, step) : 'never'

  // Check if step has multiple trigger types
  const triggerTypes = new Set(step.config.triggers.map(t => t.type))
  const hasMultipleTriggerTypes = triggerTypes.size > 1

  if (hasMultipleTriggerTypes) {
    // Multi-trigger step: use flexible MultiTriggerHandler
    const input = step.config.input || step.config.bodySchema
      ? generateTypeFromSchema((step.config.input || step.config.bodySchema) as never as JsonSchema)
      : 'any'
    
    handlers[step.config.name] = { 
      type: 'MultiTriggerHandler', 
      generics: [input, emits] 
    }
  } else if (hasEventTrigger(step)) {
    // Single event trigger
    const input = step.config.input 
      ? generateTypeFromSchema(step.config.input as never as JsonSchema) 
      : 'never'
    handlers[step.config.name] = { 
      type: 'EventHandler', 
      generics: [input, emits] 
    }
  } else if (hasApiTrigger(step)) {
    // Single API trigger
    const input = step.config.bodySchema
      ? generateTypeFromSchema(step.config.bodySchema as never as JsonSchema)
      : 'Record<string, unknown>'
    const result = step.config.responseSchema
      ? generateTypesFromResponse(step.config.responseSchema as never as Record<number, JsonSchema>)
      : 'unknown'
    handlers[step.config.name] = { 
      type: 'ApiRouteHandler', 
      generics: [input, result, emits] 
    }
  } else if (hasCronTrigger(step)) {
    // Single cron trigger
    handlers[step.config.name] = { 
      type: 'CronHandler', 
      generics: [emits] 
    }
  }
  // Note: Steps with no triggers (noop/dev steps) don't generate handlers
}
```

### Step 4: Update type import in generated types

**File:** `packages/core/src/types/generate-types.ts`

Update line 20 to include MultiTriggerHandler:

```typescript
import { EventHandler, ApiRouteHandler, ApiResponse, MotiaStream, CronHandler, MultiTriggerHandler } from 'motia'
```

### Step 5: Test the changes

After implementing:

1. Regenerate types: `pnpm dev` in playground
2. Check `playground/types.d.ts` for:
   ```typescript
   'ComprehensiveAnalytics': MultiTriggerHandler<
     { userId?: string; activityType?: string; ... },
     | { topic: 'analytics.completed'; data: {...} }
     | { topic: 'analytics.alert'; data: {...} }
   >
   ```
3. Remove all `@ts-expect-error` comments
4. Verify no TypeScript errors

## Benefits

✅ **Type Safety** - Proper typing for emit calls
✅ **Clarity** - Explicit multi-trigger handler type
✅ **Flexibility** - Works with any combination of triggers
✅ **Future-proof** - Can extend for multi-trigger-specific features
✅ **Developer Experience** - Clear intent in generated types

## Alternative Approaches (Not Recommended)

### Alt 1: Use EventHandler with `any`
- ❌ Loses type safety
- ❌ Semantically incorrect for API triggers
- ❌ Confusing for developers

### Alt 2: Generate union of all handler types
- ❌ Complex type inference
- ❌ Difficult to use in practice
- ❌ Poor IDE support

### Alt 3: Force single handler type per step
- ❌ Defeats the purpose of multi-trigger
- ❌ Requires multiple steps for same logic
- ❌ Code duplication

## Migration Guide

Once implemented, update all multi-trigger example steps:

1. Remove `@ts-expect-error` comments (5 files)
2. Handlers will automatically use MultiTriggerHandler
3. Update documentation to reference MultiTriggerHandler

## Files to Modify

1. `packages/core/src/types.ts` - Add MultiTriggerHandler type
2. `packages/core/index.ts` - Export MultiTriggerHandler
3. `packages/core/src/types/generate-types.ts` - Update type generation logic
4. `playground/steps/multi-trigger-example/*.step.ts` - Remove @ts-expect-error

## Estimated Effort

- Implementation: ~1 hour
- Testing: ~30 minutes
- Documentation: ~30 minutes
- **Total: ~2 hours**

## Status

- [ ] Step 1: Add MultiTriggerHandler type
- [ ] Step 2: Export type
- [ ] Step 3: Update generation logic
- [ ] Step 4: Update imports
- [ ] Step 5: Test and verify
- [ ] Step 6: Remove @ts-expect-error comments
- [ ] Step 7: Update documentation
