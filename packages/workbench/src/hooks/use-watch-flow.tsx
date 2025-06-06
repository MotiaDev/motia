import { useListFlows } from '@/hooks/use-list-flows'

export const useWatchFlow = (flowId: string) => {
  const { flows } = useListFlows()
  return flows.find(({ id }) => id === flowId)
}
