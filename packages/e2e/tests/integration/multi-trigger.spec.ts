import { expect, test } from '@/src/motia-fixtures'

test.describe('Multi-Trigger Examples - E2E Tests', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test.describe('Comprehensive Analytics (All 4 Trigger Types)', () => {
    test('should handle API trigger for analytics', async ({ api }) => {
      await test.step('Trigger analytics via API endpoint', async () => {
        const response = await api.post('/analytics/run', {
          userId: 'e2e_test_user',
          activityType: 'test_activity',
          forceRecalculation: true,
        })

        await api.verifyResponseStatus(response, 200)
      })

      await test.step('Verify analytics response structure', async () => {
        const response = await api.post('/analytics/run', {
          userId: 'e2e_test_user_2',
          forceRecalculation: true,
        })

        const data = await api.getResponseJson(response)
        expect(data).toHaveProperty('message')
        expect(data).toHaveProperty('analyticsId')
        expect(data).toHaveProperty('triggeredBy')
        expect(data).toHaveProperty('metricsCalculated')
        expect(data).toHaveProperty('timestamp')
      })

      await test.step('Verify multiple concurrent analytics requests', async () => {
        const requests = [
          api.post('/analytics/run', { userId: 'user_1', forceRecalculation: true }),
          api.post('/analytics/run', { userId: 'user_2', forceRecalculation: true }),
          api.post('/analytics/run', { userId: 'user_3', forceRecalculation: true }),
        ]

        const responses = await Promise.all(requests)

        for (const response of responses) {
          expect(response.status).toBe(200)
        }

        // Verify unique analytics IDs
        const analyticsIds = await Promise.all(
          responses.map(async (r) => {
            const data = await api.getResponseJson(r)
            return data.analyticsId
          }),
        )

        const uniqueIds = new Set(analyticsIds)
        expect(uniqueIds.size).toBe(3)
      })
    })

    test('should handle analytics with different input parameters', async ({ api }) => {
      await test.step('Test with minimal parameters', async () => {
        const response = await api.post('/analytics/run', {})
        expect(response.status).toBe(200)
      })

      await test.step('Test with full parameters', async () => {
        const response = await api.post('/analytics/run', {
          userId: 'full_params_user',
          activityType: 'page_view',
          timestamp: new Date().toISOString(),
          forceRecalculation: false,
        })

        expect(response.status).toBe(200)
        const data = await api.getResponseJson(response)
        expect(data.metricsCalculated).toBeGreaterThan(0)
      })
    })
  })

  test.describe('Notification Sender (API + Events + State)', () => {
    test('should send notification via API trigger', async ({ api }) => {
      await test.step('Send basic notification', async () => {
        const response = await api.post('/notifications/send', {
          userId: 'e2e_notification_test',
          message: 'E2E test notification',
          type: 'email',
          priority: 'high',
        })

        await api.verifyResponseStatus(response, 200)
      })

      await test.step('Verify notification response structure', async () => {
        const response = await api.post('/notifications/send', {
          userId: 'e2e_user_2',
          message: 'Test message',
          type: 'sms',
          priority: 'medium',
        })

        const data = await api.getResponseJson(response)
        expect(data).toHaveProperty('message')
        expect(data).toHaveProperty('notificationId')
        expect(data).toHaveProperty('sentAt')
        expect(data.notificationId).toMatch(/^notif_\d+$/)
      })
    })

    test('should handle different notification types', async ({ api }) => {
      const notificationTypes = [
        { type: 'email', priority: 'high' },
        { type: 'sms', priority: 'medium' },
        { type: 'push', priority: 'low' },
      ] as const

      for (const config of notificationTypes) {
        await test.step(`Send ${config.type} notification with ${config.priority} priority`, async () => {
          const response = await api.post('/notifications/send', {
            userId: `user_${config.type}`,
            message: `Testing ${config.type} notification`,
            type: config.type,
            priority: config.priority,
          })

          expect(response.status).toBe(200)
          const data = await api.getResponseJson(response)
          expect(data.notificationId).toBeDefined()
        })
      }
    })

    test('should handle notification with optional parameters', async ({ api }) => {
      await test.step('Send notification without optional params', async () => {
        const response = await api.post('/notifications/send', {})
        expect(response.status).toBe(200)
      })

      await test.step('Send notification with userId only', async () => {
        const response = await api.post('/notifications/send', {
          userId: 'minimal_user',
        })
        expect(response.status).toBe(200)
      })
    })
  })

  test.describe('Cache Manager (Multiple APIs + Cron + State)', () => {
    test('should clear cache via API', async ({ api }) => {
      await test.step('Clear cache with default operation', async () => {
        const response = await api.post('/cache/clear', {
          operation: 'clear',
        })

        await api.verifyResponseStatus(response, 200)
      })

      await test.step('Verify cache clear response', async () => {
        const response = await api.post('/cache/clear', {
          operation: 'clear',
          force: true,
        })

        const data = await api.getResponseJson(response)
        expect(data).toHaveProperty('message')
        expect(data).toHaveProperty('operation')
        expect(data).toHaveProperty('itemsRemoved')
        expect(data).toHaveProperty('cacheSize')
        expect(data).toHaveProperty('timestamp')
        expect(data.operation).toBe('clear')
      })
    })

    test('should optimize cache via API', async ({ api }) => {
      await test.step('Optimize cache', async () => {
        const response = await api.post('/cache/optimize', {
          operation: 'optimize',
        })

        await api.verifyResponseStatus(response, 200)
      })

      await test.step('Verify optimize response', async () => {
        const response = await api.post('/cache/optimize', {
          operation: 'optimize',
        })

        const data = await api.getResponseJson(response)
        expect(data.operation).toBe('optimize')
        expect(data.itemsRemoved).toBeGreaterThanOrEqual(0)
        expect(data.cacheSize).toBeGreaterThanOrEqual(0)
      })
    })

    test('should handle cache operations sequentially', async ({ api }) => {
      await test.step('Run cache clear', async () => {
        const response = await api.post('/cache/clear', {
          operation: 'clear',
          force: true,
        })
        expect(response.status).toBe(200)
      })

      await test.step('Run cache optimize after clear', async () => {
        const response = await api.post('/cache/optimize', {
          operation: 'optimize',
        })
        expect(response.status).toBe(200)
      })

      await test.step('Run cleanup operation', async () => {
        const response = await api.post('/cache/clear', {
          operation: 'cleanup',
        })
        const data = await api.getResponseJson(response)
        expect(data.operation).toBe('cleanup')
      })
    })
  })

  test.describe('Health Monitor (Multiple State Triggers + API)', () => {
    test('should perform health check via API', async ({ api }) => {
      await test.step('Execute health check', async () => {
        const response = await api.get('/health/check')
        await api.verifyResponseStatus(response, 200)
      })

      await test.step('Verify health check response structure', async () => {
        const response = await api.get('/health/check')

        const data = await api.getResponseJson(response)
        expect(data).toHaveProperty('status')
        expect(data).toHaveProperty('alerts')
        expect(data).toHaveProperty('timestamp')
        expect(Array.isArray(data.alerts)).toBeTruthy()
      })
    })

    test('should report healthy status when no issues', async ({ api }) => {
      await test.step('Check health status', async () => {
        const response = await api.get('/health/check')
        const data = await api.getResponseJson(response)

        expect(data.status).toBe('healthy')
        expect(data.alerts.length).toBe(0)
      })
    })

    test('should handle multiple consecutive health checks', async ({ api }) => {
      const healthChecks = []

      await test.step('Perform 5 consecutive health checks', async () => {
        for (let i = 0; i < 5; i++) {
          const response = await api.get('/health/check')
          expect(response.status).toBe(200)
          const data = await api.getResponseJson(response)
          healthChecks.push(data)
        }
      })

      await test.step('Verify all health checks returned valid data', async () => {
        expect(healthChecks.length).toBe(5)
        for (const check of healthChecks) {
          expect(check.status).toBeDefined()
          expect(check.timestamp).toBeDefined()
        }
      })

      await test.step('Verify timestamps are sequential', async () => {
        for (let i = 1; i < healthChecks.length; i++) {
          const prevTime = new Date(healthChecks[i - 1].timestamp).getTime()
          const currTime = new Date(healthChecks[i].timestamp).getTime()
          expect(currTime).toBeGreaterThanOrEqual(prevTime)
        }
      })
    })
  })

  test.describe('Cross-Step Integration Tests', () => {
    test('should handle multiple steps in sequence', async ({ api }) => {
      await test.step('Trigger analytics', async () => {
        const response = await api.post('/analytics/run', {
          userId: 'integration_user',
        })
        expect(response.status).toBe(200)
      })

      await test.step('Send notification', async () => {
        const response = await api.post('/notifications/send', {
          userId: 'integration_user',
          message: 'Analytics completed',
        })
        expect(response.status).toBe(200)
      })

      await test.step('Check system health', async () => {
        const response = await api.get('/health/check')
        expect(response.status).toBe(200)
      })

      await test.step('Clear cache', async () => {
        const response = await api.post('/cache/clear', {
          operation: 'clear',
        })
        expect(response.status).toBe(200)
      })
    })

    test('should handle parallel requests across different steps', async ({ api }) => {
      await test.step('Execute multiple steps in parallel', async () => {
        const requests = [
          api.post('/analytics/run', { userId: 'parallel_1' }),
          api.post('/notifications/send', { userId: 'parallel_2', message: 'Test' }),
          api.get('/health/check'),
          api.post('/cache/optimize', { operation: 'optimize' }),
        ]

        const responses = await Promise.all(requests)

        for (const response of responses) {
          expect(response.status).toBe(200)
        }
      })

      await test.step('Verify each response has correct structure', async () => {
        const analyticsResponse = await api.post('/analytics/run', { userId: 'verify_user' })
        const analyticsData = await api.getResponseJson(analyticsResponse)
        expect(analyticsData.analyticsId).toBeDefined()

        const notificationResponse = await api.post('/notifications/send', {
          userId: 'verify_user',
          message: 'Verification',
        })
        const notificationData = await api.getResponseJson(notificationResponse)
        expect(notificationData.notificationId).toBeDefined()

        const healthResponse = await api.get('/health/check')
        const healthData = await api.getResponseJson(healthResponse)
        expect(healthData.status).toBeDefined()

        const cacheResponse = await api.post('/cache/clear', { operation: 'cleanup' })
        const cacheData = await api.getResponseJson(cacheResponse)
        expect(cacheData.operation).toBeDefined()
      })
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle invalid input gracefully', async ({ api }) => {
      await test.step('Send analytics with invalid data', async () => {
        const response = await api.post('/analytics/run', {
          invalidField: 'should be ignored',
        })
        // Should still work, ignoring invalid fields
        expect([200, 400]).toContain(response.status)
      })

      await test.step('Send notification with invalid type', async () => {
        const response = await api.post('/notifications/send', {
          type: 'invalid_type' as any,
        })
        // Should either reject or use default
        expect([200, 400]).toContain(response.status)
      })
    })

    test('should handle empty request bodies', async ({ api }) => {
      await test.step('Analytics with empty body', async () => {
        const response = await api.post('/analytics/run', {})
        expect(response.status).toBe(200)
      })

      await test.step('Notification with empty body', async () => {
        const response = await api.post('/notifications/send', {})
        expect(response.status).toBe(200)
      })

      await test.step('Cache operation with empty body', async () => {
        const response = await api.post('/cache/clear', {})
        expect(response.status).toBe(200)
      })
    })

    test('should handle rapid successive requests', async ({ api }) => {
      await test.step('Send 10 rapid analytics requests', async () => {
        const requests = Array.from({ length: 10 }, (_, i) =>
          api.post('/analytics/run', { userId: `rapid_${i}` }),
        )

        const responses = await Promise.all(requests)

        for (const response of responses) {
          expect(response.status).toBe(200)
        }
      })

      await test.step('Verify unique response IDs', async () => {
        const requests = Array.from({ length: 5 }, (_, i) =>
          api.post('/notifications/send', { userId: `unique_${i}`, message: `Test ${i}` }),
        )

        const responses = await Promise.all(requests)
        const ids = await Promise.all(
          responses.map(async (r) => {
            const data = await api.getResponseJson(r)
            return data.notificationId
          }),
        )

        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(5)
      })
    })
  })

  test.describe('Response Time and Performance', () => {
    test('should respond within acceptable time limits', async ({ api }) => {
      const maxResponseTime = 5000 // 5 seconds

      await test.step('Analytics response time', async () => {
        const start = Date.now()
        const response = await api.post('/analytics/run', { userId: 'perf_test' })
        const duration = Date.now() - start

        expect(response.status).toBe(200)
        expect(duration).toBeLessThan(maxResponseTime)
      })

      await test.step('Notification response time', async () => {
        const start = Date.now()
        const response = await api.post('/notifications/send', {
          userId: 'perf_test',
          message: 'Performance test',
        })
        const duration = Date.now() - start

        expect(response.status).toBe(200)
        expect(duration).toBeLessThan(maxResponseTime)
      })

      await test.step('Health check response time', async () => {
        const start = Date.now()
        const response = await api.get('/health/check')
        const duration = Date.now() - start

        expect(response.status).toBe(200)
        expect(duration).toBeLessThan(maxResponseTime)
      })
    })

    test('should handle sustained load', async ({ api }) => {
      const requestCount = 20
      const requests = []

      await test.step(`Execute ${requestCount} mixed requests`, async () => {
        for (let i = 0; i < requestCount; i++) {
          const endpoint = ['/analytics/run', '/notifications/send', '/cache/clear', '/health/check'][i % 4]
          const method = endpoint === '/health/check' ? 'get' : 'post'

          if (method === 'get') {
            requests.push(api.get(endpoint))
          } else {
            requests.push(api.post(endpoint, { userId: `load_test_${i}` }))
          }
        }

        const responses = await Promise.all(requests)

        const successCount = responses.filter((r) => r.status === 200).length
        expect(successCount).toBeGreaterThan(requestCount * 0.9) // 90% success rate
      })
    })
  })

  test.describe('Data Consistency', () => {
    test('should maintain data consistency across requests', async ({ api }) => {
      const testUserId = `consistency_test_${Date.now()}`

      await test.step('Create analytics for user', async () => {
        const response = await api.post('/analytics/run', {
          userId: testUserId,
          activityType: 'initial_activity',
        })
        expect(response.status).toBe(200)
      })

      await test.step('Send notification for same user', async () => {
        const response = await api.post('/notifications/send', {
          userId: testUserId,
          message: 'Notification for analytics user',
        })
        expect(response.status).toBe(200)
      })

      await test.step('Verify operations completed successfully', async () => {
        // Both operations should have completed
        const healthResponse = await api.get('/health/check')
        expect(healthResponse.status).toBe(200)
      })
    })

    test('should generate unique IDs for each operation', async ({ api }) => {
      const analyticsIds = new Set()
      const notificationIds = new Set()

      await test.step('Collect analytics IDs', async () => {
        for (let i = 0; i < 5; i++) {
          const response = await api.post('/analytics/run', { userId: `id_test_${i}` })
          const data = await api.getResponseJson(response)
          analyticsIds.add(data.analyticsId)
        }
      })

      await test.step('Collect notification IDs', async () => {
        for (let i = 0; i < 5; i++) {
          const response = await api.post('/notifications/send', {
            userId: `id_test_${i}`,
            message: `Test ${i}`,
          })
          const data = await api.getResponseJson(response)
          notificationIds.add(data.notificationId)
        }
      })

      await test.step('Verify ID uniqueness', async () => {
        expect(analyticsIds.size).toBe(5)
        expect(notificationIds.size).toBe(5)
      })
    })
  })
})
