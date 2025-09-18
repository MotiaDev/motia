import { useMemo } from 'react'
import { EndpointBadge } from './endpoint-badge.js'
import { EndpointSidePanel } from './endpoint-side-panel.js'
import { useGetEndpoints } from './hooks/use-get-endpoints.js'
import { cn } from './lib/utils.js'
import { useGlobalStore } from './hooks/use-global-store.js'
import { ApiEndpoint } from './types/endpoint.js'

export const EndpointsPage = () => {
  const endpoints = useGetEndpoints()
  const selectedEndpointId = useGlobalStore((state) => state.selectedEndpointId)
  const selectEndpointId = useGlobalStore((state) => state.selectEndpointId)
  const selectedEndpoint = useMemo(
    () => selectedEndpointId && endpoints.find((endpoint: ApiEndpoint) => endpoint.id === selectedEndpointId),
    [endpoints, selectedEndpointId],
  )

  return (
    <div className="flex flex-row">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {endpoints.map((endpoint: ApiEndpoint) => (
          <div
            data-testid={`endpoint-${endpoint.method}-${endpoint.path}`}
            key={`${endpoint.method} ${endpoint.path}`}
            className={cn(selectedEndpoint === endpoint && 'bg-muted-foreground/10', 'cursor-pointer select-none')}
            onClick={() => selectEndpointId(endpoint.id)}
          >
            <div className="flex flex-row gap-2 items-center hover:bg-muted-foreground/10 p-2">
              <EndpointBadge variant={endpoint.method as never}>{endpoint.method.toUpperCase()}</EndpointBadge>
              <span className="text-md font-mono font-bold whitespace-nowrap">{endpoint.path}</span>
              <span className="text-md text-muted-foreground truncate">{endpoint.description}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedEndpoint && (
        <EndpointSidePanel endpoint={selectedEndpoint} onClose={() => selectEndpointId(undefined)} />
      )}
    </div>
  )
}
