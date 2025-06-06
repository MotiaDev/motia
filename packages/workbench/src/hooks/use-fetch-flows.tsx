import { useCallback, useEffect, useState } from 'react'
import { FlowConfigResponse, FlowResponse } from '@/views/flow/hooks/use-get-flow-state'
import { useWatchFlow } from '@/hooks/use-watch-flow'

export const useFetchFlows = (flowId: string) => {
  const newFlow = useWatchFlow(flowId)
  const [flow, setFlow] = useState<FlowResponse | null>(null)
  const [flowConfig, setFlowConfig] = useState<FlowConfigResponse | null>(null)

  const fetchFlow = useCallback(() => {
    Promise.all([fetch(`/flows/${flowId}`), fetch(`/flows/${flowId}/config`)])
      .then(([flowRes, configRes]) => Promise.all([flowRes.json(), configRes.json()]))
      .then(([flowData, configData]) => {
        setFlow(flowData)
        setFlowConfig(configData)
      })
      .catch((error) => {
        console.error('Failed to fetch flow:', error)
        setFlow(null)
        setFlowConfig(null)
      })
  }, [flowId])

  useEffect(() => {
    if (flowId) {
      fetchFlow()
    }
  }, [fetchFlow, flowId])

  useEffect(() => {
    if (newFlow?.data) {
      setFlow(newFlow.data)
    }
  }, [newFlow])

  return {
    flow,
    flowConfig,
  }
}
