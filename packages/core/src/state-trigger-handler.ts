import { callStepFile } from './call-step-file'
import { hasStateTrigger, getTriggersByType } from './guards'
import { globalLogger } from './logger'
import { Motia } from './motia'
import { Event, Step, StateTrigger, InternalStateManager } from './types'

export type MotiaStateManager = {
  createStateHandler: (step: Step) => void
  removeStateHandler: (step: Step) => void
  checkStateTriggers: (traceId: string, key: string, value: any, depth?: number) => Promise<void>
  clearAllHandlers: () => void
}

// Map to track state triggers by key
const stateTriggersByKey = new Map<string, Set<Step>>()

// Track active state changes to prevent infinite loops
const activeStateChanges = new Set<string>()

// Configuration for loop prevention
const MAX_STATE_CHANGE_DEPTH = 10
const STATE_CHANGE_TIMEOUT = 5000 // 5 seconds

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

    globalLogger.debug('[state handler] establishing state subscriptions', {
      filePath,
      step: step.config.name,
      stepId: `${filePath}:${name}`,
      stateTriggersCount: stateTriggers.length,
    })

    stateTriggers.forEach((stateTrigger: StateTrigger) => {
      const { key } = stateTrigger

      // Add step to the set of steps watching this key
      if (!stateTriggersByKey.has(key)) {
        stateTriggersByKey.set(key, new Set())
      }

      const stepsForKey = stateTriggersByKey.get(key)!
      const beforeSize = stepsForKey.size
      stepsForKey.add(step)
      const afterSize = stepsForKey.size

      globalLogger.debug('[state handler] added step to state trigger', {
        key,
        step: step.config.name,
        beforeSize,
        afterSize,
        wasNew: beforeSize !== afterSize,
      })
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

  const checkStateTriggers = async (traceId: string, key: string, value: any, depth: number = 0) => {
    // Prevent infinite loops
    if (depth >= MAX_STATE_CHANGE_DEPTH) {
      globalLogger.warn('[state handler] maximum state change depth reached, stopping to prevent infinite loop', {
        key,
        depth,
        maxDepth: MAX_STATE_CHANGE_DEPTH,
      })
      return
    }

    // Create a unique identifier for this state change
    const stateChangeId = `${traceId}:${key}:${depth}`

    // Check if this state change is already being processed
    if (activeStateChanges.has(stateChangeId)) {
      globalLogger.warn('[state handler] state change already being processed, skipping to prevent loop', {
        key,
        stateChangeId,
        depth,
      })
      return
    }

    // Mark this state change as active
    activeStateChanges.add(stateChangeId)

    // Set a timeout to clean up the active state change
    setTimeout(() => {
      activeStateChanges.delete(stateChangeId)
    }, STATE_CHANGE_TIMEOUT)

    const stepsForKey = stateTriggersByKey.get(key)

    if (!stepsForKey || stepsForKey.size === 0) {
      activeStateChanges.delete(stateChangeId)
      return // No steps watching this key
    }

    globalLogger.debug('[state handler] checking state triggers', {
      key,
      value,
      depth,
      stepCount: stepsForKey.size,
      stepNames: Array.from(stepsForKey).map((s) => s.config.name),
    })

    // Deduplicate steps by name to prevent multiple triggers for the same logical step
    const uniqueSteps = new Map<string, Step>()
    for (const step of stepsForKey) {
      const stepKey = `${step.filePath}:${step.config.name}`
      if (!uniqueSteps.has(stepKey)) {
        uniqueSteps.set(stepKey, step)
      }
    }

    globalLogger.debug('[state handler] deduplicated steps', {
      originalCount: stepsForKey.size,
      uniqueCount: uniqueSteps.size,
      uniqueStepNames: Array.from(uniqueSteps.values()).map((s) => s.config.name),
    })

    // Check each unique step that's watching this key
    for (const step of uniqueSteps.values()) {
      const stateTriggers = getTriggersByType(step, 'state')

      globalLogger.debug('[state handler] processing step', {
        stepName: step.config.name,
        stateTriggersCount: stateTriggers.length,
        triggers: stateTriggers.map((t) => ({ key: t.key, hasCondition: !!t.condition })),
      })

      for (const stateTrigger of stateTriggers) {
        if (stateTrigger.key !== key) {
          continue // This trigger is for a different key
        }

        globalLogger.debug('[state handler] evaluating trigger', {
          stepName: step.config.name,
          key,
          value,
          hasCondition: !!stateTrigger.condition,
        })

        // If no condition is specified, trigger on any state change
        if (!stateTrigger.condition) {
          globalLogger.debug('[state handler] triggering step (no condition)', { step: step.config.name })
          await triggerStep(step, { key, value, traceId, depth })
          continue
        }

        // Check if the condition is met
        try {
          let conditionFunction: (input: any, state: InternalStateManager) => boolean

          // If condition is a string (serialized function), reconstruct it
          if (typeof stateTrigger.condition === 'string') {
            try {
              // Reconstruct the function from the string
              conditionFunction = new Function(
                'value',
                'state',
                `return (${stateTrigger.condition})(value, state)`,
              ) as (input: any, state: InternalStateManager) => boolean
            } catch (reconstructError: any) {
              globalLogger.error('[state handler] failed to reconstruct condition function', {
                step: step.config.name,
                key,
                error: reconstructError.message,
              })
              continue
            }
          } else if (typeof stateTrigger.condition === 'function') {
            conditionFunction = stateTrigger.condition
          } else {
            globalLogger.error('[state handler] invalid condition type', {
              step: step.config.name,
              key,
              conditionType: typeof stateTrigger.condition,
            })
            continue
          }

          const conditionMet = conditionFunction(value, motia.state)
          globalLogger.debug('[state handler] condition result', {
            stepName: step.config.name,
            key,
            value,
            conditionMet,
          })

          if (conditionMet) {
            globalLogger.debug('[state handler] triggering step (condition met)', { step: step.config.name })
            await triggerStep(step, { key, value, traceId, depth })
          } else {
            globalLogger.debug('[state handler] condition not met, skipping', { step: step.config.name })
          }
        } catch (error: any) {
          globalLogger.error('[state handler] condition evaluation failed', {
            step: step.config.name,
            key,
            error: error.message,
          })
        }
      }
    }

    // Clean up the active state change
    activeStateChanges.delete(stateChangeId)
  }

  const triggerStep = async (step: Step, data: { key: string; value: any; traceId: string; depth: number }) => {
    const { config, filePath } = step
    const { name } = config

    globalLogger.debug('[state handler] triggering step', { step: name, key: data.key, depth: data.depth })

    try {
      // Create logger and tracer for the step execution
      const logger = motia.loggerFactory.create({ traceId: data.traceId, stepName: name })
      const tracer = await motia.tracerFactory.createTracer(data.traceId, step, logger)

      // Pass the depth through to the step execution so it can be used in subsequent state operations
      await callStepFile({ step, data: { ...data, depth: data.depth }, traceId: data.traceId, tracer, logger }, motia)
    } catch (error: any) {
      const message = typeof error === 'string' ? error : error.message
      globalLogger.error('[state handler] step execution failed', { step: name, error: message })
    }
  }

  const clearAllHandlers = () => {
    stateTriggersByKey.clear()
    activeStateChanges.clear()
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
