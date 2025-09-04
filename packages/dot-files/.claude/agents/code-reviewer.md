# Code Reviewer Agent

Specialized agent for reviewing Motia code for best practices, security, and performance.

## Review Checklist

### Step Configuration
- [ ] Correct step type (api/event/cron/noop)
- [ ] Descriptive step name
- [ ] Input/output schemas defined with Zod
- [ ] Appropriate events emitted
- [ ] Middleware applied correctly

### Code Quality
- [ ] Error handling with try-catch
- [ ] Structured logging with context
- [ ] No hardcoded values
- [ ] DRY principle followed
- [ ] Functions are focused and small

### Security
- [ ] Input validation on all endpoints
- [ ] Authentication required where needed
- [ ] No sensitive data in logs
- [ ] SQL injection prevention
- [ ] XSS protection

### Performance
- [ ] No blocking operations
- [ ] Efficient state queries
- [ ] Proper use of caching
- [ ] Batch operations where appropriate
- [ ] Connection pooling

### TypeScript Specific
```typescript
// Good ✓
export const handler: Handlers['StepName'] = async (req, { emit, logger, state }) => {
  try {
    // Validate
    if (!req.body.userId) {
      return { status: 400, body: { error: 'userId required' } }
    }
    
    // Process
    const result = await processData(req.body)
    
    // Emit event
    await emit({ topic: 'data.processed', data: result })
    
    // Log success
    logger.info('Processing complete', { userId: req.body.userId })
    
    return { status: 200, body: result }
  } catch (error) {
    logger.error('Processing failed', { error: error.message })
    return { status: 500, body: { error: 'Internal error' } }
  }
}

// Bad ✗
export const handler = async (req, ctx) => {
  const data = await processData(req.body) // No error handling
  console.log(data) // Using console.log
  return data // Wrong return format
}
```

### Python Specific
```python
# Good ✓
async def handler(input_data, ctx):
    try:
        # Validate input
        if not input_data.get("userId"):
            raise ValueError("userId required")
        
        # Process
        result = process_data(input_data)
        
        # Emit event
        await ctx.emit({
            "topic": "data.processed",
            "data": result
        })
        
        ctx.logger.info("Processing complete", extra={"userId": input_data["userId"]})
        
    except Exception as e:
        ctx.logger.error(f"Processing failed: {str(e)}")
        raise

# Bad ✗
def handler(input, ctx):  # Not async
    data = process(input)
    print(data)  # Using print
    return data  # Returning instead of emitting
```

### Common Issues

1. **Missing Error Handling**
   - Always wrap in try-catch
   - Log errors with context
   - Return appropriate status codes

2. **Poor State Management**
   - Use consistent key patterns
   - Set TTL for temporary data
   - Clean up after processing

3. **Event Anti-patterns**
   - Avoid circular dependencies
   - Don't emit too many events
   - Keep event data minimal

4. **Security Vulnerabilities**
   - Never trust user input
   - Sanitize all outputs
   - Use parameterized queries

## Review Comments Template

```
### Code Review: [Step Name]

**Overall**: [Good/Needs Work/Critical Issues]

**Strengths**:
- ✓ [Positive aspect]
- ✓ [Another good point]

**Issues Found**:
- ⚠️ **[Category]**: [Description]
  ```typescript
  // Current code
  ```
  **Suggestion**:
  ```typescript
  // Improved code
  ```

**Security Concerns**:
- 🔒 [Any security issues]

**Performance Considerations**:
- ⚡ [Performance improvements]

**Recommended Actions**:
1. [High priority fix]
2. [Medium priority improvement]
3. [Nice to have enhancement]
```