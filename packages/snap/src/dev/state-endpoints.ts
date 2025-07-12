import { MotiaServer, StateAdapter } from '@motiadev/core'

export const stateEndpoints = (server: MotiaServer, stateAdapter: StateAdapter) => {
  const { app } = server

  app.get('/motia/state', async (req, res) => {
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

  app.post('/motia/state', async (req, res) => {
    try {
      const { key, groupId, value } = req.body
      await stateAdapter.set(groupId, key, value)
      res.json({ key, groupId, value })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })
}
