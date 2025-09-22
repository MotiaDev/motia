import { createMotiaTester } from '@motiadev/test'

describe('Complex State Triggers', () => {
  let server: ReturnType<typeof createMotiaTester>

  beforeEach(async () => (server = createMotiaTester()))
  afterEach(async () => server.close())

  describe('Successive Updates', () => {
    it('should handle multiple score updates in sequence and trigger all appropriate monitors', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user first
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'test@example.com',
            name: 'Test User',
            initialScore: 0,
            tier: 'bronze'
          }
        })
        expect(registerResponse.status).toBe(201)
        const { userId } = registerResponse.body
        await server.waitEvents()

        // Clear initial logs
        consoleSpy.mockClear()

        // Test successive score updates
        const scoreUpdates = [
          { operation: 'add', value: 50, expectedScore: 50 },
          { operation: 'add', value: 100, expectedScore: 150 },
          { operation: 'multiply', value: 2, expectedScore: 300 },
          { operation: 'add', value: 200, expectedScore: 500 },
          { operation: 'add', value: 500, expectedScore: 1000 }
        ]

        for (const update of scoreUpdates) {
          const response = await server.post('/complex/update-score', {
            body: {
              userId,
              operation: update.operation,
              value: update.value,
              reason: `Test update: ${update.operation} ${update.value}`
            }
          })
          expect(response.status).toBe(200)
          expect(response.body.newScore).toBe(update.expectedScore)
          await server.waitEvents()
        }

        // Verify all expected logs
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
        
        // Should have score achievement monitor logs for each update
        const scoreMonitorLogs = logCalls.filter(log => log.includes('Score achievement monitor triggered'))
        expect(scoreMonitorLogs).toHaveLength(scoreUpdates.length)
        
        // Should have auto tier promoter logs for scores >= 100
        const tierPromoterLogs = logCalls.filter(log => log.includes('Auto tier promoter triggered'))
        expect(tierPromoterLogs.length).toBeGreaterThan(0)
        
        // Should have achievement unlock logs
        const achievementLogs = logCalls.filter(log => log.includes('New achievement unlocked'))
        expect(achievementLogs.length).toBeGreaterThan(0)
        
        // Should have tier promotion logs
        const promotionLogs = logCalls.filter(log => log.includes('User auto-promoted'))
        expect(promotionLogs.length).toBeGreaterThan(0)

        // Verify final state
        const finalScore = await server.state.get(userId, 'user.score')
        expect(finalScore).toBe(1000)
        
        const finalTier = await server.state.get(userId, 'user.tier')
        expect(finalTier).toBe('gold')
        
        const achievements = await server.state.get(userId, 'user.achievements')
        expect(achievements.length).toBeGreaterThan(0)
        
        const notifications = await server.state.get(userId, 'user.notifications')
        expect(notifications.length).toBeGreaterThan(0)

      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should handle tier updates and trigger tier monitor', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'tier-test@example.com',
            name: 'Tier Test User',
            initialScore: 0,
            tier: 'bronze'
          }
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Test successive tier updates
        const tierUpdates = ['silver', 'gold', 'platinum']
        
        for (const tier of tierUpdates) {
          const response = await server.post('/update-tier', {
            body: { userId, tier }
          })
          expect(response.status).toBe(200)
          expect(response.body.newTier).toBe(tier)
          await server.waitEvents()
        }

        // Verify tier monitor was triggered for each update
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
        const tierMonitorLogs = logCalls.filter(log => log.includes('Tier monitor triggered'))
        expect(tierMonitorLogs).toHaveLength(tierUpdates.length)
        
        const tierUpgradeLogs = logCalls.filter(log => log.includes('Tier Upgraded'))
        expect(tierUpgradeLogs).toHaveLength(tierUpdates.length)

        // Verify final state
        const finalTier = await server.state.get(userId, 'user.tier')
        expect(finalTier).toBe('platinum')
        
        const benefits = await server.state.get(userId, 'user.benefits')
        expect(benefits.tier).toBe('platinum')
        expect(benefits.scoreMultiplier).toBe(2.0)

      } finally {
        consoleSpy.mockRestore()
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
          const response = await server.post('/register-user', {
            body: {
              email: `user${i}@example.com`,
              name: `User ${i}`,
              initialScore: 0,
              tier: 'bronze'
            }
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
              reason: `Parallel test update ${index}`
            }
          })
        )

        const responses = await Promise.all(updatePromises)
        
        // All should succeed
        responses.forEach(response => {
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
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
        const scoreMonitorLogs = logCalls.filter(log => log.includes('Score achievement monitor triggered'))
        expect(scoreMonitorLogs.length).toBeGreaterThanOrEqual(users.length)

      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should handle rapid successive updates to the same user', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'rapid-test@example.com',
            name: 'Rapid Test User',
            initialScore: 0,
            tier: 'bronze'
          }
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Send rapid successive updates
        const rapidUpdates = Array.from({ length: 10 }, (_, i) => ({
          operation: 'add' as const,
          value: 10,
          reason: `Rapid update ${i}`
        }))

        const updatePromises = rapidUpdates.map(update =>
          server.post('/complex/update-score', {
            body: { userId, ...update }
          })
        )

        const responses = await Promise.all(updatePromises)
        
        // All should succeed
        responses.forEach(response => {
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
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
        const scoreMonitorLogs = logCalls.filter(log => log.includes('Score achievement monitor triggered'))
        expect(scoreMonitorLogs.length).toBeGreaterThan(0)

      } finally {
        consoleSpy.mockRestore()
      }
    })
  })

  describe('Durable Execution', () => {
    it('should maintain state consistency even with complex cascading updates', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'durable-test@example.com',
            name: 'Durable Test User',
            initialScore: 0,
            tier: 'bronze'
          }
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
            reason: 'Complex cascading test'
          }
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
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
        const scoreMonitorLogs = logCalls.filter(log => log.includes('Score achievement monitor triggered'))
        const tierPromoterLogs = logCalls.filter(log => log.includes('Auto tier promoter triggered'))
        const tierMonitorLogs = logCalls.filter(log => log.includes('Tier monitor triggered'))
        
        expect(scoreMonitorLogs.length).toBeGreaterThan(0)
        expect(tierPromoterLogs.length).toBeGreaterThan(0)
        expect(tierMonitorLogs.length).toBeGreaterThan(0)

      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should handle notification overflow and cleanup correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user with bronze tier (max 5 notifications)
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'notification-test@example.com',
            name: 'Notification Test User',
            initialScore: 0,
            tier: 'bronze'
          }
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
            reason: 'Notification overflow test'
          }
        })
        expect(response.status).toBe(200)
        await server.waitEvents()

        // Verify notifications were cleaned up
        const notifications = await server.state.get(userId, 'user.notifications')
        expect(notifications.length).toBeLessThanOrEqual(5) // Bronze tier limit
        
        // Verify notification cleaner was triggered
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
        const cleanerLogs = logCalls.filter(log => log.includes('Notification cleaner triggered'))
        expect(cleanerLogs.length).toBeGreaterThan(0)

      } finally {
        consoleSpy.mockRestore()
      }
    })
  })

  describe('Correct Firing Conditions', () => {
    it('should NOT trigger monitors when conditions are not met', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'condition-test@example.com',
            name: 'Condition Test User',
            initialScore: 0,
            tier: 'bronze'
          }
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
            reason: 'Below threshold test'
          }
        })
        expect(response.status).toBe(200)
        await server.waitEvents()

        // Verify score monitor was triggered (score > 0)
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
        const scoreMonitorLogs = logCalls.filter(log => log.includes('Score achievement monitor triggered'))
        expect(scoreMonitorLogs.length).toBeGreaterThan(0)
        
        // Verify auto-promotion was NOT triggered (score < 100)
        const tierPromoterLogs = logCalls.filter(log => log.includes('Auto tier promoter triggered'))
        expect(tierPromoterLogs.length).toBe(0)
        
        // Verify tier remains bronze
        const tier = await server.state.get(userId, 'user.tier')
        expect(tier).toBe('bronze')

      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should trigger monitors only when specific conditions are met', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'specific-condition@example.com',
            name: 'Specific Condition User',
            initialScore: 0,
            tier: 'bronze'
          }
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
          { score: 1000, shouldTriggerPromotion: true, expectedTier: 'gold' }
        ]

        for (const testCase of testCases) {
          consoleSpy.mockClear()
          
          const response = await server.post('/complex/update-score', {
            body: {
              userId,
              operation: 'set',
              value: testCase.score,
              reason: `Testing score ${testCase.score}`
            }
          })
          expect(response.status).toBe(200)
          await server.waitEvents()

          const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
          const tierPromoterLogs = logCalls.filter(log => log.includes('Auto tier promoter triggered'))
          
          if (testCase.shouldTriggerPromotion) {
            expect(tierPromoterLogs.length).toBeGreaterThan(0)
          } else {
            expect(tierPromoterLogs.length).toBe(0)
          }
          
          const tier = await server.state.get(userId, 'user.tier')
          expect(tier).toBe(testCase.expectedTier)
        }

      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('should handle edge cases and boundary conditions correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'edge-case@example.com',
            name: 'Edge Case User',
            initialScore: 0,
            tier: 'bronze'
          }
        })
        const { userId } = registerResponse.body
        await server.waitEvents()
        consoleSpy.mockClear()

        // Test edge cases
        const edgeCases = [
          { operation: 'subtract', value: 100, expectedScore: 0, description: 'Subtract below zero' },
          { operation: 'multiply', value: 0, expectedScore: 0, description: 'Multiply by zero' },
          { operation: 'set', value: -50, expectedScore: -50, description: 'Set negative score' }
        ]

        for (const edgeCase of edgeCases) {
          const response = await server.post('/complex/update-score', {
            body: {
              userId,
              operation: edgeCase.operation,
              value: edgeCase.value,
              reason: edgeCase.description
            }
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
        consoleSpy.mockRestore()
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle invalid operations gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      try {
        // Register a user
        const registerResponse = await server.post('/register-user', {
          body: {
            email: 'error-test@example.com',
            name: 'Error Test User',
            initialScore: 100,
            tier: 'bronze'
          }
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
            reason: 'Invalid operation test'
          }
        })
        expect(response.status).toBe(400)
        
        // Verify state was not changed
        const score = await server.state.get(userId, 'user.score')
        expect(score).toBe(100)

      } finally {
        consoleSpy.mockRestore()
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
            reason: 'Non-existent user test'
          }
        })
        expect(response.status).toBe(200) // API should succeed but state won't exist
        
        // Verify state was created (API creates state for non-existent users)
        const score = await server.state.get('non-existent-user', 'user.score')
        expect(score).toBe(100)

      } finally {
        consoleSpy.mockRestore()
      }
    })
  })
})
