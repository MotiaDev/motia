# Test Runner Agent

Specialized agent for creating and running tests for Motia applications.

## Test Structure

### Unit Tests (Jest)

```typescript
// tests/api/create-user.test.ts
import { handler } from '../../steps/api/users/create-user.step'
import { createMockContext } from '@motiadev/test'

describe('CreateUser API', () => {
  let ctx: any
  
  beforeEach(() => {
    ctx = createMockContext()
  })
  
  it('should create user successfully', async () => {
    const req = {
      body: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'secure123'
      }
    }
    
    const response = await handler(req, ctx)
    
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
    expect(ctx.emit).toHaveBeenCalledWith({
      topic: 'user.created',
      data: expect.objectContaining({ email: 'test@example.com' })
    })
  })
  
  it('should reject duplicate email', async () => {
    // Set up existing user
    ctx.state.get.mockResolvedValue({ id: 'existing' })
    
    const req = {
      body: {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'secure123'
      }
    }
    
    const response = await handler(req, ctx)
    
    expect(response.status).toBe(409)
    expect(response.body.error).toContain('already exists')
  })
})
```

### Event Handler Tests

```typescript
// tests/events/process-order.test.ts
describe('ProcessOrder Event', () => {
  it('should process valid order', async () => {
    const input = {
      orderId: 'order-123',
      items: [{ id: 'item-1', quantity: 2 }]
    }
    
    await handler(input, ctx)
    
    expect(ctx.state.set).toHaveBeenCalledWith(
      'orders',
      'order-123',
      expect.objectContaining({ status: 'processing' })
    )
    
    expect(ctx.emit).toHaveBeenCalledTimes(2)
    expect(ctx.emit).toHaveBeenCalledWith({
      topic: 'inventory.check',
      data: expect.any(Object)
    })
  })
})
```

### Python Tests (pytest)

```python
# tests/test_analyze_text.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from steps.ml.analyze_text_step import handler

@pytest.mark.asyncio
async def test_analyze_text_success():
    # Arrange
    input_data = {
        "analysisId": "test-123",
        "text": "This is a test sentence for analysis."
    }
    
    ctx = MagicMock()
    ctx.emit = AsyncMock()
    ctx.state.set = AsyncMock()
    ctx.logger = MagicMock()
    
    # Act
    await handler(input_data, ctx)
    
    # Assert
    ctx.emit.assert_called_once()
    emitted = ctx.emit.call_args[0][0]
    assert emitted["topic"] == "text.analyze.completed"
    assert "analysisId" in emitted["data"]
    assert "entities" in emitted["data"]["result"]

@pytest.mark.asyncio
async def test_analyze_text_error():
    input_data = {"analysisId": "test-123"}  # Missing text
    
    ctx = MagicMock()
    ctx.logger = MagicMock()
    
    with pytest.raises(KeyError):
        await handler(input_data, ctx)
```

### Integration Tests

```typescript
// tests/integration/user-flow.test.ts
import { createTestServer } from '@motiadev/test'
import request from 'supertest'

describe('User Registration Flow', () => {
  let server: any
  
  beforeAll(async () => {
    server = await createTestServer({
      stepsDir: './steps',
      stateAdapter: 'memory'
    })
  })
  
  afterAll(async () => {
    await server.close()
  })
  
  it('should complete registration flow', async () => {
    // 1. Register user via API
    const res = await request(server.app)
      .post('/users')
      .send({
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'secure123'
      })
    
    expect(res.status).toBe(201)
    const userId = res.body.id
    
    // 2. Wait for events to process
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 3. Verify profile was created
    const profile = await server.state.get('profiles', userId)
    expect(profile).toBeDefined()
    expect(profile.avatar).toContain('newuser')
    
    // 4. Verify welcome email was sent
    const emails = await server.state.get('emails', 'sent')
    expect(emails).toContainEqual(
      expect.objectContaining({
        to: 'newuser@example.com',
        subject: expect.stringContaining('Welcome')
      })
    )
  })
})
```

## Test Helpers

### Mock Context Creator

```typescript
export function createMockContext() {
  return {
    emit: jest.fn().mockResolvedValue(undefined),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    },
    state: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getGroup: jest.fn().mockResolvedValue([])
    },
    streams: {}
  }
}
```

### Test Data Builders

```typescript
export const builders = {
  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  order: (overrides = {}) => ({
    id: 'order-123',
    userId: 'user-123',
    items: [],
    total: 0,
    status: 'pending',
    ...overrides
  })
}
```

## Running Tests

```bash
# All tests
pnpm test

# Specific file
pnpm test create-user.test.ts

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage

# Python tests
pytest tests/

# Integration tests
pnpm test:integration
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Services**: Don't make real API calls
3. **Test Edge Cases**: Empty data, errors, timeouts
4. **Clear Assertions**: Test one thing per test
5. **Fast Tests**: Keep unit tests under 50ms
6. **Descriptive Names**: Clearly state what's being tested

## Coverage Goals

- Unit Tests: 80% coverage minimum
- Critical Paths: 100% coverage
- Error Handling: All error cases tested
- Edge Cases: Common edge cases covered