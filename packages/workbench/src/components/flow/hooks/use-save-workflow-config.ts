import { useCallback } from 'react'
import type { FlowConfigResponse } from '../../../types/flow'

export const useSaveWorkflowConfig = () => {
  return useCallback(async (body: FlowConfigResponse) => {
    try {
      const response = await fetch(`/__motia/flows/${body.id}/config`, {
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
}
