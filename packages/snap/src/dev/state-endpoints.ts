import { MotiaServer, StateAdapter } from '@motiadev/core'

export const stateEndpoints = (server: MotiaServer, stateAdapter: StateAdapter) => {
  const { app } = server

  app.get('/__motia/state', async (req, res) => {
    try {
      const groupId = req.query.groupId as string | undefined
      const filter = req.query.filter ? JSON.parse(req.query.filter as string) : undefined
      const items = await stateAdapter.items({ groupId, filter })

      res.json(items)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  app.post('/__motia/state', async (req, res) => {
    try {
      const { key, groupId, value, operation } = req.body

      if (operation) {
        // Handle atomic operations
        let result: any

        switch (operation) {
          case 'increment':
            result = await stateAdapter.increment(groupId, key, value?.delta || 1)
            break
          case 'decrement':
            result = await stateAdapter.decrement(groupId, key, value?.delta || 1)
            break
          case 'push':
            result = await stateAdapter.push(groupId, key, ...(value?.items || []))
            break
          case 'pop':
            result = await stateAdapter.pop(groupId, key)
            break
          case 'shift':
            result = await stateAdapter.shift(groupId, key)
            break
          case 'unshift':
            result = await stateAdapter.unshift(groupId, key, ...(value?.items || []))
            break
          case 'setField':
            result = await stateAdapter.setField(groupId, key, value?.field, value?.fieldValue)
            break
          case 'deleteField':
            result = await stateAdapter.deleteField(groupId, key, value?.field)
            break
          case 'compareAndSwap':
            result = await stateAdapter.compareAndSwap(groupId, key, value?.expected, value?.newValue)
            break
          case 'exists':
            result = await stateAdapter.exists(groupId, key)
            break
          case 'transaction':
            result = await stateAdapter.transaction(groupId, value?.operations || [])
            break
          case 'batch':
            result = await stateAdapter.batch(groupId, value?.operations || [])
            break
          default:
            throw new Error(`Unknown operation: ${operation}`)
        }

        res.json({ key, groupId, operation, result })
      } else {
        // Handle regular set operation
        await stateAdapter.set(groupId, key, value)
        res.json({ key, groupId, value })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })
}
