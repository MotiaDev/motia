import { useMemo } from 'react'
import { Trace, TraceFilter } from '@/types/observability'
import { useStreamGroup } from '@motiadev/stream-client-react'

export const useObservabilityListener = (filters: TraceFilter = {}) => {
  const { data: allTraces } = useStreamGroup<Trace>({ streamName: '__motia.observability', groupId: 'traces' })

  const filteredTraces = useMemo(() => {
    if (!allTraces) return []

    return allTraces
      .filter((trace) => {
        if (filters.flowName && trace.flowName !== filters.flowName) {
          return false
        }

        if (filters.status && trace.status !== filters.status) {
          return false
        }

        if (filters.stepName) {
          const hasMatchingStep = trace.steps.some((step) =>
            step.name.toLowerCase().includes(filters.stepName!.toLowerCase()),
          )
          if (!hasMatchingStep) {
            return false
          }
        }

        if (filters.correlationId && trace.correlationId !== filters.correlationId) {
          return false
        }

        if (filters.startTime) {
          if (filters.startTime.from && trace.startTime < filters.startTime.from) {
            return false
          }
          if (filters.startTime.to && trace.startTime > filters.startTime.to) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => b.startTime - a.startTime)
  }, [allTraces, filters])

  return useMemo(() => {
    if (!filters.limit) return filteredTraces
    return filteredTraces.slice(0, filters.limit)
  }, [filteredTraces, filters.limit])
}
