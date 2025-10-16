import type { Express } from 'express'
import type { TracerFactory } from '../observability'

export const traceEndpoint = (app: Express, tracerFactory: TracerFactory) => {
  app.post('/__motia/trace/clear', async (req, res) => {
    await tracerFactory.clear()
    res.json({ message: 'Traces cleared' })
  })
}
