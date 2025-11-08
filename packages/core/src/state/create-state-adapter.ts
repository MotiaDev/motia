import {
  FileStateAdapter,
  type FileAdapterConfig as FileStateAdapterConfig,
} from '../adapters/defaults/state/file-state-adapter'
import { MemoryStateAdapter } from '../adapters/defaults/state/memory-state-adapter'
import type { StateAdapter } from '../adapters/interfaces/state-adapter.interface'

type AdapterConfig = FileStateAdapterConfig | { adapter: 'memory' }

export function createStateAdapter(config: AdapterConfig): StateAdapter {
  return config.adapter === 'default' ? new FileStateAdapter(config) : new MemoryStateAdapter()
}
