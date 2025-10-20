import { type FileAdapterConfig, FileStateAdapter } from './adapters/default-state-adapter'
import { MemoryStateAdapter } from './adapters/memory-state-adapter'
import type { StateAdapter } from './state-adapter'

type AdapterConfig = FileAdapterConfig | { adapter: 'memory' }

export function createStateAdapter(config: AdapterConfig): StateAdapter {
  return config.adapter === 'default' ? new FileStateAdapter(config) : new MemoryStateAdapter()
}
