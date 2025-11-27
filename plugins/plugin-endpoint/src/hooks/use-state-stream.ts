import { useStreamItem } from '@motiadev/stream-client-react'

export const useStateStream = (object: Record<string, any> | undefined) => {
  const { __motia, ...rest } = object || {}
  const { data } = useStreamItem(__motia)
  const originalData = Array.isArray(object) ? object : rest || object

  return {
    data: data || originalData,
    originalData,
    isStreamed: !!__motia,
  }
}
