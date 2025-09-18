import { useStreamGroup } from '@motiadev/stream-client-react'
import { ApiEndpoint } from '../types/endpoint'

export const useGetEndpoints = () => {
  const { data: endpoints } = useStreamGroup<ApiEndpoint>({
    streamName: '__motia.api-endpoints',
    groupId: 'default',
  })

  return endpoints
}
