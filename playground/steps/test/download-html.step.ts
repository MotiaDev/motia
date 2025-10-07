import fs from 'fs/promises'
import path from 'path'
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Download HTML',
  description: 'Download sample HTML file',
  flows: ['files'],
  method: 'GET',
  path: '/files/index.html',
  responseSchema: {
    200: z.any({ description: 'HTML File' }),
  },
  emits: [],
}

export const handler: Handlers['Download HTML'] = async (_req, { logger }) => {
  logger.info('Downloading HTML file')

  const buffer = await fs.readFile(path.join(__dirname, 'index.html'))

  return {
    status: 200,
    body: buffer,
    headers: { 'Content-Type': 'text/html' },
  }
}
