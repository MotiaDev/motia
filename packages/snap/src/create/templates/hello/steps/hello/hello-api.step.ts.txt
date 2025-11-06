import type { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

export const config: ApiRouteConfig = {
  name: 'HelloAPI',
  type: 'api',
  path: '/hello',
  method: 'GET',
  description: 'Receives hello request and emits event for processing',
  emits: ['process-greeting'],
  flows: ['hello-world-flow'],
  responseSchema: {
    200: z.object({
      message: z.string(),
      status: z.string(),
      appName: z.string()
    })
  }
};

export const handler: Handlers['HelloAPI'] = async (_, { emit, logger }) => {
  const appName = process.env.APP_NAME || 'Motia App';
  const timestamp = new Date().toISOString();
  
  logger.info('Hello API endpoint called', { appName, timestamp });
  
  // Emit event for background processing
  await emit({
    topic: 'process-greeting',
    data: {
      timestamp,
      appName,
      greetingPrefix: process.env.GREETING_PREFIX || 'Hello',
      requestId: Math.random().toString(36).substring(7)
    }
  });
  
  return {
    status: 200,
    body: {
      message: 'Hello request received! Check logs for processing.',
      status: 'processing',
      appName
    }
  };
};
