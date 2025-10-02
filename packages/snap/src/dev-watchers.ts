import {
  CronManager,
  isApiStep,
  isCronStep,
  isEventStep,
  LockedData,
  MotiaEventManager,
  MotiaServer,
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
  stepDirs: string[],
) => {
  const watcher = new Watcher(stepDirs, lockedData, process.cwd())

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
    if (isApiStep(oldStep)) server.removeRoute(oldStep)
    if (isCronStep(oldStep)) cronManager.removeCronJob(oldStep)
    if (isEventStep(oldStep)) eventHandler.removeHandler(oldStep)

    const isUpdated = lockedData.updateStep(oldStep, newStep)

    if (isUpdated) {
      trackEvent('step_updated', {
        stepName: newStep.config.name,
        type: newStep.config.type,
      })

      if (isCronStep(newStep)) cronManager.createCronJob(newStep)
      if (isEventStep(newStep)) eventHandler.createHandler(newStep)
      if (isApiStep(newStep)) server.addRoute(newStep)
    }
  })

  watcher.onStepCreate((step: Step) => {
    const isCreated = lockedData.createStep(step)

    if (isCreated) {
      trackEvent('step_created', {
        stepName: step.config.name,
        type: step.config.type,
      })

      if (isApiStep(step)) server.addRoute(step)
      if (isEventStep(step)) eventHandler.createHandler(step)
      if (isCronStep(step)) cronManager.createCronJob(step)
    }
  })

  watcher.onStepDelete((step: Step) => {
    trackEvent('step_deleted', {
      stepName: step.config.name,
      type: step.config.type,
    })

    if (isApiStep(step)) server.removeRoute(step)
    if (isEventStep(step)) eventHandler.removeHandler(step)
    if (isCronStep(step)) cronManager.removeCronJob(step)

    lockedData.deleteStep(step)
  })

  return watcher
}
