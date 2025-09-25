import { cn } from '@motiadev/ui'
import { useCallback, useMemo } from 'react'
import { EndpointPath } from './components/endpoint-path'
import { SidePanel } from './side-panel'
import { useEndpointConfiguration } from './hooks/use-endpoint-configuration'
import { useGetEndpoints } from './hooks/use-get-endpoints'
import { ApiEndpoint } from './types/endpoint'

export const EndpointsPage = () => {
  const endpoints = useGetEndpoints()
  const { selectedEndpointId, setSelectedEndpointId } = useEndpointConfiguration()
  const selectedEndpoint = useMemo(
    () => selectedEndpointId && endpoints.find((endpoint: ApiEndpoint) => endpoint.id === selectedEndpointId),
    [endpoints, selectedEndpointId],
  )

  const onClose = useCallback(() => {
    setSelectedEndpointId('')
  }, [setSelectedEndpointId])

  return (
    <div
      className="grid h-full max-h-full"
      style={{ gridTemplateColumns: selectedEndpoint ? 'minmax(300px, 1fr) minmax(600px, 1fr)' : '1fr' }}
    >
      <div className="grid grid-cols-1 auto-rows-max overflow-y-auto min-w-0">
        {endpoints.map((endpoint: ApiEndpoint) => (
          <div
            data-testid={`endpoint-${endpoint.method}-${endpoint.path}`}
            key={`${endpoint.method} ${endpoint.path}`}
            className={cn(
              selectedEndpoint === endpoint && 'bg-muted-foreground/10',
              'cursor-pointer select-none hover:bg-muted-foreground/10',
            )}
            onClick={() => setSelectedEndpointId(endpoint.id)}
          >
            <div className="flex flex-row gap-2 items-center p-2">
              <EndpointPath method={endpoint.method} path={endpoint.path} />
              <span className="text-md text-muted-foreground truncate">{endpoint.description}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedEndpoint && <SidePanel endpoint={selectedEndpoint} onClose={onClose} />}
    </div>
  )
}
