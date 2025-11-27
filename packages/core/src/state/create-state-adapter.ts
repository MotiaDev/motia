import { FileAdapterConfig, FileStateAdapter } from './adapters/default-state-adapter'
import { MemoryStateAdapter } from './adapters/memory-state-adapter'

type AdapterConfig = FileAdapterConfig | { adapter: 'memory' }

export function createStateAdapter(config: AdapterConfig) {
  return config.adapter === 'default' ? new FileStateAdapter(config) : new MemoryStateAdapter()
}
