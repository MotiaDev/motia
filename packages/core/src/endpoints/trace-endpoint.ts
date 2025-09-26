import { Express } from 'express'
import { TracerFactory } from '../observability'

export const traceEndpoint = (app: Express, tracerFactory: TracerFactory) => {
  app.post('/__motia/trace/clear', async (req, res) => {
    await tracerFactory.clear()
    res.json({ message: 'Traces cleared' })
  })
}
