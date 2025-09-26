import { cn } from '@motiadev/ui'
import { useCallback, useMemo, useState } from 'react'
import { EndpointsSearch } from './components/endpoints-search'
import { FlowGroup } from './components/flow-group'
import { useEndpointConfiguration } from './hooks/use-endpoint-configuration'
import { useGetEndpoints } from './hooks/use-get-endpoints'
import { SidePanel } from './side-panel'
import { ApiEndpoint } from './types/endpoint'

export const EndpointsPage = () => {
  const { endpoints, groupedEndpoints } = useGetEndpoints()
  const { selectedEndpointId, setSelectedEndpointId, toggleFlowGroupStatus, flowGroupStatus } =
    useEndpointConfiguration()
  const selectedEndpoint = useMemo(
    () => endpoints.find((endpoint: ApiEndpoint) => endpoint.id === selectedEndpointId),
    [endpoints, selectedEndpointId],
  )

  const onClose = useCallback(() => {
    setSelectedEndpointId('')
  }, [setSelectedEndpointId])

  const [search, setSearch] = useState('')

  const filteredEndpoints = useMemo(() => {
    return Object.entries(groupedEndpoints).filter(([_, endpoints]) => {
      return endpoints.some(
        (endpoint) =>
          endpoint.method?.toLowerCase().includes(search.toLowerCase()) ||
          endpoint.path?.toLowerCase().includes(search.toLowerCase()),
      )
    })
  }, [groupedEndpoints, search])

  return (
    <div
      className={cn(
        'grid h-full max-h-full',
        selectedEndpoint ? 'grid-cols-[minmax(auto,1fr)_minmax(600px,1fr)]' : 'grid-cols-1',
      )}
    >
      <div className="grid grid-rows-[auto_1fr] h-full overflow-auto min-w-0">
        <EndpointsSearch value={search} onChange={setSearch} onClear={() => setSearch('')} />
        <div className="grid grid-cols-1 auto-rows-max overflow-auto min-w-0">
          {filteredEndpoints.map(([flow, endpoints]) => {
            const isSelected = endpoints.some((endpoint) => endpoint.id === selectedEndpointId)
            const isOpen = !flowGroupStatus[flow] || isSelected || search !== ''
            return (
              <FlowGroup
                key={flow}
                flow={flow}
                endpoints={endpoints as ApiEndpoint[]}
                isOpen={isOpen}
                isSelected={isSelected}
                onToggle={toggleFlowGroupStatus}
                onClearSelection={() => setSelectedEndpointId('')}
                selectedEndpointId={selectedEndpointId}
                onSelectEndpoint={setSelectedEndpointId}
              />
            )
          })}
        </div>
      </div>

      {selectedEndpoint && <SidePanel endpoint={selectedEndpoint} onClose={onClose} />}
    </div>
  )
}
