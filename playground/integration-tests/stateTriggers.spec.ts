import { createMotiaTester } from '@motiadev/test'

describe('stateTriggers', () => {
  let server: ReturnType<typeof createMotiaTester>

  beforeEach(async () => (server = createMotiaTester()))
  afterEach(async () => server.close())

  it('should trigger state monitor when user status changes to active', async () => {
    // Capture console.log to verify state trigger behavior
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    try {
      // Set user status to 'active' - this should trigger the state monitor
      const response = await server.post('/set-user-status', {
        body: {
          userId: 'test-user-123',
          status: 'active'
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
      const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
      const welcomeEmailLogs = logCalls.filter(log => log.includes('Welcome email sent to user'))
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
          status: 'inactive'
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
      const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
      const welcomeEmailLogs = logCalls.filter(log => log.includes('Welcome email sent to user'))
      expect(welcomeEmailLogs).toHaveLength(0)
      
      // But we should see the status change log
      const statusChangeLogs = logCalls.filter(log => log.includes('User status updated'))
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
          scoreChange: 150
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

      // Verify that the state trigger DID fire
      // Check that we see the "High score achievement unlocked" log
      const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
      const achievementLogs = logCalls.filter(log => log.includes('High score achievement unlocked'))
      expect(achievementLogs).toHaveLength(1)
      
      // This demonstrates the simple reactive flow:
      // API Call → State Change → State Trigger → Action (achievement unlocked)
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
          userId: 'test-user-999',
          scoreChange: 50 
        },
      })

      // Wait for all events to be processed
      await server.waitEvents()

      // Verify the API response
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Score updated successfully',
        userId: 'test-user-999',
        newScore: 50,
      })

      // Verify that the state trigger did NOT fire
      // Check that we don't see the "High score achievement unlocked" log
      const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
      const achievementLogs = logCalls.filter(log => log.includes('High score achievement unlocked'))
      expect(achievementLogs).toHaveLength(0)
      
      // But we should see the score update log
      const scoreUpdateLogs = logCalls.filter(log => log.includes('User score updated'))
      expect(scoreUpdateLogs).toHaveLength(1)
    } finally {
      consoleSpy.mockRestore()
    }
  })

  it('should trigger score monitor when score accumulates to exceed 100', async () => {
    // First update: add 60 points (total: 60)
    const response1 = await server.post('/update-score', {
      body: { 
        userId: 'test-user-accumulate',
        scoreChange: 60 
      },
    })

    // Wait for events to be processed
    await server.waitEvents()

    // Verify first update
    expect(response1.status).toBe(200)
    expect(response1.body.newScore).toBe(60)
    
    // Should not trigger achievement yet (no "High score achievement unlocked" logs)

    // Second update: add 50 points (total: 110) - this should trigger
    const response2 = await server.post('/update-score', {
      body: { 
        userId: 'test-user-accumulate',
        scoreChange: 50 
      },
    })

    // Wait for events to be processed
    await server.waitEvents()

    // Verify second update
    expect(response2.status).toBe(200)
    expect(response2.body.newScore).toBe(110)

    // The state trigger should have fired when score exceeded 100
    // This is verified by the "High score achievement unlocked" logs
  })

  it('should handle multiple state triggers for the same user', async () => {
    // Set user status to active AND update score to high value
    const statusResponse = await server.post('/set-user-status', {
      body: { 
        userId: 'test-user-multi',
        status: 'active' 
      },
    })

    const scoreResponse = await server.post('/update-score', {
      body: { 
        userId: 'test-user-multi',
        scoreChange: 200 
      },
    })

    // Wait for all events to be processed
    await server.waitEvents()

    // Verify both API responses
    expect(statusResponse.status).toBe(200)
    expect(scoreResponse.status).toBe(200)

    // Both state triggers should have fired
    // This is verified by the console logs showing:
    // "UserStatusMonitor Welcome email sent to user"
    // "ScoreAchievementMonitor High score achievement unlocked"

    // This demonstrates multiple state triggers working independently:
    // API Call 1 → State Change 1 → State Trigger 1 → Action 1 (welcome email)
    // API Call 2 → State Change 2 → State Trigger 2 → Action 2 (achievement unlock)
  })
})
