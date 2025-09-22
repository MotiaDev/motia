import {
  CronManager,
  hasApiTrigger,
  hasCronTrigger,
  hasEventTrigger,
  hasStateTrigger,
  LockedData,
  MotiaEventManager,
  MotiaServer,
  MotiaStateManager,
  Step,
  trackEvent,
} from '@motiadev/core'
import type { Stream } from '@motiadev/core/dist/src/types-stream'
import path from 'path'
import { Watcher } from './watcher'

export const createDevWatchers = (
  lockedData: LockedData,
  server: MotiaServer,
  eventHandler: MotiaEventManager,
  cronManager: CronManager,
  stateManager: MotiaStateManager,
) => {
  const stepDir = path.join(process.cwd(), 'steps')
  const watcher = new Watcher(stepDir, lockedData)

  watcher.onStreamChange((oldStream: Stream, stream: Stream) => {
    trackEvent('stream_updated', {
      streamName: stream.config.name,
      type: stream.config.baseConfig.storageType,
    })

    return lockedData.updateStream(oldStream, stream)
  })

  watcher.onStreamCreate((stream: Stream) => {
    trackEvent('stream_created', {
      streamName: stream.config.name,
      type: stream.config.baseConfig.storageType,
    })

    return lockedData.createStream(stream)
  })

  watcher.onStreamDelete((stream: Stream) => {
    trackEvent('stream_deleted', {
      streamName: stream.config.name,
      type: stream.config.baseConfig.storageType,
    })

    return lockedData.deleteStream(stream)
  })

  watcher.onStepChange((oldStep: Step, newStep: Step) => {
    if (hasApiTrigger(oldStep)) server.removeRoute(oldStep)
    if (hasCronTrigger(oldStep)) cronManager.removeCronJob(oldStep)
    if (hasEventTrigger(oldStep)) eventHandler.removeHandler(oldStep)
    if (hasStateTrigger(oldStep)) stateManager.removeStateHandler(oldStep)

    const isUpdated = lockedData.updateStep(oldStep, newStep)

    if (isUpdated) {
      trackEvent('step_updated', {
        stepName: newStep.config.name,
        triggers: newStep.config.triggers.map(t => t.type),
      })

      if (hasCronTrigger(newStep)) cronManager.createCronJob(newStep)
      if (hasEventTrigger(newStep)) eventHandler.createHandler(newStep)
      if (hasApiTrigger(newStep)) server.addRoute(newStep)
      if (hasStateTrigger(newStep)) stateManager.createStateHandler(newStep)
    }
  })

  watcher.onStepCreate((step: Step) => {
    const isCreated = lockedData.createStep(step)

    if (isCreated) {
      trackEvent('step_created', {
        stepName: step.config.name,
        triggers: step.config.triggers.map(t => t.type),
      })

      if (hasApiTrigger(step)) server.addRoute(step)
      if (hasEventTrigger(step)) eventHandler.createHandler(step)
      if (hasCronTrigger(step)) cronManager.createCronJob(step)
      if (hasStateTrigger(step)) stateManager.createStateHandler(step)
    }
  })

  watcher.onStepDelete((step: Step) => {
    trackEvent('step_deleted', {
      stepName: step.config.name,
      triggers: step.config.triggers.map(t => t.type),
    })

    if (hasApiTrigger(step)) server.removeRoute(step)
    if (hasEventTrigger(step)) eventHandler.removeHandler(step)
    if (hasCronTrigger(step)) cronManager.removeCronJob(step)
    if (hasStateTrigger(step)) stateManager.removeStateHandler(step)

    lockedData.deleteStep(step)
  })

  return watcher
}
