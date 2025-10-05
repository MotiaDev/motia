/**
 * Quick validation test for multi-trigger examples
 * Run this with: tsx playground/steps/multi-trigger-example/quick-test.ts
 */

const API_BASE = 'http://localhost:3000'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL'
  message: string
  duration: number
}

const results: TestResult[] = []

async function testEndpoint(
  name: string,
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: any,
): Promise<void> {
  const start = Date.now()
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }

    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options)
    const duration = Date.now() - start

    if (response.status === 200) {
      const data = await response.json()
      results.push({
        name,
        status: 'PASS',
        message: `✓ ${response.status} - Response: ${JSON.stringify(data).substring(0, 100)}...`,
        duration,
      })
    } else {
      results.push({
        name,
        status: 'FAIL',
        message: `✗ HTTP ${response.status}`,
        duration,
      })
    }
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({
      name,
      status: 'FAIL',
      message: `✗ Error: ${error.message}`,
      duration,
    })
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║  Multi-Trigger Examples - Quick Validation Test               ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  console.log('Testing API endpoints...\n')

  // Test 1: ComprehensiveAnalytics (API Trigger)
  await testEndpoint(
    'ComprehensiveAnalytics - API Trigger',
    '/analytics/run',
    'POST',
    { userId: 'quick_test_1', forceRecalculation: true },
  )

  // Test 2: NotificationSender (API Trigger)
  await testEndpoint(
    'NotificationSender - API Trigger',
    '/notifications/send',
    'POST',
    { userId: 'quick_test_2', message: 'Quick test notification', type: 'email', priority: 'high' },
  )

  // Test 3: CacheManager - Clear (API Trigger)
  await testEndpoint('CacheManager - Clear Cache', '/cache/clear', 'POST', { operation: 'clear' })

  // Test 4: CacheManager - Optimize (API Trigger)
  await testEndpoint('CacheManager - Optimize Cache', '/cache/optimize', 'POST', { operation: 'optimize' })

  // Test 5: HealthMonitor (API Trigger)
  await testEndpoint('HealthMonitor - Health Check', '/health/check', 'GET')

  // Test 6: Concurrent requests to ComprehensiveAnalytics
  console.log('\nTesting concurrent requests...\n')
  const concurrentStart = Date.now()
  await Promise.all([
    testEndpoint('Concurrent Analytics #1', '/analytics/run', 'POST', { userId: 'concurrent_1' }),
    testEndpoint('Concurrent Analytics #2', '/analytics/run', 'POST', { userId: 'concurrent_2' }),
    testEndpoint('Concurrent Analytics #3', '/analytics/run', 'POST', { userId: 'concurrent_3' }),
  ])
  const concurrentDuration = Date.now() - concurrentStart

  // Print results
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║  Test Results                                                  ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  results.forEach((result) => {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌'
    console.log(`${statusIcon} ${result.name}`)
    console.log(`   ${result.message}`)
    console.log(`   Duration: ${result.duration}ms\n`)
  })

  const passCount = results.filter((r) => r.status === 'PASS').length
  const failCount = results.filter((r) => r.status === 'FAIL').length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const avgDuration = Math.round(totalDuration / results.length)

  console.log('═══════════════════════════════════════════════════════════════\n')
  console.log(`Total Tests: ${results.length}`)
  console.log(`Passed: ${passCount} ✅`)
  console.log(`Failed: ${failCount} ${failCount > 0 ? '❌' : ''}`)
  console.log(`Average Response Time: ${avgDuration}ms`)
  console.log(`Concurrent Request Duration: ${concurrentDuration}ms`)
  console.log(`\nOverall Status: ${failCount === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  console.log('\n═══════════════════════════════════════════════════════════════\n')

  // Exit with appropriate code
  process.exit(failCount > 0 ? 1 : 0)
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/health/check`)
    return response.status === 200
  } catch {
    return false
  }
}

// Main execution
;(async () => {
  console.log('Checking if Motia server is running...')
  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.log('\n❌ Error: Motia server is not running on http://localhost:3000')
    console.log('\nPlease start the server first:')
    console.log('  cd playground')
    console.log('  pnpm dev')
    console.log('\nThen run this test again.\n')
    process.exit(1)
  }

  console.log('✅ Server is running\n')
  await runTests()
})()
