import { useCallback } from 'react'
import { FlowConfigResponse } from '@/views/flow/hooks/use-get-flow-state'

export const useSaveWorkflowConfig = () => {
  const saveConfig = useCallback(async (body: FlowConfigResponse) => {
    try {
      const response = await fetch(`/flows/${body.id}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Failed to save config: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error saving workflow config:', error)
      throw error
    }
  }, [])

  return { saveConfig }
}
