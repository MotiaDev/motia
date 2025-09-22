import { createMotiaTester } from '@motiadev/test'

describe('Debug State Triggers', () => {
  let server: ReturnType<typeof createMotiaTester>

  beforeEach(async () => (server = createMotiaTester()))
  afterEach(async () => server.close())

  it('should trigger debug score monitor when score changes', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    try {
      // Register a user first
      const registerResponse = await server.post('/register-user', {
        body: {
          email: 'debug@example.com',
          name: 'Debug User',
          initialScore: 0,
          tier: 'bronze'
        }
      })
      
      expect(registerResponse.status).toBe(201)
      const { userId } = registerResponse.body
      
      // Update the score
      const scoreResponse = await server.post('/complex/update-score', {
        body: {
          userId,
          operation: 'add',
          value: 50,
          reason: 'Debug test'
        }
      })
      
      expect(scoreResponse.status).toBe(200)
      await server.waitEvents()
      
      // Check if debug logs were captured
      const logCalls = consoleSpy.mock.calls.map(call => call.join(' '))
      const debugLogs = logCalls.filter(log => log.includes('DEBUG: Score changed!'))
      
      console.log('All log calls:', logCalls)
      console.log('Debug logs:', debugLogs)
      
      expect(debugLogs.length).toBeGreaterThan(0)
      
    } finally {
      consoleSpy.mockRestore()
    }
  })
})
