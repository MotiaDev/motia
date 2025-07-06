import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { EndpointBadge } from './endpoint-badge'
import { EndpointCall } from './endpoint-call'
import { ApiEndpoint, useGetEndpoints } from './hooks/use-get-endpoints'

export const Endpoints = () => {
  const endpoints = useGetEndpoints()
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)

  useEffect(() => {
    setSelectedEndpoint((selected) => {
      if (!selected) return null

      const endpoint = endpoints.find(
        (endpoint) => endpoint.method === selected.method && endpoint.path === selected.path,
      )

      return endpoint ?? null
    })
  }, [endpoints])

  return (
    <div className="flex flex-row w-full h-full">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {endpoints.map((endpoint) => (
          <div
            data-testid={`endpoint-${endpoint.method}-${endpoint.path}`}
            key={`${endpoint.method} ${endpoint.path}`}
            className={cn(selectedEndpoint === endpoint && 'bg-muted-foreground/10')}
            onClick={() => setSelectedEndpoint(endpoint)}
          >
            <div className="flex flex-row gap-2 items-center hover:bg-muted-foreground/10 p-2">
              <EndpointBadge variant={endpoint.method as never}>{endpoint.method.toUpperCase()}</EndpointBadge>
              <span className="text-md font-mono font-bold">{endpoint.path}</span>
              <span className="text-md text-muted-foreground">{endpoint.description}</span>
            </div>
          </div>
        ))}
      </div>
      {selectedEndpoint && <EndpointCall endpoint={selectedEndpoint} onClose={() => setSelectedEndpoint(null)} />}
    </div>
  )
}
