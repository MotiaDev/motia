const TEST_ENGINE_PORT = parseInt(process.env.TEST_ENGINE_PORT ?? '49199', 10)
const TEST_API_PORT = parseInt(process.env.TEST_API_PORT ?? '3199', 10)

export const TEST_ENGINE_URL = `ws://localhost:${TEST_ENGINE_PORT}`
export const TEST_API_URL = `http://localhost:${TEST_API_PORT}`

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export function initTestEnv(): void {
  process.env.III_URL = process.env.III_URL ?? TEST_ENGINE_URL
}

export async function waitForReady(sdk: { call: (id: string, data: unknown) => Promise<unknown> }): Promise<void> {
  const maxAttempts = 50
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await sdk.call('engine::workers::list', {})
      return
    } catch {
      await sleep(200)
    }
  }
  throw new Error('Engine not ready')
}
