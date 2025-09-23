import { Step, Trigger } from './types'

// Helper functions to check trigger types in the new unified structure
export const hasApiTrigger = (step: Step): boolean => step.config.triggers.some((trigger) => trigger.type === 'api')

export const hasEventTrigger = (step: Step): boolean => step.config.triggers.some((trigger) => trigger.type === 'event')

export const hasCronTrigger = (step: Step): boolean => step.config.triggers.some((trigger) => trigger.type === 'cron')

export const hasStateTrigger = (step: Step): boolean => step.config.triggers.some((trigger) => trigger.type === 'state')

// Helper to get triggers of a specific type
export const getTriggersByType = <T extends Trigger['type']>(step: Step, type: T): Extract<Trigger, { type: T }>[] =>
  step.config.triggers.filter((trigger): trigger is Extract<Trigger, { type: T }> => trigger.type === type)
