import type { SpawnOptions } from 'child_process'

export type CommunicationType = 'rpc' | 'ipc'

export interface CommunicationConfig {
  type: CommunicationType
  spawnOptions: SpawnOptions
}

export function createCommunicationConfig(command: string, projectRoot?: string): CommunicationConfig {
  // Use RPC (stdout) for Python on Windows and dotnet (C#) since they don't support Node.js IPC
  const type = (command === 'python' && process.platform === 'win32') || command === 'dotnet' ? 'rpc' : 'ipc'

  const spawnOptions: SpawnOptions = {
    stdio:
      type === 'rpc'
        ? ['pipe', 'pipe', 'inherit'] // RPC: capture stdout
        : ['inherit', 'inherit', 'inherit', 'ipc'], // IPC: include IPC channel
  }

  if (command === 'python') {
    spawnOptions.env = {
      ...process.env,
      PYTHONPATH: projectRoot || process.cwd(),
    }
  }

  return { type, spawnOptions }
}
