import { LockedData } from '../locked-data'
import { StateAdapter } from '../state/state-adapter'
import { StateStreamAdapter } from './state-stream'
import { StateAdapterWrapper } from '../state/state-adapter-wrapper'
import { InternalStateManager } from '../types'

export const setupStateStreaming = (lockedData: LockedData, stateAdapter: InternalStateManager) => {
  // Create the state stream adapter
  const stateStream = new StateStreamAdapter(stateAdapter)
  
  // Create the state stream in locked data
  const stateStreamInstance = lockedData.createStream({
    filePath: '__motia.state-stream',
    hidden: true,
    config: {
      name: '__motia.state-stream',
      baseConfig: { storageType: 'custom', factory: () => stateStream },
      schema: null as never,
    },
  })()

  // Create a wrapped state adapter that emits events (tracer will be passed per operation)
  const wrappedStateAdapter = new StateAdapterWrapper(stateAdapter, stateStream)

  return {
    stateStream: stateStreamInstance,
    wrappedStateAdapter,
  }
}
