# Testing Multi-Trigger Examples

This document explains how to test the multi-trigger examples.

## Quick Validation Test (Recommended)

The fastest way to validate all multi-trigger examples:

### 1. Start the Motia Server

```bash
cd playground
pnpm dev
```

### 2. Run Quick Test (in another terminal)

```bash
# From the project root
cd playground
npx tsx steps/multi-trigger-example/quick-test.ts
```

This will:
- ✅ Test all 5 API endpoints
- ✅ Verify response structures
- ✅ Test concurrent requests
- ✅ Show detailed results with timing
- ⚡ Complete in ~5-10 seconds

**Expected Output:**
```
╔════════════════════════════════════════════════════════════════╗
║  Multi-Trigger Examples - Quick Validation Test               ║
╚════════════════════════════════════════════════════════════════╝

✅ ComprehensiveAnalytics - API Trigger
✅ NotificationSender - API Trigger
✅ CacheManager - Clear Cache
✅ CacheManager - Optimize Cache
✅ HealthMonitor - Health Check
✅ Concurrent Analytics #1
✅ Concurrent Analytics #2
✅ Concurrent Analytics #3

Total Tests: 8
Passed: 8 ✅
Failed: 0
Overall Status: ✅ ALL TESTS PASSED
```

---

## Manual Testing

Test individual endpoints using curl:

### ComprehensiveAnalytics (All 4 Trigger Types)

```bash
# API Trigger
curl -X POST http://localhost:3000/analytics/run \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user", "forceRecalculation": true}'

# Expected: 200 OK with analyticsId, triggeredBy, metricsCalculated
```

### NotificationSender (API + Events + State)

```bash
# API Trigger
curl -X POST http://localhost:3000/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "message": "Test notification",
    "type": "email",
    "priority": "high"
  }'

# Expected: 200 OK with notificationId, sentAt
```

### CacheManager (Multiple APIs + Cron + State)

```bash
# Clear Cache API
curl -X POST http://localhost:3000/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"operation": "clear"}'

# Optimize Cache API
curl -X POST http://localhost:3000/cache/optimize \
  -H "Content-Type: application/json" \
  -d '{"operation": "optimize"}'

# Expected: 200 OK with operation, itemsRemoved, cacheSize
```

### HealthMonitor (Multiple State Triggers + API)

```bash
# Health Check API
curl http://localhost:3000/health/check

# Expected: 200 OK with status: "healthy", alerts: []
```

---

## Full E2E Tests (Playwright)

For comprehensive browser-based testing:

### Prerequisites

```bash
# Install Playwright (first time only)
cd packages/e2e
npm install
npm run install
npm run install:deps
```

### Run E2E Tests

```bash
# Make sure Motia server is running in playground directory
cd playground
pnpm dev

# In another terminal, run e2e tests
cd packages/e2e
npm run test:e2e tests/integration/multi-trigger.spec.ts
```

**Note:** E2E tests take 2-5 minutes to complete as they:
- Test all API endpoints
- Test concurrent requests
- Test error scenarios
- Test workbench integration
- Test logs and traces
- Test performance

### Run Workbench E2E Tests

```bash
npm run test:e2e tests/workbench/multi-trigger-workbench.spec.ts
```

---

## Test Coverage

### ✅ API Triggers (Tested)
- ComprehensiveAnalytics: `POST /analytics/run`
- NotificationSender: `POST /notifications/send`
- CacheManager: `POST /cache/clear`, `POST /cache/optimize`
- HealthMonitor: `GET /health/check`

### ⏱️ Event Triggers (Monitored)
- ComprehensiveAnalytics: `user.activity`
- DataProcessor: `data.uploaded`, `data.updated`, `data.validated`
- NotificationSender: `user.registered`, `order.completed`

### ⏰ Cron Triggers (Scheduled)
- ComprehensiveAnalytics: Every 4 hours
- CacheManager: Every 2 hours

### 📊 State Triggers (Monitoring)
- ComprehensiveAnalytics: `analytics.config` changes
- NotificationSender: `notifications.queue` has items
- CacheManager: `cache.size` > 1000
- HealthMonitor: Multiple system metrics

---

## Troubleshooting

### Server Not Running

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
```bash
cd playground
pnpm dev
# Wait for "Server running at http://localhost:3000"
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart server
pnpm dev
```

### E2E Tests Hanging

**Issue:** Tests take too long or appear stuck

**Solution:**
- Use the quick test instead: `npx tsx steps/multi-trigger-example/quick-test.ts`
- E2E tests need browser automation which is slower
- Check if server is responding: `curl http://localhost:3000/health/check`

### TypeScript Errors in Steps

**Error:** Handler type errors

**Solution:**
- Types are auto-generated when server runs
- Start the server to generate types
- Errors will disappear once types are generated

---

## CI/CD Integration

For automated testing in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Start Motia Server
  run: |
    cd playground
    pnpm dev &
    sleep 10 # Wait for server to start

- name: Run Quick Tests
  run: |
    cd playground
    npx tsx steps/multi-trigger-example/quick-test.ts

- name: Run E2E Tests
  run: |
    cd packages/e2e
    npm run test:e2e tests/integration/multi-trigger.spec.ts
```

---

## Performance Benchmarks

Expected response times (on local machine):

| Endpoint | Avg Response Time | Max Concurrent |
|----------|------------------|----------------|
| `/analytics/run` | 50-200ms | 10+ |
| `/notifications/send` | 30-150ms | 10+ |
| `/cache/clear` | 20-100ms | 5+ |
| `/cache/optimize` | 30-150ms | 5+ |
| `/health/check` | 10-50ms | 20+ |

---

## Next Steps

After validating the multi-trigger examples:

1. ✅ View in workbench: http://localhost:3000?flow=multi-trigger-demo
2. ✅ Check logs: http://localhost:3000/logs
3. ✅ View traces: http://localhost:3000/traces
4. ✅ Customize for your use case
5. ✅ Add more trigger combinations as needed
