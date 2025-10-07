import fs from 'fs/promises'
import path from 'path'
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Download PDF',
  description: 'Download sample PDF file',
  flows: ['files'],
  method: 'GET',
  path: '/files/sample.pdf',
  responseSchema: {
    200: z.any({ description: 'PDF File' }),
  },
  emits: [],
}

export const handler: Handlers['Download PDF'] = async (_req, { logger }) => {
  logger.info('Downloading PDF file')

  const buffer = await fs.readFile(path.join(__dirname, 'sample.pdf'))

  return {
    status: 200,
    body: buffer,
    headers: { 'Content-Type': 'application/pdf' },
  }
}
