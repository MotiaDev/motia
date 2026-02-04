import type { Step, TriggerConfig } from './types'

// Type aliases to avoid deep type instantiation
type ApiTriggerType = Extract<TriggerConfig, { type: 'api' }>
type EventTriggerType = Extract<TriggerConfig, { type: 'event' }>
type CronTriggerType = Extract<TriggerConfig, { type: 'cron' }>
type StateTriggerType = Extract<TriggerConfig, { type: 'state' }>
type StreamTriggerType = Extract<TriggerConfig, { type: 'stream' }>

export const isApiTrigger = (trigger: TriggerConfig): trigger is ApiTriggerType => trigger.type === 'api'

export const isEventTrigger = (trigger: TriggerConfig): trigger is EventTriggerType => trigger.type === 'event'

export const isCronTrigger = (trigger: TriggerConfig): trigger is CronTriggerType => trigger.type === 'cron'

export const isStateTrigger = (trigger: TriggerConfig): trigger is StateTriggerType => trigger.type === 'state'

export const isStreamTrigger = (trigger: TriggerConfig): trigger is StreamTriggerType => trigger.type === 'stream'

export const getApiTriggers = (step: Step): ApiTriggerType[] => step.config.triggers.filter(isApiTrigger)

export const getEventTriggers = (step: Step): EventTriggerType[] => step.config.triggers.filter(isEventTrigger)

export const getCronTriggers = (step: Step): CronTriggerType[] => step.config.triggers.filter(isCronTrigger)
