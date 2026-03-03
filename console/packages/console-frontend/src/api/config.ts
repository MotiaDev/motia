// Console configuration types and getter-based module
// Config is set once at startup by ConfigProvider, then available everywhere.

export interface ConsoleConfig {
  engineHost: string
  enginePort: number
  wsPort: number
  consolePort: number
  version: string
  enableFlow?: boolean
}

let _config: ConsoleConfig | null = null

export function setConfig(config: ConsoleConfig): void {
  _config = config
}

export function getConfig(): ConsoleConfig {
  if (!_config) {
    throw new Error(
      'Config not initialized. Ensure ConfigProvider has loaded before accessing config.',
    )
  }
  return _config
}

export function getDevtoolsApi(): string {
  const c = getConfig()
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
  return `${protocol}//${c.engineHost}:${c.enginePort}/_console`
}

export function getManagementApi(): string {
  const c = getConfig()
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
  return `${protocol}//${c.engineHost}:${c.enginePort}/_console`
}

export function getStreamsWs(): string {
  const c = getConfig()
  const wsProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${c.engineHost}:${c.wsPort}`
}

export function getConnectionInfo() {
  const c = getConfig()
  return {
    engineHost: c.engineHost,
    enginePort: String(c.enginePort),
    wsPort: String(c.wsPort),
    devtoolsApi: getDevtoolsApi(),
    streamsWs: getStreamsWs(),
  }
}
