import type { ApiTrigger, CronTrigger, EventTrigger, StateTrigger, Step, TriggerConfig } from './types'

export const isApiTrigger = (trigger: TriggerConfig): trigger is ApiTrigger => trigger.type === 'api'

export const isEventTrigger = (trigger: TriggerConfig): trigger is EventTrigger => trigger.type === 'event'

export const isCronTrigger = (trigger: TriggerConfig): trigger is CronTrigger => trigger.type === 'cron'

export const isStateTrigger = (trigger: TriggerConfig): trigger is StateTrigger => trigger.type === 'state'

export const getApiTriggers = (step: Step): ApiTrigger[] => step.config.triggers.filter(isApiTrigger)

export const getEventTriggers = (step: Step): EventTrigger[] => step.config.triggers.filter(isEventTrigger)

export const getCronTriggers = (step: Step): CronTrigger[] => step.config.triggers.filter(isCronTrigger)
