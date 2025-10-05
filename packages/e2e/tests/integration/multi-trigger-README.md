# Multi-Trigger E2E Tests

These end-to-end tests validate the multi-trigger examples in the playground.

## Test Files

1. **`multi-trigger.spec.ts`** - Core API and integration tests
2. **`multi-trigger-workbench.spec.ts`** - Workbench UI and visualization tests (in workbench folder)

## Running the Tests

### Prerequisites

1. **Install Playwright** (first time only):
   ```bash
   npm install
   npm run install
   npm run install:deps
   ```

2. **Start Motia Server**:
   ```bash
   # In playground directory
   cd ../../playground
   pnpm dev
   ```

### Run Tests

```bash
# Run all multi-trigger tests
npm run test:e2e tests/integration/multi-trigger.spec.ts

# Run with UI mode (interactive)
npm run test:ui tests/integration/multi-trigger.spec.ts

# Run in headed mode (see browser)
npm run test:headed tests/integration/multi-trigger.spec.ts

# Run workbench tests
npm run test:workbench
```

## Test Coverage

### API Integration Tests (`multi-trigger.spec.ts`)

**Comprehensive Analytics (All 4 Trigger Types)**
- ✅ API trigger functionality
- ✅ Response structure validation
- ✅ Concurrent request handling
- ✅ Parameter validation

**Notification Sender (API + Events + State)**
- ✅ API trigger functionality
- ✅ Different notification types (email, sms, push)
- ✅ Priority levels
- ✅ Optional parameter handling

**Cache Manager (Multiple APIs + Cron + State)**
- ✅ Cache clear operation
- ✅ Cache optimize operation
- ✅ Sequential operations
- ✅ Operation types validation

**Health Monitor (Multiple State Triggers + API)**
- ✅ Health check execution
- ✅ Status reporting
- ✅ Consecutive checks
- ✅ Timestamp sequencing

**Cross-Step Integration**
- ✅ Multiple steps in sequence
- ✅ Parallel execution across steps
- ✅ Response structure consistency

**Error Handling**
- ✅ Invalid input handling
- ✅ Empty request bodies
- ✅ Rapid successive requests
- ✅ Unique ID generation

**Performance**
- ✅ Response time limits
- ✅ Sustained load handling
- ✅ Concurrent request performance

**Data Consistency**
- ✅ Cross-request consistency
- ✅ Unique ID generation
- ✅ Operation integrity

### Workbench Tests (`workbench/multi-trigger-workbench.spec.ts`)

- ✅ Flow visibility in workbench
- ✅ Step visualization
- ✅ Log integration
- ✅ Trace recording
- ✅ Real-time updates
- ✅ Error display

## Test Structure

Each test follows this pattern:

```typescript
test.describe('Feature Area', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('specific scenario', async ({ api, workbench, logsPage }) => {
    await test.step('Setup', async () => {
      // Arrange
    })

    await test.step('Execute', async () => {
      // Act
    })

    await test.step('Verify', async () => {
      // Assert
    })
  })
})
```

## Expected Results

All tests should pass when:
- Motia server is running on http://localhost:3000
- Playground has the multi-trigger-example steps
- Server is responsive and healthy

### Success Output

```
✓ Multi-Trigger Examples - E2E Tests
  ✓ Comprehensive Analytics (All 4 Trigger Types)
    ✓ should handle API trigger for analytics
    ✓ should handle analytics with different input parameters
  ✓ Notification Sender (API + Events + State)
    ✓ should send notification via API trigger
    ✓ should handle different notification types
  ✓ Cache Manager (Multiple APIs + Cron + State)
    ✓ should clear cache via API
    ✓ should optimize cache via API
  ✓ Health Monitor (Multiple State Triggers + API)
    ✓ should perform health check via API
  ✓ Cross-Step Integration Tests
    ✓ should handle multiple steps in sequence
  ✓ Error Handling and Edge Cases
    ✓ should handle invalid input gracefully
  ✓ Performance
    ✓ should respond within acceptable time limits

Total: 20 tests passed
```

## Troubleshooting

### Tests Hanging or Timing Out

**Cause:** Server not running or not responding

**Solution:**
```bash
# Check server status
curl http://localhost:3000/health/check

# If no response, restart server
cd playground
pnpm dev
```

### Flaky Tests

**Cause:** Race conditions or timing issues

**Solution:**
- Tests have built-in waits and retries
- Increase timeout if needed: `test.setTimeout(60000)`
- Use `page.waitForLoadState('networkidle')`

### Browser Crashes

**Cause:** Resource limitations

**Solution:**
```bash
# Run tests in headless mode (default)
npm run test:e2e

# Or reduce parallel workers
npm run test:e2e -- --workers=1
```

## Debugging Tests

### Interactive Mode

```bash
# Open Playwright UI
npm run test:ui tests/integration/multi-trigger.spec.ts

# Debug specific test
npm run test:debug -- --grep "should handle API trigger"
```

### View Test Report

```bash
# After tests run
npm run test:report
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshot at failure point
- Video recording of entire test
- Console logs
- Network requests

Find them in: `test-results/`

## CI/CD Integration

These tests are designed for CI/CD pipelines:

```yaml
# Example workflow
- name: Run E2E Tests
  run: |
    cd packages/e2e
    npm run test:e2e tests/integration/multi-trigger.spec.ts
  env:
    MOTIA_API_URL: http://localhost:3000
```

## Performance Benchmarks

Tests validate these benchmarks:
- API response time < 5 seconds
- Concurrent requests: 10+ simultaneous
- Success rate: > 90% under load
- Sustained load: 20+ requests without degradation

## Contributing

When adding new multi-trigger examples:

1. Add API tests in `multi-trigger.spec.ts`
2. Add workbench tests if UI changes
3. Update test coverage documentation
4. Ensure tests pass locally before PR

## Related Documentation

- [Multi-Trigger Examples README](../../../playground/steps/multi-trigger-example/README.md)
- [Test Results](../../../playground/steps/multi-trigger-example/TEST-RESULTS.md)
- [Motia E2E Testing Guide](../README.md)
