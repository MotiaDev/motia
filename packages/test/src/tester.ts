import { createServer, createStateAdapter, Event, Logger } from '@motiadev/core'
import { generateLockedData } from 'motia'
import path from 'path'
import request from 'supertest'
import { createEventManager } from './event-manager'
import { CapturedEvent, MotiaTester } from './types'

export const createMotiaTester = (): MotiaTester => {
  const eventManager = createEventManager()
  const logger = new Logger()

  const promise = (async () => {
    const lockedData = await generateLockedData(path.join(process.cwd()), 'memory', 'disabled')
    const state = createStateAdapter({ adapter: 'memory' })
    const { server, socketServer, close } = createServer(lockedData, eventManager, state, { isVerbose: false })

    return { server, socketServer, eventManager, state, close }
  })()

  return {
    logger,
    state: {
      get: async (userId: string, key: string) => promise.then(({ state }) => state.get(userId, key)),
      set: async (userId: string, key: string, value: any) =>
        promise.then(({ state }) => state.set(userId, key, value)),
      update: async (userId: string, key: string, updateFn: (current: any) => any) =>
        promise.then(({ state }) => state.update(userId, key, updateFn)),
      delete: async (userId: string, key: string) =>
        promise.then(({ state }) => state.delete(userId, key).then(() => {})),
      clear: async (userId: string) => promise.then(({ state }) => state.clear(userId)),
      getGroup: async (userId: string) => promise.then(({ state }) => state.getGroup(userId)),
    },
    waitEvents: async () => promise.then(({ eventManager }) => eventManager.waitEvents()),
    post: async (path, options) => promise.then(({ server }) => request(server).post(path).send(options.body)),
    get: async (path, options) => promise.then(({ server }) => request(server).get(path).send(options.body)),
    emit: async (event) => eventManager.emit(event),
    watch: async <TData>(event: string) => {
      const events: CapturedEvent<TData>[] = []

      eventManager.subscribe({
        event,
        filePath: '$watcher',
        handlerName: '$watcher',
        handler: async (event: Event<TData>) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { logger, tracer, ...rest } = event
          events.push(rest)
        },
      })

      return {
        getCapturedEvents: () => events,
        getLastCapturedEvent: () => events[events.length - 1],
        getCapturedEvent: (index) => events[index],
      }
    },
    sleep: async (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    close: async () => promise.then(({ close }) => close()),
  }
}
