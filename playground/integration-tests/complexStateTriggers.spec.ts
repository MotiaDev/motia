import { createMotiaTester } from '@motiadev/test'

describe('State Triggers', () => {
  let server: ReturnType<typeof createMotiaTester>

  beforeEach(async () => (server = createMotiaTester()))
  afterEach(async () => server.close())

  describe('Basic State Triggers', () => {
    it('should trigger state monitor when user status changes to active', async () => {
      // Capture console.log to verify state trigger behavior
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Set user status to 'active' - this should trigger the state monitor
        const response = await server.post('/set-user-status', {
          body: {
            userId: 'test-user-123',
            status: 'active',
          },
        })

        // Wait for all events to be processed
        await server.waitEvents()

        // Verify the API response
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'User status updated successfully',
          userId: 'test-user-123',
          status: 'active',
        })

        // Verify that the state trigger DID fire
        // Check that we see the "Welcome email sent to user" log
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const welcomeEmailLogs = logCalls.filter((log) => log.includes('Welcome email sent to user'))
        expect(welcomeEmailLogs).toHaveLength(1)

        // This demonstrates the simple reactive flow:
        // API Call → State Change → State Trigger → Action (welcome email sent)
      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should NOT trigger state monitor when user status changes to inactive', async () => {
      // Capture console.log to verify state trigger behavior
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Set user status to 'inactive' - this should NOT trigger the state monitor
        const response = await server.post('/set-user-status', {
          body: {
            userId: 'test-user-456',
            status: 'inactive',
          },
        })

        // Wait for all events to be processed
        await server.waitEvents()

        // Verify the API response
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'User status updated successfully',
          userId: 'test-user-456',
          status: 'inactive',
        })

        // Verify that the state trigger did NOT fire
        // Check that we don't see the "Welcome email sent to user" log
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const welcomeEmailLogs = logCalls.filter((log) => log.includes('Welcome email sent to user'))
        expect(welcomeEmailLogs).toHaveLength(0)

        // But we should see the status change log
        const statusChangeLogs = logCalls.filter((log) => log.includes('User status updated'))
        expect(statusChangeLogs).toHaveLength(1)
      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should trigger score monitor when score exceeds 100', async () => {
      // Capture console.log to verify state trigger behavior
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Update score to 150 - this should trigger the score monitor
        const response = await server.post('/update-score', {
          body: {
            userId: 'test-user-789',
            scoreChange: 150,
          },
        })

        // Wait for all events to be processed
        await server.waitEvents()

        // Verify the API response
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Score updated successfully',
          userId: 'test-user-789',
          newScore: 150,
        })

        // Verify that the score monitor DID fire
        // Check that we see the "High score achievement unlocked" log
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const highScoreLogs = logCalls.filter((log) => log.includes('High score achievement unlocked'))
        expect(highScoreLogs).toHaveLength(1)
      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should NOT trigger score monitor when score is below 100', async () => {
      // Capture console.log to verify state trigger behavior
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Update score to 50 - this should NOT trigger the score monitor
        const response = await server.post('/update-score', {
          body: {
            userId: 'test-user-101',
            scoreChange: 50,
          },
        })

        // Wait for all events to be processed
        await server.waitEvents()

        // Verify the API response
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Score updated successfully',
          userId: 'test-user-101',
          newScore: 50,
        })

        // Verify that the score monitor did NOT fire
        // Check that we don't see the "High score achievement unlocked" log
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const highScoreLogs = logCalls.filter((log) => log.includes('High score achievement unlocked'))
        expect(highScoreLogs).toHaveLength(0)
      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should trigger score monitor when score accumulates to exceed 100', async () => {
      // Capture console.log to verify state trigger behavior
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // First update: 60 points
        const response1 = await server.post('/update-score', {
          body: {
            userId: 'test-user-accumulate',
            scoreChange: 60,
          },
        })

        // Second update: 50 points (total: 110, should trigger monitor)
        const response2 = await server.post('/update-score', {
          body: {
            userId: 'test-user-accumulate',
            scoreChange: 50,
          },
        })

        // Wait for all events to be processed
        await server.waitEvents()

        // Verify both API responses
        expect(response1.status).toBe(200)
        expect(response2.status).toBe(200)

        // Verify that the score monitor DID fire after the second update
        // Check that we see the "High score achievement unlocked" log
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const highScoreLogs = logCalls.filter((log) => log.includes('High score achievement unlocked'))
        expect(highScoreLogs).toHaveLength(1)
      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should handle multiple state triggers for the same user', async () => {
      // Capture console.log to verify state trigger behavior
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Set user status to active (should trigger status monitor)
        const statusResponse = await server.post('/set-user-status', {
          body: {
            userId: 'test-user-multi',
            status: 'active',
          },
        })

        // Update score to 150 (should trigger score monitor)
        const scoreResponse = await server.post('/update-score', {
          body: {
            userId: 'test-user-multi',
            scoreChange: 150,
          },
        })

        // Wait for all events to be processed
        await server.waitEvents()

        // Verify both API responses
        expect(statusResponse.status).toBe(200)
        expect(scoreResponse.status).toBe(200)

        // Verify that BOTH monitors fired
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const welcomeEmailLogs = logCalls.filter((log) => log.includes('Welcome email sent to user'))
        const highScoreLogs = logCalls.filter((log) => log.includes('High score achievement unlocked'))
        
        expect(welcomeEmailLogs).toHaveLength(1)
        expect(highScoreLogs).toHaveLength(1)
      } finally {
        consoleSpy.mockRestore()
      }
    })
  })

  describe('Intermediate State Triggers', () => {
    it('should handle multiple score updates in sequence and trigger all appropriate monitors', async () => {
      // const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user first
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'test@example.com',
            name: 'Test User',
            initialScore: 0,
            tier: 'bronze',
          },
        })
        if (registerResponse.status !== 201) {
          console.log('Registration error:', registerResponse.body)
        }
        expect(registerResponse.status).toBe(201)
        const { userId } = registerResponse.body
        await server.waitEvents()
        

        // Clear initial logs
        // consoleSpy.mockClear()

        // Test successive score updates
        const scoreUpdates = [
          { operation: 'add', value: 50, expectedScore: 50 },
          { operation: 'increment', value: 100, expectedScore: 150 },
          { operation: 'multiply', value: 2, expectedScore: 300 },
          { operation: 'add', value: 200, expectedScore: 500 },
          { operation: 'decrement', value: 50, expectedScore: 450 },
          { operation: 'add', value: 550, expectedScore: 1000 },
        ]

        for (const update of scoreUpdates) {
          const response = await server.post('/complex/update-score', {
            body: {
              userId,
              operation: update.operation,
              value: update.value,
              reason: `Test update: ${update.operation} ${update.value}`,
            },
          })
          expect(response.status).toBe(200)
          expect(response.body.newScore).toBe(update.expectedScore)
          await server.waitEvents()
        }

        // Verify state changes instead of logs
        const finalScore = await server.state.get(userId, 'user.score')
        expect(finalScore).toBe(scoreUpdates[scoreUpdates.length - 1].expectedScore)

        // Check if achievements were unlocked
        const achievements = await server.state.get(userId, 'user.achievements')
        expect(achievements).toBeDefined()
        expect(Array.isArray(achievements)).toBe(true)

        // Check if tier was promoted
        const finalTier = await server.state.get(userId, 'user.tier')
        expect(finalTier).toBeDefined()

        // Check if notifications were created
        const notifications = await server.state.get(userId, 'user.notifications')
        expect(notifications).toBeDefined()
        expect(Array.isArray(notifications)).toBe(true)
        expect(notifications.length).toBeGreaterThan(0)

        // Verify tier was promoted to gold
        expect(finalTier).toBe('gold')

        // Verify achievements were unlocked
        expect(achievements.length).toBeGreaterThan(0)
      } finally {
        // consoleSpy.mockRestore()
      }
    })

    it('should handle tier updates and trigger tier monitor', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'tier-test@example.com',
            name: 'Tier Test User',
            initialScore: 0,
            tier: 'bronze',
          },
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Test successive tier updates
        const tierUpdates = ['silver', 'gold', 'platinum']

        for (const tier of tierUpdates) {
          const response = await server.post('/update-tier', {
            body: { userId, tier },
          })
          expect(response.status).toBe(200)
          expect(response.body.newTier).toBe(tier)
          await server.waitEvents()
        }

        // Verify tier monitor was triggered for each update
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const tierMonitorLogs = logCalls.filter((log) => log.includes('Tier monitor triggered'))
        expect(tierMonitorLogs).toHaveLength(tierUpdates.length)

        const tierUpgradeLogs = logCalls.filter((log) => log.includes('Tier Upgraded'))
        expect(tierUpgradeLogs).toHaveLength(tierUpdates.length)

        // Verify final state
        const finalTier = await server.state.get(userId, 'user.tier')
        expect(finalTier).toBe('platinum')

        const benefits = await server.state.get(userId, 'user.benefits')
        expect(benefits.tier).toBe('platinum')
        expect(benefits.scoreMultiplier).toBe(2.0)
      } finally {
        // consoleSpy.mockRestore()
      }
    })
  })

  describe('Parallel Updates', () => {
    it('should handle multiple users updating simultaneously without interference', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register multiple users
        const users = []
        for (let i = 0; i < 5; i++) {
          const response = await server.post('/complex/register', {
            body: {
              email: `user${i}@example.com`,
              name: `User ${i}`,
              initialScore: 0,
              tier: 'bronze',
            },
          })
          users.push(response.body.userId)
        }
        await server.waitEvents()
        consoleSpy.mockClear()

        // Update all users' scores in parallel
        const updatePromises = users.map((userId, index) =>
          server.post('/complex/update-score', {
            body: {
              userId,
              operation: 'add',
              value: (index + 1) * 100, // Different scores for each user
              reason: `Parallel test update ${index}`,
            },
          }),
        )

        const responses = await Promise.all(updatePromises)

        // All should succeed
        responses.forEach((response) => {
          expect(response.status).toBe(200)
        })

        await server.waitEvents()

        // Verify each user's state is correct
        for (let i = 0; i < users.length; i++) {
          const userId = users[i]
          const expectedScore = (i + 1) * 100

          const score = await server.state.get(userId, 'user.score')
          expect(score).toBe(expectedScore)

          const achievements = await server.state.get(userId, 'user.achievements')
          expect(achievements.length).toBeGreaterThan(0)
        }

        // Verify logs show processing for all users
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const scoreMonitorLogs = logCalls.filter((log) => log.includes('Score achievement monitor triggered'))
        expect(scoreMonitorLogs.length).toBeGreaterThanOrEqual(users.length)
      } finally {
        // consoleSpy.mockRestore()
      }
    })

    it('should handle rapid successive updates to the same user', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'rapid-test@example.com',
            name: 'Rapid Test User',
            initialScore: 0,
            tier: 'bronze',
          },
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Send rapid successive updates
        const rapidUpdates = Array.from({ length: 10 }, (_, i) => ({
          operation: 'add' as const,
          value: 10,
          reason: `Rapid update ${i}`,
        }))

        const updatePromises = rapidUpdates.map((update) =>
          server.post('/complex/update-score', {
            body: { userId, ...update },
          }),
        )

        const responses = await Promise.all(updatePromises)

        // All should succeed
        responses.forEach((response) => {
          expect(response.status).toBe(200)
        })

        await server.waitEvents()

        // Verify final score is correct (10 * 10 = 100)
        const finalScore = await server.state.get(userId, 'user.score')
        expect(finalScore).toBe(100)

        // Verify score history has all updates
        const scoreHistory = await server.state.get(userId, 'user.score.history')
        expect(scoreHistory.length).toBe(10)

        // Verify monitors were triggered appropriately
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const scoreMonitorLogs = logCalls.filter((log) => log.includes('Score achievement monitor triggered'))
        expect(scoreMonitorLogs.length).toBeGreaterThan(0)
      } finally {
        // consoleSpy.mockRestore()
      }
    })
  })

  describe('Durable Execution', () => {
    it('should maintain state consistency even with complex cascading updates', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'durable-test@example.com',
            name: 'Durable Test User',
            initialScore: 0,
            tier: 'bronze',
          },
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Perform a complex sequence that should trigger multiple cascading updates
        const response = await server.post('/complex/update-score', {
          body: {
            userId,
            operation: 'set',
            value: 1500, // This should trigger multiple monitors and auto-promotions
            reason: 'Complex cascading test',
          },
        })
        expect(response.status).toBe(200)
        await server.waitEvents()

        // Verify all state is consistent
        const score = await server.state.get(userId, 'user.score')
        expect(score).toBe(1500)

        const tier = await server.state.get(userId, 'user.tier')
        expect(tier).toBe('gold') // Should be auto-promoted to gold

        const achievements = await server.state.get(userId, 'user.achievements')
        expect(achievements.length).toBeGreaterThan(0)

        const benefits = await server.state.get(userId, 'user.benefits')
        expect(benefits.tier).toBe('gold')
        expect(benefits.scoreMultiplier).toBe(1.5)

        const notifications = await server.state.get(userId, 'user.notifications')
        expect(notifications.length).toBeGreaterThan(0)

        // Verify score history is maintained
        const scoreHistory = await server.state.get(userId, 'user.score.history')
        expect(scoreHistory.length).toBeGreaterThan(0)
        expect(scoreHistory[scoreHistory.length - 1].newScore).toBe(1500)

        // Verify all expected monitors were triggered
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const scoreMonitorLogs = logCalls.filter((log) => log.includes('Score achievement monitor triggered'))
        const tierPromoterLogs = logCalls.filter((log) => log.includes('Auto tier promoter triggered'))
        const tierMonitorLogs = logCalls.filter((log) => log.includes('Tier monitor triggered'))

        expect(scoreMonitorLogs.length).toBeGreaterThan(0)
        expect(tierPromoterLogs.length).toBeGreaterThan(0)
        expect(tierMonitorLogs.length).toBeGreaterThan(0)
      } finally {
        // consoleSpy.mockRestore()
      }
    })

    it('should handle notification overflow and cleanup correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user with bronze tier (max 5 notifications)
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'notification-test@example.com',
            name: 'Notification Test User',
            initialScore: 0,
            tier: 'bronze',
          },
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Generate many notifications by triggering multiple achievements
        const response = await server.post('/complex/update-score', {
          body: {
            userId,
            operation: 'set',
            value: 10000, // This should trigger many achievements
            reason: 'Notification overflow test',
          },
        })
        expect(response.status).toBe(200)
        await server.waitEvents()

        // Verify notifications were cleaned up
        const notifications = await server.state.get(userId, 'user.notifications')
        const userBenefits = await server.state.get(userId, 'user.benefits')
        expect(notifications.length).toBeLessThanOrEqual(userBenefits?.maxNotifications || 5)

        // Verify notification cleaner was triggered
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const cleanerLogs = logCalls.filter((log) => log.includes('Notification cleaner triggered'))
        expect(cleanerLogs.length).toBeGreaterThan(0)
      } finally {
        // consoleSpy.mockRestore()
      }
    })
  })

  describe('Correct Firing Conditions', () => {
    it('should NOT trigger monitors when conditions are not met', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'condition-test@example.com',
            name: 'Condition Test User',
            initialScore: 0,
            tier: 'bronze',
          },
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Update score to a value that should NOT trigger auto-promotion
        const response = await server.post('/complex/update-score', {
          body: {
            userId,
            operation: 'add',
            value: 50, // Below 100 threshold for auto-promotion
            reason: 'Below threshold test',
          },
        })
        expect(response.status).toBe(200)
        await server.waitEvents()

        // Verify score monitor was triggered (score > 0)
        const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
        const scoreMonitorLogs = logCalls.filter((log) => log.includes('Score achievement monitor triggered'))
        expect(scoreMonitorLogs.length).toBeGreaterThan(0)

        // Verify auto-promotion was NOT triggered (score < 100)
        const tierPromoterLogs = logCalls.filter((log) => log.includes('Auto tier promoter triggered'))
        expect(tierPromoterLogs.length).toBe(0)

        // Verify tier remains bronze
        const tier = await server.state.get(userId, 'user.tier')
        expect(tier).toBe('bronze')
      } finally {
        // consoleSpy.mockRestore()
      }
    })

    it('should trigger monitors only when specific conditions are met', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'specific-condition@example.com',
            name: 'Specific Condition User',
            initialScore: 0,
            tier: 'bronze',
          },
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Test different score thresholds
        const testCases = [
          { score: 0, shouldTriggerPromotion: false, expectedTier: 'bronze' },
          { score: 50, shouldTriggerPromotion: false, expectedTier: 'bronze' },
          { score: 100, shouldTriggerPromotion: true, expectedTier: 'silver' },
          { score: 500, shouldTriggerPromotion: true, expectedTier: 'gold' },
          { score: 1000, shouldTriggerPromotion: true, expectedTier: 'gold' },
        ]

        for (const testCase of testCases) {
          consoleSpy.mockClear()

          const response = await server.post('/complex/update-score', {
            body: {
              userId,
              operation: 'set',
              value: testCase.score,
              reason: `Testing score ${testCase.score}`,
            },
          })
          expect(response.status).toBe(200)
          await server.waitEvents()

          const logCalls = consoleSpy.mock.calls.map((call) => call.join(' '))
          const tierPromoterLogs = logCalls.filter((log) => log.includes('Auto tier promoter triggered'))

          expect(tierPromoterLogs.length).toBe(testCase.shouldTriggerPromotion ? 1 : 0)

          const tier = await server.state.get(userId, 'user.tier')
          expect(tier).toBe(testCase.expectedTier)
        }
      } finally {
        // consoleSpy.mockRestore()
      }
    })

    it('should handle edge cases and boundary conditions correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'edge-case@example.com',
            name: 'Edge Case User',
            initialScore: 0,
            tier: 'bronze',
          },
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Test edge cases
        const edgeCases = [
          { operation: 'subtract', value: 100, expectedScore: 0, description: 'Subtract below zero' },
          { operation: 'multiply', value: 0, expectedScore: 0, description: 'Multiply by zero' },
          { operation: 'set', value: -50, expectedScore: -50, description: 'Set negative score' },
        ]

        for (const edgeCase of edgeCases) {
          const response = await server.post('/complex/update-score', {
            body: {
              userId,
              operation: edgeCase.operation,
              value: edgeCase.value,
              reason: edgeCase.description,
            },
          })
          expect(response.status).toBe(200)
          expect(response.body.newScore).toBe(edgeCase.expectedScore)
          await server.waitEvents()
        }

        // Verify final state
        const finalScore = await server.state.get(userId, 'user.score')
        expect(finalScore).toBe(-50)

        // Verify score history contains all operations
        const scoreHistory = await server.state.get(userId, 'user.score.history')
        expect(scoreHistory.length).toBe(3)
      } finally {
        // consoleSpy.mockRestore()
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle invalid operations gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Register a user
        const registerResponse = await server.post('/complex/register', {
          body: {
            email: 'error-test@example.com',
            name: 'Error Test User',
            initialScore: 100,
            tier: 'bronze',
          },
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Test invalid operation (this should fail at the API level)
        const response = await server.post('/complex/update-score', {
          body: {
            userId,
            operation: 'invalid_operation',
            value: 50,
            reason: 'Invalid operation test',
          },
        })
        expect(response.status).toBe(400)

        // Verify state was not changed
        const score = await server.state.get(userId, 'user.score')
        expect(score).toBe(100)
      } finally {
        // consoleSpy.mockRestore()
      }
    })

    it('should handle missing user gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      try {
        // Try to update score for non-existent user
        const response = await server.post('/complex/update-score', {
          body: {
            userId: 'non-existent-user',
            operation: 'add',
            value: 100,
            reason: 'Non-existent user test',
          },
        })
        expect(response.status).toBe(200) // API should succeed but state won't exist

        // Verify state was created (API creates state for non-existent users)
        const score = await server.state.get('non-existent-user', 'user.score')
        expect(score).toBe(100)
      } finally {
        // consoleSpy.mockRestore()
      }
    })

    it('should demonstrate cohesive atomic operations flow', async () => {
      // Register a user first
      const registerResponse = await server.post('/complex/register', {
        body: {
          email: 'cohesive@test.com',
          name: 'Cohesive User',
          initialScore: 0,
          tier: 'bronze',
        },
      })
      expect(registerResponse.status).toBe(201)
      const { userId } = registerResponse.body
      await server.waitEvents()

      // Step 1: Basic score operations (increment, decrement)
      const incrementResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'increment',
          value: 50,
          reason: 'Initial score boost'
        },
      })
      expect(incrementResponse.status).toBe(200)
      expect(incrementResponse.body.newScore).toBe(50)
      await server.waitEvents()

      // Step 2: Bonus round (increment + unshift items to inventory)
      const bonusResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'bonus_round',
          value: 100,
          reason: 'Bonus round',
          bonusItems: [
            { id: 'bonus_sword', type: 'weapon', name: 'Bonus Sword' },
            { id: 'bonus_potion', type: 'consumable', name: 'Bonus Potion' }
          ]
        },
      })
      expect(bonusResponse.status).toBe(200)
      expect(bonusResponse.body.newScore).toBe(150)
      await server.waitEvents()

      // Step 3: Inventory reward (increment based on inventory size)
      const inventoryRewardResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'inventory_reward',
          value: 10,
          reason: 'Inventory reward'
        },
      })
      expect(inventoryRewardResponse.status).toBe(200)
      // Should be 10 * 2 (inventory size) = 20 points
      expect(inventoryRewardResponse.body.newScore).toBe(170)
      await server.waitEvents()

      // Step 4: Check that tier promotion happened (score >= 100)
      const finalScore = await server.state.get(userId, 'user.score')
      expect(finalScore).toBe(170)
      
      const finalTier = await server.state.get(userId, 'user.tier')
      expect(finalTier).toBe('silver') // Should be promoted from bronze to silver

      // Step 5: Check that inventory has items from bonus round
      const inventory = await server.state.get(userId, 'user.inventory') || []
      expect(inventory.length).toBeGreaterThan(0)
      
      // Should have bonus items from bonus round (using unshift atomic operation)
      const hasBonusSword = inventory.some((item: any) => item.id === 'bonus_sword')
      const hasBonusPotion = inventory.some((item: any) => item.id === 'bonus_potion')
      expect(hasBonusSword).toBe(true)
      expect(hasBonusPotion).toBe(true)

      // Step 6: Check that notifications were created
      const notifications = await server.state.get(userId, 'user.notifications') || []
      expect(notifications.length).toBeGreaterThan(0)
      
      const hasPromotionNotification = notifications.some((n: any) => n.type === 'tier_upgrade')
      const hasAchievementNotification = notifications.some((n: any) => n.type === 'achievement')
      expect(hasPromotionNotification).toBe(true)
      expect(hasAchievementNotification).toBe(true)

      // Step 7: Check that profile was updated by auto tier promoter
      const profile = await server.state.get(userId, 'user.profile') || {}
      expect(profile.lastPromotion).toBeDefined()
      expect(profile.promotionCount).toBe(1)

      // Step 8: Test additional atomic operations
      // Test pop operation (remove last item)
      const popResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'remove_last_item',
          value: 25,
          reason: 'Removed last item'
        },
      })
      expect(popResponse.status).toBe(200)

      // Test exists operation
      const existsResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'check_item_exists',
          value: 1, // Check if item with id 1 exists
          reason: 'Check item existence'
        },
      })
      expect(existsResponse.status).toBe(200)

      // Test deleteField operation
      const deleteFieldResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'delete_profile_field',
          value: 10,
          fieldToDelete: 'tempField',
          reason: 'Delete profile field'
        },
      })
      expect(deleteFieldResponse.status).toBe(200)

      // Test compareAndSwap operation
      const currentScore = await server.state.get(userId, 'user.score')
      const casResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'compare_and_swap',
          value: currentScore + 100,
          expectedValue: currentScore, // Use actual current score
          reason: 'Compare and swap test'
        },
      })
      expect(casResponse.status).toBe(200)

      // Test getGroup operation (UserGroupManager handles this automatically on registration)
      // The user was already added to 'active_users' group by UserGroupManager
      const activeUsersGroup = await server.state.getGroup('active_users')
      expect(activeUsersGroup.length).toBeGreaterThan(0)
      
      // Test batch operations (NotificationCleaner uses batch operations)
      // This is tested implicitly through the notification cleanup process

      // Test clear operation (nuclear option)
      const clearResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'clear_achievements',
          value: 1000,
          reason: 'Nuclear reset'
        },
      })
      expect(clearResponse.status).toBe(200)
      
      // Verify clear worked
      const clearedScore = await server.state.get(userId, 'user.score')
      expect(clearedScore).toBe(1000)
    })
  })
})
