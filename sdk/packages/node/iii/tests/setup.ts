import { afterAll } from 'vitest'
import { iii } from './utils'

afterAll(async () => {
  try {
    const sdk = iii as { shutdown?: () => Promise<void> }
    if (sdk.shutdown) {
      await sdk.shutdown()
    }
  } catch (error) {
    console.error('Error shutting down SDK:', error)
  }
})
