import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  Box,
  Calendar,
  Check,
  CheckCircle,
  Code,
  Copy,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Layers,
  Plug,
  Radio,
  RefreshCw,
  Settings,
  Terminal,
  Users,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SystemStatus } from '@/api'
import {
  adaptersQuery,
  functionsQuery,
  statusQuery,
  streamsQuery,
  triggersQuery,
  triggerTypesQuery,
} from '@/api'
import { useConfig } from '@/api/config-provider'
import { Badge, Button } from '@/components/ui/card'

export const Route = createFileRoute('/config')({
  component: ConfigPage,
  loader: ({ context: { queryClient } }) => {
    Promise.allSettled([
      queryClient.prefetchQuery(triggerTypesQuery),
      queryClient.prefetchQuery(adaptersQuery),
      queryClient.prefetchQuery(statusQuery),
      queryClient.prefetchQuery(functionsQuery()),
      queryClient.prefetchQuery(triggersQuery()),
      queryClient.prefetchQuery(streamsQuery),
    ])
  },
})

interface EndpointStatus {
  url: string
  name: string
  icon: React.ReactNode
  status: 'checking' | 'online' | 'offline'
  latency?: number
  description?: string
}

function ConfigPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [showSystem, setShowSystem] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const consoleConfig = useConfig()
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    {
      url: `http://${consoleConfig.engineHost}:${consoleConfig.enginePort}`,
      name: 'iii Engine',
      icon: <Terminal className="w-4 h-4" />,
      status: 'checking',
      description: 'REST API & DevTools',
    },
    {
      url: `ws://${consoleConfig.engineHost}:${consoleConfig.wsPort}`,
      name: 'Streams',
      icon: <Activity className="w-4 h-4" />,
      status: 'checking',
      description: 'WebSocket streams',
    },
    {
      url: 'ws://localhost:49134',
      name: 'SDK Bridge',
      icon: <Cpu className="w-4 h-4" />,
      status: 'checking',
      description: 'Worker connections',
    },
  ])

  const { data: triggerTypesData } = useQuery(triggerTypesQuery)
  const { data: adaptersData, refetch: refetchAdapters } = useQuery(adaptersQuery)
  const { data: statusData, refetch: refetchStatus } = useQuery(statusQuery)
  const { data: functionsData } = useQuery(functionsQuery({ include_internal: showSystem }))
  const { data: triggersData } = useQuery(triggersQuery({ include_internal: showSystem }))
  const { data: streamsData } = useQuery(streamsQuery)

  const triggerTypes = triggerTypesData?.trigger_types || []
  const adapters = adaptersData?.adapters || []
  const status = statusData as SystemStatus | null
  const functionCount = functionsData?.functions?.length || 0
  const triggerCount = triggersData?.triggers?.length || 0
  const streamCount = streamsData?.streams?.filter((s) => !s.internal).length || 0

  const checkEndpoints = async () => {
    const results = await Promise.all(
      endpoints.map(async (ep) => {
        if (ep.url.startsWith('ws://')) {
          return { ...ep, status: 'online' as const }
        }
        const start = Date.now()
        try {
          const response = await fetch(`${ep.url}/_console/health`, {
            signal: AbortSignal.timeout(3000),
          })
          return {
            ...ep,
            status: response.ok ? ('online' as const) : ('offline' as const),
            latency: Date.now() - start,
          }
        } catch {
          return { ...ep, status: 'offline' as const }
        }
      }),
    )
    setEndpoints(results)
  }

  const loadData = async () => {
    await Promise.all([refetchAdapters(), refetchStatus()])
    checkEndpoints()
  }

  const copyToClipboard = (value: string, key: string) => {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const modules = useMemo(() => {
    return adapters.filter((a) => a.type === 'module' && (showSystem || !a.internal))
  }, [adapters, showSystem])

  const workers = useMemo(() => {
    return adapters.filter((a) => a.type === 'worker_pool')
  }, [adapters])

  const triggerHandlers = useMemo(() => {
    return adapters.filter((a) => a.type === 'trigger' && (showSystem || !a.internal))
  }, [adapters, showSystem])

  const selectedModuleData = adapters.find((a) => a.id === selectedModule)

  const stats = useMemo(
    () => ({
      modules: modules.length,
      functions: functionCount,
      triggers: triggerCount,
      streams: streamCount,
      workers: workers.reduce((sum, w) => sum + (w.count || 0), 0),
      healthy: modules.filter((m) => m.health === 'healthy').length,
    }),
    [modules, functionCount, triggerCount, streamCount, workers],
  )

  const exportConfig = () => {
    const yaml = `# iii Engine Configuration
# Generated from Developer Console at ${new Date().toISOString()}

modules:
${modules
  .map(
    (m) => `  - class: ${m.id}
    config:
      # Add module-specific configuration here
`,
  )
  .join('\n')}
`
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'config.yaml'
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateConfigYaml = (): string => {
    const detectedModules = adapters.filter((a) => a.type === 'module')
    const detectedTriggerHandlers = adapters.filter((a) => a.type === 'trigger')
    const workerPools = adapters.filter((a) => a.type === 'worker_pool')

    const apiPort = String(consoleConfig.enginePort)
    const streamsPort = String(consoleConfig.wsPort)
    const sdkPort =
      endpoints.find((e) => e.name === 'SDK Bridge')?.url?.match(/:(\d+)/)?.[1] || '49134'

    let modulesYaml = ''

    if (
      detectedModules.some((m) => m.id === 'streams') ||
      detectedTriggerHandlers.some((t) => t.id.includes('streams'))
    ) {
      modulesYaml += `  - class: modules::streams::StreamModule
    config:
      port: ${streamsPort}
      host: 127.0.0.1
      adapter:
        class: modules::streams::adapters::RedisAdapter
        config:
          redis_url: redis://localhost:6379

`
    }

    modulesYaml += `  - class: modules::rest_api::RestApiModule
    config:
      port: ${apiPort}
      host: 127.0.0.1
      default_timeout: 30000

`

    if (detectedTriggerHandlers.some((t) => t.id === 'cron')) {
      modulesYaml += `  - class: modules::cron::CronModule
    config:
      adapter:
        class: modules::cron::adapters::RedisCronAdapter
        config:
          redis_url: redis://localhost:6379

`
    }

    if (detectedTriggerHandlers.some((t) => t.id === 'event')) {
      modulesYaml += `  - class: modules::event::EventModule
    config:
      adapter:
        class: modules::event::adapters::RedisAdapter
        config:
          redis_url: redis://localhost:6379

`
    }

    modulesYaml += `  - class: modules::devtools::DevToolsModule
    config:
      enabled: true
      api_prefix: _console
      metrics_enabled: true
      metrics_interval: 30

`

    return `# iii Engine Runtime Configuration
# Generated from Developer Console at ${new Date().toISOString()}
# Based on detected runtime state from the engine API

# ═══════════════════════════════════════════════════════════════
# DETECTED MODULES
# ═══════════════════════════════════════════════════════════════

modules:
${modulesYaml}
# ═══════════════════════════════════════════════════════════════
# RUNTIME STATUS
# ═══════════════════════════════════════════════════════════════

# Engine:
#   Version: ${status?.version ?? '0.0.0'}
#   Uptime: ${status?.uptime_formatted ?? 'unknown'}

# Connections:
#   REST API: http://localhost:${apiPort}
#   Streams WebSocket: ws://localhost:${streamsPort}
#   SDK Bridge: ws://localhost:${sdkPort}

# Statistics:
#   Workers: ${stats.workers}
#   Functions: ${stats.functions}
#   Triggers: ${stats.triggers}
#   Streams: ${stats.streams}

# ═══════════════════════════════════════════════════════════════
# DETECTED TRIGGER TYPES
# ═══════════════════════════════════════════════════════════════
${triggerTypes.map((t) => `# - ${t}`).join('\n')}

# ═══════════════════════════════════════════════════════════════
# ACTIVE MODULES & ADAPTERS
# ═══════════════════════════════════════════════════════════════
${detectedModules.map((m) => `# [${m.health?.toUpperCase() || 'UNKNOWN'}] ${m.id} - ${m.description || 'No description'}`).join('\n')}

# ═══════════════════════════════════════════════════════════════
# TRIGGER HANDLERS
# ═══════════════════════════════════════════════════════════════
${detectedTriggerHandlers.map((t) => `# [${t.status?.toUpperCase() || 'ACTIVE'}] ${t.id} - ${t.description || 'No description'}`).join('\n')}

# ═══════════════════════════════════════════════════════════════
# WORKER POOLS
# ═══════════════════════════════════════════════════════════════
${workerPools.map((w) => `# ${w.id}: ${w.count || 0} connected`).join('\n')}
`
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 md:px-5 py-3 md:py-4 bg-dark-gray/30 border-b border-border">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <h1 className="text-sm md:text-base font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configuration</span>
            <span className="sm:hidden">Config</span>
          </h1>
          <Badge
            variant={stats.healthy === stats.modules ? 'success' : 'warning'}
            className="gap-1 text-[10px] md:text-xs"
          >
            <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3" />
            {stats.healthy}/{stats.modules}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfigModal(true)}
            className="h-6 md:h-7 text-[10px] md:text-xs px-2"
          >
            <Code className="w-3 h-3 md:mr-1.5" />
            <span className="hidden md:inline">View Config</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportConfig}
            className="h-6 md:h-7 text-[10px] md:text-xs px-2"
          >
            <Download className="w-3 h-3 md:mr-1.5" />
            <span className="hidden md:inline">Export</span>
          </Button>
          <Button
            variant={showSystem ? 'accent' : 'ghost'}
            size="sm"
            onClick={() => setShowSystem(!showSystem)}
            className="h-6 md:h-7 text-[10px] md:text-xs px-2"
          >
            {showSystem ? (
              <Eye className="w-3 h-3 md:mr-1.5" />
            ) : (
              <EyeOff className="w-3 h-3 md:mr-1.5" />
            )}
            <span className={`hidden md:inline ${showSystem ? '' : 'line-through opacity-60'}`}>
              System
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            className="h-7 text-xs text-muted hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3 p-4 border-b border-border bg-dark-gray/20">
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between mb-1">
            <Layers className="w-4 h-4 text-cyan" />
            <span className="text-xs text-muted">Modules</span>
          </div>
          <div className="text-2xl font-bold text-cyan">{stats.modules}</div>
        </div>
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between mb-1">
            <Box className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-muted">Functions</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{stats.functions}</div>
        </div>
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between mb-1">
            <Zap className="w-4 h-4 text-yellow" />
            <span className="text-xs text-muted">Triggers</span>
          </div>
          <div className="text-2xl font-bold text-yellow">{stats.triggers}</div>
        </div>
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between mb-1">
            <Database className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted">Streams</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.streams}</div>
        </div>
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted">Workers</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.workers}</div>
        </div>
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-muted">Healthy</span>
          </div>
          <div className="text-2xl font-bold text-success">{stats.healthy}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
        {endpoints.map((ep) => (
          <div
            key={`${ep.url}-${ep.name}`}
            className={`p-3 rounded-lg border transition-all ${
              ep.status === 'online'
                ? 'bg-success/5 border-success/30'
                : ep.status === 'offline'
                  ? 'bg-error/5 border-error/30'
                  : 'bg-dark-gray/30 border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`p-1.5 rounded ${
                  ep.status === 'online'
                    ? 'bg-success/20 text-success'
                    : ep.status === 'offline'
                      ? 'bg-error/20 text-error'
                      : 'bg-muted/20 text-muted'
                }`}
              >
                {ep.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{ep.name}</div>
                <div className="text-[10px] text-muted">{ep.description}</div>
              </div>
              {ep.status === 'online' && ep.latency && (
                <span className="text-xs text-success font-mono">{ep.latency}ms</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <code className="text-[10px] text-muted font-mono truncate">{ep.url}</code>
              <button
                type="button"
                onClick={() => copyToClipboard(ep.url, ep.url)}
                className="p-1 hover:bg-dark-gray rounded transition-colors"
              >
                {copied === ep.url ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3 text-muted" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`flex-1 grid overflow-hidden ${selectedModule ? 'grid-cols-[1fr_320px]' : 'grid-cols-1'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Trigger Types */}
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-yellow" />
                  Trigger Types ({triggerTypes.length})
                </h3>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {triggerTypes.map((tt) => (
                    <div
                      key={tt}
                      className="p-3 rounded-lg border border-border bg-dark-gray/30 hover:border-yellow/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {tt === 'api' && <Globe className="w-3.5 h-3.5 text-cyan" />}
                        {tt === 'cron' && <Calendar className="w-3.5 h-3.5 text-orange-400" />}
                        {tt === 'event' && <Radio className="w-3.5 h-3.5 text-green-400" />}
                        {tt.includes('stream') && (
                          <Database className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        {!['api', 'cron', 'event'].includes(tt) && !tt.includes('stream') && (
                          <Zap className="w-3.5 h-3.5 text-muted" />
                        )}
                        <span className="font-medium text-sm">{tt}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-muted font-mono flex-1 truncate">
                          "{tt}"
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tt, `tt-${tt}`)}
                          className="p-1 hover:bg-dark-gray rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {copied === `tt-${tt}` ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Modules */}
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  Active Modules ({modules.length})
                </h3>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {modules.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setSelectedModule(selectedModule === mod.id ? null : mod.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedModule === mod.id
                          ? 'bg-primary/10 border-primary'
                          : mod.health === 'healthy'
                            ? 'bg-success/5 border-success/30 hover:border-success/50'
                            : 'bg-error/5 border-error/30 hover:border-error/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {mod.health === 'healthy' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-error" />
                        )}
                        <span className="font-medium text-sm truncate">
                          {mod.id.split('::').pop()}
                        </span>
                        {mod.port && (
                          <code className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-muted font-mono ml-auto">
                            :{mod.port}
                          </code>
                        )}
                      </div>
                      <div className="text-[10px] text-muted truncate">{mod.id}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Adapters Section */}
              {adapters.filter(
                (a) => a.type !== 'module' && a.type !== 'worker_pool' && a.type !== 'trigger',
              ).length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Plug className="w-3.5 h-3.5 text-purple-400" />
                    Adapters (
                    {
                      adapters.filter(
                        (a) =>
                          a.type !== 'module' && a.type !== 'worker_pool' && a.type !== 'trigger',
                      ).length
                    }
                    )
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {adapters
                      .filter(
                        (a) =>
                          a.type !== 'module' && a.type !== 'worker_pool' && a.type !== 'trigger',
                      )
                      .map((adapter) => (
                        <div
                          key={adapter.id}
                          className={`p-3 rounded-lg border ${
                            adapter.health === 'healthy'
                              ? 'border-purple-400/30 bg-purple-400/5'
                              : 'border-error/30 bg-error/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {adapter.health === 'healthy' ? (
                              <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-error" />
                            )}
                            <span className="font-medium text-sm truncate">
                              {adapter.id.split('::').pop()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-400">
                              {adapter.type}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                adapter.status === 'active'
                                  ? 'bg-success/20 text-success'
                                  : 'bg-muted/20 text-muted'
                              }`}
                            >
                              {adapter.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {triggerHandlers.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-yellow" />
                    Trigger Handlers ({triggerHandlers.length})
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    {triggerHandlers.map((handler) => (
                      <div
                        key={handler.id}
                        className="p-3 rounded-lg border border-yellow/30 bg-yellow/5"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3.5 h-3.5 text-yellow" />
                          <span className="font-medium text-sm truncate">{handler.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              handler.status === 'active'
                                ? 'bg-success/20 text-success'
                                : 'bg-muted/20 text-muted'
                            }`}
                          >
                            {handler.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workers.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    Worker Pools ({workers.length})
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {workers.map((worker) => (
                      <div
                        key={worker.id}
                        className="p-3 rounded-lg border border-blue-400/30 bg-blue-400/5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-medium text-sm">{worker.id}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-400">
                            {worker.count || 0}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted">connected workers</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedModuleData && (
          <div className="border-l border-border bg-dark-gray/20 overflow-y-auto">
            <div className="p-4 border-b border-border sticky top-0 bg-dark-gray/50 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedModuleData.health === 'healthy' ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-error" />
                  )}
                  <h2 className="font-medium text-sm">{selectedModuleData.id.split('::').pop()}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedModule(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] text-muted uppercase tracking-wider mb-2">Full ID</div>
                <code className="text-xs font-mono bg-black/40 px-2 py-1 rounded block break-all">
                  {selectedModuleData.id}
                </code>
              </div>

              <div>
                <div className="text-[10px] text-muted uppercase tracking-wider mb-2">Type</div>
                <Badge variant="outline">{selectedModuleData.type}</Badge>
              </div>

              <div>
                <div className="text-[10px] text-muted uppercase tracking-wider mb-2">Status</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      selectedModuleData.status === 'active'
                        ? 'bg-success/20 text-success'
                        : 'bg-muted/20 text-muted'
                    }`}
                  >
                    {selectedModuleData.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      selectedModuleData.health === 'healthy'
                        ? 'bg-success/20 text-success'
                        : 'bg-error/20 text-error'
                    }`}
                  >
                    {selectedModuleData.health}
                  </span>
                </div>
              </div>

              {selectedModuleData.port && (
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-wider mb-2">Port</div>
                  <code className="text-sm font-mono">{selectedModuleData.port}</code>
                </div>
              )}

              {selectedModuleData.description && (
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-wider mb-2">
                    Description
                  </div>
                  <p className="text-xs text-muted">{selectedModuleData.description}</p>
                </div>
              )}

              {selectedModuleData.internal && (
                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted/20 text-muted">
                    Internal Module
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Config File Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold">Runtime Configuration</h3>
                <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const configYaml = generateConfigYaml()
                    copyToClipboard(configYaml, 'config-yaml')
                  }}
                  className="h-7 text-xs gap-1.5"
                >
                  {copied === 'config-yaml' ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportConfig}
                  className="h-7 text-xs gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  Download
                </Button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="p-1 rounded hover:bg-dark-gray"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs font-mono bg-dark-gray p-4 rounded-lg overflow-x-auto whitespace-pre text-foreground">
                {generateConfigYaml()}
              </pre>
            </div>

            <div className="px-4 py-3 border-t border-border text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Generated from detected runtime state • Module configs inferred from API responses
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
