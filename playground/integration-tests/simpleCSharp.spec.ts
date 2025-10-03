import { createMotiaTester } from '@motiadev/test'

describe('simpleCSharp', () => {
  let server: ReturnType<typeof createMotiaTester>

  beforeEach(async () => (server = createMotiaTester()))
  afterEach(async () => server.close())

  it('should execute C# steps end-to-end', async () => {
    // Creating a watcher for the event we want to test
    const testedEvent = await server.watch('tested.csharp')

    const response = await server.post('/test-csharp', {
      body: { message: 'Start simple csharp test' },
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ message: 'payload processed' })

    // This is important to ensure all events are handled in this test
    await server.waitEvents()

    // Checking all captured events
    expect(testedEvent.getCapturedEvents()).toHaveLength(1)

    // Checking the last captured event
    // State.Get now works with bidirectional RPC - enriched should be "yes"
    expect(testedEvent.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      topic: 'tested.csharp',
      flows: ['simple-csharp'],
      data: { message: 'hello world', enriched: 'yes' }, // ✅ Now "yes" with working State.Get()
    })
  })
})

