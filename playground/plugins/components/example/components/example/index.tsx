import { Badge, Button, cn } from '@motiadev/ui'
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Server } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface PluginData {
  message: string
  timestamp: string
  environment: string
  status: 'active' | 'inactive'
}

export const Example = () => {
  const [data, setData] = useState<PluginData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/__motia/local-plugin-example')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
            <Server className="w-5 h-5 text-accent-1000" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Local Plugin Example</h1>
            <p className="text-sm text-muted-foreground">Demonstrates plugin capabilities in Motia</p>
          </div>
        </div>
        <Button variant="default" onClick={fetchData} disabled={isLoading} className="h-9 gap-2">
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4">
        {isLoading && !data && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading data...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">Error loading data</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <Badge
                  variant={data.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    'gap-1.5',
                    data.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
                  )}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </Badge>
              </div>
              <p className="text-2xl font-semibold text-foreground">{data.message}</p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Environment */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Environment</span>
                </div>
                <p className="text-lg font-mono font-semibold text-foreground">{data.environment}</p>
              </div>

              {/* Timestamp */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                </div>
                <p className="text-lg font-mono font-semibold text-foreground">
                  {new Date(data.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h3 className="text-sm font-semibold mb-2 text-foreground">About This Plugin</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is a local plugin example demonstrating how to create custom plugins for Motia. Plugins can extend
                the Workbench UI and add custom API endpoints. Click the refresh button above to fetch new data from the
                server.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
