import { createMotiaTester } from '@motiadev/test'

describe('Debug API', () => {
  let server: ReturnType<typeof createMotiaTester>

  beforeEach(async () => (server = createMotiaTester()))
  afterEach(async () => server.close())

  it('should be able to call the score updater API', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    try {
      // First, let's try to register a user
      const registerResponse = await server.post('/register-user', {
        body: {
          email: 'debug@example.com',
          name: 'Debug User',
          initialScore: 0,
          tier: 'bronze'
        }
      })
      
      console.log('Register response:', registerResponse.status, registerResponse.body)
      
      if (registerResponse.status === 200 || registerResponse.status === 201) {
        const { userId } = registerResponse.body
        
        // Now try to update the score
        const scoreResponse = await server.post('/update-score', {
          body: {
            userId,
            operation: 'add',
            value: 50,
            reason: 'Debug test'
          }
        })
        
        console.log('Score response:', scoreResponse.status, scoreResponse.body)
        
        // Check what we got
        expect(scoreResponse.status).toBe(200)
        expect(scoreResponse.body).toBeDefined()
        expect(scoreResponse.body.newScore).toBeDefined()
        
      } else {
        console.log('Registration failed:', registerResponse.body)
        // Try the score update anyway to see what happens
        const scoreResponse = await server.post('/update-score', {
          body: {
            userId: 'debug-user-123',
            operation: 'add',
            value: 50,
            reason: 'Debug test'
          }
        })
        
        console.log('Score response (no user):', scoreResponse.status, scoreResponse.body)
      }
      
    } finally {
      consoleSpy.mockRestore()
    }
  })
})
