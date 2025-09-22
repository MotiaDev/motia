import { ApiResponse, ApiRouteConfig, ApiRouteHandler } from '../types'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Clear State',
  description: 'System endpoint for clearing state data',
  path: '/__motia/clear-state',
  method: 'POST',
  emits: [],
  flows: ['_system'],
  bodySchema: z.object({
    traceId: z.string().optional(),
  }),
}

type ClearStateData = { traceId?: string }

export const handler: ApiRouteHandler<
  ClearStateData,
  ApiResponse<200, { message: string; traceId?: string }> | ApiResponse<500, { message: string; traceId?: string }>,
  ClearStateData
> = async (req, { state, logger }) => {
  const { traceId } = req.body

  logger.info('[Clear State] Clearing state data', { traceId: traceId || 'all' })

  try {
    if (traceId === 'all') {
      // Clear all state by getting all traceIds and clearing each one
      const stateAdapter = state as any
      logger.info('[Clear State] Attempting to clear all state data')
      
      try {
        // Try to get traceIds from the state adapter
        if (stateAdapter.traceIds && typeof stateAdapter.traceIds === 'function') {
          const allTraceIds = await stateAdapter.traceIds()
          logger.info('[Clear State] Found traceIds to clear', { count: allTraceIds.length, traceIds: allTraceIds })
          
          for (const id of allTraceIds) {
            await state.clear(id)
            logger.debug('[Clear State] Cleared traceId', { traceId: id })
          }
          
          logger.info('[Clear State] Cleared all state data', { clearedTraceIds: allTraceIds.length })
        } else {
          // Fallback: manually extract traceIds from the state file
          logger.info('[Clear State] traceIds method not available, using fallback approach')
          const fs = require('fs')
          const path = require('path')
          const stateFilePath = path.join(process.cwd(), '.motia', 'motia.state.json')
          
          if (fs.existsSync(stateFilePath)) {
            const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'))
            const traceIds = new Set<string>()
            
            // Extract unique traceIds from state keys
            Object.keys(stateData).forEach(key => {
              const traceId = key.split(':')[0]
              if (traceId) {
                traceIds.add(traceId)
              }
            })
            
            const allTraceIds = Array.from(traceIds)
            logger.info('[Clear State] Found traceIds to clear (fallback)', { count: allTraceIds.length, traceIds: allTraceIds })
            
            for (const id of allTraceIds) {
              await state.clear(id)
              logger.debug('[Clear State] Cleared traceId', { traceId: id })
            }
            
            logger.info('[Clear State] Cleared all state data (fallback)', { clearedTraceIds: allTraceIds.length })
          } else {
            logger.warn('[Clear State] State file not found', { stateFilePath })
          }
        }
      } catch (error) {
        logger.error('[Clear State] Error clearing state', { error: error instanceof Error ? error.message : 'Unknown error' })
        throw error
      }
    } else if (traceId) {
      // Clear specific traceId
      await state.clear(traceId)
      logger.info('[Clear State] Cleared state for traceId', { traceId })
    } else {
      logger.warn('[Clear State] No traceId provided - this might not work as expected')
    }

    return {
      status: 200,
      body: { 
        message: 'State cleared successfully', 
        traceId: traceId || 'all' 
      },
    }
  } catch (error) {
    logger.error('[Clear State] Failed to clear state', { error: error instanceof Error ? error.message : 'Unknown error' })
    return {
      status: 500,
      body: { 
        message: 'Failed to clear state',
        traceId: traceId || 'all'
      },
    }
  }
}
