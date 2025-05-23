import { SpawnOptions } from 'child_process'

export type CommunicationType = 'rpc' | 'ipc'

export interface CommunicationConfig {
  type: CommunicationType
  spawnOptions: SpawnOptions
}

export function createCommunicationConfig(command: string): CommunicationConfig {
  const type = command === 'python' && process.platform === 'win32' ? 'rpc' : 'ipc'
  
  const spawnOptions: SpawnOptions = {
    stdio: type === 'rpc' 
      ? ['inherit', 'pipe', 'inherit']  // RPC: capture stdout
      : ['inherit', 'inherit', 'inherit', 'ipc']  // IPC: include IPC channel
  }

  return { type, spawnOptions }
} 