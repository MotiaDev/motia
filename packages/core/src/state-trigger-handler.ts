import { callStepFile } from './call-step-file'
import { hasStateTrigger, getTriggersByType } from './guards'
import { globalLogger } from './logger'
import { Motia } from './motia'
import { Event, Step, StateTrigger, InternalStateManager } from './types'

export type MotiaStateManager = {
  createStateHandler: (step: Step) => void
  removeStateHandler: (step: Step) => void
  checkStateTriggers: (traceId: string, key: string, value: any) => Promise<void>
  clearAllHandlers: () => void
}

// Map to track state triggers by key
const stateTriggersByKey = new Map<string, Set<Step>>()

export const createStateHandlers = (motia: Motia): MotiaStateManager => {
  const stateSteps = motia.lockedData.stepsWithStateTriggers()

  globalLogger.debug(`[state handler] creating state handlers for ${stateSteps.length} steps`)

  const createStateHandler = (step: Step) => {
    if (!hasStateTrigger(step)) {
      return // No state triggers, nothing to do
    }

    const { config, filePath } = step
    const { name } = config
    const stateTriggers = getTriggersByType(step, 'state')

    globalLogger.debug('[state handler] establishing state subscriptions', { filePath, step: step.config.name })

    stateTriggers.forEach((stateTrigger: StateTrigger) => {
      const { key } = stateTrigger
      
      // Add step to the set of steps watching this key
      if (!stateTriggersByKey.has(key)) {
        stateTriggersByKey.set(key, new Set())
      }
      stateTriggersByKey.get(key)!.add(step)
    })
  }

  const removeStateHandler = (step: Step) => {
    if (!hasStateTrigger(step)) {
      return // No state triggers, nothing to do
    }

    const stateTriggers = getTriggersByType(step, 'state')

    stateTriggers.forEach((stateTrigger: StateTrigger) => {
      const { key } = stateTrigger
      const stepsForKey = stateTriggersByKey.get(key)
      
      if (stepsForKey) {
        stepsForKey.delete(step)
        
        // Clean up empty sets
        if (stepsForKey.size === 0) {
          stateTriggersByKey.delete(key)
        }
      }
    })
  }

  const checkStateTriggers = async (traceId: string, key: string, value: any) => {
    const stepsForKey = stateTriggersByKey.get(key)
    
    if (!stepsForKey || stepsForKey.size === 0) {
      return // No steps watching this key
    }

    globalLogger.debug('[state handler] checking state triggers', { key, value, stepCount: stepsForKey.size })

    // Check each step that's watching this key
    for (const step of stepsForKey) {
      const stateTriggers = getTriggersByType(step, 'state')
      
      for (const stateTrigger of stateTriggers) {
        if (stateTrigger.key !== key) {
          continue // This trigger is for a different key
        }

        // If no condition is specified, trigger on any state change
        if (!stateTrigger.condition) {
          await triggerStep(step, { key, value, traceId })
          continue
        }

        // Check if the condition is met
        try {
          const conditionMet = stateTrigger.condition(value, motia.state)
          
          if (conditionMet) {
            await triggerStep(step, { key, value, traceId })
          }
        } catch (error: any) {
          globalLogger.error('[state handler] condition evaluation failed', { 
            step: step.config.name, 
            key, 
            error: error.message 
          })
        }
      }
    }
  }

  const triggerStep = async (step: Step, data: { key: string; value: any; traceId: string }) => {
    const { config, filePath } = step
    const { name } = config

    globalLogger.debug('[state handler] triggering step', { step: name, key: data.key })

    try {
      // Create logger and tracer for the step execution
      const logger = motia.loggerFactory.create({ traceId: data.traceId, stepName: name })
      const tracer = await motia.tracerFactory.createTracer(data.traceId, step, logger)

      await callStepFile({ step, data, traceId: data.traceId, tracer, logger }, motia)
    } catch (error: any) {
      const message = typeof error === 'string' ? error : error.message
      globalLogger.error('[state handler] step execution failed', { step: name, error: message })
    }
  }

  const clearAllHandlers = () => {
    stateTriggersByKey.clear()
  }

  // Initialize handlers for existing steps
  stateSteps.forEach(createStateHandler)

  return {
    createStateHandler,
    removeStateHandler,
    checkStateTriggers,
    clearAllHandlers,
  }
}
