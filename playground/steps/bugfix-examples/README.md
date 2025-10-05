# Bug: Zod Default Values Not Applied to req.body

## Issue Description

When using Zod schemas with `.default()` values in `bodySchema`, those defaults are **not applied** to `req.body` when fields are omitted from the request.

### Expected Behavior

```typescript
bodySchema: z.object({
  message: z.string(),
  priority: z.string().default('normal'),
  retryCount: z.number().default(3),
})
```

When a request is sent with only `{ "message": "test" }`, we expect:
- `req.body.priority` → `"normal"` 
- `req.body.retryCount` → `3`

### Actual Behavior

Instead, we receive:
- `req.body.priority` → `undefined`
- `req.body.retryCount` → `undefined`

## Root Cause

The Zod schema validation in Motia's bodySchema doesn't parse/transform the request body with defaults. It only validates the structure.

## Workaround

Use explicit JavaScript default parameters in destructuring:

```typescript
export const handler: Handlers['MyStep'] = async (req, { logger }) => {
  // WORKAROUND: Apply defaults in JavaScript
  const { 
    message, 
    priority = 'normal',    // JS default
    retryCount = 3,         // JS default
    enabled = true          // JS default
  } = req.body

  // Now priority, retryCount, and enabled will have values even when omitted
}
```

## Test Steps

1. **Bug Demonstration**: `POST /api/zod-defaults-bug`
   ```bash
   curl -X POST http://localhost:3000/api/zod-defaults-bug \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   ```
   Response shows `bugPresent: true` and undefined values

2. **Fixed Version**: `POST /api/zod-defaults-fixed`
   ```bash
   curl -X POST http://localhost:3000/api/zod-defaults-fixed \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   ```
   Response shows `defaultsApplied: true` with correct default values

## Affected Areas

This bug affects any API step that:
- Uses `bodySchema` with `.default()` values
- Expects those defaults to be available in `req.body`
- Doesn't manually apply defaults in the handler

## Recommendation

Until this bug is fixed in the framework:
1. Always use JavaScript default parameters in destructuring
2. Document this pattern in handler code
3. Consider framework-level fix to apply Zod defaults during parsing

## Example Files

- `zod-defaults-bug.step.ts` - Demonstrates the bug
- `zod-defaults-fixed.step.ts` - Shows the workaround
