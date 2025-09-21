import { Step, Emit } from './types'
import { hasApiTrigger, hasCronTrigger, hasEventTrigger } from './guards'

const toTopic = (emit: Emit) => (typeof emit === 'string' ? emit : emit.topic)

export const isAllowedToEmit = (step: Step, emit: string): boolean => {
  // Only steps with triggers (not noop steps) can emit
  if (step.config.triggers.length === 0) return false

  // Check if step has any of the supported trigger types
  if (!hasApiTrigger(step) && !hasCronTrigger(step) && !hasEventTrigger(step)) return false

  // If no emits are defined, allow all emissions
  if (!step.config.emits || step.config.emits.length === 0) return true

  const emitsTopics = step.config.emits.map(toTopic)
  return emitsTopics.includes(emit)
}
