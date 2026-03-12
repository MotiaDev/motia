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

function resolveEngineHost(): string {
  const c = getConfig()
  const loopbackHosts = ['127.0.0.1', 'localhost']
  // When the engine is configured for loopback, use the browser's hostname so the
  // console works when accessed via LAN IP or custom hostname (e.g. Docker, remote dev).
  // Security: this assumes the console is only served from trusted origins.
  if (typeof window !== 'undefined' && loopbackHosts.includes(c.engineHost)) {
    return window.location.hostname
  }
  return c.engineHost
}

export function getDevtoolsApi(): string {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
  const c = getConfig()
  return `${protocol}//${resolveEngineHost()}:${c.enginePort}/_console`
}

export function getManagementApi(): string {
  return getDevtoolsApi()
}

export function getStreamsWs(): string {
  const c = getConfig()
  const wsProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${resolveEngineHost()}:${c.wsPort}`
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
