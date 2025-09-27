import { useStreamGroup } from '@motiadev/stream-client-react'
import { ApiEndpoint } from '../types/endpoint'
import { useMemo } from 'react'

export const useGetEndpoints = () => {
  const { data: endpoints } = useStreamGroup<ApiEndpoint>({
    streamName: '__motia.api-endpoints',
    groupId: 'default',
  })

  const groupedEndpoints = useMemo(() => {
    return endpoints.reduce(
      (acc, endpoint) => {
        endpoint.flows?.forEach((flow) => {
          acc[flow] = acc[flow] || []
          acc[flow].push(endpoint)
        })

        if (endpoint.flows?.length == 0) {
          acc['no-flow'] = acc['no-flow'] || []
          acc['no-flow'].push(endpoint)
        }
        return acc
      },
      {} as Record<string, ApiEndpoint[]>,
    )
  }, [endpoints])

  return { endpoints, groupedEndpoints }
}
