import { createMotiaTester } from '@motiadev/test'

describe('stateTriggers', () => {
  let server: ReturnType<typeof createMotiaTester>

  beforeEach(async () => (server = createMotiaTester()))
  afterEach(async () => server.close())

  it('should trigger state monitor when user status changes to active', async () => {
    // Create watchers for the events we want to test
    const userActivated = await server.watch('user.activated')
    const userStatusChanged = await server.watch('user.status.changed')

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

    // Verify that the user.status.changed event was emitted
    expect(userStatusChanged.getCapturedEvents()).toHaveLength(1)
    expect(userStatusChanged.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      topic: 'user.status.changed',
      flows: ['user-management'],
      data: {
        userId: 'test-user-123',
        status: 'active',
        changedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
      },
    })

    // Verify that the state trigger fired and emitted user.activated
    expect(userActivated.getCapturedEvents()).toHaveLength(1)
    expect(userActivated.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      topic: 'user.activated',
      flows: ['user-management'],
      data: {
        userId: 'test-user-123',
        status: 'active',
      },
    })
  })

  it('should NOT trigger state monitor when user status changes to inactive', async () => {
    // Create watchers for the events we want to test
    const userActivated = await server.watch('user.activated')
    const userStatusChanged = await server.watch('user.status.changed')

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

    // Verify that the user.status.changed event was emitted
    expect(userStatusChanged.getCapturedEvents()).toHaveLength(1)
    expect(userStatusChanged.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      topic: 'user.status.changed',
      flows: ['user-management'],
      data: {
        userId: 'test-user-456',
        status: 'inactive',
        changedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
      },
    })

    // Verify that the state trigger did NOT fire (no user.activated event)
    expect(userActivated.getCapturedEvents()).toHaveLength(0)
  })

  it('should trigger score monitor when score exceeds 100', async () => {
    // Create watcher for the score achievement event
    const scoreHigh = await server.watch('user.score.high')

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

    // Verify that the state trigger fired and emitted user.score.high
    expect(scoreHigh.getCapturedEvents()).toHaveLength(1)
    expect(scoreHigh.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      topic: 'user.score.high',
      flows: ['user-achievements'],
      data: {
        userId: 'test-user-789',
        score: 150,
      },
    })
  })

  it('should NOT trigger score monitor when score is below 100', async () => {
    // Create watcher for the score achievement event
    const scoreHigh = await server.watch('user.score.high')

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

    // Verify that the state trigger did NOT fire (no user.score.high event)
    expect(scoreHigh.getCapturedEvents()).toHaveLength(0)
  })

  it('should trigger score monitor when score accumulates to exceed 100', async () => {
    // Create watcher for the score achievement event
    const scoreHigh = await server.watch('user.score.high')

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
    expect(scoreHigh.getCapturedEvents()).toHaveLength(0) // Should not trigger yet

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

    // Verify that the state trigger fired when score exceeded 100
    expect(scoreHigh.getCapturedEvents()).toHaveLength(1)
    expect(scoreHigh.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      topic: 'user.score.high',
      flows: ['user-achievements'],
      data: {
        userId: 'test-user-accumulate',
        score: 110,
      },
    })
  })

  it('should handle multiple state triggers for the same user', async () => {
    // Create watchers for both state trigger events
    const userActivated = await server.watch('user.activated')
    const scoreHigh = await server.watch('user.score.high')

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

    // Verify both state triggers fired
    expect(userActivated.getCapturedEvents()).toHaveLength(1)
    expect(userActivated.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      topic: 'user.activated',
      flows: ['user-management'],
      data: {
        userId: 'test-user-multi',
        status: 'active',
      },
    })

    expect(scoreHigh.getCapturedEvents()).toHaveLength(1)
    expect(scoreHigh.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      topic: 'user.score.high',
      flows: ['user-achievements'],
      data: {
        userId: 'test-user-multi',
        score: 200,
      },
    })
  })
})
