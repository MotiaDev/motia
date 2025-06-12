import request from 'supertest'
import { createServer, createStateAdapter, createStepHandlers, Event, Logger } from '@motiadev/core'
import { generateLockedData } from 'motia'
import { createEventManager } from './event-manager'
import { CapturedEvent, MotiaTester } from './types'
import path from 'path'

export const createMotiaTester = (): MotiaTester => {
  const eventManager = createEventManager()
  const promise = (async () => {
    const lockedData = await generateLockedData(path.join(process.cwd()), 'memory')
    const state = createStateAdapter({ adapter: 'memory' })
    const { server, socketServer, close } = await createServer(lockedData, eventManager, state, {
      isVerbose: true,
    })

    createStepHandlers(lockedData, eventManager, state)

    return { server, socketServer, eventManager, state, close }
  })()

  const logger: Logger = new Logger('', [], '', true)

  return {
    logger,
    waitEvents: async () => {
      const { eventManager } = await promise
      await eventManager.waitEvents()
    },
    post: async (path, options) => {
      const { server } = await promise
      return request(server).post(path).send(options.body)
    },
    get: async (path, options) => {
      const { server } = await promise
      return request(server).get(path).send(options.body)
    },
    emit: async (event) => {
      return eventManager.emit(event)
    },
    watch: async <TData>(event: string) => {
      const events: CapturedEvent<TData>[] = []

      eventManager.subscribe({
        event,
        filePath: '$watcher',
        handlerName: '$watcher',
        handler: async (event: Event<TData>) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { logger, ...rest } = event
          events.push(rest)
        },
      })

      return {
        getCapturedEvents: () => events,
        getLastCapturedEvent: () => events[events.length - 1],
        getCapturedEvent: (index) => events[index],
      }
    },
    sleep: async (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
    close: async () => {
      const { close } = await promise
      await close()
    },
  }
}
