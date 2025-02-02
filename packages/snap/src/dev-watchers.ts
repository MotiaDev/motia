import {
  isApiStep,
  LockedData,
  MotiaServer,
  MotiaEventManager,
  isEventStep,
  isCronStep,
  CronManager,
} from '@motiadev/core'
import { Step } from '@motiadev/core'
import { Watcher } from './watcher'
import path from 'path'

export const createDevWatchers = (
  lockedData: LockedData,
  server: MotiaServer,
  eventHandler: MotiaEventManager,
  cronManager: CronManager,
) => {
  const stepDir = path.join(process.cwd(), 'steps')
  const watcher = new Watcher(stepDir, lockedData)

  lockedData.on('flow-created', (flowName: string) => {
    server.socketServer.emit('flow-created', flowName)
  })

  lockedData.on('flow-removed', (flowName: string) => {
    server.socketServer.emit('flow-removed', flowName)
  })

  lockedData.on('flow-updated', (flowName: string) => {
    server.socketServer.emit('flow-updated', flowName)
  })

  watcher.onStepChange((oldStep: Step, newStep: Step) => {
    if (isApiStep(oldStep)) server.removeRoute(oldStep)
    if (isCronStep(oldStep)) cronManager.removeCronJob(oldStep)
    if (isEventStep(oldStep)) eventHandler.removeHandler(oldStep)

    const isUpdated = lockedData.updateStep(oldStep, newStep)

    if (isUpdated) {
      if (isCronStep(newStep)) cronManager.createCronJob(newStep)
      if (isEventStep(newStep)) eventHandler.createHandler(newStep)
      if (isApiStep(newStep)) server.addRoute(newStep)
    }
  })

  watcher.onStepCreate((step: Step) => {
    const isCreated = lockedData.createStep(step)

    if (isCreated) {
      if (isApiStep(step)) server.addRoute(step)
      if (isEventStep(step)) eventHandler.createHandler(step)
      if (isCronStep(step)) cronManager.createCronJob(step)
    }
  })

  watcher.onStepDelete((step: Step) => {
    if (isApiStep(step)) server.removeRoute(step)
    if (isEventStep(step)) eventHandler.removeHandler(step)
    if (isCronStep(step)) cronManager.removeCronJob(step)

    lockedData.deleteStep(step)
  })

  return watcher
}
